<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/077d6f5a-e4cf-45b3-b970-d627b092dc8a

## Documentation & Architecture Guides

Complete documentation for development, system architecture, database design, and cloud deployments:

1. 🏛️ **[System Architecture](docs/SYSTEM_ARCHITECTURE.md)**: High-level architectural topology, layer breakdown, component interaction, and data flows.
2. 📐 **[System Design](docs/SYSTEM_DESIGN.md)**: Detailed 17-table ERD, domain models, design patterns, RBAC matrix, and Japanese retail logic.
3. 💻 **[Run Local Guide](docs/RUN_LOCAL_GUIDE.md)**: Quick start, npm scripts, demo accounts, feature walkthrough, and local troubleshooting.
4. ⚙️ **[Setup Guidelines](docs/SETUP_GUIDELINES.md)**: Environment variable matrix, Supabase provisioning, SQL DDL schema execution, and auth setup.
5. ☁️ **[Cloudflare + Supabase Setup](docs/CLOUDFLARE_SUPABASE_SETUP.md)**: Cloudflare Pages (frontend), Cloudflare Workers (edge proxy), custom domain DNS, and production security.
6. ▲ **[Vercel + Supabase Setup](docs/VERCEL_SUPABASE_SETUP.md)**: Vercel deployment, official Supabase integration, environment variables, and SPA rewrites.

## Run Locally

**Prerequisites:** Node.js (v18+)

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start development server:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:3000` in your browser.