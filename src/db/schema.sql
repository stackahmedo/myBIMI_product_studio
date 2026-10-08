-- ============================================================================
-- PRODUCT STUDIO by My BIMI
-- PostgreSQL & Supabase Relational Database Architecture
-- Multi-Store Supermarket Retail Product Information Management (PIM)
-- Complete 17-Table Relational Schema with UUIDs, Foreign Keys, Indexes, & RLS
-- ============================================================================

-- Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. ENUMS & ROLES DEFINITION
-- ============================================================================
DO $$ BEGIN
    CREATE TYPE user_role_enum AS ENUM ('ADMIN', 'MANAGER', 'STORE_STAFF', 'VIEWER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ROLES REFERENCE TABLE
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_key user_role_enum UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 2. STORES TABLE (Multi-Store Physical & Virtual Branches)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    phone TEXT NOT NULL,
    manager_name TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    opened_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 3. PROFILES TABLE (Supabase Auth User Profiles & RBAC)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role user_role_enum NOT NULL DEFAULT 'VIEWER',
    assigned_store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
    avatar_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 4. CATEGORIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    name_ja TEXT NOT NULL,
    tax_rate NUMERIC(4,2) NOT NULL DEFAULT 0.08, -- 0.08 for groceries, 0.10 for standard
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 5. BRANDS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    country TEXT NOT NULL DEFAULT 'Japan',
    website TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 6. SUPPLIERS TABLE (Comprehensive Wholesale Vendor Management)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    contact_name TEXT,
    phone TEXT,
    whatsapp TEXT,
    email TEXT,
    address TEXT,
    country TEXT NOT NULL DEFAULT 'Japan',
    website TEXT,
    payment_terms TEXT NOT NULL DEFAULT 'End of month 30 days',
    currency TEXT NOT NULL DEFAULT 'JPY',
    lead_time_days INTEGER NOT NULL DEFAULT 2,
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- ============================================================================
-- 7. MASTER PRODUCTS TABLE (Central Product Catalog)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku TEXT UNIQUE NOT NULL,
    barcode TEXT UNIQUE NOT NULL, -- JAN-13 / EAN-13
    name TEXT NOT NULL,
    name_ja TEXT NOT NULL,
    description TEXT,
    internal_notes TEXT,
    category_id UUID REFERENCES public.categories(id) ON DELETE RESTRICT,
    brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL,
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
    image_url TEXT,
    country_of_origin TEXT NOT NULL DEFAULT 'Japan',
    weight_volume TEXT NOT NULL DEFAULT '1 pcs',
    unit TEXT NOT NULL DEFAULT 'pcs',
    tax_rate NUMERIC(4,2) NOT NULL DEFAULT 0.08,
    cost_price NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    freight_cost NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    customs_duty NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    other_cost NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    base_retail_price NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    min_stock_alert INTEGER NOT NULL DEFAULT 10,
    reorder_level INTEGER NOT NULL DEFAULT 20,
    status TEXT NOT NULL DEFAULT 'Active', -- Draft, Active, Out of Stock, Discontinued, Archived
    halal_status TEXT NOT NULL DEFAULT 'certified', -- certified, muslim_friendly, not_applicable, non_halal
    is_new_arrival BOOLEAN NOT NULL DEFAULT false,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    is_bestseller BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    website_sync_status TEXT NOT NULL DEFAULT 'synced', -- synced, pending, error, disabled
    website_sync_error TEXT,
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- ============================================================================
-- 8. PRODUCT IMAGES TABLE (Multi-Gallery Product Assets)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    alt_text TEXT,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 9. PRODUCT STORE PRICES TABLE (Branch Specific Pricing Matrix)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.product_store_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    regular_price NUMERIC(12,2) NOT NULL,
    offer_price NUMERIC(12,2),
    wholesale_price NUMERIC(12,2),
    online_price NUMERIC(12,2),
    tax_rate NUMERIC(4,2) NOT NULL DEFAULT 0.08,
    offer_start_date TIMESTAMPTZ,
    offer_end_date TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    CONSTRAINT uq_product_store_price UNIQUE (product_id, store_id)
);

-- ============================================================================
-- 10. PRICE HISTORY AUDIT TABLE (Permanent Financial Price Ledger)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
    store_name TEXT NOT NULL,
    price_type TEXT NOT NULL DEFAULT 'regular', -- regular, offer, wholesale, online, bulk_adjustment
    old_price NUMERIC(12,2) NOT NULL,
    new_price NUMERIC(12,2) NOT NULL,
    cost_price NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    margin_percent NUMERIC(5,2),
    reason TEXT NOT NULL,
    effective_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    offer_end_date TIMESTAMPTZ,
    is_below_cost BOOLEAN NOT NULL DEFAULT false,
    changed_by TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- ============================================================================
-- 11. INVENTORY TABLE (Multi-Store Real-Time Stock Ledger)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    reserved_quantity INTEGER NOT NULL DEFAULT 0,
    min_stock INTEGER NOT NULL DEFAULT 10,
    reorder_level INTEGER NOT NULL DEFAULT 20,
    shelf_location TEXT,
    last_restocked_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_product_store_inventory UNIQUE (product_id, store_id)
);

-- ============================================================================
-- 12. STOCK MOVEMENTS TABLE (Immutable Stock Audit Trail)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE RESTRICT,
    movement_type TEXT NOT NULL, -- Stock In, Stock Out, Sale, Adjustment, Transfer In, Transfer Out, Damaged, Waste, Expired, Return
    quantity INTEGER NOT NULL,
    quantity_change INTEGER NOT NULL,
    previous_stock INTEGER NOT NULL DEFAULT 0,
    new_stock INTEGER NOT NULL DEFAULT 0,
    balance_after INTEGER NOT NULL DEFAULT 0,
    reference TEXT,
    notes TEXT,
    performed_by TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- ============================================================================
-- 13. PRODUCT SUPPLIERS TABLE (Multi-Vendor Sourcing & Cost Comparison)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.product_suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
    supplier_product_code TEXT NOT NULL,
    purchase_price NUMERIC(12,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'JPY',
    moq INTEGER NOT NULL DEFAULT 1,
    pack_quantity INTEGER NOT NULL DEFAULT 1,
    lead_time_days INTEGER NOT NULL DEFAULT 2,
    last_purchase_price NUMERIC(12,2),
    is_preferred BOOLEAN NOT NULL DEFAULT false,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    CONSTRAINT uq_product_supplier UNIQUE (product_id, supplier_id)
);

-- ============================================================================
-- 14. PURCHASE ORDERS TABLE (Procurement Management)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    po_number TEXT UNIQUE NOT NULL,
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
    destination_store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE RESTRICT,
    status TEXT NOT NULL DEFAULT 'draft', -- draft, ordered, partially_received, received, cancelled
    total_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expected_delivery_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- ============================================================================
-- 15. PURCHASE ORDER ITEMS TABLE (Line Items for Procurement Orders)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.purchase_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    quantity_ordered INTEGER NOT NULL,
    quantity_received INTEGER NOT NULL DEFAULT 0,
    unit_cost NUMERIC(12,2) NOT NULL,
    total_cost NUMERIC(12,2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 16. WEBSITE SYNC TABLE (E-Commerce Webhook & Sync Events)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.website_sync (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    channel TEXT NOT NULL, -- BIMI Online Store, POS Shin-Koiwa, POS Yotsugi, BIMI Mobile App
    event_type TEXT NOT NULL, -- product_create, product_update, price_update, stock_update
    status TEXT NOT NULL, -- success, failed, in_progress
    http_code INTEGER,
    error_message TEXT,
    payload_summary TEXT NOT NULL,
    synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 17. AUDIT LOGS TABLE (System-Wide Security & Change Audit Trail)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL, -- product, price, inventory, sync, supplier, user, store, tag_template
    entity_id TEXT NOT NULL,
    action TEXT NOT NULL, -- create, update, delete, sync_trigger, stock_adjust, price_override
    description TEXT NOT NULL,
    user_name TEXT NOT NULL,
    user_role TEXT NOT NULL,
    diff JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- ============================================================================
-- HIGH-PERFORMANCE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON public.products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_supplier ON public.products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status, is_active);

CREATE INDEX IF NOT EXISTS idx_inventory_store ON public.inventory(store_id);
CREATE INDEX IF NOT EXISTS idx_inventory_product ON public.inventory(product_id);

CREATE INDEX IF NOT EXISTS idx_stock_movements_store_date ON public.stock_movements(store_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON public.stock_movements(product_id);

CREATE INDEX IF NOT EXISTS idx_store_prices_product_store ON public.product_store_prices(product_id, store_id);
CREATE INDEX IF NOT EXISTS idx_price_history_product_date ON public.price_history(product_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_po_supplier ON public.purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_po_destination ON public.purchase_orders(destination_store_id);

CREATE INDEX IF NOT EXISTS idx_website_sync_product ON public.website_sync(product_id, synced_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs(created_at DESC);

-- ============================================================================
-- AUTOMATIC TIMESTAMPS TRIGGER FUNCTION
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_stores_updated_at ON public.stores;
CREATE TRIGGER trigger_stores_updated_at BEFORE UPDATE ON public.stores FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON public.profiles;
CREATE TRIGGER trigger_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_suppliers_updated_at ON public.suppliers;
CREATE TRIGGER trigger_suppliers_updated_at BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_products_updated_at ON public.products;
CREATE TRIGGER trigger_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_inventory_updated_at ON public.inventory;
CREATE TRIGGER trigger_inventory_updated_at BEFORE UPDATE ON public.inventory FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Multi-Role Access Enforced at Database Engine Level:
-- ADMIN: Full Access
-- MANAGER: Products, Pricing, Inventory, Suppliers, Reports
-- STORE_STAFF: View products, Update allowed stock, Generate price tags
-- VIEWER: Read Only
-- ============================================================================

-- Helper functions to check caller role safely
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS user_role_enum AS $$
DECLARE
    r user_role_enum;
BEGIN
    SELECT role INTO r FROM public.profiles WHERE id = auth.uid();
    RETURN COALESCE(r, 'VIEWER'::user_role_enum);
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'VIEWER'::user_role_enum;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS across all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_store_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_sync ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. PROFILES POLICIES
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
CREATE POLICY "Profiles are viewable by authenticated users"
    ON public.profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE TO authenticated
USING (id = auth.uid()) WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Admins have full access to profiles" ON public.profiles;
CREATE POLICY "Admins have full access to profiles"
    ON public.profiles FOR ALL TO authenticated
USING (public.get_auth_role() = 'ADMIN');

-- 2. STORES POLICIES (All authenticated can view, only ADMIN can edit)
DROP POLICY IF EXISTS "Stores viewable by all authenticated" ON public.stores;
CREATE POLICY "Stores viewable by all authenticated"
    ON public.stores FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Stores manageable by admins" ON public.stores;
CREATE POLICY "Stores manageable by admins"
    ON public.stores FOR ALL TO authenticated
USING (public.get_auth_role() = 'ADMIN');

-- 3. PRODUCTS & CATALOG POLICIES
DROP POLICY IF EXISTS "Products viewable by all authenticated" ON public.products;
CREATE POLICY "Products viewable by all authenticated"
    ON public.products FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Products manageable by Admin and Manager" ON public.products;
CREATE POLICY "Products manageable by Admin and Manager"
    ON public.products FOR ALL TO authenticated
USING (public.get_auth_role() IN ('ADMIN', 'MANAGER'));

-- 4. INVENTORY POLICIES
DROP POLICY IF EXISTS "Inventory viewable by all authenticated" ON public.inventory;
CREATE POLICY "Inventory viewable by all authenticated"
    ON public.inventory FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Inventory updatable by Admin, Manager, and Staff" ON public.inventory;
CREATE POLICY "Inventory updatable by Admin, Manager, and Staff"
    ON public.inventory FOR UPDATE TO authenticated
USING (public.get_auth_role() IN ('ADMIN', 'MANAGER', 'STORE_STAFF'));

DROP POLICY IF EXISTS "Inventory insert/delete by Admin and Manager" ON public.inventory;
CREATE POLICY "Inventory insert/delete by Admin and Manager"
    ON public.inventory FOR ALL TO authenticated
USING (public.get_auth_role() IN ('ADMIN', 'MANAGER'));

-- 5. STOCK MOVEMENTS POLICIES
DROP POLICY IF EXISTS "Stock movements viewable by all authenticated" ON public.stock_movements;
CREATE POLICY "Stock movements viewable by all authenticated"
    ON public.stock_movements FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Stock movements recordable by Staff, Manager, Admin" ON public.stock_movements;
CREATE POLICY "Stock movements recordable by Staff, Manager, Admin"
    ON public.stock_movements FOR INSERT TO authenticated
WITH CHECK (public.get_auth_role() IN ('ADMIN', 'MANAGER', 'STORE_STAFF'));

-- 6. PRICING & PRICE HISTORY POLICIES
DROP POLICY IF EXISTS "Prices viewable by all authenticated" ON public.product_store_prices;
CREATE POLICY "Prices viewable by all authenticated"
    ON public.product_store_prices FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Prices manageable by Admin and Manager" ON public.product_store_prices;
CREATE POLICY "Prices manageable by Admin and Manager"
    ON public.product_store_prices FOR ALL TO authenticated
USING (public.get_auth_role() IN ('ADMIN', 'MANAGER'));

DROP POLICY IF EXISTS "Price history viewable by all authenticated" ON public.price_history;
CREATE POLICY "Price history viewable by all authenticated"
    ON public.price_history FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Price history insertable by Admin and Manager" ON public.price_history;
CREATE POLICY "Price history insertable by Admin and Manager"
    ON public.price_history FOR INSERT TO authenticated
WITH CHECK (public.get_auth_role() IN ('ADMIN', 'MANAGER'));

-- 7. SUPPLIERS & PURCHASING POLICIES
DROP POLICY IF EXISTS "Suppliers viewable by Admin and Manager" ON public.suppliers;
CREATE POLICY "Suppliers viewable by Admin and Manager"
    ON public.suppliers FOR SELECT TO authenticated
USING (public.get_auth_role() IN ('ADMIN', 'MANAGER'));

DROP POLICY IF EXISTS "Suppliers manageable by Admin and Manager" ON public.suppliers;
CREATE POLICY "Suppliers manageable by Admin and Manager"
    ON public.suppliers FOR ALL TO authenticated
USING (public.get_auth_role() IN ('ADMIN', 'MANAGER'));

DROP POLICY IF EXISTS "Purchase orders viewable by Admin and Manager" ON public.purchase_orders;
CREATE POLICY "Purchase orders viewable by Admin and Manager"
    ON public.purchase_orders FOR ALL TO authenticated
USING (public.get_auth_role() IN ('ADMIN', 'MANAGER'));

-- 8. AUDIT LOGS POLICIES
DROP POLICY IF EXISTS "Audit logs viewable by Admin and Manager" ON public.audit_logs;
CREATE POLICY "Audit logs viewable by Admin and Manager"
    ON public.audit_logs FOR SELECT TO authenticated
USING (public.get_auth_role() IN ('ADMIN', 'MANAGER'));

DROP POLICY IF EXISTS "Audit logs insertable by all authenticated" ON public.audit_logs;
CREATE POLICY "Audit logs insertable by all authenticated"
    ON public.audit_logs FOR INSERT TO authenticated
WITH CHECK (true);

-- ============================================================================
-- SEED SYSTEM ROLES
-- ============================================================================
INSERT INTO public.roles (role_key, title, description, permissions)
VALUES
    ('ADMIN', 'System Administrator', 'Full unrestricted access to all stores, products, pricing, users, and security settings', '{"all": true}'::jsonb),
    ('MANAGER', 'Store Manager', 'Full management of products, store pricing, inventory, supplier procurement, and reports', '{"products": true, "pricing": true, "inventory": true, "suppliers": true, "reports": true}'::jsonb),
    ('STORE_STAFF', 'Store Staff', 'View catalog, update allowed inventory stock, perform transfers, and print shelf price tags', '{"products_view": true, "inventory_adjust": true, "price_tags": true}'::jsonb),
    ('VIEWER', 'Auditor / Viewer', 'Read-only access across the product catalog and stock reports', '{"read_only": true}'::jsonb)
ON CONFLICT (role_key) DO NOTHING;
