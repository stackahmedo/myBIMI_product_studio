# Setup & Configuration Guidelines: PRODUCT STUDIO by My BIMI

This document provides complete instructions for configuring, provisioning, and connecting **PRODUCT STUDIO by My BIMI** with cloud infrastructure, authentication services, and external storefront channels.

---

## 1. Environment Configuration

The application uses environment variables loaded from [.env](file:///Users/ahmedfaiyaz/Downloads/MyBIMI/log_data/product-studio-by-my-bimi/.env). A reference template is maintained in [.env.example](file:///Users/ahmedfaiyaz/Downloads/MyBIMI/log_data/product-studio-by-my-bimi/.env.example).

### 1.1 Complete Environment Matrix

```env
# ----------------------------------------------------------------------------
# 1. Supabase Client Credentials (Vite Frontend)
# ----------------------------------------------------------------------------
# Exposed to the browser bundle to initialize the Supabase JS Client.
VITE_SUPABASE_URL=https://<your-project-id>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-or-publishable-key>
VITE_SUPABASE_PUBLISHABLE_KEY=<your-anon-or-publishable-key>

# ----------------------------------------------------------------------------
# 2. Supabase Server & Backend Credentials (@supabase/server)
# ----------------------------------------------------------------------------
# Kept server-side (Cloudflare Workers, Edge Functions, Express API).
# NEVER prefix these with VITE_ to prevent leaking secrets to client browsers.
SUPABASE_URL=https://<your-project-id>.supabase.co
SUPABASE_PUBLISHABLE_KEY=<your-anon-or-publishable-key>
SUPABASE_SECRET_KEY=<your-service-role-secret-key>
SUPABASE_JWKS_URL=https://<your-project-id>.supabase.co/auth/v1/.well-known/jwks.json

# ----------------------------------------------------------------------------
# 3. My BIMI E-Commerce & Storefront Sync Integration
# ----------------------------------------------------------------------------
# Configures outbound synchronization to online store and POS terminals.
WEBSITE_SYNC_API_URL=https://api.mybimi.jp/v1/catalog/sync
WEBSITE_SYNC_API_KEY=your-storefront-api-secret-key
WEBSITE_SYNC_WEBHOOK_SECRET=your-webhook-signature-secret
```

### 1.2 Security Distinction
- **Variables starting with `VITE_`**: Bundled into client-side JavaScript. Safe ONLY for public endpoints (`VITE_SUPABASE_URL`) and anonymous keys (`VITE_SUPABASE_ANON_KEY`) whose access is restricted by PostgreSQL Row Level Security (RLS).
- **Variables without `VITE_`**: Reserved strictly for server-side environments (e.g. Cloudflare Workers). `SUPABASE_SECRET_KEY` bypasses RLS and **must never** be included in frontend code.

---

## 2. Supabase Cloud Database Provisioning

### Step 1: Create a Supabase Project
1. Go to [https://supabase.com](https://supabase.com) and create an organization.
2. Click **New Project** and configure:
   - **Name**: `product-studio-mybimi`
   - **Database Password**: Generate and store securely.
   - **Region**: Select **Tokyo (ap-northeast-1)** for lowest latency to retail stores in Japan.

### Step 2: Retrieve API Keys
In your Supabase Dashboard:
1. Navigate to **Project Settings** (gear icon) ➔ **API** (or **API Keys**).
2. Copy:
   - **Project URL** (`https://<ref>.supabase.co`)
   - **anon / publishable key** (`sb_publishable_...` or `eyJhbGci...`)
   - **service_role secret key** (`sb_secret_...` or `eyJhbGci...`)
3. Paste these values into your [.env](file:///Users/ahmedfaiyaz/Downloads/MyBIMI/log_data/product-studio-by-my-bimi/.env) file.

### Step 3: Execute the Relational Schema (17 Tables)
1. In the Supabase Dashboard, open the **SQL Editor** tab.
2. Click **New Query**.
3. Copy the entire contents of [supabase/schema.sql](file:///Users/ahmedfaiyaz/Downloads/MyBIMI/log_data/product-studio-by-my-bimi/supabase/schema.sql) (or [src/db/schema.sql](file:///Users/ahmedfaiyaz/Downloads/MyBIMI/log_data/product-studio-by-my-bimi/src/db/schema.sql)).
4. Paste into the SQL Editor and click **Run**.

**Verification:**
After running the script, verify in the **Table Editor** that all 17 tables appear:
- `roles`, `stores`, `profiles`, `categories`, `brands`, `suppliers`, `products`, `product_images`, `product_store_prices`, `price_history`, `inventory`, `stock_movements`, `product_suppliers`, `purchase_orders`, `purchase_order_items`, `website_sync`, `audit_logs`.

### Step 4: Seed Master Catalog Data
You have two options to seed initial retail data:

**Option A (Via Application UI - Recommended):**
1. Start the app (`npm run dev`) and visit `http://localhost:3000`.
2. Navigate to **Settings** in the sidebar.
3. In the **Supabase Relational Database Architecture** card, click **Seed Master Data to Supabase**.
4. The system will automatically insert the starter branches, categories, suppliers, and sample products into your live tables.

**Option B (Via SQL Editor):**
Execute the seed insert blocks defined at the bottom of [supabase/schema.sql](file:///Users/ahmedfaiyaz/Downloads/MyBIMI/log_data/product-studio-by-my-bimi/supabase/schema.sql).

---

## 3. Supabase Authentication Setup

The application uses Supabase Auth to identify retail operators and assign roles.

### 3.1 Enable Authentication Providers
1. In Supabase Dashboard, go to **Authentication** ➔ **Providers**.
2. Ensure **Email** is enabled.
3. Turn off **"Confirm email"** in development/staging if you want newly invited store staff to log in immediately without email confirmation loops.

### 3.2 Linking Profiles to Auth Users
When a new user signs up or is invited, an automated trigger or profile hook in `schema.sql` creates a corresponding entry in `public.profiles`:

```sql
-- Creates profile record on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, name, role, is_active)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
        'STORE_STAFF',
        TRUE
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 4. Supabase Storage Setup (Product Images Bucket)

For uploading product packaging and halal certification photos:

1. In Supabase Dashboard, click **Storage** in the sidebar.
2. Click **New Bucket**:
   - **Name**: `product-images`
   - **Public bucket**: **Enable** (Checked, so product photos load in the storefront, mobile apps, and printed shelf tags without expiring presigned tokens).
3. Under **Policies**, add a policy allowing authenticated staff to upload:
   - **Target Roles**: `authenticated`
   - **Allowed Operations**: `INSERT`, `UPDATE`, `DELETE`

---

## 5. External E-Commerce & POS Webhook Setup

When products are published or prices are adjusted in Product Studio, events can be pushed to external storefronts:

### 5.1 My BIMI Headless API (`bimi_headless`)
- Set `WEBSITE_SYNC_API_URL` to your production headless endpoint (e.g. `https://api.mybimi.jp/v1/catalog/sync`).
- Provide the API secret in `WEBSITE_SYNC_API_KEY`.
- In [src/services/websiteSyncService.ts](file:///Users/ahmedfaiyaz/Downloads/MyBIMI/log_data/product-studio-by-my-bimi/src/services/websiteSyncService.ts), requests are dispatched with `Authorization: Bearer <WEBSITE_SYNC_API_KEY>`.

### 5.2 Shopify Adapter (`shopify_webhook`)
- If synchronizing with Shopify POS or Shopify Online Store, set `endpoint_url` to your Shopify App webhook proxy:
  - Header: `X-Shopify-Access-Token`
  - Body: Converted to Shopify REST / GraphQL Product format.

---

## 6. Pre-Flight Production Checklist

Before going live in physical supermarket branches:

- [ ] All 17 PostgreSQL tables exist and have **Row Level Security (RLS)** toggled ON.
- [ ] Production stores are entered in `stores` table (`STORE-SHIN-KOIWA`, `STORE-YOTSUGI`).
- [ ] Japanese tax categories are confirmed: `0.08` for foodstuffs and `0.10` for non-food.
- [ ] Test printed shelf price tag on in-store printer: verify that JAN-13 barcode scans accurately on the POS scanner.
- [ ] `SUPABASE_SECRET_KEY` is kept off the client browser bundle.
- [ ] Test inter-store stock transfer: verify that origin decrements, destination increments, and an audit log entry is written.
