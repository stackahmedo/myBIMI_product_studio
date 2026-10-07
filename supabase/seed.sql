-- ============================================================================
-- PRODUCT STUDIO by My BIMI - Initial Seed Data & Public Read RLS Update
-- ============================================================================
-- Run this in your Supabase SQL Editor to:
-- 1. Enable public (anon + authenticated) read access for catalog browsing.
-- 2. Populate stores, categories, brands, suppliers, products, and prices.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. ALLOW PUBLIC READ ACCESS (ANON + AUTHENTICATED) FOR CATALOG
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can view roles" ON public.roles;
CREATE POLICY "Anyone can view roles" ON public.roles FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "All authenticated users can read stores" ON public.stores;
CREATE POLICY "Anyone can read stores" ON public.stores FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "All authenticated users can read categories" ON public.categories;
CREATE POLICY "Anyone can read categories" ON public.categories FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "All authenticated users can read brands" ON public.brands;
CREATE POLICY "Anyone can read brands" ON public.brands FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "All authenticated users can read products" ON public.products;
CREATE POLICY "Anyone can read products" ON public.products FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "All users can view product images" ON public.product_images;
CREATE POLICY "Anyone can view product images" ON public.product_images FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "All authenticated users can read prices" ON public.product_store_prices;
CREATE POLICY "Anyone can read prices" ON public.product_store_prices FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "All authenticated users can view price history" ON public.price_history;
CREATE POLICY "Anyone can view price history" ON public.price_history FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "All authenticated users can read inventory" ON public.inventory;
CREATE POLICY "Anyone can read inventory" ON public.inventory FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "All authenticated users can view stock movements" ON public.stock_movements;
CREATE POLICY "Anyone can view stock movements" ON public.stock_movements FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "ADMIN and MANAGER can view suppliers" ON public.suppliers;
CREATE POLICY "Anyone can view suppliers" ON public.suppliers FOR SELECT TO anon, authenticated USING (true);

-- ----------------------------------------------------------------------------
-- 2. SEED STORES
-- ----------------------------------------------------------------------------
INSERT INTO public.stores (code, name, address, phone, manager_name, is_active)
VALUES
    ('SKW-01', 'BIMI Supa – Shin-Koiwa', '1-14-8 Shin-Koiwa, Katsushika-ku, Tokyo 124-0024', '03-3691-8821', 'Sayaka Sato', true),
    ('YTG-02', 'BIMI Supa – Yotsugi', '2-21-4 Yotsugi, Katsushika-ku, Tokyo 124-0014', '03-3694-5510', 'Daisuke Mori', true)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    address = EXCLUDED.address,
    phone = EXCLUDED.phone,
    manager_name = EXCLUDED.manager_name,
    is_active = EXCLUDED.is_active;

-- ----------------------------------------------------------------------------
-- 3. SEED CATEGORIES
-- ----------------------------------------------------------------------------
INSERT INTO public.categories (name, name_ja, slug, tax_rate)
VALUES
    ('Fresh Produce', '生鮮野菜・果物', 'produce', 0.08),
    ('Meat & Poultry', '精肉・加工肉', 'meat', 0.08),
    ('Seafood & Sashimi', '鮮魚・刺身', 'seafood', 0.08),
    ('Dairy & Chilled', '乳製品・日配品', 'dairy', 0.08),
    ('Pantry & Grains', '調味料・米・乾物', 'pantry', 0.08),
    ('Deli & Bento', '惣菜・弁当', 'deli', 0.08),
    ('Beverages & Tea', '飲料・日本茶', 'beverages', 0.08),
    ('Snacks & Sweets', '菓子・米菓', 'snacks', 0.08)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    name_ja = EXCLUDED.name_ja,
    tax_rate = EXCLUDED.tax_rate;

-- ----------------------------------------------------------------------------
-- 4. SEED BRANDS
-- ----------------------------------------------------------------------------
INSERT INTO public.brands (name, country)
VALUES
    ('BIMI Select', 'Japan'),
    ('Tokyo Fresh', 'Japan'),
    ('Nippon Halal', 'Japan'),
    ('Halal Kitchen Asia', 'Malaysia'),
    ('Sunrise Farm', 'Japan')
ON CONFLICT (name) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 5. SEED SUPPLIERS
-- ----------------------------------------------------------------------------
INSERT INTO public.suppliers (code, name, contact_person, phone, whatsapp, email, address, country, payment_terms, currency, lead_time_days, is_active)
VALUES
    ('SUP-001', 'Tokyo Organic Market Wholesale', 'Kenji Takahashi', '03-5566-7788', '+81355667788', 'orders@tokyo-organic.jp', 'Toyosu Market Bldg 4F, Koto-ku, Tokyo', 'Japan', 'Net 30', 'JPY', 2, true),
    ('SUP-002', 'Nippon Halal Meat Distributors', 'Tariq Al-Mansoor', '03-3456-7890', '+819012345678', 'sales@nipponhalal.jp', 'Shibaura Meat Terminal, Minato-ku, Tokyo', 'Japan', 'Net 15', 'JPY', 1, true),
    ('SUP-003', 'Hokkaido Dairy & Chilled Goods', 'Yoko Ota', '011-888-9999', '+81118889999', 'supply@hokkaido-chilled.jp', 'Chitose Logistics Hub, Hokkaido', 'Japan', 'Net 30', 'JPY', 3, true)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    contact_person = EXCLUDED.contact_person,
    phone = EXCLUDED.phone,
    is_active = EXCLUDED.is_active;

-- ----------------------------------------------------------------------------
-- 6. SEED INITIAL PRODUCTS
-- ----------------------------------------------------------------------------
DO $$
DECLARE
    cat_meat UUID;
    cat_produce UUID;
    cat_pantry UUID;
    brand_bimi UUID;
    brand_halal UUID;
    p1 UUID;
    p2 UUID;
    p3 UUID;
    s1 UUID;
    s2 UUID;
BEGIN
    SELECT id INTO cat_meat FROM public.categories WHERE slug = 'meat' LIMIT 1;
    SELECT id INTO cat_produce FROM public.categories WHERE slug = 'produce' LIMIT 1;
    SELECT id INTO cat_pantry FROM public.categories WHERE slug = 'pantry' LIMIT 1;
    SELECT id INTO brand_bimi FROM public.brands WHERE name = 'BIMI Select' LIMIT 1;
    SELECT id INTO brand_halal FROM public.brands WHERE name = 'Nippon Halal' LIMIT 1;
    SELECT id INTO s1 FROM public.stores WHERE code = 'SKW-01' LIMIT 1;
    SELECT id INTO s2 FROM public.stores WHERE code = 'YTG-02' LIMIT 1;

    -- Product 1: Wagyu Beef Striploin (Halal Certified)
    INSERT INTO public.products (
        sku, barcode, name, name_ja, description,
        category_id, brand_id, unit, base_price, tax_rate,
        halal_status, status, website_sync_status, website_publishing_state
    ) VALUES (
        'WAGYU-STRIP-200G', '4580001230015',
        'Halal Miyazaki Wagyu A5 Striploin Steak 200g', '宮崎牛A5等級サーロインステーキ (ハラール認証)',
        'Miyazaki Prefecture A5 Wagyu striploin steak, 100% Halal certified slaughter with trace certificate.',
        cat_meat, brand_halal, 'pack', 3800.00, 0.08,
        'certified', 'Active', 'synced', 'Published'
    ) ON CONFLICT (sku) DO UPDATE SET
        name = EXCLUDED.name,
        base_price = EXCLUDED.base_price
    RETURNING id INTO p1;

    -- Product 2: Premium Japanese Koshihikari Rice 5kg
    INSERT INTO public.products (
        sku, barcode, name, name_ja, description,
        category_id, brand_id, unit, base_price, tax_rate,
        halal_status, status, website_sync_status, website_publishing_state
    ) VALUES (
        'RICE-KOSHI-5KG', '4580001230022',
        'Niigata Uonuma Koshihikari Premium Rice 5kg', '新潟県魚沼産コシヒカリ 5kg (極上)',
        'Single-origin Uonuma harvest white rice with soft texture and natural sweetness.',
        cat_pantry, brand_bimi, 'bag', 2980.00, 0.08,
        'not_applicable', 'Active', 'synced', 'Published'
    ) ON CONFLICT (sku) DO UPDATE SET
        name = EXCLUDED.name,
        base_price = EXCLUDED.base_price
    RETURNING id INTO p2;

    -- Product 3: Organic Japanese Amaou Strawberries 300g
    INSERT INTO public.products (
        sku, barcode, name, name_ja, description,
        category_id, brand_id, unit, base_price, tax_rate,
        halal_status, status, website_sync_status, website_publishing_state
    ) VALUES (
        'STRAW-AMAOU-300G', '4580001230039',
        'Fukuoka Hakata Amaou Strawberry Pack 300g', '福岡県産博多あまおう 1パック (300g)',
        'Famous Hakata Amaou strawberries renowned for size, roundness, deep redness, and high sugar brix.',
        cat_produce, brand_bimi, 'pack', 1280.00, 0.08,
        'not_applicable', 'Active', 'synced', 'Published'
    ) ON CONFLICT (sku) DO UPDATE SET
        name = EXCLUDED.name,
        base_price = EXCLUDED.base_price
    RETURNING id INTO p3;

    -- Store Prices & Inventory for Store 1
    IF s1 IS NOT NULL THEN
        IF p1 IS NOT NULL THEN
            INSERT INTO public.product_store_prices (product_id, store_id, price)
            VALUES (p1, s1, 3800.00) ON CONFLICT (product_id, store_id) DO NOTHING;
            INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
            VALUES (p1, s1, 25, 5, 50, 10) ON CONFLICT (product_id, store_id) DO NOTHING;
        END IF;
        IF p2 IS NOT NULL THEN
            INSERT INTO public.product_store_prices (product_id, store_id, price)
            VALUES (p2, s1, 2980.00) ON CONFLICT (product_id, store_id) DO NOTHING;
            INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
            VALUES (p2, s1, 60, 10, 100, 20) ON CONFLICT (product_id, store_id) DO NOTHING;
        END IF;
        IF p3 IS NOT NULL THEN
            INSERT INTO public.product_store_prices (product_id, store_id, price)
            VALUES (p3, s1, 1280.00) ON CONFLICT (product_id, store_id) DO NOTHING;
            INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
            VALUES (p3, s1, 40, 8, 80, 15) ON CONFLICT (product_id, store_id) DO NOTHING;
        END IF;
    END IF;

    -- Store Prices & Inventory for Store 2
    IF s2 IS NOT NULL THEN
        IF p1 IS NOT NULL THEN
            INSERT INTO public.product_store_prices (product_id, store_id, price)
            VALUES (p1, s2, 3850.00) ON CONFLICT (product_id, store_id) DO NOTHING;
            INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
            VALUES (p1, s2, 18, 5, 40, 8) ON CONFLICT (product_id, store_id) DO NOTHING;
        END IF;
        IF p2 IS NOT NULL THEN
            INSERT INTO public.product_store_prices (product_id, store_id, price)
            VALUES (p2, s2, 2980.00) ON CONFLICT (product_id, store_id) DO NOTHING;
            INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
            VALUES (p2, s2, 45, 10, 80, 15) ON CONFLICT (product_id, store_id) DO NOTHING;
        END IF;
        IF p3 IS NOT NULL THEN
            INSERT INTO public.product_store_prices (product_id, store_id, price)
            VALUES (p3, s2, 1250.00) ON CONFLICT (product_id, store_id) DO NOTHING;
            INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
            VALUES (p3, s2, 30, 8, 60, 12) ON CONFLICT (product_id, store_id) DO NOTHING;
        END IF;
    END IF;
END $$;
