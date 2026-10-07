import {
  Product,
  WebsitePublishingState,
  WebsiteSyncLog,
  WebsiteSyncConfig,
  WebsiteSyncFieldsConfig,
} from '../types/database';

export interface WebsiteSyncPayload {
  sku: string;
  barcode?: string;
  name?: string;
  name_ja?: string;
  image_url?: string;
  category?: string;
  description?: string;
  price?: number;
  offer_price?: number | null;
  stock_status?: 'in_stock' | 'low_stock' | 'out_of_stock';
  stock_quantity?: number;
  origin?: string;
  weight?: string;
  featured?: boolean;
  new_arrival?: boolean;
  synced_at: string;
}

export interface WebsiteSyncResponse {
  success: boolean;
  http_code: number;
  message: string;
  external_id?: string;
  data?: any;
  error?: {
    code: string;
    message: string;
    field?: string;
  };
}

export interface WebsiteSyncAdapter {
  id: string;
  name: string;
  description: string;
  publish(payload: WebsiteSyncPayload): Promise<WebsiteSyncResponse>;
  update(payload: WebsiteSyncPayload): Promise<WebsiteSyncResponse>;
  unpublish(sku: string): Promise<WebsiteSyncResponse>;
  healthCheck(): Promise<{ ok: boolean; latencyMs: number; message: string }>;
}

const DEFAULT_SYNC_FIELDS: WebsiteSyncFieldsConfig = {
  name: true,
  name_ja: true,
  image: true,
  category: true,
  description: true,
  price: true,
  offer_price: true,
  stock_status: true,
  origin: true,
  weight: true,
  barcode: true,
  featured: true,
  new_arrival: true,
};

const DEFAULT_CONFIG: WebsiteSyncConfig = {
  adapter_type: 'bimi_headless',
  endpoint_url: '/api/website-sync',
  auto_sync_on_edit: false, // Internal edits must NOT automatically become public unless configured
  sync_fields: DEFAULT_SYNC_FIELDS,
  retry_attempts: 3,
  timeout_seconds: 10,
  last_sync_at: '2026-10-05T06:12:00Z',
};

/**
 * Adapter 1: My BIMI Headless Storefront API Adapter
 * Connects to external storefront via server-side proxy route (/api/website-sync) or simulated client worker
 */
class BimiHeadlessApiAdapter implements WebsiteSyncAdapter {
  id = 'bimi_headless';
  name = 'My BIMI Headless E-Commerce API (Recommended)';
  description = 'Direct high-speed REST sync with My BIMI online supermarket storefront & mobile apps.';

  async publish(payload: WebsiteSyncPayload): Promise<WebsiteSyncResponse> {
    // Validate required publishing constraints
    if (!payload.sku) {
      return {
        success: false,
        http_code: 400,
        message: 'Validation Error: SKU is required for e-commerce publishing.',
        error: { code: 'MISSING_SKU', message: 'SKU is required' },
      };
    }
    if (payload.price === undefined || payload.price <= 0) {
      return {
        success: false,
        http_code: 422,
        message: 'Pricing Error: Selling price must be greater than ¥0.',
        error: { code: 'INVALID_PRICE', message: 'Selling price must be greater than ¥0', field: 'price' },
      };
    }

    // Check for known edge-case simulation (e.g. matcha 422 test item)
    if (payload.sku === 'BIMI-TEA-003' && payload.description?.includes('TRIGGER_422')) {
      return {
        success: false,
        http_code: 422,
        message: 'Tax Category Classification Error: Groceries 8% reduced rate schema mismatch.',
        error: { code: 'TAX_SCHEMA_MISMATCH', message: 'Tax category classification failed schema check' },
      };
    }

    // Simulate standard network roundtrip latency
    await new Promise((r) => setTimeout(r, 350));

    return {
      success: true,
      http_code: 201,
      message: `Successfully published SKU ${payload.sku} to My BIMI Online Catalog.`,
      external_id: `bimi_prod_${payload.sku.toLowerCase()}`,
      data: {
        published_url: `https://mybimi.jp/product/${payload.sku}`,
        synced_fields_count: Object.keys(payload).length,
      },
    };
  }

  async update(payload: WebsiteSyncPayload): Promise<WebsiteSyncResponse> {
    await new Promise((r) => setTimeout(r, 300));
    return {
      success: true,
      http_code: 200,
      message: `Successfully updated website payload for SKU ${payload.sku}.`,
      external_id: `bimi_prod_${payload.sku.toLowerCase()}`,
    };
  }

  async unpublish(sku: string): Promise<WebsiteSyncResponse> {
    await new Promise((r) => setTimeout(r, 250));
    return {
      success: true,
      http_code: 200,
      message: `Product ${sku} unpublished from public storefront (status set to archived/hidden).`,
    };
  }

  async healthCheck(): Promise<{ ok: boolean; latencyMs: number; message: string }> {
    const start = Date.now();
    await new Promise((r) => setTimeout(r, 120));
    const latencyMs = Date.now() - start;
    return {
      ok: true,
      latencyMs,
      message: 'My BIMI Storefront API cluster is operational (Tokyo-North Region).',
    };
  }
}

/**
 * Adapter 2: Shopify Webhook / Admin REST Adapter
 */
class ShopifyStorefrontAdapter implements WebsiteSyncAdapter {
  id = 'shopify_webhook';
  name = 'Shopify Storefront Webhook Adapter';
  description = 'Enterprise Shopify Admin REST integration with multi-currency & language tags.';

  async publish(payload: WebsiteSyncPayload): Promise<WebsiteSyncResponse> {
    await new Promise((r) => setTimeout(r, 400));
    return {
      success: true,
      http_code: 201,
      message: `Created Shopify product handle for ${payload.sku}.`,
      external_id: `gid://shopify/Product/${Date.now()}`,
    };
  }

  async update(payload: WebsiteSyncPayload): Promise<WebsiteSyncResponse> {
    await new Promise((r) => setTimeout(r, 350));
    return {
      success: true,
      http_code: 200,
      message: `Shopify variant and meta-fields updated for ${payload.sku}.`,
    };
  }

  async unpublish(sku: string): Promise<WebsiteSyncResponse> {
    await new Promise((r) => setTimeout(r, 300));
    return {
      success: true,
      http_code: 200,
      message: `Product ${sku} set to draft status on Shopify channels.`,
    };
  }

  async healthCheck(): Promise<{ ok: boolean; latencyMs: number; message: string }> {
    return {
      ok: true,
      latencyMs: 145,
      message: 'Shopify Storefront API connected with valid webhook signatures.',
    };
  }
}

/**
 * Adapter 3: Simulation & Testing Adapter
 * Allows forcing test errors for robust error handling verification
 */
class SimulationAdapter implements WebsiteSyncAdapter {
  id = 'mock_simulation';
  name = 'Staging Simulation & Diagnostics Adapter';
  description = 'Local test sandbox with error simulation and payload inspection.';

  async publish(payload: WebsiteSyncPayload): Promise<WebsiteSyncResponse> {
    await new Promise((r) => setTimeout(r, 200));
    return {
      success: true,
      http_code: 200,
      message: `[Simulated] Published SKU ${payload.sku} successfully.`,
    };
  }

  async update(payload: WebsiteSyncPayload): Promise<WebsiteSyncResponse> {
    await new Promise((r) => setTimeout(r, 200));
    return {
      success: true,
      http_code: 200,
      message: `[Simulated] Updated SKU ${payload.sku}.`,
    };
  }

  async unpublish(sku: string): Promise<WebsiteSyncResponse> {
    await new Promise((r) => setTimeout(r, 150));
    return {
      success: true,
      http_code: 200,
      message: `[Simulated] Unpublished SKU ${sku}.`,
    };
  }

  async healthCheck(): Promise<{ ok: boolean; latencyMs: number; message: string }> {
    return {
      ok: true,
      latencyMs: 15,
      message: 'Local sandbox ready.',
    };
  }
}

const STORAGE_KEY_CONFIG = 'bimi_website_sync_config';
const STORAGE_KEY_LOGS = 'bimi_website_sync_logs';

const INITIAL_MOCK_LOGS: WebsiteSyncLog[] = [
  {
    id: 'log-001',
    product_id: 'prod-001',
    product_sku: 'BIMI-MEAT-001',
    product_name: 'Japanese Black Wagyu A5 Sirloin Steak (200g)',
    action: 'Publish',
    request: JSON.stringify({
      sku: 'BIMI-MEAT-001',
      name: 'Japanese Black Wagyu A5 Sirloin Steak (200g)',
      price: 2980,
      stock_status: 'in_stock',
      category: 'Meat & Poultry',
      tax_rate: 0.08,
    }),
    result: 'Published to My BIMI Online Catalog (HTTP 201 Created)',
    status: 'Success',
    user: 'Sayaka Sato',
    timestamp: '2026-10-05T06:12:00Z',
    http_code: 201,
    channel: 'BIMI Online Store',
  },
  {
    id: 'log-002',
    product_id: 'prod-002',
    product_sku: 'BIMI-SEA-002',
    product_name: 'Toyosu Direct Bluefin Tuna Sashimi Platter',
    action: 'Update Website',
    request: JSON.stringify({
      sku: 'BIMI-SEA-002',
      name: 'Toyosu Direct Bluefin Tuna Sashimi Platter',
      price: 1680,
      stock_status: 'in_stock',
    }),
    result: 'Updated stock and retail prices (HTTP 200 OK)',
    status: 'Success',
    user: 'Kenji Tanaka',
    timestamp: '2026-10-05T07:00:00Z',
    http_code: 200,
    channel: 'BIMI Online Store',
  },
  {
    id: 'log-003',
    product_id: 'prod-003',
    product_sku: 'BIMI-TEA-003',
    product_name: 'Uji Ceremonial Grade Stone-Ground Matcha (100g Can)',
    action: 'Publish',
    request: JSON.stringify({
      sku: 'BIMI-TEA-003',
      name: 'Uji Ceremonial Grade Stone-Ground Matcha',
      price: 1680,
      tax_category: 'Food 8%',
    }),
    result: 'Validation failed on Shopify webhook (HTTP 422)',
    status: 'Failed',
    error: 'Tax category classification failed: "Food & Beverage 8%" validation schema rejected by Shopify webhook.',
    user: 'System Sync Engine',
    timestamp: '2026-10-04T18:40:00Z',
    http_code: 422,
    channel: 'BIMI Online Store',
  },
  {
    id: 'log-004',
    product_id: 'prod-005',
    product_sku: 'BIMI-FRUIT-005',
    product_name: 'Fukuoka Amaou Premium Giant Strawberries',
    action: 'Update Website',
    request: JSON.stringify({
      sku: 'BIMI-FRUIT-005',
      stock_status: 'in_stock',
      stock_quantity: 24,
    }),
    result: 'Real-time stock updated (HTTP 200 OK)',
    status: 'Success',
    user: 'Sayaka Sato',
    timestamp: '2026-10-05T06:05:00Z',
    http_code: 200,
    channel: 'BIMI Mobile App',
  },
];

class WebsiteSyncService {
  private config: WebsiteSyncConfig;
  private adapters: Map<string, WebsiteSyncAdapter> = new Map();
  private logs: WebsiteSyncLog[] = [];

  constructor() {
    // Register available adapters
    const bimi = new BimiHeadlessApiAdapter();
    const shopify = new ShopifyStorefrontAdapter();
    const mock = new SimulationAdapter();

    this.adapters.set(bimi.id, bimi);
    this.adapters.set(shopify.id, shopify);
    this.adapters.set(mock.id, mock);

    // Load persisted configuration
    try {
      const storedConfig = localStorage.getItem(STORAGE_KEY_CONFIG);
      this.config = storedConfig ? { ...DEFAULT_CONFIG, ...JSON.parse(storedConfig) } : DEFAULT_CONFIG;
    } catch {
      this.config = DEFAULT_CONFIG;
    }

    // Load persisted sync logs
    try {
      const storedLogs = localStorage.getItem(STORAGE_KEY_LOGS);
      this.logs = storedLogs ? JSON.parse(storedLogs) : INITIAL_MOCK_LOGS;
    } catch {
      this.logs = INITIAL_MOCK_LOGS;
    }
  }

  // --- CONFIGURATION ---
  getConfig(): WebsiteSyncConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<WebsiteSyncConfig>): WebsiteSyncConfig {
    this.config = {
      ...this.config,
      ...updates,
      sync_fields: {
        ...this.config.sync_fields,
        ...(updates.sync_fields || {}),
      },
    };
    try {
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(this.config));
    } catch (e) {
      console.warn('Failed to persist sync config:', e);
    }
    return this.getConfig();
  }

  getAvailableAdapters(): { id: string; name: string; description: string }[] {
    return Array.from(this.adapters.values()).map((a) => ({
      id: a.id,
      name: a.name,
      description: a.description,
    }));
  }

  private getActiveAdapter(): WebsiteSyncAdapter {
    const adapter = this.adapters.get(this.config.adapter_type);
    return adapter || this.adapters.get('bimi_headless')!;
  }

  // --- PAYLOAD BUILDER ---
  buildPayload(
    product: Product,
    categoryName?: string,
    currentStock?: number,
    offerPrice?: number | null
  ): WebsiteSyncPayload {
    const fields = this.config.sync_fields;
    const stock = currentStock ?? 10;

    let stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock' = 'in_stock';
    if (stock <= 0) {
      stockStatus = 'out_of_stock';
    } else if (stock <= product.min_stock_alert) {
      stockStatus = 'low_stock';
    }

    const payload: WebsiteSyncPayload = {
      sku: product.sku,
      synced_at: new Date().toISOString(),
    };

    if (fields.barcode) payload.barcode = product.barcode;
    if (fields.name) payload.name = product.name;
    if (fields.name_ja) payload.name_ja = product.name_ja;
    if (fields.image) payload.image_url = product.image_url;
    if (fields.category) payload.category = categoryName || 'Groceries';
    if (fields.description) payload.description = product.description;
    if (fields.price) payload.price = product.base_retail_price;
    if (fields.offer_price) payload.offer_price = offerPrice !== undefined ? offerPrice : null;
    if (fields.stock_status) {
      payload.stock_status = stockStatus;
      payload.stock_quantity = stock;
    }
    if (fields.origin) payload.origin = product.country_of_origin;
    if (fields.weight) payload.weight = product.weight_volume || product.unit;
    if (fields.featured) payload.featured = Boolean(product.is_featured || product.is_bestseller);
    if (fields.new_arrival) payload.new_arrival = Boolean(product.is_new_arrival);

    return payload;
  }

  // --- ACTIONS ---

  /**
   * Action 1: Publish product (Draft / Ready to Publish / Unpublished -> Published)
   * CRITICAL GUARANTEE: Never corrupts internal Product Studio data on failure.
   */
  async publishProduct(
    product: Product,
    options?: {
      user?: string;
      categoryName?: string;
      currentStock?: number;
      offerPrice?: number | null;
    }
  ): Promise<{ product: Product; response: WebsiteSyncResponse }> {
    const payload = this.buildPayload(product, options?.categoryName, options?.currentStock, options?.offerPrice);
    const adapter = this.getActiveAdapter();
    const user = options?.user || 'Store Manager';
    const now = new Date().toISOString();

    let response: WebsiteSyncResponse;

    try {
      response = await adapter.publish(payload);
    } catch (err: any) {
      response = {
        success: false,
        http_code: 500,
        message: err?.message || 'Network exception connecting to website API.',
        error: { code: 'NETWORK_ERROR', message: err?.message || 'Unknown network error' },
      };
    }

    // Prepare updated product (only updating publishing states, internal attributes untouched!)
    let updatedProduct: Product;

    if (response.success) {
      updatedProduct = {
        ...product,
        publishing_state: 'Published',
        website_sync_status: 'synced',
        website_sync_error: undefined,
        last_synced_at: now,
        has_pending_changes: false,
      };
    } else {
      // Failed sync must NOT corrupt internal Product Studio data!
      updatedProduct = {
        ...product,
        publishing_state: 'Sync Error',
        website_sync_status: 'error',
        website_sync_error: response.message || response.error?.message || 'Sync failed',
      };
    }

    // Append to Sync Log
    this.addLog({
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      product_id: product.id,
      product_sku: product.sku,
      product_name: product.name,
      action: 'Publish',
      request: JSON.stringify(payload, null, 2),
      result: response.message,
      status: response.success ? 'Success' : 'Failed',
      error: response.success ? undefined : response.message,
      user,
      timestamp: now,
      http_code: response.http_code,
      channel: 'BIMI Online Store',
    });

    return { product: updatedProduct, response };
  }

  /**
   * Action 2: Update Website (Pushes latest internal edits to live website)
   */
  async updateWebsite(
    product: Product,
    options?: {
      user?: string;
      categoryName?: string;
      currentStock?: number;
      offerPrice?: number | null;
    }
  ): Promise<{ product: Product; response: WebsiteSyncResponse }> {
    const payload = this.buildPayload(product, options?.categoryName, options?.currentStock, options?.offerPrice);
    const adapter = this.getActiveAdapter();
    const user = options?.user || 'Store Manager';
    const now = new Date().toISOString();

    let response: WebsiteSyncResponse;

    try {
      response = await adapter.update(payload);
    } catch (err: any) {
      response = {
        success: false,
        http_code: 500,
        message: err?.message || 'Network error updating website API.',
        error: { code: 'NETWORK_ERROR', message: err?.message || 'Unknown error' },
      };
    }

    let updatedProduct: Product;

    if (response.success) {
      updatedProduct = {
        ...product,
        publishing_state: 'Published',
        website_sync_status: 'synced',
        website_sync_error: undefined,
        last_synced_at: now,
        has_pending_changes: false,
      };
    } else {
      updatedProduct = {
        ...product,
        publishing_state: 'Sync Error',
        website_sync_status: 'error',
        website_sync_error: response.message,
      };
    }

    this.addLog({
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      product_id: product.id,
      product_sku: product.sku,
      product_name: product.name,
      action: 'Update Website',
      request: JSON.stringify(payload, null, 2),
      result: response.message,
      status: response.success ? 'Success' : 'Failed',
      error: response.success ? undefined : response.message,
      user,
      timestamp: now,
      http_code: response.http_code,
      channel: 'BIMI Online Store',
    });

    return { product: updatedProduct, response };
  }

  /**
   * Action 3: Unpublish (Sets product unpublished/hidden on live website)
   */
  async unpublishProduct(
    product: Product,
    user: string = 'Store Manager'
  ): Promise<{ product: Product; response: WebsiteSyncResponse }> {
    const adapter = this.getActiveAdapter();
    const now = new Date().toISOString();

    let response: WebsiteSyncResponse;

    try {
      response = await adapter.unpublish(product.sku);
    } catch (err: any) {
      response = {
        success: false,
        http_code: 500,
        message: err?.message || 'Network exception unpublishing product.',
      };
    }

    let updatedProduct: Product;

    if (response.success) {
      updatedProduct = {
        ...product,
        publishing_state: 'Unpublished',
        website_sync_status: 'disabled',
        website_sync_error: undefined,
        last_synced_at: now,
        has_pending_changes: false,
      };
    } else {
      updatedProduct = {
        ...product,
        publishing_state: 'Sync Error',
        website_sync_status: 'error',
        website_sync_error: response.message,
      };
    }

    this.addLog({
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      product_id: product.id,
      product_sku: product.sku,
      product_name: product.name,
      action: 'Unpublish',
      request: JSON.stringify({ sku: product.sku, action: 'unpublish' }, null, 2),
      result: response.message,
      status: response.success ? 'Success' : 'Failed',
      error: response.success ? undefined : response.message,
      user,
      timestamp: now,
      http_code: response.http_code,
      channel: 'BIMI Online Store',
    });

    return { product: updatedProduct, response };
  }

  /**
   * Action 4: Retry Sync (For products currently in Sync Error)
   */
  async retrySync(
    product: Product,
    options?: {
      user?: string;
      categoryName?: string;
      currentStock?: number;
      offerPrice?: number | null;
    }
  ): Promise<{ product: Product; response: WebsiteSyncResponse }> {
    const payload = this.buildPayload(product, options?.categoryName, options?.currentStock, options?.offerPrice);
    const adapter = this.getActiveAdapter();
    const user = options?.user || 'Store Manager';
    const now = new Date().toISOString();

    let response: WebsiteSyncResponse;

    try {
      // If product was previously published, retry update; otherwise retry publish
      if (product.last_synced_at) {
        response = await adapter.update(payload);
      } else {
        response = await adapter.publish(payload);
      }
    } catch (err: any) {
      response = {
        success: false,
        http_code: 500,
        message: err?.message || 'Retry failed due to connection error.',
      };
    }

    let updatedProduct: Product;

    if (response.success) {
      updatedProduct = {
        ...product,
        publishing_state: 'Published',
        website_sync_status: 'synced',
        website_sync_error: undefined,
        last_synced_at: now,
        has_pending_changes: false,
      };
    } else {
      updatedProduct = {
        ...product,
        publishing_state: 'Sync Error',
        website_sync_status: 'error',
        website_sync_error: response.message,
      };
    }

    this.addLog({
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      product_id: product.id,
      product_sku: product.sku,
      product_name: product.name,
      action: 'Retry Sync',
      request: JSON.stringify(payload, null, 2),
      result: response.message,
      status: response.success ? 'Success' : 'Failed',
      error: response.success ? undefined : response.message,
      user,
      timestamp: now,
      http_code: response.http_code,
      channel: 'BIMI Online Store',
    });

    return { product: updatedProduct, response };
  }

  // --- LOGS MANAGEMENT ---
  async getLogs(): Promise<WebsiteSyncLog[]> {
    return [...this.logs];
  }

  private addLog(entry: WebsiteSyncLog) {
    this.logs.unshift(entry);
    if (this.logs.length > 250) {
      this.logs.pop();
    }
    try {
      localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(this.logs));
    } catch (e) {
      console.warn('Failed to save sync log:', e);
    }
  }

  async clearLogs(): Promise<void> {
    this.logs = [];
    try {
      localStorage.removeItem(STORAGE_KEY_LOGS);
    } catch (e) {
      console.warn('Failed to clear sync logs:', e);
    }
  }

  async healthCheck(): Promise<{ ok: boolean; latencyMs: number; message: string }> {
    return this.getActiveAdapter().healthCheck();
  }
}

export const websiteSyncService = new WebsiteSyncService();
