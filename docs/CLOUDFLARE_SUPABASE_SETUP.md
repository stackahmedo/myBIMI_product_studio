# Cloudflare + Supabase Production Setup Guide

This guide details the complete production architecture pairing **Cloudflare** (Pages & Workers) with **Supabase** (PostgreSQL, Auth & Storage) for **PRODUCT STUDIO by My BIMI**.

---

## 1. Production Architecture Overview

```mermaid
flowchart LR
    subgraph Users [Retail Operations Network]
        Browser[Store Staff / POS / Manager]
    end

    subgraph CloudflareEdge [Cloudflare Edge Network]
        DNS[Cloudflare DNS\nstudio.mybimi.jp & api.mybimi.jp]
        Pages[Cloudflare Pages\nReact 19 SPA + Global CDN]
        Worker[Cloudflare Worker\nEdge API Proxy & Auth Guard]
        Cache[Edge Cache\nProduct Images & Static Assets]
    end

    subgraph SupabaseCloud [Supabase Cloud Infrastructure]
        Auth[Supabase Auth\nJWT Session Service]
        Postgres[(Supabase PostgreSQL\n17 Relational Tables + RLS)]
        Storage[Supabase Storage\nproduct-images Bucket]
    end

    subgraph ExternalServices [External Storefronts & POS]
        Storefront[My BIMI Online Storefront]
        Shopify[Shopify / POS Terminals]
    end

    Browser --> DNS
    DNS --> Pages
    DNS --> Worker
    
    Pages -->|Direct Client Queries via Anon Key| Postgres
    Pages -->|Authentication Requests| Auth
    Pages -->|Media Requests (Cached)| Cache
    Cache --> Storage
    
    Pages -->|Internal API /sync| Worker
    Worker -->|withSupabase + Service Role Key| Postgres
    Worker -->|Authorized Catalog Publish| ExternalServices
```

---

## 2. Part 1: Deploying Frontend to Cloudflare Pages

Cloudflare Pages delivers zero-latency static asset distribution across 300+ global data centers, ideal for retail stores across Tokyo.

### 2.1 Create the SPA Routing File (`_redirects`)
Because Product Studio is a Single Page Application (SPA), all route paths must resolve to `index.html`.

Create a file named `public/_redirects`:
```text
/*    /index.html   200
```
*(When Vite runs `npm run build`, files in `public/` are automatically copied to `dist/`).*

### 2.2 Deployment Option A: Cloudflare Dashboard (Continuous Deployment)
1. Push your code repository to **GitHub** or **GitLab**.
2. Log into the [Cloudflare Dashboard](https://dash.cloudflare.com/) ➔ **Workers & Pages** ➔ **Create application** ➔ **Pages** ➔ **Connect to Git**.
3. Select your repository and configure the build settings:
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
4. Expand **Environment variables** and add:
   - `VITE_SUPABASE_URL` = `https://<your-project-id>.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `<your-supabase-publishable-key>`
   - `VITE_SUPABASE_PUBLISHABLE_KEY` = `<your-supabase-publishable-key>`
5. Click **Save and Deploy**.

### 2.3 Deployment Option B: Direct Terminal Deployment (Wrangler CLI)
To deploy directly from your local terminal:

```bash
# 1. Install dependencies and compile production bundle
npm install
npm run build

# 2. Deploy dist/ directly to Cloudflare Pages
npx wrangler pages deploy dist --project-name=product-studio-mybimi
```

---

## 3. Part 2: Cloudflare Worker as Edge API & Sync Proxy

The application includes `@supabase/server` in [package.json](file:///Users/ahmedfaiyaz/Downloads/MyBIMI/log_data/product-studio-by-my-bimi/package.json). A Cloudflare Worker serves as a secure server-side boundary to:
1. Validate client JWT sessions before forwarding catalog mutations.
2. Execute catalog sync to external online storefronts without exposing `SUPABASE_SECRET_KEY` or `WEBSITE_SYNC_API_KEY` to client browsers.
3. Eliminate browser Cross-Origin Resource Sharing (CORS) blocks.

### 3.1 Worker Configuration (`wrangler.toml`)
Create `wrangler.toml` in your worker directory:

```toml
name = "bimi-studio-api"
main = "src/worker.ts"
compatibility_date = "2026-10-01"
compatibility_flags = ["nodejs_compat"]

[vars]
SUPABASE_URL = "https://<your-project-id>.supabase.co"
SUPABASE_PUBLISHABLE_KEY = "sb_publishable_5SndaauFfQC8W2Al33WgyQ_bdKLEXK0"
```

### 3.2 Securely Set Encrypted Secrets
Run in terminal to store secrets encrypted on Cloudflare's edge:
```bash
npx wrangler secret put SUPABASE_SECRET_KEY
# Enter your sb_secret_... key when prompted

npx wrangler secret put WEBSITE_SYNC_API_KEY
# Enter your external e-commerce storefront API key
```

### 3.3 Worker Implementation (`src/worker.ts`)
Using `@supabase/server`'s `withSupabase` helper:

```typescript
import { withSupabase } from '@supabase/server';

export default {
  fetch: withSupabase(
    { auth: 'user' }, // Enforces valid Supabase JWT session header
    async (req, ctx) => {
      const url = new URL(req.url);

      // Handle CORS Pre-flight
      if (req.method === 'OPTIONS') {
        return new Response(null, {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        });
      }

      // Endpoint: Storefront Catalog Sync (/api/website-sync)
      if (url.pathname === '/api/website-sync' && req.method === 'POST') {
        const payload = await req.json();

        // 1. Verify User Role from Supabase DB
        const { data: profile } = await ctx.supabase
          .from('profiles')
          .select('role')
          .eq('id', ctx.auth.user.id)
          .single();

        if (!profile || (profile.role !== 'ADMIN' && profile.role !== 'MANAGER')) {
          return new Response(
            JSON.stringify({ success: false, message: 'Forbidden: Insufficient privileges to publish catalog.' }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          );
        }

        // 2. Dispatch payload to external My BIMI Headless E-Commerce API
        const externalResponse = await fetch('https://api.mybimi.jp/v1/catalog/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ctx.env.WEBSITE_SYNC_API_KEY}`,
          },
          body: JSON.stringify(payload),
        });

        const syncResult = await externalResponse.json();

        // 3. Log event into Supabase website_sync table
        await ctx.supabase.from('website_sync').insert({
          product_id: payload.sku,
          channel: 'BIMI Online Store',
          event_type: 'product_update',
          status: externalResponse.ok ? 'success' : 'failed',
          http_code: externalResponse.status,
          payload_summary: `SKU: ${payload.sku}, Price: ${payload.price}`,
        });

        return new Response(JSON.stringify(syncResult), {
          status: externalResponse.status,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      return new Response('Not Found', { status: 404 });
    }
  ),
};
```

---

## 4. Part 3: Custom Domains & Reverse Proxy via Cloudflare DNS

Configuring a custom domain through Cloudflare unlocks critical architectural advantages for retail operations:

### 4.1 Why Route Supabase through Cloudflare DNS?
1. **First-Party Authentication Cookies**: When Supabase Auth runs under your root domain (`api.mybimi.jp` matching `studio.mybimi.jp`), mobile browsers (Safari / iOS) do not block or truncate authentication tokens under Intelligent Tracking Prevention (ITP).
2. **Sub-Millisecond Edge Media Caching**: Product images stored in Supabase Storage (`product-images`) can be cached at Cloudflare edge nodes in Tokyo, dramatically speeding up in-store shelf tag generation and catalog browsing.

### 4.2 Step-by-Step Custom Domain Setup
1. In **Supabase Dashboard** ➔ **Project Settings** ➔ **Custom Domains**.
2. Enter your desired subdomain: `api.mybimi.jp`.
3. In your **Cloudflare Dashboard** ➔ **DNS Records**:
   - Add the `CNAME` record provided by Supabase:
     - **Name**: `api`
     - **Target**: `<your-project-ref>.supabase.co`
     - **Proxy status**: Set to **DNS Only** (gray cloud) during verification.
4. After Supabase verifies the SSL certificate, you can enable Cloudflare CDN proxying.
5. In your [.env](file:///Users/ahmedfaiyaz/Downloads/MyBIMI/log_data/product-studio-by-my-bimi/.env), update the endpoint:
   ```env
   VITE_SUPABASE_URL=https://api.mybimi.jp
   ```

---

## 5. Security & Edge Hardening Checklist

- **SSL/TLS Encryption**: Set to **Full (strict)** in Cloudflare Dashboard ➔ **SSL/TLS**.
- **Content Security Policy (CSP)**: Ensure `connect-src` includes `https://*.supabase.co` and `https://api.mybimi.jp`.
- **Cloudflare WAF Rate Limiting**:
  - Add rate limiting rules on `/api/website-sync` (e.g. max 60 requests/minute per IP) to prevent denial-of-service on external sync endpoints.
- **Bot Management**: Enable **Cloudflare Turnstile** or Managed Challenge on administrative sign-in routes to block brute-force attacks against retail staff credentials.
