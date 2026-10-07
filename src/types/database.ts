/**
 * PRODUCT STUDIO by My BIMI
 * Relational Database Types (PostgreSQL / Supabase Compatible)
 */

export type StoreId = string;

export interface Store {
  id: StoreId;
  name: string;
  code: string;
  address: string;
  phone: string;
  manager_name: string;
  is_active: boolean;
  opened_at: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  name_ja: string;
  slug: string;
  tax_rate: number; // 0.08 for groceries/food, 0.10 for standard
}

export interface Brand {
  id: string;
  name: string;
  country: string;
}

export interface Supplier {
  id: string;
  code: string;
  name: string; // Company name
  contact_name: string; // Contact person
  phone: string;
  whatsapp?: string;
  email: string;
  address: string;
  country: string;
  website?: string;
  payment_terms: string;
  currency: string; // JPY, USD, EUR, THB, etc.
  lead_time_days: number;
  notes?: string;
  is_active: boolean;
  linked_products_count?: number;
  created_at?: string;
  updated_at?: string;
}

export type ProductStatus = 'Draft' | 'Active' | 'Out of Stock' | 'Discontinued' | 'Archived';
export type ProductUnit = 'pcs' | 'kg' | 'g' | 'L' | 'ml' | 'pack' | 'box';
export type HalalStatus = 'certified' | 'muslim_friendly' | 'not_applicable' | 'non_halal';

export interface Product {
  id: string;
  sku: string;
  barcode: string; // JAN-13 / EAN-13
  name: string; // English Name
  name_ja: string; // Japanese Name
  brand_id: string;
  category_id: string;
  subcategory: string;
  description: string;
  internal_notes?: string;
  image_url: string;
  country_of_origin: string;
  weight_volume: string; // e.g. "200g", "5kg", "1000ml"
  unit: ProductUnit;
  tax_rate: number; // 0.08 (reduced) or 0.10 (standard)
  cost_price: number; // purchase cost in JPY (preferred supplier cost)
  freight_cost?: number; // shipping / freight cost per unit
  customs_duty?: number; // customs tariff / import clearance per unit
  other_cost?: number; // handling, cold chain, inspection per unit
  base_retail_price: number; // default retail price in JPY (tax-excluded)
  min_stock_alert: number;
  reorder_level?: number;
  status: ProductStatus;
  halal_status: HalalStatus;
  is_new_arrival: boolean;
  is_featured: boolean;
  is_bestseller: boolean;
  supplier_id: string; // Primary / preferred supplier ID
  is_active: boolean;
  website_sync_status: 'synced' | 'pending' | 'error' | 'disabled';
  publishing_state?: WebsitePublishingState;
  has_pending_changes?: boolean;
  website_sync_error?: string;
  last_synced_at?: string;
  created_at: string;
  updated_at: string;
}

export type WebsitePublishingState =
  | 'Draft'
  | 'Ready to Publish'
  | 'Published'
  | 'Sync Error'
  | 'Unpublished';

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  alt_text?: string;
  is_primary: boolean;
  display_order: number;
  created_at: string;
}

export interface ProductSupplier {
  id: string;
  supplier_id: string;
  supplier_name: string;
  supplier_code?: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  supplier_product_code: string;
  purchase_price: number;
  currency: string;
  moq: number; // Minimum Order Quantity
  pack_quantity: number; // Pack/carton units
  lead_time_days: number;
  last_purchase_price?: number;
  is_preferred: boolean;
  notes?: string;
  last_updated: string;
  updated_by?: string;
}

export interface SupplierPriceHistoryRecord {
  id: string;
  product_id: string;
  product_name: string;
  supplier_id: string;
  supplier_name: string;
  old_price: number;
  new_price: number;
  currency: string;
  reason: string;
  effective_date: string;
  changed_by: string;
  created_at: string;
}

export interface ProductStorePrice {
  id: string;
  product_id: string;
  store_id: StoreId | 'website';
  store_name?: string;
  regular_price: number;
  offer_price?: number | null;
  wholesale_price?: number | null;
  online_price?: number | null;
  tax_rate: number; // e.g. 0.08 or 0.10
  offer_start_date?: string | null;
  offer_end_date?: string | null;
  is_active: boolean;
  last_updated: string;
  updated_by: string;
}

export type StockMovementType =
  | 'Stock In'
  | 'Stock Out'
  | 'Sale'
  | 'Adjustment'
  | 'Transfer In'
  | 'Transfer Out'
  | 'Damaged'
  | 'Waste'
  | 'Expired'
  | 'Return'
  | 'received'
  | 'sale'
  | 'transfer_in'
  | 'transfer_out'
  | 'adjustment'
  | 'waste';

export interface StoreProduct {
  id: string;
  product_id: string;
  store_id: StoreId;
  retail_price: number; // maintained for backward compatibility, mapped to regular_price
  stock_quantity: number;
  reserved_quantity: number;
  reorder_level?: number; // reorder trigger point
  shelf_location: string; // e.g. "Aisle 3 - Shelf B", "Chilled Unit 2"
  last_restocked_at: string;
  updated_at: string;
}

export interface PriceHistoryRecord {
  id: string;
  product_id: string;
  product_name: string;
  sku?: string;
  store_id: StoreId | 'all' | 'website';
  store_name: string;
  price_type?: 'regular' | 'offer' | 'wholesale' | 'online' | 'bulk_adjustment';
  old_price: number;
  new_price: number;
  cost_price: number;
  old_margin_percent?: number;
  new_margin_percent?: number;
  margin_percent?: number;
  reason: string;
  effective_date: string;
  offer_end_date?: string | null;
  is_below_cost?: boolean;
  changed_by: string;
  created_at: string;
}

export interface StockMovement {
  id: string;
  product_id: string;
  product_name: string;
  sku: string;
  store_id: StoreId;
  store_name: string;
  type: StockMovementType;
  quantity?: number; // absolute quantity moved
  quantity_change: number; // negative or positive
  previous_stock?: number; // stock prior to movement
  new_stock?: number; // stock after movement
  balance_after: number; // backward compatibility
  reference?: string; // reference number, PO, or transfer code
  reference_doc?: string; // backward compatibility
  notes: string;
  performed_by: string;
  created_at: string;
}

export interface PurchaseOrder {
  id: string;
  po_number: string;
  supplier_id: string;
  supplier_name: string;
  destination_store_id: StoreId;
  destination_store_name: string;
  status: 'draft' | 'ordered' | 'partially_received' | 'received' | 'cancelled';
  total_amount: number;
  order_date: string;
  expected_delivery_date: string;
  created_by: string;
  items_count: number;
  notes?: string;
}

export interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  product_id: string;
  product_name?: string;
  product_sku?: string;
  quantity_ordered: number;
  quantity_received: number;
  unit_cost: number;
  total_cost: number;
  created_at?: string;
}

export interface WebsiteSyncEvent {
  id: string;
  product_id: string;
  product_name: string;
  sku: string;
  channel: 'BIMI Online Store' | 'POS Shin-Koiwa' | 'POS Yotsugi' | 'BIMI Mobile App';
  event_type: 'product_create' | 'product_update' | 'price_update' | 'stock_update';
  status: 'success' | 'failed' | 'in_progress';
  http_code?: number;
  error_message?: string;
  timestamp: string;
  payload_summary: string;
}

export interface WebsiteSyncLog {
  id: string;
  product_id: string;
  product_name: string;
  sku?: string;
  product_sku: string;
  action: 'Publish' | 'Update Website' | 'Unpublish' | 'Retry Sync' | 'Batch Sync';
  request: string;
  result: string;
  status: 'Success' | 'Failed' | 'Pending';
  error?: string;
  user: string;
  timestamp: string;
  http_code?: number;
  channel?: string;
}

export interface WebsiteSyncFieldsConfig {
  name: boolean;
  name_ja: boolean;
  image: boolean;
  category: boolean;
  description: boolean;
  price: boolean;
  offer_price: boolean;
  stock_status: boolean;
  origin: boolean;
  weight: boolean;
  barcode: boolean;
  featured: boolean;
  new_arrival: boolean;
}

export interface WebsiteSyncConfig {
  adapter_type: 'bimi_headless' | 'shopify_webhook' | 'custom_rest' | 'mock_simulation';
  endpoint_url: string;
  auto_sync_on_edit: boolean;
  sync_fields: WebsiteSyncFieldsConfig;
  retry_attempts: number;
  timeout_seconds: number;
  last_sync_at?: string;
}

export type AppRole = 'ADMIN' | 'MANAGER' | 'STORE_STAFF' | 'VIEWER';

export interface RoleRecord {
  id: string;
  role_key: AppRole;
  title: string;
  description: string;
  permissions: Record<string, boolean>;
  created_at?: string;
}

export interface UserProfile {
  id: string;
  username?: string;
  name: string;
  email: string;
  role: AppRole | 'super_admin' | 'store_manager' | 'inventory_lead' | 'staff';
  assigned_store_id?: StoreId; // null if super admin
  is_active: boolean;
  last_login_at: string;
  is_super_admin?: boolean;
}

export interface AuditLogEntry {
  id: string;
  entity_type: 'product' | 'price' | 'inventory' | 'sync' | 'supplier' | 'user' | 'store';
  entity_id: string;
  action: 'create' | 'update' | 'delete' | 'sync_trigger' | 'stock_adjust' | 'price_override';
  description: string;
  user_name: string;
  user_role: string;
  diff?: {
    field: string;
    before: string | number;
    after: string | number;
  }[];
  timestamp: string;
}

export type PaperSize = 'A4' | 'A5' | 'A3';
export type PriceTagTemplateType = 'Normal' | 'Offer' | 'New Arrival' | 'Clearance' | 'Custom';

export type CuttingGuideStyle = 'crop-marks' | 'dashed' | 'solid' | 'none';

export interface CardTextSizes {
  productNameJa?: number; // e.g. 16
  productNameEn?: number; // e.g. 11
  price?: number; // e.g. 43
  priceCurrency?: number; // e.g. 23
  taxPrice?: number; // e.g. 16.5
  taxLabel?: number; // e.g. 11
  ribbonJa?: number; // e.g. 12
  ribbonEn?: number; // e.g. 8.5
  weight?: number; // e.g. 13.5
  origin?: number; // e.g. 9.5
  footer?: number; // e.g. 9
}

export type TitleLineLimitMode = 'auto' | '1-line' | '2-lines';

export interface CardDesignTheme {
  themeName?: string;
  ribbonColor?: string; // default '#005A36'
  topBarColor?: string; // default '#F25C05'
  priceColor?: string; // default '#D6001C'
  footerLeftColor?: string; // default '#005A36'
  footerRightColor?: string; // default '#F25C05'
  ribbonJaText?: string; // default '新鮮で美味しい'
  ribbonEnText?: string; // default 'Fresh & Delicious'
  bottomLeftText?: string; // default 'Good Food Better Life'
  bottomRightText?: string; // default '安心・ハラール  Halal & Quality'
  originLabel?: string; // default '原産国'
  taxLabel?: string; // default '税込'
  textSizes?: CardTextSizes;
  titleLineLimit?: TitleLineLimitMode; // 'auto' (default smart auto-fit) | '1-line' (strict 1 line) | '2-lines' (allow 2 lines)
  maxTitleCharsJa?: number; // optional max character limit for Japanese title (e.g. 20)
  maxTitleCharsEn?: number; // optional max character limit for English title (e.g. 35)
}

export interface PriceTagContentConfig {

  showLogo: boolean;
  showProductImage: boolean;
  showJapaneseName: boolean;
  showEnglishName: boolean;
  showWeightVolume: boolean;
  showOrigin: boolean;
  showRegularPrice: boolean;
  showOfferPrice: boolean;
  showTaxIncluded: boolean;
  showBarcode: boolean;
  showQrCode: boolean;
  showNewArrivalBadge: boolean;
  showOfferBadge: boolean;
  showStoreName: boolean;
  showShelfLocation: boolean;
  showCutLines: boolean;
  cuttingStyle?: CuttingGuideStyle;
  cardSize?: '90x65' | '105x74';
  designTheme?: CardDesignTheme;
}

export interface PriceTagTemplate {
  id: string;
  name: string;
  type: PriceTagTemplateType;
  paper_size: PaperSize;
  cards_per_page: number;
  orientation: 'portrait' | 'landscape';
  config: PriceTagContentConfig;
  custom_badge_text?: string;
  created_at: string;
  updated_at: string;
}

export interface PrintBatchRecord {
  id: string;
  batch_number: string;
  store_id: StoreId;
  store_name: string;
  template_type: PriceTagTemplateType;
  paper_size: PaperSize;
  cards_per_page: number;
  total_cards: number;
  total_pages: number;
  product_ids: string[];
  product_names: string[];
  printed_by: string;
  printed_at: string;
}
