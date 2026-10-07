-- ============================================================================
-- PRODUCT STUDIO by My BIMI - Supabase Relational Schema & RLS Architecture
-- ============================================================================
-- Complete schema definition for 17 relational entities with:
-- UUID Primary Keys, Foreign Keys, Indexes, Timestamps, Triggers,
-- Supabase Auth Integration, and Strict Row Level Security (RLS) Policies.
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 1. ROLES TABLE & ENUM
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.roles (
    code VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed predefined application roles
INSERT INTO public.roles (code, name, description, permissions)
VALUES
    ('ADMIN', 'System Administrator', 'Full unrestricted access to all operations, users, and settings', '["all"]'::jsonb),
    ('MANAGER', 'Store / Category Manager', 'Full control over products, pricing, inventory, suppliers, and reports', '["products:write", "pricing:write", "inventory:write", "suppliers:write", "reports:read"]'::jsonb),
    ('STORE_STAFF', 'Store Retail Staff', 'Can view products, update assigned store stock, and generate shelf price tags', '["products:read", "inventory:adjust", "price_tags:create"]'::jsonb),
    ('VIEWER', 'Read-Only Stakeholder', 'View-only access to products, stores, stock levels, and price tags', '["read:only"]'::jsonb)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    permissions = EXCLUDED.permissions;

-- ----------------------------------------------------------------------------
-- 2. STORES TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    phone VARCHAR(50) NOT NULL,
    manager_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    opened_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stores_code ON public.stores(code);
CREATE INDEX IF NOT EXISTS idx_stores_is_active ON public.stores(is_active);

-- ----------------------------------------------------------------------------
-- 3. PROFILES TABLE (Connected to Supabase auth.users)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'VIEWER' REFERENCES public.roles(code) ON UPDATE CASCADE,
    assigned_store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    avatar_url TEXT,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_store ON public.profiles(assigned_store_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- ----------------------------------------------------------------------------
-- 4. CATEGORIES TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    name_ja VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    tax_rate NUMERIC(4,2) NOT NULL DEFAULT 0.08,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);

-- ----------------------------------------------------------------------------
-- 5. BRANDS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL DEFAULT 'Japan',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_brands_name ON public.brands(name);

-- ----------------------------------------------------------------------------
-- 6. SUPPLIERS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(100),
    phone VARCHAR(50),
    whatsapp VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    country VARCHAR(100) NOT NULL DEFAULT 'Japan',
    website TEXT,
    payment_terms VARCHAR(100) DEFAULT 'Net 30 days',
    currency VARCHAR(10) NOT NULL DEFAULT 'JPY',
    lead_time_days INTEGER NOT NULL DEFAULT 2,
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_suppliers_code ON public.suppliers(code);
CREATE INDEX IF NOT EXISTS idx_suppliers_is_active ON public.suppliers(is_active);

-- ----------------------------------------------------------------------------
-- 7. PRODUCTS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku VARCHAR(100) UNIQUE NOT NULL,
    barcode VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    name_ja VARCHAR(255) NOT NULL,
    brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    subcategory VARCHAR(100),
    description TEXT,
    internal_notes TEXT,
    image_url TEXT,
    country_of_origin VARCHAR(100) NOT NULL DEFAULT 'Japan',
    weight_volume VARCHAR(50),
    unit VARCHAR(50) NOT NULL DEFAULT 'pcs',
    tax_rate NUMERIC(4,2) NOT NULL DEFAULT 0.08,
    cost_price NUMERIC(12,2) NOT NULL DEFAULT 0,
    freight_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
    customs_duty NUMERIC(12,2) NOT NULL DEFAULT 0,
    other_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
    base_retail_price NUMERIC(12,2) NOT NULL DEFAULT 0,
    min_stock_alert INTEGER NOT NULL DEFAULT 10,
    reorder_level INTEGER NOT NULL DEFAULT 20,
    status VARCHAR(50) NOT NULL DEFAULT 'Active',
    halal_status VARCHAR(50) NOT NULL DEFAULT 'not_applicable',
    is_new_arrival BOOLEAN NOT NULL DEFAULT false,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    is_bestseller BOOLEAN NOT NULL DEFAULT false,
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    website_sync_status VARCHAR(50) NOT NULL DEFAULT 'pending',
    website_sync_error TEXT,
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON public.products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand ON public.products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_supplier ON public.products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);

-- ----------------------------------------------------------------------------
-- 8. PRODUCT_IMAGES TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    alt_text VARCHAR(255),
    is_primary BOOLEAN NOT NULL DEFAULT false,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_images_product ON public.product_images(product_id);

-- ----------------------------------------------------------------------------
-- 9. PRODUCT_STORE_PRICES TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_store_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    channel VARCHAR(50) NOT NULL DEFAULT 'store', -- 'store' or 'website'
    regular_price NUMERIC(12,2) NOT NULL,
    offer_price NUMERIC(12,2),
    wholesale_price NUMERIC(12,2),
    online_price NUMERIC(12,2),
    tax_rate NUMERIC(4,2) NOT NULL DEFAULT 0.08,
    offer_start_date TIMESTAMPTZ,
    offer_end_date TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    CONSTRAINT uq_product_store_channel UNIQUE (product_id, store_id, channel)
);

CREATE INDEX IF NOT EXISTS idx_psp_product ON public.product_store_prices(product_id);
CREATE INDEX IF NOT EXISTS idx_psp_store ON public.product_store_prices(store_id);

-- ----------------------------------------------------------------------------
-- 10. PRICE_HISTORY TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
    channel VARCHAR(50) NOT NULL DEFAULT 'store',
    old_price NUMERIC(12,2) NOT NULL,
    new_price NUMERIC(12,2) NOT NULL,
    price_type VARCHAR(50) NOT NULL DEFAULT 'regular',
    reason TEXT,
    changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    effective_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_price_history_product ON public.price_history(product_id);
CREATE INDEX IF NOT EXISTS idx_price_history_store ON public.price_history(store_id);
CREATE INDEX IF NOT EXISTS idx_price_history_date ON public.price_history(effective_date DESC);

-- ----------------------------------------------------------------------------
-- 11. INVENTORY TABLE (Store-specific inventory)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    reserved_quantity INTEGER NOT NULL DEFAULT 0,
    shelf_location VARCHAR(100),
    last_restocked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_inventory_product_store UNIQUE (product_id, store_id)
);

CREATE INDEX IF NOT EXISTS idx_inventory_product ON public.inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_store ON public.inventory(store_id);

-- ----------------------------------------------------------------------------
-- 12. STOCK_MOVEMENTS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    movement_type VARCHAR(50) NOT NULL, -- 'Stock In', 'Stock Out', 'Sale', 'Adjustment', 'Transfer In', 'Transfer Out', 'Damaged', 'Waste', 'Expired', 'Return'
    quantity INTEGER NOT NULL,
    previous_stock INTEGER NOT NULL,
    new_stock INTEGER NOT NULL,
    reference VARCHAR(100),
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stock_movements_prod ON public.stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_store ON public.stock_movements(store_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON public.stock_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created ON public.stock_movements(created_at DESC);

-- ----------------------------------------------------------------------------
-- 13. PRODUCT_SUPPLIERS TABLE (Multi-supplier sourcing)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    supplier_product_code VARCHAR(100),
    purchase_price NUMERIC(12,2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'JPY',
    moq INTEGER NOT NULL DEFAULT 1,
    pack_quantity INTEGER NOT NULL DEFAULT 1,
    lead_time_days INTEGER NOT NULL DEFAULT 2,
    last_purchase_price NUMERIC(12,2),
    is_preferred BOOLEAN NOT NULL DEFAULT false,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    CONSTRAINT uq_prod_supplier UNIQUE (supplier_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_prod_suppliers_prod ON public.product_suppliers(product_id);
CREATE INDEX IF NOT EXISTS idx_prod_suppliers_sup ON public.product_suppliers(supplier_id);

-- ----------------------------------------------------------------------------
-- 14. PURCHASE_ORDERS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    po_number VARCHAR(100) UNIQUE NOT NULL,
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
    store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Draft', -- 'Draft', 'Sent', 'Partial', 'Received', 'Cancelled'
    total_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
    currency VARCHAR(10) NOT NULL DEFAULT 'JPY',
    expected_delivery_date DATE,
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_po_supplier ON public.purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_po_store ON public.purchase_orders(store_id);
CREATE INDEX IF NOT EXISTS idx_po_status ON public.purchase_orders(status);

-- ----------------------------------------------------------------------------
-- 15. PURCHASE_ORDER_ITEMS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.purchase_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL,
    received_quantity INTEGER NOT NULL DEFAULT 0,
    unit_cost NUMERIC(12,2) NOT NULL,
    subtotal NUMERIC(12,2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_poi_po ON public.purchase_order_items(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_poi_prod ON public.purchase_order_items(product_id);

-- ----------------------------------------------------------------------------
-- 16. WEBSITE_SYNC TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.website_sync (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    channel VARCHAR(100) NOT NULL DEFAULT 'Shopify',
    event_type VARCHAR(50) NOT NULL, -- 'product_create', 'product_update', 'price_update', 'stock_update'
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'success', 'failed'
    http_code INTEGER,
    error_message TEXT,
    payload_summary TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sync_product ON public.website_sync(product_id);
CREATE INDEX IF NOT EXISTS idx_sync_status ON public.website_sync(status);

-- ----------------------------------------------------------------------------
-- 17. AUDIT_LOGS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL, -- 'product', 'price', 'inventory', 'sync', 'supplier', 'user', 'store', 'auth'
    entity_id VARCHAR(100),
    action VARCHAR(50) NOT NULL, -- 'create', 'update', 'delete', 'login', 'sync_trigger', 'stock_adjust', 'price_override'
    description TEXT NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    diff JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_user ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON public.audit_logs(created_at DESC);

-- ----------------------------------------------------------------------------
-- AUTOMATED UPDATED_AT TRIGGER FUNCTION
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach updated_at triggers
DO $$
DECLARE
    tbl text;
BEGIN
    FOR tbl IN
        SELECT unnest(ARRAY[
            'profiles', 'stores', 'categories', 'brands', 'suppliers',
            'products', 'product_store_prices', 'inventory', 'product_suppliers',
            'purchase_orders'
        ])
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS trg_set_updated_at ON public.%I;
            CREATE TRIGGER trg_set_updated_at
            BEFORE UPDATE ON public.%I
            FOR EACH ROW EXECUTE FUNCTION public.handle_set_updated_at();
        ', tbl, tbl);
    END LOOP;
END;
$$;

-- ----------------------------------------------------------------------------
-- AUTOMATIC USER CREATION TRIGGER (auth.users -> public.profiles)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
    default_role text := 'VIEWER';
    is_first boolean := false;
BEGIN
    -- Check if this is the first user registered in the system -> make ADMIN
    SELECT (count(*) = 0) INTO is_first FROM public.profiles;
    IF is_first THEN
        default_role := 'ADMIN';
    END IF;

    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        role,
        assigned_store_id,
        is_active,
        avatar_url,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'role', default_role),
        (NEW.raw_user_meta_data->>'assigned_store_id')::uuid,
        true,
        NEW.raw_user_meta_data->>'avatar_url',
        now(),
        now()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Helper function: Get authenticated caller's application role
CREATE OR REPLACE FUNCTION public.current_app_role()
RETURNS VARCHAR LANGUAGE sql STABLE SECURITY DEFINER AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid() AND is_active = true;
$$;

-- Helper function: Get authenticated caller's assigned store
CREATE OR REPLACE FUNCTION public.current_user_store_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER AS $$
    SELECT assigned_store_id FROM public.profiles WHERE id = auth.uid();
$$;

-- Enable RLS on ALL 17 tables
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_store_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_sync ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- RLS POLICIES FOR: ROLES
-- ----------------------------------------------------------------------------
CREATE POLICY "Anyone can view roles"
    ON public.roles FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Only ADMIN can modify roles"
    ON public.roles FOR ALL
    TO authenticated
    USING (public.current_app_role() = 'ADMIN');

-- ----------------------------------------------------------------------------
-- RLS POLICIES FOR: PROFILES
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can view active profiles"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid() AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())); -- Prevent self-escalation

CREATE POLICY "ADMIN has full profile control"
    ON public.profiles FOR ALL
    TO authenticated
    USING (public.current_app_role() = 'ADMIN');

-- ----------------------------------------------------------------------------
-- RLS POLICIES FOR: STORES, CATEGORIES, BRANDS
-- ----------------------------------------------------------------------------
CREATE POLICY "Anyone can read stores"
    ON public.stores FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "ADMIN and MANAGER can modify stores"
    ON public.stores FOR ALL TO authenticated
    USING (public.current_app_role() IN ('ADMIN', 'MANAGER'));

CREATE POLICY "Anyone can read categories"
    ON public.categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "ADMIN and MANAGER can modify categories"
    ON public.categories FOR ALL TO authenticated
    USING (public.current_app_role() IN ('ADMIN', 'MANAGER'));

CREATE POLICY "Anyone can read brands"
    ON public.brands FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "ADMIN and MANAGER can modify brands"
    ON public.brands FOR ALL TO authenticated
    USING (public.current_app_role() IN ('ADMIN', 'MANAGER'));

-- ----------------------------------------------------------------------------
-- RLS POLICIES FOR: PRODUCTS & PRODUCT_IMAGES
-- ----------------------------------------------------------------------------
CREATE POLICY "Anyone can read products"
    ON public.products FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "ADMIN and MANAGER can insert/update products"
    ON public.products FOR INSERT TO authenticated
    WITH CHECK (public.current_app_role() IN ('ADMIN', 'MANAGER'));

CREATE POLICY "ADMIN and MANAGER can update products"
    ON public.products FOR UPDATE TO authenticated
    USING (public.current_app_role() IN ('ADMIN', 'MANAGER'));

-- Backward-compatibility delete policy
CREATE POLICY "Only ADMIN can delete products"
    ON public.products FOR DELETE TO authenticated
    USING (public.current_app_role() = 'ADMIN');

CREATE POLICY "Anyone can view product images"
    ON public.product_images FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "ADMIN and MANAGER can modify product images"
    ON public.product_images FOR ALL TO authenticated
    USING (public.current_app_role() IN ('ADMIN', 'MANAGER'));

-- ----------------------------------------------------------------------------
-- RLS POLICIES FOR: PRICING (PRODUCT_STORE_PRICES & PRICE_HISTORY)
-- ----------------------------------------------------------------------------
CREATE POLICY "Anyone can read prices"
    ON public.product_store_prices FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "ADMIN and MANAGER can modify prices"
    ON public.product_store_prices FOR ALL TO authenticated
    USING (public.current_app_role() IN ('ADMIN', 'MANAGER'));

CREATE POLICY "Anyone can view price history"
    ON public.price_history FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "ADMIN and MANAGER can insert price history"
    ON public.price_history FOR INSERT TO authenticated
    WITH CHECK (public.current_app_role() IN ('ADMIN', 'MANAGER'));

-- ----------------------------------------------------------------------------
-- RLS POLICIES FOR: INVENTORY & STOCK_MOVEMENTS
-- ----------------------------------------------------------------------------
CREATE POLICY "Anyone can read inventory"
    ON public.inventory FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "ADMIN and MANAGER can manage all inventory"
    ON public.inventory FOR ALL TO authenticated
    USING (public.current_app_role() IN ('ADMIN', 'MANAGER'));

CREATE POLICY "STORE_STAFF can update inventory of assigned store"
    ON public.inventory FOR UPDATE TO authenticated
    USING (
        public.current_app_role() = 'STORE_STAFF' AND
        (public.current_user_store_id() IS NULL OR store_id = public.current_user_store_id())
    );

CREATE POLICY "Anyone can view stock movements"
    ON public.stock_movements FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "ADMIN, MANAGER, and STORE_STAFF can record stock movements"
    ON public.stock_movements FOR INSERT TO authenticated
    WITH CHECK (
        public.current_app_role() IN ('ADMIN', 'MANAGER') OR
        (public.current_app_role() = 'STORE_STAFF' AND (public.current_user_store_id() IS NULL OR store_id = public.current_user_store_id()))
    );

-- ----------------------------------------------------------------------------
-- RLS POLICIES FOR: SUPPLIERS & PRODUCT_SUPPLIERS
-- ----------------------------------------------------------------------------
CREATE POLICY "Anyone can view suppliers"
    ON public.suppliers FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "ADMIN and MANAGER can modify suppliers"
    ON public.suppliers FOR ALL TO authenticated
    USING (public.current_app_role() IN ('ADMIN', 'MANAGER'));

CREATE POLICY "ADMIN and MANAGER can view product suppliers"
    ON public.product_suppliers FOR SELECT TO authenticated
    USING (public.current_app_role() IN ('ADMIN', 'MANAGER'));

CREATE POLICY "ADMIN and MANAGER can modify product suppliers"
    ON public.product_suppliers FOR ALL TO authenticated
    USING (public.current_app_role() IN ('ADMIN', 'MANAGER'));

-- ----------------------------------------------------------------------------
-- RLS POLICIES FOR: PURCHASE ORDERS
-- ----------------------------------------------------------------------------
CREATE POLICY "ADMIN and MANAGER can view purchase orders"
    ON public.purchase_orders FOR SELECT TO authenticated
    USING (public.current_app_role() IN ('ADMIN', 'MANAGER'));

CREATE POLICY "ADMIN and MANAGER can modify purchase orders"
    ON public.purchase_orders FOR ALL TO authenticated
    USING (public.current_app_role() IN ('ADMIN', 'MANAGER'));

CREATE POLICY "ADMIN and MANAGER can view purchase order items"
    ON public.purchase_order_items FOR SELECT TO authenticated
    USING (public.current_app_role() IN ('ADMIN', 'MANAGER'));

CREATE POLICY "ADMIN and MANAGER can modify purchase order items"
    ON public.purchase_order_items FOR ALL TO authenticated
    USING (public.current_app_role() IN ('ADMIN', 'MANAGER'));

-- ----------------------------------------------------------------------------
-- RLS POLICIES FOR: WEBSITE SYNC & AUDIT LOGS
-- ----------------------------------------------------------------------------
CREATE POLICY "ADMIN and MANAGER can view website sync"
    ON public.website_sync FOR SELECT TO authenticated
    USING (public.current_app_role() IN ('ADMIN', 'MANAGER'));

CREATE POLICY "ADMIN and MANAGER can record website sync"
    ON public.website_sync FOR ALL TO authenticated
    USING (public.current_app_role() IN ('ADMIN', 'MANAGER'));

CREATE POLICY "ADMIN and MANAGER can view audit logs"
    ON public.audit_logs FOR SELECT TO authenticated
    USING (public.current_app_role() IN ('ADMIN', 'MANAGER'));

CREATE POLICY "Authenticated users can record audit entries"
    ON public.audit_logs FOR INSERT TO authenticated
    WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================================
-- SEED DATA FOR DEMO & TESTING
-- ============================================================================
-- Stores
INSERT INTO public.stores (id, code, name, address, phone, manager_name)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'SKW-01', 'BIMI Supa – Shin-Koiwa', '1-48-8 Higashi-Shin-Koiwa, Katsushika-ku, Tokyo', '03-5678-1234', 'Sayaka Sato'),
    ('22222222-2222-2222-2222-222222222222', 'YTG-02', 'BIMI Supa – Yotsugi', '3-14-2 Yotsugi, Katsushika-ku, Tokyo', '03-3691-8899', 'Daisuke Mori')
ON CONFLICT (code) DO NOTHING;

-- Categories
INSERT INTO public.categories (id, name, name_ja, slug, tax_rate)
VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Fresh Meat & Poultry', '精肉・鶏肉', 'meat', 0.08),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Fresh Seafood', '鮮魚・刺身', 'seafood', 0.08),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Japanese Pantry & Condiments', '調味料・乾物', 'pantry', 0.08),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Beverages & Soft Drinks', '飲料・お茶', 'beverages', 0.08)
ON CONFLICT (slug) DO NOTHING;

-- Brands
INSERT INTO public.brands (id, name, country)
VALUES
    ('99999999-9999-9999-9999-999999999901', 'My BIMI Direct Selection', 'Japan'),
    ('99999999-9999-9999-9999-999999999902', 'JA Miyazaki Wagyu Guild', 'Japan'),
    ('99999999-9999-9999-9999-999999999903', 'Ito En Co.', 'Japan'),
    ('99999999-9999-9999-9999-999999999904', 'Siam Gourmet Co.', 'Thailand')
ON CONFLICT DO NOTHING;
