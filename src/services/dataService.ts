import {
  Store,
  Category,
  Brand,
  Supplier,
  Product,
  StoreProduct,
  PriceHistoryRecord,
  StockMovement,
  StockMovementType,
  PurchaseOrder,
  WebsiteSyncEvent,
  UserProfile,
  AuditLogEntry,
  StoreId,
  ProductStorePrice,
  ProductSupplier,
  SupplierPriceHistoryRecord,
  PriceTagTemplate,
  PrintBatchRecord,
  WebsitePublishingState,
  WebsiteSyncLog,
} from '../types/database';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { websiteSyncService } from './websiteSyncService';
import {
  INITIAL_STORES,
  INITIAL_CATEGORIES,
  INITIAL_BRANDS,
  INITIAL_SUPPLIERS,
  INITIAL_PRODUCTS,
  INITIAL_STORE_PRODUCTS,
  INITIAL_PRODUCT_STORE_PRICES,
  INITIAL_PRICE_HISTORY,
  INITIAL_STOCK_MOVEMENTS,
  INITIAL_PURCHASE_ORDERS,
  INITIAL_SYNC_LOGS,
  INITIAL_USERS,
  INITIAL_AUDIT_LOGS,
  INITIAL_PRODUCT_SUPPLIERS,
  INITIAL_SUPPLIER_PRICE_HISTORY,
  INITIAL_PRICE_TAG_TEMPLATES,
  INITIAL_PRINT_BATCHES,
} from '../data/mockData';

// Persistent LocalStorage keys for stateful demo experience
const STORAGE_PREFIX = 'bimi_product_studio_';

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data));
  } catch {
    // ignore
  }
}

class ProductStudioDataService {
  private stores: Store[] = loadFromStorage('stores', INITIAL_STORES);
  private categories: Category[] = loadFromStorage('categories', INITIAL_CATEGORIES);
  private brands: Brand[] = loadFromStorage('brands', INITIAL_BRANDS);
  private suppliers: Supplier[] = loadFromStorage('suppliers', INITIAL_SUPPLIERS);
  private products: Product[] = loadFromStorage('products', INITIAL_PRODUCTS);
  private storeProducts: StoreProduct[] = loadFromStorage('store_products', INITIAL_STORE_PRODUCTS);
  private productStorePrices: ProductStorePrice[] = loadFromStorage('product_store_prices', INITIAL_PRODUCT_STORE_PRICES);
  private priceHistory: PriceHistoryRecord[] = loadFromStorage('price_history', INITIAL_PRICE_HISTORY);
  private stockMovements: StockMovement[] = loadFromStorage('stock_movements', INITIAL_STOCK_MOVEMENTS);
  private purchaseOrders: PurchaseOrder[] = loadFromStorage('purchase_orders', INITIAL_PURCHASE_ORDERS);
  private syncLogs: WebsiteSyncEvent[] = loadFromStorage('sync_logs', INITIAL_SYNC_LOGS);
  private users: UserProfile[] = loadFromStorage('users', INITIAL_USERS);
  private auditLogs: AuditLogEntry[] = loadFromStorage('audit_logs', INITIAL_AUDIT_LOGS);
  private productSuppliers: ProductSupplier[] = loadFromStorage('product_suppliers', INITIAL_PRODUCT_SUPPLIERS);
  private supplierPriceHistory: SupplierPriceHistoryRecord[] = loadFromStorage('supplier_price_history', INITIAL_SUPPLIER_PRICE_HISTORY);
  private priceTagTemplates: PriceTagTemplate[] = loadFromStorage('price_tag_templates', INITIAL_PRICE_TAG_TEMPLATES);
  private printBatches: PrintBatchRecord[] = loadFromStorage('print_batches', INITIAL_PRINT_BATCHES);

  private persist() {
    saveToStorage('stores', this.stores);
    saveToStorage('categories', this.categories);
    saveToStorage('brands', this.brands);
    saveToStorage('suppliers', this.suppliers);
    saveToStorage('products', this.products);
    saveToStorage('store_products', this.storeProducts);
    saveToStorage('product_store_prices', this.productStorePrices);
    saveToStorage('price_history', this.priceHistory);
    saveToStorage('stock_movements', this.stockMovements);
    saveToStorage('purchase_orders', this.purchaseOrders);
    saveToStorage('sync_logs', this.syncLogs);
    saveToStorage('users', this.users);
    saveToStorage('audit_logs', this.auditLogs);
    saveToStorage('product_suppliers', this.productSuppliers);
    saveToStorage('supplier_price_history', this.supplierPriceHistory);
    saveToStorage('price_tag_templates', this.priceTagTemplates);
    saveToStorage('print_batches', this.printBatches);
  }

  constructor() {
    this.ensureInitialProductsPresent();
    this.ensureProductPublishingStates();
  }

  private ensureInitialProductsPresent() {
    let modified = false;
    for (const initP of INITIAL_PRODUCTS) {
      if (!this.products.some((p) => p.id === initP.id)) {
        this.products.unshift(initP);
        modified = true;
      }
    }
    for (const initSP of INITIAL_STORE_PRODUCTS) {
      if (!this.storeProducts.some((sp) => sp.id === initSP.id)) {
        this.storeProducts.unshift(initSP);
        modified = true;
      }
    }
    for (const initPSP of INITIAL_PRODUCT_STORE_PRICES) {
      if (!this.productStorePrices.some((psp) => psp.id === initPSP.id)) {
        this.productStorePrices.unshift(initPSP);
        modified = true;
      }
    }
    if (modified) {
      this.persist();
    }
  }

  private ensureProductPublishingStates() {
    let modified = false;
    this.products.forEach((p) => {
      if (!p.publishing_state) {
        if (p.website_sync_status === 'synced') p.publishing_state = 'Published';
        else if (p.website_sync_status === 'pending') p.publishing_state = 'Ready to Publish';
        else if (p.website_sync_status === 'error') p.publishing_state = 'Sync Error';
        else if (p.website_sync_status === 'disabled') p.publishing_state = 'Unpublished';
        else p.publishing_state = 'Draft';
        modified = true;
      }
    });
    if (modified) {
      this.persist();
    }
  }

  // --- STORES ---
  async getStores(): Promise<Store[]> {
    return [...this.stores];
  }

  async addStore(newStore: Omit<Store, 'id' | 'created_at' | 'updated_at'>): Promise<Store> {
    const id = `store-${newStore.code.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString(36)}`;
    const store: Store = {
      ...newStore,
      id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.stores.push(store);

    // Initialize store_products entries for existing products at base retail price
    this.products.forEach((p) => {
      this.storeProducts.push({
        id: `sp-${store.code.toLowerCase()}-${p.id}`,
        product_id: p.id,
        store_id: store.id,
        retail_price: p.base_retail_price,
        stock_quantity: 0,
        reserved_quantity: 0,
        shelf_location: 'General Storage Bay',
        last_restocked_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    });

    this.addAuditEntry({
      entity_type: 'store',
      entity_id: store.id,
      action: 'create',
      description: `Created new branch store: ${store.name} (${store.code})`,
      user_name: 'Current User',
      user_role: 'Administrator',
    });

    this.persist();
    return store;
  }

  // --- CATEGORIES & BRANDS & SUPPLIERS ---
  async getCategories(): Promise<Category[]> {
    return [...this.categories];
  }

  async getBrands(): Promise<Brand[]> {
    return [...this.brands];
  }

  // --- SUPPLIERS & PRODUCT-SUPPLIER SOURCING ---
  async getSuppliers(): Promise<Supplier[]> {
    return this.suppliers.map((s) => {
      const linkedCount = this.productSuppliers.filter((ps) => ps.supplier_id === s.id).length;
      return {
        ...s,
        linked_products_count: linkedCount,
      };
    });
  }

  async getSupplierById(id: string): Promise<Supplier | undefined> {
    const supplier = this.suppliers.find((s) => s.id === id);
    if (!supplier) return undefined;
    const linkedCount = this.productSuppliers.filter((ps) => ps.supplier_id === id).length;
    return {
      ...supplier,
      linked_products_count: linkedCount,
    };
  }

  async addSupplier(supplierData: Omit<Supplier, 'id' | 'linked_products_count' | 'created_at' | 'updated_at'>): Promise<Supplier> {
    const id = `sup-${Date.now().toString(36)}`;
    const now = new Date().toISOString();
    const newSup: Supplier = {
      ...supplierData,
      id,
      code: supplierData.code?.toUpperCase().trim() || `SUP-${Math.floor(100 + Math.random() * 900)}`,
      whatsapp: supplierData.whatsapp || supplierData.phone,
      country: supplierData.country || 'Japan',
      currency: supplierData.currency || 'JPY',
      payment_terms: supplierData.payment_terms || 'Net 30 days',
      lead_time_days: Number(supplierData.lead_time_days) || 2,
      is_active: supplierData.is_active ?? true,
      linked_products_count: 0,
      created_at: now,
      updated_at: now,
    };
    this.suppliers.unshift(newSup);
    this.addAuditEntry({
      entity_type: 'supplier',
      entity_id: newSup.id,
      action: 'create',
      description: `Registered new wholesale supplier: ${newSup.name} (${newSup.code})`,
      user_name: 'Current User',
      user_role: 'Procurement Specialist',
    });
    this.persist();
    return newSup;
  }

  async updateSupplier(id: string, updates: Partial<Supplier>): Promise<Supplier> {
    const index = this.suppliers.findIndex((s) => s.id === id);
    if (index === -1) throw new Error(`Supplier with id ${id} not found.`);

    const existing = this.suppliers[index];
    const now = new Date().toISOString();
    const updated: Supplier = {
      ...existing,
      ...updates,
      updated_at: now,
    };
    this.suppliers[index] = updated;

    // If company name changed, sync supplier_name in productSuppliers
    if (updates.name && updates.name !== existing.name) {
      this.productSuppliers.forEach((ps) => {
        if (ps.supplier_id === id) {
          ps.supplier_name = updates.name!;
        }
      });
    }

    this.addAuditEntry({
      entity_type: 'supplier',
      entity_id: id,
      action: 'update',
      description: `Updated supplier profile: ${updated.name} (${updated.code})`,
      user_name: 'Current User',
      user_role: 'Procurement Specialist',
    });
    this.persist();
    return updated;
  }

  async deleteSupplier(id: string): Promise<void> {
    const supplier = this.suppliers.find((s) => s.id === id);
    if (!supplier) throw new Error(`Supplier not found.`);

    // Remove supplier
    this.suppliers = this.suppliers.filter((s) => s.id !== id);

    // Remove any product-supplier links
    this.productSuppliers = this.productSuppliers.filter((ps) => ps.supplier_id !== id);

    this.addAuditEntry({
      entity_type: 'supplier',
      entity_id: id,
      action: 'delete',
      description: `Deleted supplier record: ${supplier.name} (${supplier.code})`,
      user_name: 'Current User',
      user_role: 'Procurement Specialist',
    });
    this.persist();
  }

  // --- PRODUCT-SUPPLIER RELATIONSHIPS ---
  async getProductSuppliers(productId?: string, supplierId?: string): Promise<ProductSupplier[]> {
    return this.productSuppliers.filter((ps) => {
      const matchProd = !productId || ps.product_id === productId;
      const matchSup = !supplierId || ps.supplier_id === supplierId;
      return matchProd && matchSup;
    });
  }

  async setPreferredSupplier(productId: string, supplierId: string, updatedBy = 'Procurement Specialist'): Promise<void> {
    const product = this.products.find((p) => p.id === productId);
    if (!product) throw new Error('Product not found.');

    const targetSupplierLink = this.productSuppliers.find(
      (ps) => ps.product_id === productId && ps.supplier_id === supplierId
    );
    if (!targetSupplierLink) {
      throw new Error('This supplier is not linked to the product.');
    }

    // Mark target as preferred and un-mark all other suppliers for this product
    const now = new Date().toISOString();
    this.productSuppliers.forEach((ps) => {
      if (ps.product_id === productId) {
        ps.is_preferred = ps.supplier_id === supplierId;
        ps.last_updated = now;
        ps.updated_by = updatedBy;
      }
    });

    // Update product's primary supplier_id and cost_price based on preferred supplier's purchase price
    product.supplier_id = supplierId;
    product.cost_price = targetSupplierLink.purchase_price;
    product.updated_at = now;

    this.addAuditEntry({
      entity_type: 'supplier',
      entity_id: supplierId,
      action: 'update',
      description: `Set ${targetSupplierLink.supplier_name} as preferred supplier for ${product.name} (Purchase Cost: ¥${targetSupplierLink.purchase_price})`,
      user_name: updatedBy,
      user_role: 'Procurement Specialist',
    });

    this.persist();
  }

  async upsertProductSupplier(
    data: Omit<ProductSupplier, 'id' | 'last_updated'> & { id?: string },
    updatedBy = 'Procurement Specialist',
    priceChangeReason?: string
  ): Promise<ProductSupplier> {
    const product = this.products.find((p) => p.id === data.product_id);
    const supplier = this.suppliers.find((s) => s.id === data.supplier_id);
    if (!product) throw new Error('Product not found.');
    if (!supplier) throw new Error('Supplier not found.');

    const now = new Date().toISOString();
    const existingIndex = data.id
      ? this.productSuppliers.findIndex((ps) => ps.id === data.id)
      : this.productSuppliers.findIndex(
          (ps) => ps.product_id === data.product_id && ps.supplier_id === data.supplier_id
        );

    // If this is set as preferred, remove preferred flag from existing links
    if (data.is_preferred) {
      this.productSuppliers.forEach((ps) => {
        if (ps.product_id === data.product_id && ps.id !== data.id) {
          ps.is_preferred = false;
        }
      });
      product.supplier_id = data.supplier_id;
      product.cost_price = data.purchase_price;
      product.updated_at = now;
    }

    let result: ProductSupplier;

    if (existingIndex >= 0) {
      const existing = this.productSuppliers[existingIndex];
      const oldPrice = existing.purchase_price;
      const newPrice = Number(data.purchase_price);

      // Check if price changed -> record supplier price history
      if (oldPrice !== newPrice) {
        this.supplierPriceHistory.unshift({
          id: `sph-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`,
          product_id: product.id,
          product_name: product.name,
          supplier_id: supplier.id,
          supplier_name: supplier.name,
          old_price: oldPrice,
          new_price: newPrice,
          currency: data.currency || existing.currency || 'JPY',
          reason: priceChangeReason || 'Supplier purchase tariff adjustment',
          effective_date: now,
          changed_by: updatedBy,
          created_at: now,
        });
      }

      result = {
        ...existing,
        ...data,
        supplier_name: supplier.name,
        product_name: product.name,
        product_sku: product.sku,
        purchase_price: newPrice,
        last_purchase_price: oldPrice !== newPrice ? oldPrice : existing.last_purchase_price,
        last_updated: now,
        updated_by: updatedBy,
      };
      this.productSuppliers[existingIndex] = result;
    } else {
      const id = `ps-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`;
      result = {
        ...data,
        id,
        supplier_name: supplier.name,
        product_name: product.name,
        product_sku: product.sku,
        purchase_price: Number(data.purchase_price),
        last_purchase_price: Number(data.purchase_price),
        last_updated: now,
        updated_by: updatedBy,
      };
      this.productSuppliers.push(result);

      // Record initial supplier price
      this.supplierPriceHistory.unshift({
        id: `sph-${Date.now().toString(36)}`,
        product_id: product.id,
        product_name: product.name,
        supplier_id: supplier.id,
        supplier_name: supplier.name,
        old_price: Number(data.purchase_price),
        new_price: Number(data.purchase_price),
        currency: data.currency || 'JPY',
        reason: 'Initial supplier sourcing agreement established',
        effective_date: now,
        changed_by: updatedBy,
        created_at: now,
      });
    }

    this.persist();
    return result;
  }

  async removeProductSupplier(productSupplierId: string): Promise<void> {
    const link = this.productSuppliers.find((ps) => ps.id === productSupplierId);
    if (!link) return;

    this.productSuppliers = this.productSuppliers.filter((ps) => ps.id !== productSupplierId);

    // If the removed supplier was preferred, make another supplier preferred if available
    if (link.is_preferred) {
      const remaining = this.productSuppliers.filter((ps) => ps.product_id === link.product_id);
      if (remaining.length > 0) {
        remaining[0].is_preferred = true;
        const prod = this.products.find((p) => p.id === link.product_id);
        if (prod) {
          prod.supplier_id = remaining[0].supplier_id;
          prod.cost_price = remaining[0].purchase_price;
        }
      }
    }

    this.persist();
  }

  // --- SUPPLIER PRICE HISTORY ---
  async getSupplierPriceHistory(productId?: string, supplierId?: string): Promise<SupplierPriceHistoryRecord[]> {
    return this.supplierPriceHistory.filter((sph) => {
      const matchProd = !productId || sph.product_id === productId;
      const matchSup = !supplierId || sph.supplier_id === supplierId;
      return matchProd && matchSup;
    });
  }

  // --- PRODUCT COST & LANDED COST SECTION ---
  async updateProductCostBreakdown(
    productId: string,
    costs: {
      cost_price?: number;
      freight_cost?: number;
      customs_duty?: number;
      other_cost?: number;
    }
  ): Promise<Product> {
    const product = this.products.find((p) => p.id === productId);
    if (!product) throw new Error(`Product ${productId} not found.`);

    if (costs.cost_price !== undefined) product.cost_price = Number(costs.cost_price);
    if (costs.freight_cost !== undefined) product.freight_cost = Number(costs.freight_cost);
    if (costs.customs_duty !== undefined) product.customs_duty = Number(costs.customs_duty);
    if (costs.other_cost !== undefined) product.other_cost = Number(costs.other_cost);
    product.updated_at = new Date().toISOString();

    this.addAuditEntry({
      entity_type: 'product',
      entity_id: product.id,
      action: 'update',
      description: `Updated landed cost components for ${product.name} (Purchase: ¥${product.cost_price}, Freight: ¥${product.freight_cost || 0}, Customs: ¥${product.customs_duty || 0}, Other: ¥${product.other_cost || 0})`,
      user_name: 'Current User',
      user_role: 'Cost Accounting',
    });

    this.persist();
    return product;
  }

  // --- PRODUCTS ---
  async getProducts(): Promise<Product[]> {
    return [...this.products];
  }

  async getProductById(id: string): Promise<Product | undefined> {
    return this.products.find((p) => p.id === id);
  }

  async getStoreProducts(): Promise<StoreProduct[]> {
    return [...this.storeProducts];
  }

  async getStoreProductByStoreAndProduct(storeId: StoreId, productId: string): Promise<StoreProduct | undefined> {
    return this.storeProducts.find((sp) => sp.store_id === storeId && sp.product_id === productId);
  }

  // Validation helpers
  isSkuUnique(sku: string, excludeId?: string): boolean {
    const trimmed = sku.trim().toLowerCase();
    return !this.products.some((p) => p.sku.trim().toLowerCase() === trimmed && p.id !== excludeId);
  }

  isBarcodeUnique(barcode: string, excludeId?: string): boolean {
    const trimmed = barcode.trim();
    if (!trimmed) return true; // Optional barcode or empty
    return !this.products.some((p) => p.barcode.trim() === trimmed && p.id !== excludeId);
  }

  async addProduct(
    productData: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'website_sync_status'>,
    initialStockByStore: Record<StoreId, { price: number; stock: number; location: string }>
  ): Promise<Product> {
    // Validate required fields
    if (!productData.name || !productData.name.trim()) {
      throw new Error('English product name is required.');
    }
    if (!productData.sku || !productData.sku.trim()) {
      throw new Error('SKU identifier is required.');
    }
    if (!this.isSkuUnique(productData.sku)) {
      throw new Error(`SKU "${productData.sku}" is already assigned to another product.`);
    }
    if (productData.barcode && !this.isBarcodeUnique(productData.barcode)) {
      throw new Error(`Barcode / JAN "${productData.barcode}" is already registered in the catalog.`);
    }

    const id = `prod-${Date.now().toString(36)}`;
    const now = new Date().toISOString();
    const product: Product = {
      ...productData,
      id,
      website_sync_status: 'synced',
      last_synced_at: now,
      created_at: now,
      updated_at: now,
    };

    this.products.unshift(product);

    // Create store product mappings
    this.stores.forEach((st) => {
      const storeInput = initialStockByStore[st.id] || {
        price: product.base_retail_price,
        stock: 0,
        location: 'Storage',
      };
      this.storeProducts.push({
        id: `sp-${st.code.toLowerCase()}-${product.id}`,
        product_id: product.id,
        store_id: st.id,
        retail_price: storeInput.price,
        stock_quantity: storeInput.stock,
        reserved_quantity: 0,
        shelf_location: storeInput.location,
        last_restocked_at: now,
        updated_at: now,
      });

      if (storeInput.stock > 0) {
        this.stockMovements.unshift({
          id: `sm-${Date.now()}-${st.code}`,
          product_id: product.id,
          product_name: product.name,
          sku: product.sku,
          store_id: st.id,
          store_name: st.name,
          type: 'received',
          quantity_change: storeInput.stock,
          balance_after: storeInput.stock,
          reference_doc: 'INIT-INVENTORY',
          notes: 'Initial stock intake upon catalog creation',
          performed_by: 'Inventory Manager',
          created_at: now,
        });
      }
    });

    this.addAuditEntry({
      entity_type: 'product',
      entity_id: product.id,
      action: 'create',
      description: `Created new master product: ${product.name} (SKU: ${product.sku})`,
      user_name: 'Store Manager',
      user_role: 'Operations',
    });

    this.persist();
    return product;
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    const index = this.products.findIndex((p) => p.id === id);
    if (index === -1) throw new Error('Product not found');

    if (updates.sku && !this.isSkuUnique(updates.sku, id)) {
      throw new Error(`SKU "${updates.sku}" is already assigned to another product.`);
    }
    if (updates.barcode && !this.isBarcodeUnique(updates.barcode, id)) {
      throw new Error(`Barcode / JAN "${updates.barcode}" is already registered in the catalog.`);
    }

    const current = this.products[index];
    const autoSync = websiteSyncService.getConfig().auto_sync_on_edit;

    let nextPublishingState: WebsitePublishingState =
      updates.publishing_state || current.publishing_state || 'Draft';
    let hasPending = current.has_pending_changes;

    // IMPORTANT: Internal edits must NOT automatically become public unless configured
    if (!updates.publishing_state && current.publishing_state === 'Published') {
      if (!autoSync) {
        nextPublishingState = 'Ready to Publish';
        hasPending = true;
      }
    }

    const updated: Product = {
      ...current,
      ...updates,
      publishing_state: nextPublishingState,
      has_pending_changes: hasPending,
      updated_at: new Date().toISOString(),
    };
    this.products[index] = updated;

    this.addAuditEntry({
      entity_type: 'product',
      entity_id: id,
      action: 'update',
      description: `Updated master product properties for ${updated.name}${
        nextPublishingState === 'Ready to Publish' && current.publishing_state === 'Published'
          ? ' (Staged: Ready to Publish. Website not updated until published)'
          : ''
      }`,
      user_name: 'Current User',
      user_role: 'Editor',
    });

    this.persist();

    // If autoSync is explicitly configured ON, trigger sync
    if (autoSync && current.publishing_state === 'Published') {
      try {
        await this.updateProductOnWebsite(id);
      } catch (e) {
        console.warn('Auto sync on edit failed:', e);
      }
    }

    return updated;
  }

  async duplicateProduct(
    sourceProductId: string,
    newSku: string,
    newBarcode: string,
    newName?: string
  ): Promise<Product> {
    const source = this.products.find((p) => p.id === sourceProductId);
    if (!source) throw new Error('Source product not found');

    if (!this.isSkuUnique(newSku)) {
      throw new Error(`SKU "${newSku}" already exists.`);
    }
    if (newBarcode && !this.isBarcodeUnique(newBarcode)) {
      throw new Error(`Barcode "${newBarcode}" already exists.`);
    }

    const now = new Date().toISOString();
    const newId = `prod-${Date.now().toString(36)}`;
    const clonedName = newName || `${source.name} (Copy)`;

    const duplicated: Product = {
      ...source,
      id: newId,
      sku: newSku,
      barcode: newBarcode,
      name: clonedName,
      status: 'Draft',
      created_at: now,
      updated_at: now,
    };

    this.products.unshift(duplicated);

    // Copy store product records with 0 initial stock
    this.stores.forEach((st) => {
      const sourceSp = this.storeProducts.find((sp) => sp.product_id === source.id && sp.store_id === st.id);
      this.storeProducts.push({
        id: `sp-${st.code.toLowerCase()}-${duplicated.id}`,
        product_id: duplicated.id,
        store_id: st.id,
        retail_price: sourceSp ? sourceSp.retail_price : duplicated.base_retail_price,
        stock_quantity: 0,
        reserved_quantity: 0,
        shelf_location: sourceSp ? sourceSp.shelf_location : 'Sales Floor',
        last_restocked_at: now,
        updated_at: now,
      });
    });

    this.addAuditEntry({
      entity_type: 'product',
      entity_id: duplicated.id,
      action: 'create',
      description: `Duplicated product from ${source.name} as ${duplicated.name} (SKU: ${duplicated.sku})`,
      user_name: 'Current User',
      user_role: 'Editor',
    });

    this.persist();
    return duplicated;
  }

  async archiveProduct(id: string): Promise<Product> {
    return this.updateProduct(id, { status: 'Archived', is_active: false });
  }

  async deleteProduct(id: string): Promise<void> {
    const index = this.products.findIndex((p) => p.id === id);
    if (index === -1) throw new Error('Product not found');

    const deleted = this.products[index];
    this.products.splice(index, 1);
    this.storeProducts = this.storeProducts.filter((sp) => sp.product_id !== id);

    this.addAuditEntry({
      entity_type: 'product',
      entity_id: id,
      action: 'delete',
      description: `Permanently deleted product: ${deleted.name} (${deleted.sku})`,
      user_name: 'Current User',
      user_role: 'Administrator',
    });

    this.persist();
  }

  // --- MULTI-STORE PRICING SYSTEM ---
  async getProductStorePrices(productId?: string, storeId?: string): Promise<ProductStorePrice[]> {
    return this.productStorePrices.filter((psp) => {
      const matchesProduct = !productId || psp.product_id === productId;
      const matchesStore = !storeId || storeId === 'all' || psp.store_id === storeId;
      return matchesProduct && matchesStore;
    });
  }

  async getProductPriceByStore(productId: string, storeId: string): Promise<ProductStorePrice | undefined> {
    return this.productStorePrices.find(
      (psp) => psp.product_id === productId && psp.store_id === storeId
    );
  }

  async getEffectiveStorePrice(productId: string, storeId: string): Promise<ProductStorePrice> {
    const existing = this.productStorePrices.find(
      (psp) => psp.product_id === productId && psp.store_id === storeId
    );
    if (existing) return existing;

    const product = this.products.find((p) => p.id === productId);
    const storeObj = this.stores.find((s) => s.id === storeId);
    const storeName = storeId === 'website' ? 'My BIMI Online Store' : storeObj?.name || storeId;
    const basePrice = product ? product.base_retail_price : 0;
    const taxRate = product ? product.tax_rate : 0.08;

    return {
      id: `psp-${storeId}-${productId}-fallback`,
      product_id: productId,
      store_id: storeId,
      store_name: storeName,
      regular_price: basePrice,
      offer_price: null,
      wholesale_price: Math.round(basePrice * 0.85),
      online_price: basePrice,
      tax_rate: taxRate,
      is_active: true,
      last_updated: product ? product.updated_at : new Date().toISOString(),
      updated_by: 'System Fallback',
    };
  }

  async setProductStorePrice(params: {
    productId: string;
    storeId: StoreId | 'website';
    regularPrice: number;
    offerPrice?: number | null;
    wholesalePrice?: number | null;
    onlinePrice?: number | null;
    offerStartDate?: string | null;
    offerEndDate?: string | null;
    reason: string;
    updatedBy: string;
  }): Promise<ProductStorePrice> {
    const product = this.products.find((p) => p.id === params.productId);
    if (!product) throw new Error('Product not found');

    const now = new Date().toISOString();
    let psp = this.productStorePrices.find(
      (item) => item.product_id === params.productId && item.store_id === params.storeId
    );

    const storeObj = this.stores.find((s) => s.id === params.storeId);
    const storeName = params.storeId === 'website' ? 'My BIMI Online Store' : storeObj?.name || params.storeId;

    const oldRegular = psp ? psp.regular_price : product.base_retail_price;
    const oldOffer = psp?.offer_price ?? null;

    const isBelowCost = (params.offerPrice ?? params.regularPrice) < product.cost_price;

    if (!psp) {
      psp = {
        id: `psp-${params.storeId}-${params.productId}-${Date.now().toString(36)}`,
        product_id: params.productId,
        store_id: params.storeId,
        store_name: storeName,
        regular_price: params.regularPrice,
        offer_price: params.offerPrice ?? null,
        wholesale_price: params.wholesalePrice ?? Math.round(params.regularPrice * 0.85),
        online_price: params.onlinePrice ?? params.regularPrice,
        tax_rate: product.tax_rate,
        offer_start_date: params.offerStartDate ?? null,
        offer_end_date: params.offerEndDate ?? null,
        is_active: true,
        last_updated: now,
        updated_by: params.updatedBy,
      };
      this.productStorePrices.push(psp);
    } else {
      psp.regular_price = params.regularPrice;
      if (params.offerPrice !== undefined) psp.offer_price = params.offerPrice;
      if (params.wholesalePrice !== undefined) psp.wholesale_price = params.wholesalePrice;
      if (params.onlinePrice !== undefined) psp.online_price = params.onlinePrice;
      if (params.offerStartDate !== undefined) psp.offer_start_date = params.offerStartDate;
      if (params.offerEndDate !== undefined) psp.offer_end_date = params.offerEndDate;
      psp.last_updated = now;
      psp.updated_by = params.updatedBy;
    }

    // Also sync storeProducts retail_price
    if (params.storeId !== 'website') {
      const sp = this.storeProducts.find(
        (item) => item.product_id === params.productId && item.store_id === params.storeId
      );
      if (sp) {
        sp.retail_price = params.regularPrice;
        sp.updated_at = now;
      }
    }

    const effectiveSelling = params.offerPrice ?? params.regularPrice;
    const margin = Math.round(((effectiveSelling - product.cost_price) / effectiveSelling) * 1000) / 10;
    const oldEffective = oldOffer ?? oldRegular;
    const oldMargin = Math.round(((oldEffective - product.cost_price) / oldEffective) * 1000) / 10;

    // NEVER overwrite price history - always prepend an immutable record
    this.priceHistory.unshift({
      id: `ph-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      product_id: product.id,
      product_name: product.name,
      sku: product.sku,
      store_id: params.storeId,
      store_name: storeName,
      price_type: params.offerPrice ? 'offer' : 'regular',
      old_price: oldEffective,
      new_price: effectiveSelling,
      cost_price: product.cost_price,
      old_margin_percent: oldMargin,
      new_margin_percent: margin,
      margin_percent: margin,
      reason: params.reason,
      effective_date: params.offerStartDate || now,
      offer_end_date: params.offerEndDate || null,
      is_below_cost: isBelowCost,
      changed_by: params.updatedBy,
      created_at: now,
    });

    this.addAuditEntry({
      entity_type: 'price',
      entity_id: product.id,
      action: 'price_override',
      description: `Updated price for ${product.name} at ${storeName} to Regular: ¥${params.regularPrice.toLocaleString()}${
        params.offerPrice ? ` (Offer: ¥${params.offerPrice.toLocaleString()})` : ''
      }${isBelowCost ? ' [WARNING: Below Cost]' : ''}`,
      user_name: params.updatedBy,
      user_role: 'Pricing Manager',
    });

    this.persist();
    return psp;
  }

  async bulkUpdatePrices(params: {
    productIds: string[];
    storeIds: (StoreId | 'website')[];
    adjustmentType: 'amount' | 'percentage' | 'fixed_regular' | 'fixed_offer';
    adjustmentValue: number;
    priceTarget: 'regular' | 'offer' | 'wholesale' | 'online';
    scheduleDate?: string | null;
    offerStartDate?: string | null;
    offerEndDate?: string | null;
    reason: string;
    updatedBy: string;
  }): Promise<{ updatedCount: number; warningsCount: number }> {
    if (!params.reason || !params.reason.trim()) {
      throw new Error('A price change reason is required for bulk price updates.');
    }

    let updatedCount = 0;
    let warningsCount = 0;
    const now = new Date().toISOString();

    for (const prodId of params.productIds) {
      const product = this.products.find((p) => p.id === prodId);
      if (!product) continue;

      for (const stId of params.storeIds) {
        let psp = this.productStorePrices.find(
          (item) => item.product_id === prodId && item.store_id === stId
        );
        const storeObj = this.stores.find((s) => s.id === stId);
        const storeName = stId === 'website' ? 'My BIMI Online Store' : storeObj?.name || stId;

        const currentRegular = psp ? psp.regular_price : product.base_retail_price;
        const currentOffer = psp?.offer_price ?? null;
        let baseVal = currentRegular;

        if (params.priceTarget === 'offer' && currentOffer) {
          baseVal = currentOffer;
        } else if (params.priceTarget === 'wholesale' && psp?.wholesale_price) {
          baseVal = psp.wholesale_price;
        } else if (params.priceTarget === 'online' && psp?.online_price) {
          baseVal = psp.online_price;
        }

        let calculated = baseVal;
        if (params.adjustmentType === 'amount') {
          calculated = Math.max(1, Math.round(baseVal + params.adjustmentValue));
        } else if (params.adjustmentType === 'percentage') {
          calculated = Math.max(1, Math.round(baseVal * (1 + params.adjustmentValue / 100)));
        } else if (params.adjustmentType === 'fixed_regular' || params.adjustmentType === 'fixed_offer') {
          calculated = Math.max(1, Math.round(params.adjustmentValue));
        }

        const isBelowCost = calculated < product.cost_price;
        if (isBelowCost) warningsCount++;

        let newRegular = currentRegular;
        let newOffer = currentOffer;
        let newWholesale = psp?.wholesale_price ?? Math.round(currentRegular * 0.85);
        let newOnline = psp?.online_price ?? currentRegular;

        if (params.priceTarget === 'regular' || params.adjustmentType === 'fixed_regular') {
          newRegular = calculated;
        } else if (params.priceTarget === 'offer' || params.adjustmentType === 'fixed_offer') {
          newOffer = calculated;
        } else if (params.priceTarget === 'wholesale') {
          newWholesale = calculated;
        } else if (params.priceTarget === 'online') {
          newOnline = calculated;
        }

        if (!psp) {
          psp = {
            id: `psp-${stId}-${prodId}-${Date.now().toString(36)}`,
            product_id: prodId,
            store_id: stId,
            store_name: storeName,
            regular_price: newRegular,
            offer_price: newOffer,
            wholesale_price: newWholesale,
            online_price: newOnline,
            tax_rate: product.tax_rate,
            offer_start_date: params.offerStartDate || null,
            offer_end_date: params.offerEndDate || null,
            is_active: true,
            last_updated: now,
            updated_by: params.updatedBy,
          };
          this.productStorePrices.push(psp);
        } else {
          psp.regular_price = newRegular;
          psp.offer_price = newOffer;
          psp.wholesale_price = newWholesale;
          psp.online_price = newOnline;
          if (params.offerStartDate) psp.offer_start_date = params.offerStartDate;
          if (params.offerEndDate) psp.offer_end_date = params.offerEndDate;
          psp.last_updated = now;
          psp.updated_by = params.updatedBy;
        }

        // Sync storeProducts
        if (stId !== 'website') {
          const sp = this.storeProducts.find(
            (item) => item.product_id === prodId && item.store_id === stId
          );
          if (sp) {
            sp.retail_price = newRegular;
            sp.updated_at = now;
          }
        }

        const margin = Math.round(((calculated - product.cost_price) / calculated) * 1000) / 10;
        const oldMargin = Math.round(((baseVal - product.cost_price) / baseVal) * 1000) / 10;

        // Permanent price history log
        this.priceHistory.unshift({
          id: `ph-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          product_id: product.id,
          product_name: product.name,
          sku: product.sku,
          store_id: stId,
          store_name: storeName,
          price_type: 'bulk_adjustment',
          old_price: baseVal,
          new_price: calculated,
          cost_price: product.cost_price,
          old_margin_percent: oldMargin,
          new_margin_percent: margin,
          margin_percent: margin,
          reason: `${params.reason} [Bulk: ${params.adjustmentType} ${params.adjustmentValue > 0 ? '+' : ''}${params.adjustmentValue}]`,
          effective_date: params.scheduleDate || params.offerStartDate || now,
          offer_end_date: params.offerEndDate || null,
          is_below_cost: isBelowCost,
          changed_by: params.updatedBy,
          created_at: now,
        });

        updatedCount++;
      }
    }

    this.addAuditEntry({
      entity_type: 'price',
      entity_id: 'bulk',
      action: 'price_override',
      description: `Executed bulk price update across ${params.productIds.length} product(s) and ${params.storeIds.length} branch(es) (${updatedCount} pricing records updated). Reason: ${params.reason}`,
      user_name: params.updatedBy,
      user_role: 'Pricing Manager',
    });

    this.persist();
    return { updatedCount, warningsCount };
  }

  async getPriceHistory(productId?: string, storeId?: string): Promise<PriceHistoryRecord[]> {
    return this.priceHistory.filter((ph) => {
      const matchProd = !productId || ph.product_id === productId;
      const matchStore = !storeId || storeId === 'all' || ph.store_id === storeId || ph.store_id === 'all';
      return matchProd && matchStore;
    });
  }

  // Backward compatible wrapper
  async updateStorePrice(
    productId: string,
    storeId: StoreId | 'all',
    newPrice: number,
    reason: string,
    userName: string
  ): Promise<void> {
    if (storeId === 'all') {
      for (const st of this.stores) {
        await this.setProductStorePrice({
          productId,
          storeId: st.id,
          regularPrice: newPrice,
          reason,
          updatedBy: userName,
        });
      }
      await this.setProductStorePrice({
        productId,
        storeId: 'website',
        regularPrice: newPrice,
        reason,
        updatedBy: userName,
      });
    } else {
      await this.setProductStorePrice({
        productId,
        storeId,
        regularPrice: newPrice,
        reason,
        updatedBy: userName,
      });
    }
  }

  // --- INVENTORY ADJUSTMENT, TRANSFERS & MOVEMENTS ---
  async getStockMovements(params?: {
    productId?: string;
    storeId?: string;
    type?: string;
  }): Promise<StockMovement[]> {
    return this.stockMovements.filter((sm) => {
      const matchProd = !params?.productId || sm.product_id === params.productId;
      const matchStore = !params?.storeId || params.storeId === 'all' || sm.store_id === params.storeId;
      const matchType = !params?.type || params.type === 'all' || sm.type === params.type;
      return matchProd && matchStore && matchType;
    });
  }

  async adjustStock(params: {
    productId: string;
    storeId: StoreId;
    type: StockMovementType;
    quantity: number; // magnitude
    isPhysicalCountOverride?: boolean; // if true, quantity is target count
    reason: string;
    reference?: string;
    notes?: string;
    userName: string;
  }): Promise<{ previousStock: number; newStock: number; movement: StockMovement }> {
    const product = this.products.find((p) => p.id === params.productId);
    const store = this.stores.find((s) => s.id === params.storeId);
    let sp = this.storeProducts.find((s) => s.product_id === params.productId && s.store_id === params.storeId);

    if (!sp && product && store) {
      sp = {
        id: `sp-${store.code.toLowerCase()}-${product.id}`,
        product_id: params.productId,
        store_id: params.storeId,
        retail_price: product.base_retail_price,
        stock_quantity: 0,
        reserved_quantity: 0,
        shelf_location: 'Storage Bay',
        last_restocked_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.storeProducts.push(sp);
    }

    if (!sp || !product || !store) throw new Error('Inventory record or store entity not found');

    const previousStock = sp.stock_quantity;
    let newStock = previousStock;
    let quantityChange = 0;
    const absQty = Math.abs(params.quantity);

    if (params.isPhysicalCountOverride) {
      newStock = Math.max(0, params.quantity);
      quantityChange = newStock - previousStock;
    } else {
      // Determine direction based on movement type
      switch (params.type) {
        case 'Stock In':
        case 'Return':
        case 'Transfer In':
        case 'received':
          quantityChange = absQty;
          newStock = previousStock + absQty;
          break;
        case 'Stock Out':
        case 'Sale':
        case 'Damaged':
        case 'Waste':
        case 'Expired':
        case 'Transfer Out':
        case 'sale':
        case 'waste':
          quantityChange = -absQty;
          newStock = Math.max(0, previousStock - absQty);
          break;
        case 'Adjustment':
        case 'adjustment':
        default:
          quantityChange = params.quantity;
          newStock = Math.max(0, previousStock + params.quantity);
          break;
      }
    }

    sp.stock_quantity = newStock;
    sp.updated_at = new Date().toISOString();
    if (quantityChange > 0) {
      sp.last_restocked_at = new Date().toISOString();
    }

    const now = new Date().toISOString();
    const referenceDoc = params.reference || `ADJ-${Date.now().toString(36).toUpperCase()}`;
    const combinedNotes = params.notes
      ? `${params.reason}: ${params.notes}`
      : params.reason || `Stock ${params.type} adjustment`;

    const movement: StockMovement = {
      id: `sm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      product_id: product.id,
      product_name: product.name,
      sku: product.sku,
      store_id: store.id,
      store_name: store.name,
      type: params.type,
      quantity: Math.abs(quantityChange),
      quantity_change: quantityChange,
      previous_stock: previousStock,
      new_stock: newStock,
      balance_after: newStock,
      reference: referenceDoc,
      reference_doc: referenceDoc,
      notes: combinedNotes,
      performed_by: params.userName,
      created_at: now,
    };

    // Never allow stock to silently change without recording a stock movement
    this.stockMovements.unshift(movement);

    this.addAuditEntry({
      entity_type: 'inventory',
      entity_id: product.id,
      action: 'stock_adjust',
      description: `Stock adjusted for ${product.name} at ${store.name}: ${previousStock} → ${newStock} (${quantityChange >= 0 ? '+' : ''}${quantityChange} units) [${params.type}]. Reason: ${params.reason}`,
      user_name: params.userName,
      user_role: 'Inventory Specialist',
    });

    this.persist();
    return { previousStock, newStock, movement };
  }

  async transferStock(params: {
    productId: string;
    fromStoreId: StoreId;
    toStoreId: StoreId;
    quantity: number;
    reason: string;
    reference?: string;
    notes?: string;
    userName: string;
  }): Promise<{ fromNewStock: number; toNewStock: number }> {
    if (params.quantity <= 0) throw new Error('Transfer quantity must be greater than zero');
    if (params.fromStoreId === params.toStoreId) {
      throw new Error('Source and destination stores must be different');
    }

    const product = this.products.find((p) => p.id === params.productId);
    const fromStore = this.stores.find((s) => s.id === params.fromStoreId);
    const toStore = this.stores.find((s) => s.id === params.toStoreId);
    const fromSp = this.storeProducts.find((s) => s.product_id === params.productId && s.store_id === params.fromStoreId);
    let toSp = this.storeProducts.find((s) => s.product_id === params.productId && s.store_id === params.toStoreId);

    if (!product || !fromStore || !toStore || !fromSp) {
      throw new Error('Transfer entity records could not be resolved');
    }

    if (fromSp.stock_quantity < params.quantity) {
      throw new Error(
        `Insufficient stock at ${fromStore.name}. Available on hand: ${fromSp.stock_quantity} ${product.unit}, requested: ${params.quantity} ${product.unit}`
      );
    }

    if (!toSp) {
      toSp = {
        id: `sp-${toStore.code.toLowerCase()}-${product.id}`,
        product_id: product.id,
        store_id: params.toStoreId,
        retail_price: fromSp.retail_price,
        stock_quantity: 0,
        reserved_quantity: 0,
        shelf_location: 'Inbound Holding Bay',
        last_restocked_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.storeProducts.push(toSp);
    }

    const fromPrevious = fromSp.stock_quantity;
    const toPrevious = toSp.stock_quantity;

    fromSp.stock_quantity -= params.quantity;
    fromSp.updated_at = new Date().toISOString();

    toSp.stock_quantity += params.quantity;
    toSp.updated_at = new Date().toISOString();
    toSp.last_restocked_at = new Date().toISOString();

    const now = new Date().toISOString();
    const reference = params.reference || `TRF-${Date.now().toString(36).toUpperCase()}`;
    const transferNote = params.notes
      ? `${params.reason}: ${params.notes}`
      : params.reason || 'Store-to-store stock rebalance';

    // 1. Record Transfer Out at source store
    this.stockMovements.unshift({
      id: `sm-${Date.now()}-out`,
      product_id: product.id,
      product_name: product.name,
      sku: product.sku,
      store_id: fromStore.id,
      store_name: fromStore.name,
      type: 'Transfer Out',
      quantity: params.quantity,
      quantity_change: -params.quantity,
      previous_stock: fromPrevious,
      new_stock: fromSp.stock_quantity,
      balance_after: fromSp.stock_quantity,
      reference,
      reference_doc: reference,
      notes: `Transfer out to ${toStore.name} (${transferNote})`,
      performed_by: params.userName,
      created_at: now,
    });

    // 2. Record Transfer In at destination store
    this.stockMovements.unshift({
      id: `sm-${Date.now()}-in`,
      product_id: product.id,
      product_name: product.name,
      sku: product.sku,
      store_id: toStore.id,
      store_name: toStore.name,
      type: 'Transfer In',
      quantity: params.quantity,
      quantity_change: params.quantity,
      previous_stock: toPrevious,
      new_stock: toSp.stock_quantity,
      balance_after: toSp.stock_quantity,
      reference,
      reference_doc: reference,
      notes: `Transfer in from ${fromStore.name} (${transferNote})`,
      performed_by: params.userName,
      created_at: now,
    });

    this.addAuditEntry({
      entity_type: 'inventory',
      entity_id: product.id,
      action: 'stock_adjust',
      description: `Executed store transfer of ${params.quantity} units of ${product.name} from ${fromStore.name} (${fromPrevious} → ${fromSp.stock_quantity}) to ${toStore.name} (${toPrevious} → ${toSp.stock_quantity}). Reference: ${reference}`,
      user_name: params.userName,
      user_role: 'Operations',
    });

    this.persist();
    return { fromNewStock: fromSp.stock_quantity, toNewStock: toSp.stock_quantity };
  }

  async getInventoryMetrics(storeId?: string): Promise<{
    totalValuationCost: number;
    totalValuationRetail: number;
    totalUnits: number;
    lowStockCount: number;
    outOfStockCount: number;
    storeValuations: { store: Store; costValue: number; retailValue: number; units: number }[];
    topStockedProducts: { product: Product; totalStock: number; totalCostValue: number; totalRetailValue: number }[];
    recentMovements: StockMovement[];
  }> {
    const isSingleStore = storeId && storeId !== 'all';
    const relevantSp = this.storeProducts.filter((sp) => !isSingleStore || sp.store_id === storeId);

    let totalValuationCost = 0;
    let totalValuationRetail = 0;
    let totalUnits = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    this.products.forEach((p) => {
      const prodSp = relevantSp.filter((sp) => sp.product_id === p.id);
      const stock = prodSp.reduce((sum, sp) => sum + sp.stock_quantity, 0);

      totalUnits += stock;
      totalValuationCost += stock * p.cost_price;
      totalValuationRetail += stock * p.base_retail_price;

      if (stock === 0) {
        outOfStockCount++;
      } else if (stock <= p.min_stock_alert) {
        lowStockCount++;
      }
    });

    // Store breakdown
    const storeValuations = this.stores.map((st) => {
      let costValue = 0;
      let retailValue = 0;
      let units = 0;

      this.storeProducts
        .filter((sp) => sp.store_id === st.id)
        .forEach((sp) => {
          const prod = this.products.find((p) => p.id === sp.product_id);
          units += sp.stock_quantity;
          if (prod) {
            costValue += sp.stock_quantity * prod.cost_price;
            retailValue += sp.stock_quantity * prod.base_retail_price;
          }
        });

      return { store: st, costValue, retailValue, units };
    });

    // Top stocked products
    const topStockedProducts = this.products
      .map((p) => {
        const prodSp = relevantSp.filter((sp) => sp.product_id === p.id);
        const totalStock = prodSp.reduce((sum, sp) => sum + sp.stock_quantity, 0);
        return {
          product: p,
          totalStock,
          totalCostValue: totalStock * p.cost_price,
          totalRetailValue: totalStock * p.base_retail_price,
        };
      })
      .sort((a, b) => b.totalStock - a.totalStock)
      .slice(0, 5);

    const recentMovements = this.stockMovements
      .filter((sm) => !isSingleStore || sm.store_id === storeId)
      .slice(0, 10);

    return {
      totalValuationCost,
      totalValuationRetail,
      totalUnits,
      lowStockCount,
      outOfStockCount,
      storeValuations,
      topStockedProducts,
      recentMovements,
    };
  }

  // --- WEBSITE / POS SYNC ---
  async getSyncLogs(): Promise<WebsiteSyncEvent[]> {
    return [...this.syncLogs];
  }

  async getWebsiteSyncLogs(): Promise<WebsiteSyncLog[]> {
    return websiteSyncService.getLogs();
  }

  async getWebsiteSyncConfig(): Promise<any> {
    return websiteSyncService.getConfig();
  }

  async updateWebsiteSyncConfig(updates: any): Promise<any> {
    return websiteSyncService.updateConfig(updates);
  }

  async publishProductToWebsite(productId: string, user?: string): Promise<Product> {
    const prod = this.products.find((p) => p.id === productId);
    if (!prod) throw new Error('Product not found');

    const cat = this.categories.find((c) => c.id === prod.category_id);
    const storeProducts = this.storeProducts.filter((sp) => sp.product_id === productId);
    const totalStock = storeProducts.reduce((sum, sp) => sum + sp.stock_quantity, 0);
    const storePrice = this.productStorePrices.find((p) => p.product_id === productId && p.store_id === 'website');

    const result = await websiteSyncService.publishProduct(prod, {
      user: user || 'Store Staff',
      categoryName: cat?.name,
      currentStock: totalStock,
      offerPrice: storePrice?.offer_price,
    });

    const index = this.products.findIndex((p) => p.id === productId);
    if (index !== -1) {
      this.products[index] = result.product;
      this.persist();
    }

    this.addAuditEntry({
      entity_type: 'sync',
      entity_id: productId,
      action: 'sync_trigger',
      description: result.response.success
        ? `Published product ${prod.name} (${prod.sku}) to My BIMI Online Store`
        : `Publishing failed for ${prod.sku}: ${result.response.message}`,
      user_name: user || 'Store Staff',
      user_role: 'E-Commerce Ops',
    });

    return result.product;
  }

  async updateProductOnWebsite(productId: string, user?: string): Promise<Product> {
    const prod = this.products.find((p) => p.id === productId);
    if (!prod) throw new Error('Product not found');

    const cat = this.categories.find((c) => c.id === prod.category_id);
    const storeProducts = this.storeProducts.filter((sp) => sp.product_id === productId);
    const totalStock = storeProducts.reduce((sum, sp) => sum + sp.stock_quantity, 0);
    const storePrice = this.productStorePrices.find((p) => p.product_id === productId && p.store_id === 'website');

    const result = await websiteSyncService.updateWebsite(prod, {
      user: user || 'Store Staff',
      categoryName: cat?.name,
      currentStock: totalStock,
      offerPrice: storePrice?.offer_price,
    });

    const index = this.products.findIndex((p) => p.id === productId);
    if (index !== -1) {
      this.products[index] = result.product;
      this.persist();
    }

    this.addAuditEntry({
      entity_type: 'sync',
      entity_id: productId,
      action: 'sync_trigger',
      description: result.response.success
        ? `Updated website catalog payload for ${prod.name} (${prod.sku})`
        : `Website update failed for ${prod.sku}: ${result.response.message}`,
      user_name: user || 'Store Staff',
      user_role: 'E-Commerce Ops',
    });

    return result.product;
  }

  async unpublishProductFromWebsite(productId: string, user?: string): Promise<Product> {
    const prod = this.products.find((p) => p.id === productId);
    if (!prod) throw new Error('Product not found');

    const result = await websiteSyncService.unpublishProduct(prod, user);

    const index = this.products.findIndex((p) => p.id === productId);
    if (index !== -1) {
      this.products[index] = result.product;
      this.persist();
    }

    this.addAuditEntry({
      entity_type: 'sync',
      entity_id: productId,
      action: 'sync_trigger',
      description: `Unpublished product ${prod.name} (${prod.sku}) from live website`,
      user_name: user || 'Store Staff',
      user_role: 'E-Commerce Ops',
    });

    return result.product;
  }

  async retryProductWebsiteSync(productId: string, user?: string): Promise<Product> {
    const prod = this.products.find((p) => p.id === productId);
    if (!prod) throw new Error('Product not found');

    const cat = this.categories.find((c) => c.id === prod.category_id);
    const storeProducts = this.storeProducts.filter((sp) => sp.product_id === productId);
    const totalStock = storeProducts.reduce((sum, sp) => sum + sp.stock_quantity, 0);
    const storePrice = this.productStorePrices.find((p) => p.product_id === productId && p.store_id === 'website');

    const result = await websiteSyncService.retrySync(prod, {
      user: user || 'Store Staff',
      categoryName: cat?.name,
      currentStock: totalStock,
      offerPrice: storePrice?.offer_price,
    });

    const index = this.products.findIndex((p) => p.id === productId);
    if (index !== -1) {
      this.products[index] = result.product;
      this.persist();
    }

    this.addAuditEntry({
      entity_type: 'sync',
      entity_id: productId,
      action: 'sync_trigger',
      description: result.response.success
        ? `Retried sync successfully resolved for ${prod.sku}`
        : `Retried sync failed for ${prod.sku}: ${result.response.message}`,
      user_name: user || 'Store Staff',
      user_role: 'E-Commerce Ops',
    });

    return result.product;
  }

  async syncSelectedProducts(productIds: string[], user?: string): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;
    for (const id of productIds) {
      try {
        const prod = this.products.find((p) => p.id === id);
        if (!prod) continue;
        if (prod.publishing_state === 'Published' || prod.publishing_state === 'Ready to Publish') {
          await this.updateProductOnWebsite(id, user);
        } else {
          await this.publishProductToWebsite(id, user);
        }
        success++;
      } catch {
        failed++;
      }
    }
    return { success, failed };
  }

  async syncAllChangedProducts(user?: string): Promise<{ success: number; failed: number }> {
    const changed = this.products.filter(
      (p) => p.publishing_state === 'Ready to Publish' || p.has_pending_changes
    );
    let success = 0;
    let failed = 0;
    for (const prod of changed) {
      try {
        await this.updateProductOnWebsite(prod.id, user);
        success++;
      } catch {
        failed++;
      }
    }
    return { success, failed };
  }

  async triggerSync(productId?: string): Promise<{ successCount: number; failureCount: number }> {
    if (productId) {
      try {
        const prod = this.products.find((p) => p.id === productId);
        if (prod?.publishing_state === 'Sync Error') {
          await this.retryProductWebsiteSync(productId);
        } else {
          await this.updateProductOnWebsite(productId);
        }
        return { successCount: 1, failureCount: 0 };
      } catch {
        return { successCount: 0, failureCount: 1 };
      }
    }

    const now = new Date().toISOString();
    let successCount = 0;
    let failureCount = 0;

    for (const p of this.products) {
      try {
        if (p.publishing_state === 'Sync Error') {
          await this.retryProductWebsiteSync(p.id);
        } else if (p.publishing_state === 'Unpublished') {
          continue;
        } else {
          await this.updateProductOnWebsite(p.id);
        }
        successCount++;
      } catch {
        failureCount++;
      }
    }

    return { successCount, failureCount };
  }

  // --- STATS & AGGREGATIONS ---
  async getDashboardMetrics(selectedStoreId?: StoreId) {
    const products = this.products;
    const storeProducts = selectedStoreId
      ? this.storeProducts.filter((sp) => sp.store_id === selectedStoreId)
      : this.storeProducts;

    const totalProducts = products.length;

    // Total stock in units
    const totalStock = storeProducts.reduce((sum, sp) => sum + sp.stock_quantity, 0);

    // Total inventory valuation at cost
    let inventoryValue = 0;
    storeProducts.forEach((sp) => {
      const p = products.find((item) => item.id === sp.product_id);
      if (p) {
        inventoryValue += sp.stock_quantity * p.cost_price;
      }
    });

    // Low stock and out of stock items
    let lowStockCount = 0;
    let outOfStockCount = 0;

    // Check store-specific or aggregated stock
    products.forEach((p) => {
      const relevantSps = storeProducts.filter((sp) => sp.product_id === p.id);
      const stock = relevantSps.reduce((acc, curr) => acc + curr.stock_quantity, 0);
      if (stock === 0) {
        outOfStockCount++;
      } else if (stock <= p.min_stock_alert) {
        lowStockCount++;
      }
    });

    const syncErrorsCount = products.filter((p) => p.website_sync_status === 'error').length;

    // Filter stock movements by store if specified
    const filteredMovements = selectedStoreId
      ? this.stockMovements.filter((m) => m.store_id === selectedStoreId)
      : this.stockMovements;

    // Filter price changes by store if specified
    const filteredPriceHistory = selectedStoreId
      ? this.priceHistory.filter((ph) => ph.store_id === selectedStoreId || ph.store_id === 'all')
      : this.priceHistory;

    return {
      totalProducts,
      totalStock,
      inventoryValue,
      lowStockCount,
      outOfStockCount,
      syncErrorsCount,
      recentProducts: products.slice(0, 5),
      recentMovements: filteredMovements.slice(0, 6),
      recentPriceChanges: filteredPriceHistory.slice(0, 5),
    };
  }

  // --- USERS & AUDIT ---
  async getUsers(): Promise<UserProfile[]> {
    return [...this.users];
  }

  async getAuditLogs(): Promise<AuditLogEntry[]> {
    return [...this.auditLogs];
  }

  private addAuditEntry(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) {
    const log: AuditLogEntry = {
      ...entry,
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    this.auditLogs.unshift(log);
    if (this.auditLogs.length > 200) {
      this.auditLogs.pop();
    }
  }

  async getPurchaseOrders(): Promise<PurchaseOrder[]> {
    return [...this.purchaseOrders];
  }

  async addPurchaseOrder(po: Omit<PurchaseOrder, 'id'>): Promise<PurchaseOrder> {
    const newPo: PurchaseOrder = {
      ...po,
      id: `po-${Date.now().toString(36)}`,
    };
    this.purchaseOrders.unshift(newPo);
    this.persist();
    return newPo;
  }

  // --- PRICE TAG TEMPLATES ---
  async getPriceTagTemplates(): Promise<PriceTagTemplate[]> {
    return [...this.priceTagTemplates];
  }

  async getPriceTagTemplateById(id: string): Promise<PriceTagTemplate | undefined> {
    return this.priceTagTemplates.find((t) => t.id === id);
  }

  async savePriceTagTemplate(
    template: Omit<PriceTagTemplate, 'id' | 'created_at' | 'updated_at'> & { id?: string }
  ): Promise<PriceTagTemplate> {
    const now = new Date().toISOString();
    const existingIndex = template.id
      ? this.priceTagTemplates.findIndex((t) => t.id === template.id)
      : -1;

    if (existingIndex >= 0) {
      const updated: PriceTagTemplate = {
        ...this.priceTagTemplates[existingIndex],
        ...template,
        id: this.priceTagTemplates[existingIndex].id,
        updated_at: now,
      };
      this.priceTagTemplates[existingIndex] = updated;
      this.addAuditEntry({
        entity_type: 'tag_template' as any,
        entity_id: updated.id,
        action: 'update',
        description: `Updated price tag template: ${updated.name}`,
        user_name: 'Current User',
        user_role: 'Store Staff',
      });
      this.persist();
      return updated;
    } else {
      const id = template.id || `tmpl-${Date.now().toString(36)}`;
      const created: PriceTagTemplate = {
        ...template,
        id,
        created_at: now,
        updated_at: now,
      };
      this.priceTagTemplates.push(created);
      this.addAuditEntry({
        entity_type: 'tag_template' as any,
        entity_id: created.id,
        action: 'create',
        description: `Created price tag template: ${created.name}`,
        user_name: 'Current User',
        user_role: 'Store Staff',
      });
      this.persist();
      return created;
    }
  }

  async deletePriceTagTemplate(id: string): Promise<void> {
    const template = this.priceTagTemplates.find((t) => t.id === id);
    if (!template) return;
    this.priceTagTemplates = this.priceTagTemplates.filter((t) => t.id !== id);
    this.addAuditEntry({
      entity_type: 'tag_template' as any,
      entity_id: id,
      action: 'delete',
      description: `Deleted price tag template: ${template.name}`,
      user_name: 'Current User',
      user_role: 'Store Staff',
    });
    this.persist();
  }

  // --- PRINT BATCHES ---
  async getPrintBatches(): Promise<PrintBatchRecord[]> {
    return [...this.printBatches];
  }

  async recordPrintBatch(batch: Omit<PrintBatchRecord, 'id' | 'printed_at'>): Promise<PrintBatchRecord> {
    const id = `batch-${Date.now().toString(36)}`;
    const newBatch: PrintBatchRecord = {
      ...batch,
      id,
      printed_at: new Date().toISOString(),
    };
    this.printBatches.unshift(newBatch);
    if (this.printBatches.length > 50) {
      this.printBatches.pop();
    }
    this.addAuditEntry({
      entity_type: 'product',
      entity_id: newBatch.batch_number,
      action: 'create',
      description: `Generated shelf price tags: ${newBatch.batch_number} (${newBatch.total_cards} cards for ${newBatch.store_name})`,
      user_name: newBatch.printed_by,
      user_role: 'Store Staff',
    });
    this.persist();
    return newBatch;
  }

  // --- SUPABASE LIVE SYNC & RECOVERY ---
  async syncFromSupabase(): Promise<{ success: boolean; message: string; count?: number }> {
    if (!isSupabaseConfigured()) {
      return { success: false, message: 'Supabase credentials are not configured in environment variables.' };
    }
    try {
      // Attempt fetching stores
      const { data: storesData, error: storesError } = await supabase.from('stores').select('*');
      if (!storesError && storesData && storesData.length > 0) {
        this.stores = storesData.map((s: any) => ({
          id: s.id,
          name: s.name,
          code: s.code,
          address: s.address,
          phone: s.phone,
          manager_name: s.manager_name || '',
          is_active: s.is_active ?? true,
          opened_at: s.opened_at || new Date().toISOString(),
          created_at: s.created_at || new Date().toISOString(),
          updated_at: s.updated_at || new Date().toISOString(),
        }));
      }

      // Attempt fetching products
      const { data: prodData, error: prodError } = await supabase.from('products').select('*');
      if (!prodError && prodData && prodData.length > 0) {
        this.products = prodData.map((p: any) => ({
          ...p,
          unit: p.unit || 'pcs',
          status: p.status || 'Active',
          halal_status: p.halal_status || 'certified',
          website_sync_status: p.website_sync_status || 'synced',
        }));
      }

      this.persist();
      return {
        success: true,
        message: `Synced with Supabase database (${this.products.length} products, ${this.stores.length} stores).`,
        count: this.products.length,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Failed to query Supabase tables. Using local cache fallback.',
      };
    }
  }

  async resetToFactoryDefaults(): Promise<void> {
    try {
      Object.keys(localStorage).forEach((k) => {
        if (k.startsWith(STORAGE_PREFIX)) {
          localStorage.removeItem(k);
        }
      });
    } catch {
      // ignore
    }
    this.stores = [...INITIAL_STORES];
    this.categories = [...INITIAL_CATEGORIES];
    this.brands = [...INITIAL_BRANDS];
    this.suppliers = [...INITIAL_SUPPLIERS];
    this.products = [...INITIAL_PRODUCTS];
    this.storeProducts = [...INITIAL_STORE_PRODUCTS];
    this.productStorePrices = [...INITIAL_PRODUCT_STORE_PRICES];
    this.priceHistory = [...INITIAL_PRICE_HISTORY];
    this.stockMovements = [...INITIAL_STOCK_MOVEMENTS];
    this.purchaseOrders = [...INITIAL_PURCHASE_ORDERS];
    this.syncLogs = [...INITIAL_SYNC_LOGS];
    this.users = [...INITIAL_USERS];
    this.auditLogs = [...INITIAL_AUDIT_LOGS];
    this.productSuppliers = [...INITIAL_PRODUCT_SUPPLIERS];
    this.supplierPriceHistory = [...INITIAL_SUPPLIER_PRICE_HISTORY];
    this.priceTagTemplates = [...INITIAL_PRICE_TAG_TEMPLATES];
    this.printBatches = [...INITIAL_PRINT_BATCHES];
    this.persist();
  }
}

export const dataService = new ProductStudioDataService();
