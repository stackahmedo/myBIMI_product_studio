# Local Development Guide: PRODUCT STUDIO by My BIMI

This guide walks you through running, exploring, and testing **PRODUCT STUDIO by My BIMI** locally on your workstation.

---

## 1. Prerequisites

Before starting, ensure your local development machine has:
- **Node.js**: `v18.0.0` or higher (`v20+` or `v22+` recommended).
  ```bash
  node -v
  ```
- **Package Manager**: `npm` (bundled with Node) or `bun` / `pnpm`.
- **Modern Web Browser**: Chrome, Edge, Safari, or Firefox with CSS Grid & `@media print` support.

---

## 2. Quick Start (Running in 60 Seconds)

### Step 1: Open Terminal in Project Directory
Navigate to the project root:
```bash
cd /Users/ahmedfaiyaz/Downloads/MyBIMI/log_data/product-studio-by-my-bimi
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Start the Development Server
```bash
npm run dev
```

The terminal will output:
```text
  VITE v8.3.0  ready in 240 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: http://0.0.0.0:3000/
  ➜  press h + enter to show help
```

### Step 4: Open in Your Browser
Open your browser and navigate to:
```text
http://localhost:3000
```

---

## 3. Available npm Scripts

| Command | Action | Description |
| :--- | :--- | :--- |
| `npm run dev` | `vite --port=3000 --host=0.0.0.0` | Starts local development server on port 3000 with HMR. |
| `npm run build` | `vite build` | Compiles TypeScript and creates optimized production bundle in `dist/`. |
| `npm run preview` | `vite preview` | Locally serves the compiled production build from `dist/`. |
| `npm run lint` | `tsc --noEmit` | Runs TypeScript compiler in type-check mode without emitting code. |
| `npm run clean` | `rm -rf dist server.js` | Cleans up compiled artifacts and temporary builds. |

---

## 4. Demo Mode vs. Live Supabase Mode

The application is architected with a **Zero-Setup Standby Mode**:

| Mode | Configuration | Behavior |
| :--- | :--- | :--- |
| **Standby / Demo Mode** | No active database credentials needed | Runs entirely in-browser. All changes to products, inventory, prices, and audit logs are saved to browser `localStorage` and seeded from [src/data/mockData.ts](file:///Users/ahmedfaiyaz/Downloads/MyBIMI/log_data/product-studio-by-my-bimi/src/data/mockData.ts). |
| **Live Supabase Mode** | Valid `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env` | Syncs data against live PostgreSQL tables with full RLS enforcement. |

---

## 5. Built-in Demo Accounts & Role Switching

You can test permissions across all 4 operational roles without logging out:

1. Click on the **User Profile avatar** in the top-right corner of the Top Bar.
2. Select any demo account from the dropdown:

| Account Name | Role | Access Scope |
| :--- | :--- | :--- |
| **Kenji Tanaka** | `ADMIN` | Unrestricted full access across all stores, settings, user admin, and database sync. |
| **Sayaka Sato** | `MANAGER` | Full catalog, store pricing, inventory adjustments, and supplier procurement for Shin-Koiwa. |
| **Haruto Takahashi** | `STORE_STAFF` | Stock count adjustments, shelf tag printing, and catalog viewing (restricted from cost/margin data). |
| **Auditor Guest** | `VIEWER` | Read-only observation across products and stock (cannot edit data). |

---

## 6. How to Test Core Features Locally

### 1. Catalog & 360° Product Inspector
1. Click **Products** in the sidebar.
2. Filter by Category (`Spices & Seasoning`, `Rice & Grains`, `Meat & Poultry`) or Halal Status (`Certified Halal`).
3. Click on any product row (e.g. *Royal Basmati Rice 5kg*) to open the **360° Product Detail Drawer**.
4. Test the **Landed Cost Calculator**: edit the Freight or Customs Duty and watch the Gross Margin percentage recalculate dynamically.

### 2. Multi-Store Stock Transfer
1. Click **Inventory** in the sidebar.
2. In the branch stock matrix, click **Transfer Stock** at the top right.
3. Select:
   - **Source Store**: *Shin-Koiwa Flagship*
   - **Destination Store**: *Yotsugi Branch*
   - **Product**: Select any in-stock product.
   - **Quantity**: Enter `10`.
4. Click **Confirm Transfer**.
5. Observe the live stock decrement at Shin-Koiwa and increment at Yotsugi, as well as the new entry in the **Stock Movements** ledger below.

### 3. Shelf Price Tag Printing
1. Click **Price Tags** in the sidebar.
2. Select your template: **Normal**, **Special Offer**, or **New Arrival**.
3. Choose paper size: **A4 (8 cards)** or **A4 (4 cards)**.
4. Select 2 or 3 products from the checklist.
5. Review the live interactive print preview with Japanese names, tax-included prices, cut lines, and JAN-13 barcodes.
6. Click **Print Sheet** to trigger your browser's native print preview dialog.

### 4. Omnichannel Website Sync Simulation
1. Click **Website Sync** in the sidebar.
2. Toggle sync fields (e.g. disable description sync, enable price sync).
3. Click **Sync Product** on any pending SKU.
4. Check the **Sync Activity Log** to see simulated HTTP 200 responses and payloads.

### 5. Factory Resetting Demo Data
If you made test changes and want to return to fresh default data:
1. Navigate to **Settings** in the sidebar.
2. Scroll to the **Factory Reset & Recovery** card.
3. Click **Reset to Factory Defaults**. This clears `localStorage` and re-seeds all 17 entities from `mockData.ts`.

---

## 7. Troubleshooting & FAQ

### Port 3000 Already in Use
If port 3000 is occupied by another process:
```bash
npm run dev -- --port 3001
```

### TypeScript Lint Check
To verify type correctness across all components:
```bash
npm run lint
```

### Resetting Vite Cache
If you encounter bundle caching issues after modifying `.env`:
```bash
rm -rf node_modules/.vite
npm run dev
```
