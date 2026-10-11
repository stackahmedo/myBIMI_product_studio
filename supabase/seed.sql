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

-- ----------------------------------------------------------------------------
-- 6. SEED SHIN-KOIWA STORE CATALOG (367 ITEMS FROM SPREADSHEET)
-- ----------------------------------------------------------------------------
DO 14891
DECLARE
    skw_id UUID;
    cat_meat UUID;
    cat_seafood UUID;
    cat_beverages UUID;
    cat_pantry UUID;
    b_direct UUID;
    cur_cat UUID;
    prod_id UUID;
BEGIN
    SELECT id INTO skw_id FROM public.stores WHERE code = 'SKW-01' LIMIT 1;
    SELECT id INTO cat_meat FROM public.categories WHERE slug = 'meat' LIMIT 1;
    SELECT id INTO cat_seafood FROM public.categories WHERE slug = 'seafood' LIMIT 1;
    SELECT id INTO cat_beverages FROM public.categories WHERE slug = 'beverages' LIMIT 1;
    SELECT id INTO cat_pantry FROM public.categories WHERE slug = 'pantry' LIMIT 1;
    SELECT id INTO b_direct FROM public.brands LIMIT 1;

    cur_cat := cat_beverages;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0001', '490100000001', '100% ORGANIC APPLE JUICE 200ML', 'オーガニック アップルジュース', cur_cat, b_direct, 'Japan', '200ML', 'ml', 78, 120, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 120)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_beverages;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0002', '490100000002', '100% ORGANIC MIXED BERRY 200ML', 'オーガニック ミックスベリージュース', cur_cat, b_direct, 'Japan', '200ML', 'ml', 78, 120, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 120)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0003', '490100000003', 'AHMED BIRYANI MASALA 60G', 'アーメド ビリヤニマサラ', cur_cat, b_direct, 'Japan', '60gm', 'g', 150, 231, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 231)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0004', '490100000004', 'AHMED CUMIN POWDER', 'アーメド クミンパウダー', cur_cat, b_direct, 'Japan', '200gm', 'g', 300, 462, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 462)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0005', '490100000005', 'AHMED PULAO BRIYANI', 'アーメド プラオ ビリヤニ', cur_cat, b_direct, 'Japan', '50gm', 'g', 300, 462, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 462)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0006', '490100000006', 'AJWAIN SEED', 'アジュワンシード', cur_cat, b_direct, 'Japan', '100gm', 'g', 300, 462, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 462)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0007', '490100000007', 'AL MANI DRY CHILI', 'アルマニ 乾燥唐辛子', cur_cat, b_direct, 'Japan', '50gm', 'g', 90, 138, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 138)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0008', '490100000008', 'AL MANI MAIDA', 'アルマニ マイダ粉', cur_cat, b_direct, 'Japan', '1kg', 'kg', 211, 324, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 324)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0009', '490100000009', 'AL MANI MUSTARD OIL 1L', 'アルマニ マスタードオイル', cur_cat, b_direct, 'Japan', '1l', 'L', 469, 722, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 722)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0010', '490100000010', 'AL MANI POTATO MIX CHANACHUR', 'アルマニ ポテトミックス チャナチュール', cur_cat, b_direct, 'Japan', '200gm', 'g', 211, 324, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 324)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0011', '490100000011', 'AL MANI SOOJI', 'アルマニ スージ', cur_cat, b_direct, 'Japan', '1KG', 'kg', 300, 462, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 462)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_meat;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0012', '490100000012', 'AL MODINA BEEF SINA', 'アルモディナ 牛バラ肉', cur_cat, b_direct, 'Japan', '1kg', 'kg', 601, 925, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 925)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0013', '490100000013', 'AL-MANI CHINNAMON STICK', 'アルマニ シナモンスティック', cur_cat, b_direct, 'Japan', '100gm', 'g', 150, 231, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 231)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_meat;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0014', '490100000014', 'ALIN CHICKEN CURRY MASALA', 'アリン チキンカレーマサラ', cur_cat, b_direct, 'Japan', '40gm', 'g', 132, 203, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 203)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0015', '490100000015', 'ALIN CHILI POWDER', 'アリン チリパウダー', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 211, 324, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 324)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0016', '490100000016', 'ALIN CHILLI POWDER', 'アリン チリパウダー', cur_cat, b_direct, 'Japan', '200gm', 'g', 211, 324, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 324)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_meat;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0017', '490100000017', 'ALIN MUTTON BIRYANI MASALA', 'アリン マトンビリヤニマサラ', cur_cat, b_direct, 'Japan', '40gm', 'g', 138, 212, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 212)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0018', '490100000018', 'ALIN VERMICELLI/SEMAI', 'アリン バーミセリ セマイ', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 138, 212, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 212)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_meat;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0019', '490100000019', 'AL MADINA BEEF W/B', 'アルマディナ 骨付き牛肉', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 1083, 1666, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 1666)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0020', '490100000020', 'AL MANI HOT CHANACHUR', 'アルマニ ホットチャナチュール', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 138, 212, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 212)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_meat;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0021', '490100000021', 'AL MODINA CHICKEN BONELESS', 'アルモディナ 骨なしチキン', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 120, 185, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 185)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0022', '490100000022', 'ALMOND 500gm', 'アーモンド 500gm', cur_cat, b_direct, 'Japan', '500gm', 'g', 764, 1175, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 1175)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_beverages;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0023', '490100000023', 'ALOE WATERMELON', 'アロエ スイカジュース', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 187, 287, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 287)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0024', '490100000024', 'ALPHONSO MANGO PULP', 'アルフォンソ マンゴーピューレ', cur_cat, b_direct, 'Japan', '850gm', 'g', 349, 537, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 537)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0025', '490100000025', 'ANDA CHOP', 'アンダーチョップ', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 90, 138, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 138)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_beverages;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0026', '490100000026', 'APPLE JUICE DRINK', 'アップルジュース', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 72, 111, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 111)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_seafood;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0027', '490100000027', 'BAILA FISH', 'バイラ魚', cur_cat, b_direct, 'Japan', '500gm', 'g', 65, 100, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 100)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0028', '490100000028', 'BASHUNDHARA MOIDHA', 'バシュンダラ マイダ粉', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 211, 324, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 324)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_beverages;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0029', '490100000029', 'BASIL SEED DRINK', 'バジルシードドリンク ホワイトグレープ', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 90, 138, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 138)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_beverages;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0030', '490100000030', 'BASIL SEED DRINK', 'バジルシードドリンク', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 180, 277, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 277)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0031', '490100000031', 'BASIL SEED ORANGE 200M', 'バジルシード オレンジ', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 180, 277, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 277)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0032', '490100000032', 'KAALAR BASMATI RICE', 'バスマティライス', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 571, 879, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 879)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0033', '490100000033', 'KAALAR BASMATI RICE', 'カラール バスマティライス', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 2347, 3611, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 3611)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0034', '490100000034', 'MEHRAN BASMATI RICE', 'メヘラン バスマティライス', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 2226, 3425, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 3425)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0035', '490100000035', 'BAY LEAF', 'ベイリーフ', cur_cat, b_direct, 'Japan', '50gm', 'g', 90, 138, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 138)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0036', '490100000036', 'RUCHI BBQ CHANACHUR', 'バーベキュー チャナチュール', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 138, 212, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 212)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_meat;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0037', '490100000037', 'BEEF & CHICKEN DICED STEAK', '牛鶏サイコロステーキ', cur_cat, b_direct, 'Japan', '1', 'pcs', 481, 740, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 740)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_meat;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0038', '490100000038', 'AHMED BEEF BIRYANI', 'アーメド ビーフビリヤニ', cur_cat, b_direct, 'Japan', '55gm', 'g', 150, 231, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 231)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_meat;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0039', '490100000039', 'BEEF CHEESE KEBAB WRAP', 'ビーフチーズケバブラップ', cur_cat, b_direct, 'Japan', '1', 'pcs', 632, 972, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 972)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_meat;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0040', '490100000040', 'BEEF KEBAB RICE BOWL', 'ビーフケバブ丼', cur_cat, b_direct, 'Japan', '1', 'pcs', 1805, 2777, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 2777)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_meat;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0041', '490100000041', 'BEEF KEBAB SANDWICH', 'ビーフケバブサンド', cur_cat, b_direct, 'Japan', '1', 'pcs', 4875, 7500, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 7500)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_meat;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0042', '490100000042', 'BEEF KEBAB SNACK', 'ビーフケバブ おつまみ', cur_cat, b_direct, 'Japan', '1', 'pcs', 1083, 1666, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 1666)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_meat;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0043', '490100000043', 'BEEF KEBAB WRAP', 'ビーフケバブラップ', cur_cat, b_direct, 'Japan', '1', 'pcs', 601, 925, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 925)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_meat;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0044', '490100000044', 'BEEF KIMA', 'ビーフキーマ', cur_cat, b_direct, 'Japan', '400gm', 'g', 722, 1111, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 1111)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_meat;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0045', '490100000045', 'BEEF LIVER', '牛レバー', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 571, 879, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 879)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_meat;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0046', '490100000046', 'BEEF LIVER AL-MODINA', 'アルモディナ 牛レバー', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 662, 1018, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 1018)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_meat;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0047', '490100000047', 'BEEF PAYA', '牛パヤ', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 692, 1064, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 1064)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_meat;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0048', '490100000048', 'BEEF TRIPE PREIUM QUAILTY', '特選 牛ハチノス', cur_cat, b_direct, 'Japan', '1Kg', 'kg', 692, 1064, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 1064)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_meat;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0049', '490100000049', 'BEEF TRIPE WITH SKIN', '皮付き牛ハチノス', cur_cat, b_direct, 'Japan', '1kg', 'kg', 1083, 1666, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 1666)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_meat;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0050', '490100000050', 'BEEF WITH BONE', '骨付き牛肉', cur_cat, b_direct, 'Japan', '1kg', 'kg', 1083, 1666, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 1666)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_meat;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0051', '490100000051', 'BIMI BEEF BONELESS 1KG', '美味 骨なし牛肉', cur_cat, b_direct, 'Japan', '1kg', 'kg', 1234, 1898, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 1898)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_meat;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0052', '490100000052', 'BIMI CHICKEN CUT 1KG', '美味 チキンカット', cur_cat, b_direct, 'Japan', '1kg', 'kg', 391, 601, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 601)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_meat;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0053', '490100000053', 'BIMI MUTTON BONELESS 1KG', '美味 骨なしマトン肉', cur_cat, b_direct, 'Japan', '1kg', 'kg', 2106, 3240, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 3240)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0054', '490100000054', 'BIMI WHITE CHANA', '美味 白ひよこ豆', cur_cat, b_direct, 'Japan', '1kg', 'kg', 541, 833, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 833)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0055', '490100000055', 'BLACK EYE BEANS JB', 'ジェイビー 黒目豆', cur_cat, b_direct, 'Japan', '1kg', 'kg', 512, 787, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 787)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0056', '490100000056', 'BLACK PAPER', 'ブラックペッパー', cur_cat, b_direct, 'Japan', '500gm', 'g', 1, 1, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 1)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_seafood;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0057', '490100000057', 'BOAL CUT 500G', 'ボアル魚 カット', cur_cat, b_direct, 'Japan', '500gm', 'g', 551, 847, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 847)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0058', '490100000058', 'BRITANNIA BUTTER COOKIES', 'ブリタニア バタークッキー', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 78, 120, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 120)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0059', '490100000059', 'BRITANNIA CASHEW COOKIES', 'ブリタニア カシュークッキー', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 78, 120, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 120)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0060', '490100000060', 'BRITANNIA PISTACHIO COOKIES', 'ブリタニア ピスタチオクッキー', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 78, 120, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 120)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0061', '490100000061', 'CALROSE RICE', 'カルローズ米', cur_cat, b_direct, 'Japan', '5Kg', 'kg', 2889, 4444, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 4444)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0062', '490100000062', 'CARDAMON WHOLE 1 PACKET', 'カルダモン ホール', cur_cat, b_direct, 'Japan', '400gm', 'g', 566, 870, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 870)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0063', '490100000063', 'CASHEWNUT BROKEN', '割れカシューナッツ', cur_cat, b_direct, 'Japan', '500gm', 'g', 782, 1203, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 1203)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_meat;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0064', '490100000064', 'CENTURY CHICKEN MASALA', 'センチュリー チキンマサラ', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 132, 203, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 203)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0065', '490100000065', 'CENTURY GARAM MASALA', 'センチュリー ガラムマサラ', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 168, 259, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 259)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_meat;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0066', '490100000066', 'CENTURY MEAT MASALA', 'センチュリー ミートマサラ', cur_cat, b_direct, 'Japan', '50gm', 'g', 132, 203, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 203)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0067', '490100000067', 'CENTURY MIX MASALA', 'センチュリー ミックスマサラ', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 391, 601, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 601)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0068', '490100000068', 'CENTURY PANI PURI', 'センチュリー パニプリ', cur_cat, b_direct, 'Japan', '175gm', 'g', 174, 268, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 268)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0069', '490100000069', 'CENTURY PANIPURI MASALA', 'センチュリー パニプリマサラ', cur_cat, b_direct, 'Japan', '50gm', 'g', 132, 203, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 203)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0070', '490100000070', 'CHAKKIFRESH ATTA', 'チャッキフレッシュ アタ粉', cur_cat, b_direct, 'Japan', '1Kg', 'kg', 211, 324, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 324)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0071', '490100000071', 'CHANA DAL JB', 'ジェイビー チャナダール', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 211, 324, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 324)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0072', '490100000072', 'CHAOKOH COCONUT MILK', 'チャオコー ココナッツミルク', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 300, 462, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 462)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0073', '490100000073', 'CHATPATE MASALA', 'チャットパテマサラ', cur_cat, b_direct, 'Japan', '50gm', 'g', 150, 231, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 231)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0074', '490100000074', 'CHEPA SUTKI', 'チェパ シュトキ', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 300, 462, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 462)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0075', '490100000075', 'CHIA SEEDS', 'チアシード', cur_cat, b_direct, 'Japan', '100gm', 'g', 211, 324, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 324)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_meat;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0076', '490100000076', 'CHICKEN BIRYANI MASALA', 'チキンビリヤニ', cur_cat, b_direct, 'Japan', '1', 'pcs', 475, 731, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 731)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_meat;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0077', '490100000077', 'CHICKEN BIRYANI MASALA', 'チキンビリヤニ', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 132, 203, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 203)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_meat;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0078', '490100000078', 'CHICKEN BREAST PKT', '鶏むね肉 パック', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 902, 1388, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 1388)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_meat;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0079', '490100000079', 'CHICKEN BRIYANI MASALA', 'チキンビリヤニ', cur_cat, b_direct, 'Japan', '200gm', 'g', 331, 509, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 509)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_meat;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0080', '490100000080', 'CHICKEN CHEESE KEBAB WRAP', 'チキンチーズケバブラップ', cur_cat, b_direct, 'Japan', '1', 'pcs', 2257, 3472, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 3472)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_meat;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0081', '490100000081', 'CHICKEN DRUMSTICK', '鶏ドラムスティック', cur_cat, b_direct, 'Japan', '900gm', 'g', 512, 787, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 787)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_meat;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0082', '490100000082', 'CHICKEN KEBAB RICE BOWL', 'チキンケバブ丼', cur_cat, b_direct, 'Japan', '1', 'pcs', 2106, 3240, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 3240)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_meat;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0083', '490100000083', 'CHICKEN KEBAB SANDWICH', 'チキンケバブサンド', cur_cat, b_direct, 'Japan', '1', 'pcs', 3611, 5555, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 5555)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_meat;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0084', '490100000084', 'CHICKEN KEBAB SNACK', 'チキンケバブ おつまみ', cur_cat, b_direct, 'Japan', '1', 'pcs', 1805, 2777, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 2777)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_meat;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0085', '490100000085', 'CHICKEN KEBAB WRAP', 'チキンケバブラップ', cur_cat, b_direct, 'Japan', '1', 'pcs', 3370, 5185, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 5185)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_meat;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0086', '490100000086', 'CHICKEN KING', 'チキンキング', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 211, 324, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 324)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_meat;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0087', '490100000087', 'CHICKEN MINCE', '鶏ひき肉', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 601, 925, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 925)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_meat;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0088', '490100000088', 'CHICKEN MOMO', 'チキンモモ', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 300, 462, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 462)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_meat;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0089', '490100000089', 'CHICKEN MOMO', 'チキンモモ', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 2407, 3703, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 3703)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_meat;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0090', '490100000090', 'CHICKEN TANDOORI', 'タンドリーチキン', cur_cat, b_direct, 'Japan', '1', 'pcs', 300, 462, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 462)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_meat;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0091', '490100000091', 'CHICKEN THIGH', '鶏もも肉', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 1805, 2777, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 2777)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_meat;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0092', '490100000092', 'CHICKEN TIKKA', 'チキンティッカ', cur_cat, b_direct, 'Japan', '1', 'pcs', 300, 462, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 462)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_meat;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0093', '490100000093', 'CHICKEN WHOLE CUT', '丸鶏 カット', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 2738, 4212, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 4212)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0094', '490100000094', 'CHILLI', '青唐辛子', cur_cat, b_direct, 'Japan', '500gm', 'g', 331, 509, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 509)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0095', '490100000095', 'CHILLI', '赤唐辛子', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 211, 324, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 324)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0096', '490100000096', 'CHILLI', 'チリチリ スナック', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 300, 462, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 462)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0097', '490100000097', 'CHILLI FLAKES ,', 'チリフレーク', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 270, 416, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 416)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0098', '490100000098', 'CHILLI POWDER', 'チリパウダー', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 1, 1, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 1)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0099', '490100000099', 'CHILLI POWDER', 'チリパウダー', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 89, 137, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 137)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_beverages;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0100', '490100000100', 'CHOCOLATE SOOPER COOKIES', 'チョコレート スーパークッキー', cur_cat, b_direct, 'Japan', '12.6gm', 'g', 90, 138, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 138)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0101', '490100000101', 'CHOMCHOM', 'チョムチョム', cur_cat, b_direct, 'Japan', '500gm', 'g', 493, 759, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 759)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0102', '490100000102', 'CHOWMEIN MASALA', 'チョウメンマサラ', cur_cat, b_direct, 'Japan', '50gm', 'g', 135, 208, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 208)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0103', '490100000103', 'CHUNKY CHAT MASALA', 'チャンキー チャットマサラ', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 211, 324, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 324)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0104', '490100000104', 'CIRRENT HOT N SPICY STICKS', 'カレント ホット スパイシースティック', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 716, 1101, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 1101)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0105', '490100000105', 'CLICK ZEERA BISCUITS', 'クリック ジーラビスケット', cur_cat, b_direct, 'Japan', '17.8gm', 'g', 90, 138, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 138)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0106', '490100000106', 'CLOVE WHOLE', 'クローブ ホール', cur_cat, b_direct, 'Japan', '500gm', 'g', 1625, 2500, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 2500)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0107', '490100000107', 'CLOVES WHOLE', 'クローブ ホール', cur_cat, b_direct, 'Japan', '100gm', 'g', 433, 666, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 666)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_beverages;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0108', '490100000108', 'COCA COLA', 'コカ・コーラ', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 204, 314, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 314)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_beverages;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0109', '490100000109', 'COCO WATER DRINK', 'ココナッツウォーター', cur_cat, b_direct, 'Japan', '1li', 'L', 307, 472, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 472)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_beverages;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0110', '490100000110', 'COCOMAX COCONUT WATER', 'ココマックス ココナッツウォーター', cur_cat, b_direct, 'Japan', '330ml', 'ml', 180, 277, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 277)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0111', '490100000111', 'COCONUT FINE', 'ココナッツファイン', cur_cat, b_direct, 'Japan', '500gm', 'g', 451, 694, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 694)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0112', '490100000112', 'COMPOUND GHEE', 'コンパウンドギー', cur_cat, b_direct, 'Japan', '900gm', 'g', 1083, 1666, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 1666)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0113', '490100000113', 'CORIANDER WHOLE 1 PACKET', 'コリアンダー ホール', cur_cat, b_direct, 'Japan', '1 PACKET', 'pack', 120, 185, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 185)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0114', '490100000114', 'CORIANDET POWDER 1 PACKET', 'コリアンダーパウダー', cur_cat, b_direct, 'Japan', '1 PACKET', 'pack', 58, 90, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 90)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0115', '490100000115', 'CORN GRITS', 'コーングリッツ', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 361, 555, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 555)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0116', '490100000116', 'CRISPY BEATEN RICE', 'クリスピー ビートライス', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 571, 879, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 879)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0117', '490100000117', 'CRISPY BEATEN RICE', 'クリスピー ビートライス', cur_cat, b_direct, 'Japan', '500gm', 'g', 601, 925, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 925)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0118', '490100000118', 'CUMIN POWDER 1 PACKET', 'クミンパウダー', cur_cat, b_direct, 'Japan', '1 PACKET', 'pack', 120, 185, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 185)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0119', '490100000119', 'CUMIN SEEDS', 'クミンシード', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 963, 1481, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 1481)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0120', '490100000120', 'CUMIN WHOLE 1 PACKET', 'クミン ホール', cur_cat, b_direct, 'Japan', '1 PACKET', 'pack', 120, 185, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 185)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0121', '490100000121', 'CURRENT 2X HOT AND SPICY NOODLES', 'カレント 激辛 スパイシーヌードル', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 180, 277, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 277)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0122', '490100000122', 'CURRENT HOT AND SPICY NOODLES', 'カレント ホット スパイシーヌードル', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 662, 1018, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 1018)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0123', '490100000123', 'CURRY POWDER', 'カレーパウダー', cur_cat, b_direct, 'Japan', '200gm', 'g', 270, 416, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 416)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0124', '490100000124', 'DAILY SPECIAL SET', '日替わりセット', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 300, 462, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 462)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0125', '490100000125', 'DESI CHAI', 'デシ チャイ', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 180, 277, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 277)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_meat;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0126', '490100000126', 'DIDER BEEF SINA', 'ディダー 牛バラ肉', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 1143, 1759, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 1759)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0127', '490100000127', 'DRY GARLIC1KG', '乾燥ニンニク', cur_cat, b_direct, 'Japan', '1KG', 'kg', 590, 907, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 907)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_seafood;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0128', '490100000128', 'DRY LOITA', '乾燥ロイタ魚', cur_cat, b_direct, 'Japan', '250gm', 'g', 601, 925, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 925)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_meat;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0129', '490100000129', 'DUCK WHOLE', '丸鴨肉', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 1625, 2500, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 2500)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0130', '490100000130', 'ECTARSUBUSUBU', 'ネクターつぶつぶ', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 132, 203, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 203)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0131', '490100000131', 'FANTA', 'ファンタ', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 307, 472, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 472)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0132', '490100000132', 'FELAFEL', 'ファラフェル', cur_cat, b_direct, 'Japan', '360gm', 'g', 421, 648, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 648)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0133', '490100000133', 'FENNEL SEED', 'フェンネルシード', cur_cat, b_direct, 'Japan', '100gm', 'g', 60, 92, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 92)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0134', '490100000134', 'FENUGRECK', 'フェヌグリーク', cur_cat, b_direct, 'Japan', '100gm', 'g', 60, 92, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 92)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0135', '490100000135', 'FRESH EGGS', '新鮮たまご', cur_cat, b_direct, 'Japan', '1packet', 'pack', 752, 1157, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 1157)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0136', '490100000136', 'FRESH FROZEN NAN', '冷凍生ナン', cur_cat, b_direct, 'Japan', '5pc', 'pcs', 902, 1388, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 1388)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0137', '490100000137', 'FROZEN CHBRASIL JOINT WING+TIP TEBASAKI', 'ブラジル産 冷凍手羽先', cur_cat, b_direct, 'Japan', '2kg', 'kg', 716, 1101, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 1101)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0138', '490100000138', 'FROZEN GREEN CHILLI', '冷凍青唐辛子', cur_cat, b_direct, 'Japan', '250gm', 'g', 150, 231, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 231)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0139', '490100000139', 'FURANDANA', 'フランダナ', cur_cat, b_direct, 'Japan', '400gm', 'g', 300, 462, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 462)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0140', '490100000140', 'FUSAOTOME JAPANESE RICE', 'ふさおとめ 国産米', cur_cat, b_direct, 'Japan', '5kg', 'kg', 1625, 2500, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 2500)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0141', '490100000141', 'GARLIC AND GINGER PASTE', 'ニンニク 生姜ペースト', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 451, 694, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 694)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0142', '490100000142', 'GINGER', '生姜', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 211, 324, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 324)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0143', '490100000143', 'GINSEN RICE', '吟扇米', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 1504, 2314, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 2314)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_meat;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0144', '490100000144', 'GOAT WITH BONE JB', 'ジェイビー 骨付きヤギ肉', cur_cat, b_direct, 'Japan', '1kg', 'kg', 2708, 4166, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 4166)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_meat;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0145', '490100000145', 'GOAT WITH SKIN GB', '皮付きヤギ肉', cur_cat, b_direct, 'Japan', '1Kg', 'kg', 902, 1388, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 1388)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_meat;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0146', '490100000146', 'GOAT WITH SKIN JB', 'ジェイビー 皮付きヤギ肉', cur_cat, b_direct, 'Japan', '1Kg', 'kg', 896, 1379, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 1379)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0147', '490100000147', 'GOLDEN PARATHA', 'ゴールデンパラタ', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 770, 1185, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 1185)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0148', '490100000148', 'GUARD SUPREME BASMATI', 'ガード スプリーム バスマティライス', cur_cat, b_direct, 'Japan', '5Kg', 'kg', 2226, 3425, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 3425)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0149', '490100000149', 'GUARD ULTIMATE BASMATI', 'ガード アルティメット バスマティライス', cur_cat, b_direct, 'Japan', '5Kg', 'kg', 2347, 3611, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 3611)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0150', '490100000150', 'GULAB JAMUN', 'グラブジャムン', cur_cat, b_direct, 'Japan', '850gm', 'g', 451, 694, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 694)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_beverages;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0151', '490100000151', 'HAJJIBABA MANGO JUICE', 'ハジババ マンゴージュース', cur_cat, b_direct, 'Japan', '1l', 'L', 240, 370, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 370)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0152', '490100000152', 'HAJL BABA RUTI', 'ハジババ ルティ', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 211, 324, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 324)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0153', '490100000153', 'HALDIRAM ALOO BHUJIA', 'ハルディラム アルーブジア', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 361, 555, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 555)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0154', '490100000154', 'HALDIRAM BHUJIA', 'ハルディラム ブジア', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 180, 277, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 277)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0155', '490100000155', 'HALDIRAM''S KHARI ZEERA CRISPY PUFF', 'ハルディラム カハリ ジーラ クリスピーパフ', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 211, 324, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 324)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0156', '490100000156', 'HALDIRAM''S MOONG DAL', 'ハルディラム ムングダール', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 361, 555, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 555)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0157', '490100000157', 'HALDIRAM''S PHULKA ROTI', 'ハルディラム フルカロティ', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 270, 416, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 416)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0158', '490100000158', 'HALDIRAM''S SOAN PAPDI', 'ハルディラム ソーンパプディ', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 331, 509, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 509)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_meat;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0159', '490100000159', 'HARD CHICKEN CUT', '親鶏肉 カット', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 391, 601, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 601)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_meat;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0160', '490100000160', 'HARD CHICKEN WHOLE', '親鶏 丸鶏', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 391, 601, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 601)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_seafood;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0161', '490100000161', 'HILSHA CUT', 'ヒルサ魚 カット', cur_cat, b_direct, 'Japan', '600gm', 'g', 782, 1203, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 1203)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_seafood;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0162', '490100000162', 'HILSHA WHOLE', 'ヒルサ魚 ホール', cur_cat, b_direct, 'Japan', '1000gm', 'g', 1625, 2500, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 2500)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0163', '490100000163', 'HL FROZEN GREEN PEAS 1KG', 'エイチエル 冷凍グリーンピース', cur_cat, b_direct, 'Japan', '1kg', 'kg', 361, 555, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 555)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_seafood;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0164', '490100000164', 'HL RUHI CUT1.', 'エイチエル ルイ魚 カット', cur_cat, b_direct, 'Japan', '1kg', 'kg', 1625, 2500, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 2500)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0165', '490100000165', 'HOKKAIDO GHEE', '北海道ギー', cur_cat, b_direct, 'Japan', '450gm', 'g', 1113, 1712, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 1712)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0166', '490100000166', 'HOKKAIDO ONION 1PK', '北海道産 玉ねぎ', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 162, 250, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 250)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_seafood;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0167', '490100000167', 'HYAKURA JB', 'ジェイビー ヒャクラ魚', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 1805, 2777, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 2777)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0168', '490100000168', 'HYDERABADI BIRYNI MASALA', 'ハイデラバディ ビリヤニマサラ', cur_cat, b_direct, 'Japan', '100g', 'g', 198, 305, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 305)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0169', '490100000169', 'IBARAKI KOSHIHIKARI JAPANESE RICE 5KG BAG', '茨城県産 コシヒカリ 五キロ', cur_cat, b_direct, 'Japan', '5kg', 'kg', 1203, 1851, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 1851)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0170', '490100000170', 'INDIA GATE BASMATI RICE', 'インディアゲート バスマティライス', cur_cat, b_direct, 'Japan', '5kg', 'kg', 632, 972, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 972)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0171', '490100000171', 'ISPAHANI CHAI 200G', 'イスパハニ チャイ', cur_cat, b_direct, 'Japan', '200gm', 'g', 198, 305, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 305)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_beverages;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0172', '490100000172', 'ITO EN OI OCHA 600ML', '伊藤園 お〜いお茶', cur_cat, b_direct, 'Japan', '600ml', 'ml', 270, 416, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 416)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0173', '490100000173', 'JAM DELIGHT COOKIES', 'ジャムディライト クッキー', cur_cat, b_direct, 'Japan', '100gm', 'g', 90, 138, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 138)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0174', '490100000174', 'JAPANESE RICE 10KG BAG BLEND', '国産ブレンド米 十キロ', cur_cat, b_direct, 'Japan', '10Kg', 'kg', 19259, 29629, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 29629)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_meat;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0175', '490100000175', 'JB BEEF SHINA', 'ジェイビー 牛バラ肉', cur_cat, b_direct, 'Japan', '1kg', 'kg', 1083, 1666, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 1666)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0176', '490100000176', 'JB BLACK CHANA', 'ジェイビー 黒ひよこ豆', cur_cat, b_direct, 'Japan', '1kg', 'kg', 379, 583, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 583)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0177', '490100000177', 'JB CHINIGURA RICE CHAASI 1KG', 'ジェイビー チニグラ米 チャアシ', cur_cat, b_direct, 'Japan', '1kg', 'kg', 632, 972, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 972)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0178', '490100000178', 'JB MIX DAAL', 'ジェイビー ミックスダール', cur_cat, b_direct, 'Japan', '1kg', 'kg', 289, 444, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 444)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0179', '490100000179', 'K F K PLAIN PARATHA', 'ケーエフケー プレーンパラタ', cur_cat, b_direct, 'Japan', '400gm', 'g', 168, 259, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 259)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0180', '490100000180', 'KAALAR BASMATI', 'カラール バスマティライス', cur_cat, b_direct, 'Japan', '2kg', 'kg', 1083, 1666, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 1666)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0181', '490100000181', 'KALA JAMUN', 'カラジャムン', cur_cat, b_direct, 'Japan', '850gm', 'g', 451, 694, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 694)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0182', '490100000182', 'KALLAR BASHMATI RICE1KG', 'カラール バスマティライス', cur_cat, b_direct, 'Japan', '1kg', 'kg', 571, 879, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 879)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0183', '490100000183', 'KASHI KO BHUTAN JB', 'ジェイビー カシコブタン', cur_cat, b_direct, 'Japan', '1kg', 'kg', 662, 1018, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 1018)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0184', '490100000184', 'KASMIRI MIRCH POWDER', 'カシミール チリパウダー', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 150, 231, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 231)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_seafood;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0185', '490100000185', 'KATAL CUT', 'カトラ魚 カット', cur_cat, b_direct, 'Japan', '1.5kg', 'kg', 812, 1250, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 1250)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0186', '490100000186', 'KAWAN CHAPATTI', 'カワン チャパティ', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 211, 324, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 324)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0187', '490100000187', 'KHALAS DATES', 'ハラス デーツ', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 537, 826, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 826)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0188', '490100000188', 'KHEER MIX STANDARD', 'キールミックス スタンダード', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 150, 231, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 231)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0189', '490100000189', 'KHIR MIX PISTACHIO', 'キールミックス ピスタチオ', cur_cat, b_direct, 'Japan', '160gm', 'g', 162, 250, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 250)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0190', '490100000190', 'KITCHEN FROZEN GREEN PEAS', 'キッチン 冷凍グリーンピース', cur_cat, b_direct, 'Japan', '500gm', 'g', 211, 324, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 324)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0191', '490100000191', 'KOBE BASIL 50G', '神戸スパイス バジル', cur_cat, b_direct, 'Japan', '50gm', 'g', 289, 444, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 444)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0192', '490100000192', 'KOBE BLACK PEPPER POWDER 50G', '神戸スパイス ブラックペッパーパウダー', cur_cat, b_direct, 'Japan', '50gm', 'g', 228, 351, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 351)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0193', '490100000193', 'KOBE CINNAMON POWDER (CASSIA)', '神戸スパイス シナモンパウダー カシア', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 211, 324, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 324)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0194', '490100000194', 'KOBE CLOVE WHOLE 50G', '神戸スパイス クローブホール', cur_cat, b_direct, 'Japan', '50g', 'g', 270, 416, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 416)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0195', '490100000195', 'KOBE CUMIN POWDER 1KG', '神戸スパイス クミンパウダー', cur_cat, b_direct, 'Japan', '1kg', 'kg', 963, 1481, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 1481)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0196', '490100000196', 'KOBE GINGER POWDER 100G', '神戸スパイス ジンジャーパウダー', cur_cat, b_direct, 'Japan', '100gm', 'g', 300, 462, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 462)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0197', '490100000197', 'KOBE MOMO MASALA 100G', '神戸スパイス モモマサラ', cur_cat, b_direct, 'Japan', '100gm', 'g', 192, 296, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 296)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0198', '490100000198', 'KOBE MUSTARD POWDER 100G', '神戸スパイス マスタードパウダー', cur_cat, b_direct, 'Japan', '100gm', 'g', 150, 231, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 231)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0199', '490100000199', 'KOBE PAPRIKA POWDER 1KG', '神戸スパイス パプリカパウダー', cur_cat, b_direct, 'Japan', '1kg', 'kg', 1, 1, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 1)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_seafood;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0200', '490100000200', 'KOI FISH', 'コイ魚', cur_cat, b_direct, 'Japan', '7000gm', 'g', 1143, 1759, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 1759)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0201', '490100000201', 'LADDU', 'ラドゥ', cur_cat, b_direct, 'Japan', '500gm', 'g', 454, 699, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 699)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0202', '490100000202', 'LAL SHAK', '赤ヒユ菜', cur_cat, b_direct, 'Japan', '500gm', 'g', 60, 92, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 92)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_meat;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0203', '490100000203', 'LAMB BONELESS *2350', '骨なしラム肉', cur_cat, b_direct, 'Japan', '1kg', 'kg', 1528, 2350, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 2350)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_meat;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0204', '490100000204', 'LAMB CHOP', 'ラムチョップ', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 963, 1481, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 1481)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_meat;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0205', '490100000205', 'LAMB HEART', 'ラムハツ', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 1138, 1750, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 1750)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0206', '490100000206', 'LARGE SIZE', '大盛り', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 240, 370, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 370)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0207', '490100000207', 'LASSI', 'ラッシー', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 300, 462, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 462)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0208', '490100000208', 'LAZZAT CHILLI GARLIC SAUCE330GM', 'ラザット チリガーリックソース', cur_cat, b_direct, 'Japan', '330gm', 'g', 211, 324, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 324)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_seafood;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0209', '490100000209', 'LOITTA DRY FISH', '乾燥ロイタ魚', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 481, 740, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 740)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0210', '490100000210', 'MALAI PANEER500G', 'マライパニール', cur_cat, b_direct, 'Japan', '500gm', 'g', 662, 1018, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 1018)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_beverages;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0211', '490100000211', 'MANGO JUICE', 'マンゴージュース', cur_cat, b_direct, 'Japan', '2litre', 'L', 180, 277, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 277)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_beverages;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0212', '490100000212', 'MANGO JUICE DRINK', 'マンゴージュース', cur_cat, b_direct, 'Japan', '330ml', 'ml', 72, 111, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 111)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0213', '490100000213', 'MAS DAL SI JAPAN', 'エスアイ 国産 マシュダール', cur_cat, b_direct, 'Japan', '1kg', 'kg', 261, 402, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 402)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0214', '490100000214', 'MAS SILKA', 'マシュシルカ', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 261, 402, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 402)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0215', '490100000215', 'MASALA VEG BRIYANI', 'マサラ 野菜ビリヤニ', cur_cat, b_direct, 'Japan', '275gm', 'g', 261, 402, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 402)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0216', '490100000216', 'MASOOR DAL', 'マスールダール', cur_cat, b_direct, 'Japan', '1kg', 'kg', 198, 305, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 305)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0217', '490100000217', 'MDH GARAM MASALA', 'エムディーエイチ ガラムマサラ', cur_cat, b_direct, 'Japan', '100gm', 'g', 211, 324, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 324)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0218', '490100000218', 'MDH KITCHEN KING', 'エムディーエイチ キッチンキング', cur_cat, b_direct, 'Japan', '500gm', 'g', 752, 1157, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 1157)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_meat;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0219', '490100000219', 'MEAT CURRY MASALA', 'ミートカレーマサラ', cur_cat, b_direct, 'Japan', '100gm', 'g', 204, 314, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 314)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0220', '490100000220', 'MEHRAN MIXEL PICKLE', 'メヘラン ミックスピクルス', cur_cat, b_direct, 'Japan', '320gm', 'g', 211, 324, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 324)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0221', '490100000221', 'MEHRAN TANDOORI MASALA', 'メヘラン タンドリーマサラ', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 144, 222, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 222)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0222', '490100000222', 'MINI GULAB JAMUN', 'ミニ グラブジャムン', cur_cat, b_direct, 'Japan', '500gm', 'g', 541, 833, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 833)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0223', '490100000223', 'MIX DUL WHOLE', 'ミックスダール ホール', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 289, 444, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 444)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0224', '490100000224', 'MIX SPICE', 'ミックススパイス', cur_cat, b_direct, 'Japan', '100gm', 'g', 361, 555, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 555)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0225', '490100000225', 'MIX SWEET', 'ミックススイーツ', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 481, 740, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 740)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0226', '490100000226', 'MIXED KEBAB RICE BOWL', 'ミックスケバブ丼', cur_cat, b_direct, 'Japan', '1', 'pcs', 1083, 1666, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 1666)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0227', '490100000227', 'MIXED KEBAB SANDWICH', 'ミックスケバブサンド', cur_cat, b_direct, 'Japan', '1', 'pcs', 1444, 2222, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 2222)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0228', '490100000228', 'MIXED KEBAB WRAP', 'ミックスケバブラップ', cur_cat, b_direct, 'Japan', '1', 'pcs', 541, 833, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 833)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0229', '490100000229', 'MOONG DAL', 'ムングダール', cur_cat, b_direct, 'Japan', '1kg', 'kg', 235, 361, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 361)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0230', '490100000230', 'MOONG DAL', 'ムングダール', cur_cat, b_direct, 'Japan', '1Kg', 'kg', 235, 361, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 361)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_beverages;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0231', '490100000231', 'MTR BADAM DRINK 180ML', 'エムティーアール バダムドリンク', cur_cat, b_direct, 'Japan', '180ml', 'ml', 361, 555, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 555)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0232', '490100000232', 'MTR PALAK PANEER 300G', 'エムティーアール パラックパニール', cur_cat, b_direct, 'Japan', '300gm', 'g', 252, 388, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 388)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0233', '490100000233', 'MULTIGRAIN COOKIES', 'マルチグレインクッキー', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 180, 277, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 277)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0234', '490100000234', 'MUSTARD OIL', 'マスタードオイル', cur_cat, b_direct, 'Japan', '1litre', 'L', 469, 722, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 722)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0235', '490100000235', 'MUSTARD OIL', 'マスタードオイル', cur_cat, b_direct, 'Japan', '1litre', 'L', 283, 435, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 435)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_meat;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0236', '490100000236', 'MUTTOM FLECTHER AUS', 'オーストラリア産 マトン フレッチャー', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 1414, 2175, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 2175)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_meat;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0237', '490100000237', 'MUTTON BIRYANI', 'マトンビリヤニ', cur_cat, b_direct, 'Japan', '1 Packet', 'pack', 132, 203, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 203)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_meat;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0238', '490100000238', 'MUTTON BONELESS 1KG', '骨なしマトン肉', cur_cat, b_direct, 'Japan', '1Kg', 'kg', 2106, 3240, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 3240)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_meat;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0239', '490100000239', 'MUTTON KACCHI BIRYANI', 'マトンカッチビリヤニ', cur_cat, b_direct, 'Japan', '1', 'pcs', 512, 787, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 787)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_meat;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0240', '490100000240', 'MUTTON PAYA JB', 'ジェイビー マトンパヤ', cur_cat, b_direct, 'Japan', '1Kg', 'kg', 560, 861, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 861)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_meat;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0241', '490100000241', 'MUTTON SHANK JB', 'ジェイビー マトンシャンク', cur_cat, b_direct, 'Japan', '1kg', 'kg', 902, 1388, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 1388)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_meat;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0242', '490100000242', 'MUTTON WITH BONE', '骨付きマトン肉', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 902, 1388, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 1388)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_meat;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0243', '490100000243', 'MUTTON WITH BONE DRY CUT', '骨付きマトン肉 ドライカット', cur_cat, b_direct, 'Japan', '1Kg', 'kg', 902, 1388, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 1388)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0244', '490100000244', 'NAPALI DAL MOTH', 'ネパール ダルモート', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 1143, 1759, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 1759)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0245', '490100000245', 'NAPALI DUL MOTH', 'ネパール ダルモート', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 571, 879, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 879)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_meat;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0246', '490100000246', 'NAT CHICKEN SAUSAGE', 'ナット チキンソーセージ', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 211, 324, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 324)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0247', '490100000247', 'NAUBAHAR BASMATI RICE', 'ナウバハール バスマティライス', cur_cat, b_direct, 'Japan', '5kg', 'kg', 1956, 3009, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 3009)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0248', '490100000248', 'NEPALI DAL MOTH', 'ネパール ダルモート', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 421, 648, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 648)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0249', '490100000249', 'NEPALI DALMOTH HOT', 'ネパール 辛口 ダルモート', cur_cat, b_direct, 'Japan', '200gm', 'g', 211, 324, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 324)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0250', '490100000250', 'NEPALI GUNDRUK', 'ネパール グンドゥルック', cur_cat, b_direct, 'Japan', '100gm', 'g', 222, 342, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 342)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_meat;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0251', '490100000251', 'NOODLES IN CUP BD CHICKEN', 'カップヌードル バングラデシュ チキン味', cur_cat, b_direct, 'Japan', '40gm', 'g', 90, 138, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 138)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_meat;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0252', '490100000252', 'NOODLES IN CUP BD CHICKEN', 'カップヌードル バングラデシュ チキン味', cur_cat, b_direct, 'Japan', '40gm', 'g', 42, 64, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 64)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_beverages;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0253', '490100000253', 'OKF ALOE DRINK 500ML', 'オーケーエフ アロエドリンク', cur_cat, b_direct, 'Japan', '500ml', 'ml', 168, 259, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 259)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0254', '490100000254', 'OKF LEMONADE', 'オーケーエフ レモネード', cur_cat, b_direct, 'Japan', '500ml', 'ml', 187, 287, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 287)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0255', '490100000255', 'PADMA AROMATIC RICE PADMA', 'パドマ 香り米', cur_cat, b_direct, 'Japan', '1Kg', 'kg', 632, 972, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 972)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0256', '490100000256', 'PADMA BASMATI RICE', 'パドマ バスマティライス', cur_cat, b_direct, 'Japan', '5Kg', 'kg', 2226, 3425, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 3425)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_meat;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0257', '490100000257', 'PADMA GOAT WITH SKIN', 'パドマ 皮付きヤギ肉', cur_cat, b_direct, 'Japan', '900gm', 'g', 3731, 5740, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 5740)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_meat;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0258', '490100000258', 'PADMA MIX BAKRA', 'パドマ ミックスヤギ肉', cur_cat, b_direct, 'Japan', '1Kg', 'kg', 902, 1388, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 1388)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_meat;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0259', '490100000259', 'PADMA MUTTON MIX OFFEL', 'パドマ マトン ミックスホルモン', cur_cat, b_direct, 'Japan', '1Kg', 'kg', 692, 1064, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 1064)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0260', '490100000260', 'PADMA SOYA CHUNKS 200G', 'パドマ ソヤチャンク', cur_cat, b_direct, 'Japan', '200gm', 'g', 180, 277, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 277)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0261', '490100000261', 'PADMA SUPER SOFT RUTI', 'パドマ スーパーソフトルティ', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 300, 462, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 462)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0262', '490100000262', 'PANCH PHORAN', 'パンチフォロン', cur_cat, b_direct, 'Japan', '100gm', 'g', 270, 416, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 416)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_beverages;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0263', '490100000263', 'PANGSIUS STEAK', 'パンガシウス ステーキ', cur_cat, b_direct, 'Japan', '500gm', 'g', 902, 1388, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 1388)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0264', '490100000264', 'PAPRIKA POWDER', 'パプリカパウダー', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 178, 274, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 274)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0265', '490100000265', 'PARATHA', 'パラタ', cur_cat, b_direct, 'Japan', '1', 'pcs', 108, 166, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 166)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0266', '490100000266', 'PARTY PIK', 'パーティー ピック ビスケット', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 180, 277, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 277)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_beverages;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0267', '490100000267', 'PINK GUAVA', 'ピンクグアバ ジュース', cur_cat, b_direct, 'Japan', '2litre', 'L', 361, 555, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 555)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_beverages;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0268', '490100000268', 'PINK GUAVA BASIL SEED DRINK', 'ピンクグアバ バジルシードドリンク', cur_cat, b_direct, 'Japan', '2litre', 'L', 90, 138, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 138)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0269', '490100000269', 'PISTA PIK BISCUITS', 'ピスタ ピック ビスケット', cur_cat, b_direct, 'Japan', '17.8gm', 'g', 90, 138, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 138)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0270', '490100000270', 'PITA BREAD', 'ピタパン', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 331, 509, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 509)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0271', '490100000271', 'PLAIN NAAN', 'プレーンナン', cur_cat, b_direct, 'Japan', '1', 'pcs', 240, 370, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 370)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0272', '490100000272', 'POPPY SEED', 'ポピーシード', cur_cat, b_direct, 'Japan', '100gm', 'g', 361, 555, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 555)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0273', '490100000273', 'POTATO', 'じゃがいも', cur_cat, b_direct, 'Japan', '1 pack', 'pack', 300, 462, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 462)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0274', '490100000274', 'POTATO CHOP', 'ポテトチョップ', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 451, 694, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 694)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0275', '490100000275', 'PRAN CHINIGURA RICE', 'プラン チニグラ米', cur_cat, b_direct, 'Japan', '1Kg', 'kg', 632, 972, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 972)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0276', '490100000276', 'PRAN PLAIN PARATHA', 'プラン プレーンパラタ', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 963, 1481, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 1481)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_seafood;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0277', '490100000277', 'PRAWN CRACKERS120GM', 'エビせんべい', cur_cat, b_direct, 'Japan', '120gm', 'g', 120, 185, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 185)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0278', '490100000278', 'PTINGLES CHEESE', 'プリングルズ チーズ', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 180, 277, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 277)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0279', '490100000279', 'PTINGLES ORIGINAL', 'プリングルズ オリジナル', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 240, 370, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 370)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0280', '490100000280', 'PUFFED RICE', 'パフライス', cur_cat, b_direct, 'Japan', '200gm', 'g', 180, 277, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 277)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0281', '490100000281', 'PUFFED RICE 200', 'パフライス', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 180, 277, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 277)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0282', '490100000282', 'PUFFED RICEM200GM', 'パフライス', cur_cat, b_direct, 'Japan', '200gm', 'g', 541, 833, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 833)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0283', '490100000283', 'PUNJABI SAMOSA 456', 'パンジャビ サモサ', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 512, 787, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 787)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_beverages;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0284', '490100000284', 'PURE GREEN TEA', 'ピュア 緑茶', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 51, 78, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 78)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0285', '490100000285', 'QQUICK ORANGE COOKIES', 'クイック オレンジクッキー', cur_cat, b_direct, 'Japan', '800gm', 'g', 421, 647, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 647)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0286', '490100000286', 'QUICK MILK COOKIES', 'クイック ミルククッキー', cur_cat, b_direct, 'Japan', '800gm', 'g', 421, 647, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 647)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0287', '490100000287', 'QUORMA POWDER', 'コルマパウダー', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 132, 203, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 203)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0288', '490100000288', 'RADHUNI BIRYANI MASALA', 'ラドゥニ ビリヤニマサラ', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 150, 231, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 231)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_seafood;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0289', '490100000289', 'RADHUNI FISH MASALA 100G', 'ラドゥニ フィッシュマサラ', cur_cat, b_direct, 'Japan', '100G', 'g', 150, 231, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 231)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0290', '490100000290', 'RADHUNI HALEEM MIX', 'ラドゥニ ハリームミックス', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 228, 351, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 351)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_meat;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0291', '490100000291', 'RADHUNI MEAT MASALA', 'ラドゥニ ミートマサラ', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 150, 231, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 231)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0292', '490100000292', 'RADHUNI ROAST MASALA', 'ラドゥニ ローストマサラ', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 150, 231, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 231)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0293', '490100000293', 'RAGI FLOUR', 'ラギ粉', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 632, 972, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 972)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0294', '490100000294', 'RASGULLA', 'ラスグラ', cur_cat, b_direct, 'Japan', '850gm', 'g', 475, 731, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 731)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0295', '490100000295', 'RAW BLACK SESAME', '生黒ごま', cur_cat, b_direct, 'Japan', '100gm', 'g', 150, 231, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 231)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0296', '490100000296', 'RED CHILLI', '赤唐辛子', cur_cat, b_direct, 'Japan', '500gm', 'g', 391, 601, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 601)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0297', '490100000297', 'RED ONION 1PK', '赤玉ねぎ', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 313, 481, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 481)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0298', '490100000298', 'RED TILAPIA', 'レッドティラピア', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 300, 462, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 462)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0299', '490100000299', 'RED WHEAT RUTI', '赤小麦ルティ', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 499, 768, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 768)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_beverages;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0300', '490100000300', 'RELAXING JUSMIN TEA', 'リラックス ジャスミン茶', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 90, 138, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 138)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0301', '490100000301', 'ROASTED SUJI', '焙煎スージ', cur_cat, b_direct, 'Japan', '400gm', 'g', 180, 277, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 277)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0302', '490100000302', 'ROSEMARY', 'ローズマリー', cur_cat, b_direct, 'Japan', '100gm', 'g', 270, 416, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 416)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0303', '490100000303', 'ROYAL UMBRELLA THAI JASMINE RICE', 'ロイヤルアンブレラ タイ産 ジャスミンライス', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 3912, 6018, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 6018)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0304', '490100000304', 'RUCHI HOT CHANACHUR', 'ルチ ホットチャナチュール', cur_cat, b_direct, 'Japan', '140gm', 'g', 276, 425, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 425)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_seafood;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0305', '490100000305', 'RUHI CUT', 'ルイ魚 カット', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 1925, 2962, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 2962)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_seafood;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0306', '490100000306', 'RUHI CUT', 'ルイ魚 カット', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 1023, 1574, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 1574)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_seafood;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0307', '490100000307', 'RUI FISH CUT', 'ルイ魚 カット', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 812, 1250, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 1250)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0308', '490100000308', 'SABUDAANA', 'サブダナ', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 270, 416, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 416)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0309', '490100000309', 'SABUDANA', 'サブダナ', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 289, 444, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 444)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_meat;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0310', '490100000310', 'SADIA CHICKEN FRANKS', 'サディア チキンフランク', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 235, 361, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 361)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0311', '490100000311', 'SALTES COOKIES PADMA', 'パドマ 塩味クッキー', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 331, 509, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 509)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0312', '490100000312', 'SALTY COOKIES', 'ソルトクッキー', cur_cat, b_direct, 'Japan', '220gm', 'g', 180, 277, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 277)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0313', '490100000313', 'SARTAJ CORIANDER POWDER', 'サルタジ コリアンダーパウダー', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 571, 879, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 879)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0314', '490100000314', 'SARTAJ TURMERIC POWDER', 'サルタジ ターメリックパウダー', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 1, 1, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 1)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_meat;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0315', '490100000315', 'SEARA CHICKEN FRANKS340G', 'セアラ チキンフランク', cur_cat, b_direct, 'Japan', '340G', 'g', 211, 324, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 324)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_meat;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0316', '490100000316', 'SEARA CHICKEN NUGGETS', 'セアラ チキンナゲット', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 662, 1018, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 1018)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_meat;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0317', '490100000317', 'SEARA CHICKEN WHOLE', 'セアラ 丸鶏', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 2600, 4000, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 4000)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0318', '490100000318', 'SHEEP TRIPE', '羊ハチノス', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 571, 879, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 879)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0319', '490100000319', 'SI TURMERIC POWDER', 'エスアイ ターメリックパウダー', cur_cat, b_direct, 'Japan', '400gm', 'g', 349, 537, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 537)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0320', '490100000320', 'SITARAM GHEE', 'シタラム ギー', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 662, 1018, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 1018)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0321', '490100000321', 'SOOJI', 'スージ', cur_cat, b_direct, 'Japan', '500gm', 'g', 433, 666, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 666)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_meat;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0322', '490100000322', 'SOY SAUCE GRILLED CHICKEN THIGH 250G', '鶏もも肉 醤油焼き', cur_cat, b_direct, 'Japan', '250gm', 'g', 211, 324, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 324)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0323', '490100000323', 'SPONGE SWEET', 'スポンジ スイーツ', cur_cat, b_direct, 'Japan', '500gm', 'g', 481, 740, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 740)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0324', '490100000324', 'SPRING ROLL', 'スプリングロール', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 150, 231, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 231)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0325', '490100000325', 'SPRITE', 'スプライト', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 102, 157, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 157)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0326', '490100000326', 'STAR ANISE', 'スターアニス', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 150, 230, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 230)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0327', '490100000327', 'SUNFLOWER OIL', 'ひまわり油 一リットル', cur_cat, b_direct, 'Japan', '1l', 'L', 632, 972, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 972)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0328', '490100000328', 'SUNFLOWER OIL', 'ひまわり油 三リットル', cur_cat, b_direct, 'Japan', '3l', 'L', 2076, 3194, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 3194)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0329', '490100000329', 'SUNFLOWER OIL', 'ひまわり油 五リットル', cur_cat, b_direct, 'Japan', '5l', 'L', 1071, 1648, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 1648)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_beverages;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0330', '490100000330', 'TAPAL DANEDAR TEA', 'タパル ダネダール 紅茶', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 842, 1296, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 1296)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0331', '490100000331', 'TEER BESAN500G', 'ティール ベサン粉', cur_cat, b_direct, 'Japan', '500gm', 'g', 211, 324, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 324)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0332', '490100000332', 'TEER MUSRARD OIL', 'ティール マスタードオイル', cur_cat, b_direct, 'Japan', '250ml', 'ml', 259, 398, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 398)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0333', '490100000333', 'TEER MUSTARD OIL', 'ティール マスタードオイル', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 180, 277, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 277)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0334', '490100000334', 'TEER PUFFED RICE', 'ティール パフライス', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 1264, 1944, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 1944)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_beverages;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0335', '490100000335', 'TILAPIA STEAK', 'ティラピア ステーキ', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 541, 833, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 833)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0336', '490100000336', 'TIMMUR KO CHHOP', 'ティムール コ チョップ', cur_cat, b_direct, 'Japan', '200gm', 'g', 391, 601, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 601)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_meat;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0337', '490100000337', 'TIMMUR KO CHOP WITH BUFF', 'ティムール コ チョップ 水牛肉入り', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 692, 1064, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 1064)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_beverages;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0338', '490100000338', 'TOKLA MASALA TEA', 'トクラ マサラティー', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 211, 324, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 324)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_beverages;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0339', '490100000339', 'TOKLA TEA', 'トクラ 紅茶', cur_cat, b_direct, 'Japan', '500gm', 'g', 391, 601, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 601)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0340', '490100000340', 'TOMATO PASTE', 'トマトペースト 二・二キロ', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 512, 787, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 787)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0341', '490100000341', 'TOMATO PASTE', 'トマトペースト 四百グラム', cur_cat, b_direct, 'Japan', '400gm', 'g', 132, 203, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 203)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0342', '490100000342', 'TOMATO PASTE', 'トマトペースト 八百グラム', cur_cat, b_direct, 'Japan', '800gm', 'g', 228, 351, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 351)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0343', '490100000343', 'TOOR DAL JB', 'ジェイビー トゥールダール', cur_cat, b_direct, 'Japan', '1Kg', 'kg', 294, 452, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 452)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0344', '490100000344', 'TORTILLA', 'トルティーヤ 十インチ', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 1047, 1611, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 1611)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0345', '490100000345', 'TORTILLA', 'フレスカ フラワー トルティーヤ', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 481, 740, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 740)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0346', '490100000346', 'TULLY''S BARISTA BLACK', 'タリーズ バリスタ ブラック', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 90, 138, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 138)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0347', '490100000347', 'TULLY''S BARISTA CAFE AU LAIT', 'タリーズ バリスタ カフェオレ', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 90, 138, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 138)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0348', '490100000348', 'TULLY''S BARISTA''S ESPRESSO CAN', 'タリーズ バリスタズ エスプレッソ缶', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 78, 120, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 120)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0349', '490100000349', 'TURMERIC', 'ターメリック', cur_cat, b_direct, 'Japan', '50gm', 'g', 65, 100, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 100)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0350', '490100000350', 'TURMERIC POWDER', 'ターメリックパウダー', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 211, 324, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 324)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0351', '490100000351', 'TURMERIC POWDER', 'ターメリックパウダー', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 1625, 2500, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 2500)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0352', '490100000352', 'UDA PARATHA', 'ウダ パラタ', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 192, 296, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 296)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0353', '490100000353', 'ULTIMATE BASMATI RICE', 'アルティメット バスマティライス', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 571, 879, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 879)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0354', '490100000354', 'VEGETABLE SINGARA', '野菜シンガラ', cur_cat, b_direct, 'Japan', '1', 'pcs', 1324, 2037, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 2037)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_seafood;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0355', '490100000355', 'VINUT MIX FRUITS330ML', 'ヴィナット ミックスフルーツジュース', cur_cat, b_direct, 'Japan', '330ML', 'ml', 72, 111, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 111)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0356', '490100000356', 'WAI WAI 123 NOODLES 60G', 'ワイワイ ワンツースリー ヌードル', cur_cat, b_direct, 'Japan', '60gm', 'g', 1932, 2972, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 2972)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0357', '490100000357', 'WANNAPOB THAI JASMINE RICE 1KG', 'ワンナポップ タイ産 ジャスミンライス 一キロ', cur_cat, b_direct, 'Japan', '1Kg', 'kg', 512, 787, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 787)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0358', '490100000358', 'WANNAPOB THAI JASMINE RICE 5KG', 'ワンナポップ タイ産 ジャスミンライス 五キロ', cur_cat, b_direct, 'Japan', '5Kg', 'kg', 2076, 3194, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 3194)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0359', '490100000359', 'WANNAPOB THAI WHITE RICE 10KG', 'ワンナポップ タイ産 白米 十キロ', cur_cat, b_direct, 'Japan', '10Kg', 'kg', 2889, 4444, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 4444)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0360', '490100000360', 'WHITE PAPPER', 'ホワイトペッパー', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 180, 277, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 277)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0361', '490100000361', 'WHITE PEACE', '白えんどう豆', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 255, 393, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 393)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0362', '490100000362', 'WHITE PEAS SI JAPAN', 'エスアイ 国産 白えんどう豆', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 270, 416, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 416)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_pantry;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0363', '490100000363', 'WHITE SESAME 100G', '白ごま', cur_cat, b_direct, 'Japan', '100G', 'g', 150, 231, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 231)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_meat;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0364', '490100000364', 'WHOLE CHICKEN', '丸鶏 九百グラム', cur_cat, b_direct, 'Japan', '900gm', 'g', 3912, 6018, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 6018)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_meat;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0365', '490100000365', 'WHOLE CHICKEN', '丸鶏 千二百グラム', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 391, 601, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 601)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_meat;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0366', '490100000366', 'WHOLE CHICKEN', 'ブラジル産 丸鶏', cur_cat, b_direct, 'Japan', '700gm', 'g', 2046, 3148, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 3148)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

    cur_cat := cat_meat;
    INSERT INTO public.products (sku, barcode, name, name_ja, category_id, brand_id, country_of_origin, weight_volume, unit, cost_price, base_retail_price, tax_rate, status, halal_status)
    VALUES ('SKW-PRD-0367', '490100000367', 'WHOLE CHICKEN GRILLER', 'グリラー チキンホール', cur_cat, b_direct, 'Japan', '1 unit', 'pcs', 451, 694, 0.08, 'Active', 'certified')
    ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, name_ja = EXCLUDED.name_ja, base_retail_price = EXCLUDED.base_retail_price, cost_price = EXCLUDED.cost_price
    RETURNING id INTO prod_id;

    IF skw_id IS NOT NULL AND prod_id IS NOT NULL THEN
        INSERT INTO public.product_store_prices (product_id, store_id, price)
        VALUES (prod_id, skw_id, 694)
        ON CONFLICT (product_id, store_id) DO UPDATE SET price = EXCLUDED.price;

        INSERT INTO public.inventory (product_id, store_id, current_stock, minimum_stock, maximum_stock, reorder_point)
        VALUES (prod_id, skw_id, 45, 10, 100, 20)
        ON CONFLICT (product_id, store_id) DO UPDATE SET current_stock = EXCLUDED.current_stock;
    END IF;

END 14891;
