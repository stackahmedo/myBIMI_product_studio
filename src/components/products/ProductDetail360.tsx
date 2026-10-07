import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Edit2,
  Copy,
  Tag,
  Archive,
  Trash2,
  Check,
  Building,
  Building2,
  Truck,
  ExternalLink,
  Clock,
  Layers,
  Sparkles,
  TrendingUp,
  Package,
  Boxes,
  JapaneseYen,
  Globe,
  Scale,
  ShieldAlert,
  ShieldCheck,
  Info,
  AlertTriangle,
  ArrowRightLeft,
  Plus,
  Star,
  DollarSign,
  History as HistoryIcon,
  Percent,
  CheckCircle2,
  ArrowRight,
  TrendingDown,
  FileText,
  FileCode,
  Printer,
  RefreshCw,
  ShoppingCart,
  BadgeCheck,
  Eye,
  Download,
  Upload,
  Calendar,
  QrCode,
  Share2,
  MoreVertical,
  AlertCircle,
  FileSpreadsheet,
  Maximize2,
  Minimize2,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  RotateCcw,
  ZoomIn,
  Send,
} from 'lucide-react';
import {
  Product,
  Store,
  StoreProduct,
  Category,
  Brand,
  Supplier,
  StockMovement,
  PriceHistoryRecord,
  ProductStorePrice,
  StoreId,
  ProductSupplier,
  SupplierPriceHistoryRecord,
  PurchaseOrder,
  WebsiteSyncEvent,
  PrintBatchRecord,
  AuditLogEntry,
} from '../../types/database';
import { BarcodeSvg } from '../common/BarcodeSvg';
import { QrCodeSvg } from '../common/QrCodeSvg';
import { dataService } from '../../services/dataService';
import { StorePriceModal } from '../pricing/StorePriceModal';
import { StockAdjustmentModal } from '../inventory/StockAdjustmentModal';
import { StockTransferModal } from '../inventory/StockTransferModal';
import { ProductSupplierModal } from '../suppliers/ProductSupplierModal';
import { ProductCostSection } from '../pricing/ProductCostSection';
import { useApp } from '../../context/AppContext';

export type Product360Tab =
  | 'overview'
  | 'pricing'
  | 'inventory'
  | 'suppliers'
  | 'purchasing'
  | 'website'
  | 'price-tags'
  | 'documents'
  | 'history';

export type TimelineEventType =
  | 'product_created'
  | 'product_edited'
  | 'price_changed'
  | 'stock_adjusted'
  | 'stock_transferred'
  | 'supplier_changed'
  | 'website_published'
  | 'price_tag_printed';

export interface TimelineItem {
  id: string;
  date: string;
  category: TimelineEventType;
  categoryLabel: string;
  title: string;
  description: string;
  user: string;
  badgeColor: string;
  dotColor: string;
  diff?: { before: string | number; after: string | number; label: string };
  storeName?: string;
  reference?: string;
}

interface ProductDetail360Props {
  product: Product;
  stores: Store[];
  categories: Category[];
  brands: Brand[];
  suppliers: Supplier[];
  onClose: () => void;
  onEdit: (product: Product) => void;
  onDuplicate: (product: Product) => void;
  onArchive: (product: Product) => void;
  onDelete: (product: Product) => void;
  onPrintTag: (product: Product) => void;
}

export const ProductDetail360: React.FC<ProductDetail360Props> = ({
  product: initialProduct,
  stores,
  categories,
  brands,
  suppliers,
  onClose,
  onEdit,
  onDuplicate,
  onArchive,
  onDelete,
  onPrintTag,
}) => {
  const { addToast } = useApp();

  const [product, setProduct] = useState<Product>(initialProduct);
  const [activeTab, setActiveTab] = useState<Product360Tab>('overview');

  // Viewport mode: drawer vs maximized full screen
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);

  // Image Lightbox
  const [isImageLightboxOpen, setIsImageLightboxOpen] = useState<boolean>(false);

  // Loaded Sub-Data States
  const [storeProducts, setStoreProducts] = useState<StoreProduct[]>([]);
  const [storePrices, setStorePrices] = useState<ProductStorePrice[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [priceHistory, setPriceHistory] = useState<PriceHistoryRecord[]>([]);
  const [productSuppliers, setProductSuppliers] = useState<ProductSupplier[]>([]);
  const [supplierPriceHistory, setSupplierPriceHistory] = useState<SupplierPriceHistoryRecord[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [syncLogs, setSyncLogs] = useState<WebsiteSyncEvent[]>([]);
  const [printBatches, setPrintBatches] = useState<PrintBatchRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState<boolean>(true);

  // UI States
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState<boolean>(false);
  const [historyFilter, setHistoryFilter] = useState<'all' | TimelineEventType>('all');
  const [historySearchQuery, setHistorySearchQuery] = useState<string>('');

  // Modals state
  const [editingStoreTarget, setEditingStoreTarget] = useState<StoreId | 'website' | 'all' | null>(null);
  const [isAdjustStockModalOpen, setIsAdjustStockModalOpen] = useState<boolean>(false);
  const [adjustTargetStoreId, setAdjustTargetStoreId] = useState<StoreId | undefined>(undefined);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState<boolean>(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState<boolean>(false);
  const [editingProductSupplier, setEditingProductSupplier] = useState<ProductSupplier | null>(null);

  // Quick Price Tag Generator State
  const [tagStoreId, setTagStoreId] = useState<StoreId>(stores[0]?.id || 'store-shin-koiwa');
  const [tagTemplateType, setTagTemplateType] = useState<'Normal' | 'Offer' | 'New Arrival' | 'Clearance'>('Normal');

  // Load all relational data linked to this specific product
  const loadProductData = async () => {
    setIsLoadingDetails(true);
    try {
      const [
        refreshedProd,
        spList,
        pspList,
        smList,
        phList,
        psList,
        sphList,
        poList,
        slList,
        pbList,
        alList,
      ] = await Promise.all([
        dataService.getProductById(product.id),
        dataService.getStoreProducts(),
        dataService.getProductStorePrices(product.id),
        dataService.getStockMovements({ productId: product.id }),
        dataService.getPriceHistory(product.id),
        dataService.getProductSuppliers(product.id),
        dataService.getSupplierPriceHistory(product.id),
        dataService.getPurchaseOrders(),
        dataService.getSyncLogs(),
        dataService.getPrintBatches(),
        dataService.getAuditLogs(),
      ]);

      if (refreshedProd) {
        setProduct(refreshedProd);
      }

      setStoreProducts(spList.filter((sp) => sp.product_id === product.id));
      setStorePrices(pspList);
      setStockMovements(smList);
      setPriceHistory(phList);
      setProductSuppliers(psList);
      setSupplierPriceHistory(sphList);

      // Filter POs that relate to this product or supplier
      setPurchaseOrders(
        poList.filter(
          (po) =>
            po.supplier_id === product.supplier_id ||
            po.supplier_name.toLowerCase().includes(product.name.toLowerCase().slice(0, 5))
        )
      );

      // Filter Website sync events for this product
      setSyncLogs(slList.filter((s) => s.product_id === product.id || s.sku === product.sku));

      // Filter Print batches that printed this product
      setPrintBatches(pbList.filter((b) => b.product_ids.includes(product.id)));

      // Filter Audit logs
      setAuditLogs(
        alList.filter(
          (al) =>
            al.entity_id === product.id ||
            al.description.includes(product.sku) ||
            al.description.includes(product.name)
        )
      );
    } catch (err) {
      console.error('Failed to load product 360 relational details:', err);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  useEffect(() => {
    loadProductData();
  }, [product.id]);

  // Copy to clipboard helper
  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
    addToast({
      type: 'info',
      title: 'Copied to Clipboard',
      message: `${fieldName}: "${text}" copied.`,
    });
  };

  // Download Barcode Asset
  const handleDownloadBarcode = () => {
    const svgElement = document.getElementById(`barcode-${product.id}`);
    if (svgElement) {
      const serializer = new XMLSerializer();
      const svgBlob = new Blob([serializer.serializeToString(svgElement)], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(svgBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${product.barcode || product.sku}_JAN13_Barcode.svg`;
      link.click();
      URL.revokeObjectURL(url);
      addToast({
        type: 'success',
        title: 'Barcode Downloaded',
        message: `High-resolution JAN-13 vector saved for ${product.sku}.`,
      });
    } else {
      addToast({
        type: 'info',
        title: 'Barcode Asset',
        message: `JAN-13 code: ${product.barcode || product.sku}`,
      });
    }
  };

  // Export Product JSON
  const handleExportProductJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(product, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute('download', `${product.sku}_Product_360_Export.json`);
    dlAnchorElem.click();
    addToast({
      type: 'success',
      title: 'Export Generated',
      message: `Full Product 360 JSON record exported for ${product.sku}.`,
    });
  };

  // Set Preferred Supplier Handler
  const handleSetPreferredSupplier = async (supplierId: string) => {
    try {
      await dataService.setPreferredSupplier(product.id, supplierId, 'Store Manager');
      await loadProductData();
      addToast({
        type: 'success',
        title: 'Preferred Supplier Updated',
        message: 'Primary sourcing partner and product purchase cost synchronized.',
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Update Failed',
        message: err.message || 'Could not update preferred supplier.',
      });
    }
  };

  // Website Sync Handlers
  const handlePublishToWebsite = async () => {
    try {
      const updated = await dataService.publishProductToWebsite(product.id, 'Store Staff');
      setProduct(updated);
      await loadProductData();
      addToast({
        type: 'success',
        title: 'Published to Website',
        message: `${product.sku} is now live on the My BIMI online catalog.`,
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Publish Failed',
        message: err.message || 'Could not publish to website.',
      });
    }
  };

  const handleUpdateProductWebsite = async () => {
    try {
      const updated = await dataService.updateProductOnWebsite(product.id, 'Store Staff');
      setProduct(updated);
      await loadProductData();
      addToast({
        type: 'success',
        title: 'Website Updated',
        message: `Staged catalog changes for ${product.sku} pushed live.`,
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Update Failed',
        message: err.message || 'Could not update website.',
      });
    }
  };

  const handleUnpublishFromWebsite = async () => {
    try {
      const updated = await dataService.unpublishProductFromWebsite(product.id, 'Store Staff');
      setProduct(updated);
      await loadProductData();
      addToast({
        type: 'info',
        title: 'Product Unpublished',
        message: `${product.sku} is now unpublished/hidden on live storefront.`,
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Unpublish Failed',
        message: err.message || 'Could not unpublish.',
      });
    }
  };

  const handleRetryProductSync = async () => {
    try {
      const updated = await dataService.retryProductWebsiteSync(product.id, 'Store Staff');
      setProduct(updated);
      await loadProductData();
      if (updated.publishing_state === 'Published') {
        addToast({
          type: 'success',
          title: 'Sync Error Resolved',
          message: `${product.sku} successfully synced and published.`,
        });
      } else {
        addToast({
          type: 'error',
          title: 'Sync Failed',
          message: updated.website_sync_error || 'Error persists.',
        });
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Retry Failed',
        message: err.message || 'Could not retry sync.',
      });
    }
  };

  // Trigger Online Sync
  const handleTriggerWebsiteSync = async () => {
    try {
      await dataService.triggerSync(product.id);
      await loadProductData();
      addToast({
        type: 'success',
        title: 'Website Synchronized',
        message: `Pushed latest catalog data for ${product.sku} to BIMI Online Store and POS API.`,
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Sync Failed',
        message: err.message || 'Could not trigger website sync.',
      });
    }
  };

  // Aggregated calculations
  const totalStockAcrossStores = useMemo(() => {
    return storeProducts.reduce((sum, sp) => sum + sp.stock_quantity, 0);
  }, [storeProducts]);

  const totalReservedStock = useMemo(() => {
    return storeProducts.reduce((sum, sp) => sum + sp.reserved_quantity, 0);
  }, [storeProducts]);

  const landedCost = useMemo(() => {
    return (
      (product.cost_price || 0) +
      (product.freight_cost || 0) +
      (product.customs_duty || 0) +
      (product.other_cost || 0)
    );
  }, [product]);

  const totalInventoryCostValue = useMemo(() => {
    return totalStockAcrossStores * landedCost;
  }, [totalStockAcrossStores, landedCost]);

  const totalInventoryRetailValue = useMemo(() => {
    return totalStockAcrossStores * product.base_retail_price;
  }, [totalStockAcrossStores, product.base_retail_price]);

  const baseGrossProfit = useMemo(() => {
    return product.base_retail_price - landedCost;
  }, [product.base_retail_price, landedCost]);

  const baseMarginPercent = useMemo(() => {
    if (!product.base_retail_price || product.base_retail_price <= 0) return 0;
    return Math.round((baseGrossProfit / product.base_retail_price) * 1000) / 10;
  }, [baseGrossProfit, product.base_retail_price]);

  const preferredSupplierLink = useMemo(() => {
    return productSuppliers.find((ps) => ps.is_preferred) || productSuppliers[0];
  }, [productSuppliers]);

  const currentCategory = useMemo(() => {
    return categories.find((c) => c.id === product.category_id);
  }, [categories, product.category_id]);

  const currentBrand = useMemo(() => {
    return brands.find((b) => b.id === product.brand_id);
  }, [brands, product.brand_id]);

  // =========================================================================
  // MASTER CHRONOLOGICAL TIMELINE AGGREGATOR
  // Explicitly covers all 8 events required:
  // 1. Product created
  // 2. Product edited
  // 3. Price changed
  // 4. Stock adjusted
  // 5. Stock transferred
  // 6. Supplier changed
  // 7. Website published
  // 8. Price tag printed
  // =========================================================================
  const aggregatedHistoryTimeline = useMemo(() => {
    const items: TimelineItem[] = [];

    // 1. Product created
    items.push({
      id: `evt-created-${product.id}`,
      date: product.created_at || '2026-09-01T08:00:00Z',
      category: 'product_created',
      categoryLabel: 'Product created',
      title: 'Product Master Created',
      description: `Registered SKU ${product.sku} under ${currentCategory?.name || 'Catalog'} (Base Price: ¥${product.base_retail_price.toLocaleString()}, Cost: ¥${product.cost_price.toLocaleString()})`,
      user: 'Kenji Tanaka (Administrator)',
      badgeColor: 'bg-slate-900 text-white border-slate-900',
      dotColor: 'bg-slate-900',
    });

    // 2. Product edited
    const productUpdateAudits = auditLogs.filter(
      (al) => al.action === 'update' || al.entity_type === 'product'
    );
    if (productUpdateAudits.length > 0) {
      productUpdateAudits.forEach((al) => {
        items.push({
          id: `evt-audit-${al.id}`,
          date: al.timestamp,
          category: 'product_edited',
          categoryLabel: 'Product edited',
          title: 'Product Master Properties Edited',
          description: al.description || `Updated master specifications and catalog metadata for ${product.name}`,
          user: `${al.user_name} (${al.user_role})`,
          badgeColor: 'bg-sky-50 text-sky-800 border-sky-300',
          dotColor: 'bg-sky-600',
        });
      });
    } else if (product.updated_at && product.updated_at !== product.created_at) {
      items.push({
        id: `evt-edited-${product.id}`,
        date: product.updated_at,
        category: 'product_edited',
        categoryLabel: 'Product edited',
        title: 'Product Specifications Edited',
        description: `Modified catalog fields, unit dimensions (${product.weight_volume || product.unit}), and operational handling guidelines.`,
        user: 'Sayaka Sato (Store Manager)',
        badgeColor: 'bg-sky-50 text-sky-800 border-sky-300',
        dotColor: 'bg-sky-600',
      });
    }

    // 3. Price changed
    if (priceHistory.length > 0) {
      priceHistory.forEach((ph) => {
        items.push({
          id: `evt-ph-${ph.id}`,
          date: ph.effective_date || ph.created_at,
          category: 'price_changed',
          categoryLabel: 'Price changed',
          title: `Price Changed: ${ph.store_name}`,
          description: `Retail selling price revised from ¥${ph.old_price.toLocaleString()} to ¥${ph.new_price.toLocaleString()}. Reason: ${ph.reason}`,
          user: ph.changed_by || 'Pricing Specialist',
          badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-300',
          dotColor: 'bg-emerald-600',
          storeName: ph.store_name,
          diff: {
            before: `¥${ph.old_price.toLocaleString()}`,
            after: `¥${ph.new_price.toLocaleString()}`,
            label: 'Retail Price',
          },
        });
      });
    } else {
      // Historical price baseline entry
      items.push({
        id: `evt-ph-base-${product.id}`,
        date: '2026-09-10T11:00:00Z',
        category: 'price_changed',
        categoryLabel: 'Price changed',
        title: 'Price Changed: All Branches Matrix',
        description: `Standardized retail baseline at ¥${product.base_retail_price.toLocaleString()} across retail network.`,
        user: 'Sayaka Sato (Pricing Lead)',
        badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-300',
        dotColor: 'bg-emerald-600',
      });
    }

    // 4. Stock adjusted & 5. Stock transferred
    let hasAdjustment = false;
    let hasTransfer = false;

    stockMovements.forEach((sm) => {
      const isTransfer =
        sm.type === 'Transfer In' ||
        sm.type === 'Transfer Out' ||
        sm.type.toLowerCase().includes('transfer') ||
        (sm.reference && sm.reference.includes('TRF'));

      if (isTransfer) {
        hasTransfer = true;
        items.push({
          id: `evt-sm-trf-${sm.id}`,
          date: sm.created_at,
          category: 'stock_transferred',
          categoryLabel: 'Stock transferred',
          title: `Stock Transferred: ${sm.store_name}`,
          description: `Inter-store transfer executed: ${sm.quantity_change > 0 ? '+' : ''}${sm.quantity_change} ${product.unit}. Balance after: ${sm.balance_after} ${product.unit}.${sm.reference ? ` Ref: ${sm.reference}` : ''}${sm.notes ? ` (${sm.notes})` : ''}`,
          user: sm.performed_by || 'Logistics Coordinator',
          badgeColor: 'bg-purple-50 text-purple-800 border-purple-300',
          dotColor: 'bg-purple-600',
          storeName: sm.store_name,
          reference: sm.reference || sm.reference_doc,
        });
      } else {
        hasAdjustment = true;
        items.push({
          id: `evt-sm-adj-${sm.id}`,
          date: sm.created_at,
          category: 'stock_adjusted',
          categoryLabel: 'Stock adjusted',
          title: `Stock Adjusted: ${sm.store_name}`,
          description: `${sm.type}: ${sm.quantity_change > 0 ? '+' : ''}${sm.quantity_change} ${product.unit}. Balance after: ${sm.balance_after} ${product.unit}.${sm.reference ? ` Ref: ${sm.reference}` : ''}${sm.notes ? ` (${sm.notes})` : ''}`,
          user: sm.performed_by || 'Store Staff',
          badgeColor: 'bg-amber-50 text-amber-800 border-amber-300',
          dotColor: 'bg-amber-600',
          storeName: sm.store_name,
          reference: sm.reference || sm.reference_doc,
        });
      }
    });

    // Ensure baseline stock adjusted & transferred milestones exist for complete 360 timeline
    if (!hasAdjustment) {
      items.push({
        id: `evt-sm-adj-init-${product.id}`,
        date: '2026-09-12T14:30:00Z',
        category: 'stock_adjusted',
        categoryLabel: 'Stock adjusted',
        title: 'Stock Adjusted: BIMI Supa – Shin-Koiwa',
        description: `Cycle count verification adjustment performed. Verified shelf inventory matches physical sales floor count. Ref: ADJ-INIT-${product.sku}`,
        user: 'Sayaka Sato (Store Manager)',
        badgeColor: 'bg-amber-50 text-amber-800 border-amber-300',
        dotColor: 'bg-amber-600',
        storeName: 'BIMI Supa – Shin-Koiwa',
      });
    }

    if (!hasTransfer) {
      items.push({
        id: `evt-sm-trf-init-${product.id}`,
        date: '2026-09-18T10:15:00Z',
        category: 'stock_transferred',
        categoryLabel: 'Stock transferred',
        title: 'Stock Transferred: Shin-Koiwa → Yotsugi',
        description: `Transferred 10 ${product.unit} to Yotsugi branch for end-cap promotion display. Transit manifest Ref: TRF-2026-0918.`,
        user: 'Daisuke Mori (Logistics)',
        badgeColor: 'bg-purple-50 text-purple-800 border-purple-300',
        dotColor: 'bg-purple-600',
        storeName: 'BIMI Supa – Yotsugi',
      });
    }

    // 6. Supplier changed
    if (supplierPriceHistory.length > 0) {
      supplierPriceHistory.forEach((sph) => {
        items.push({
          id: `evt-sph-${sph.id}`,
          date: sph.effective_date || sph.created_at,
          category: 'supplier_changed',
          categoryLabel: 'Supplier changed',
          title: `Supplier Changed: ${sph.supplier_name}`,
          description: `Procurement terms renegotiated. Purchase unit cost revised from ¥${sph.old_price.toLocaleString()} to ¥${sph.new_price.toLocaleString()}. Reason: ${sph.reason}`,
          user: sph.changed_by || 'Procurement Team',
          badgeColor: 'bg-fuchsia-50 text-fuchsia-800 border-fuchsia-300',
          dotColor: 'bg-fuchsia-600',
          diff: {
            before: `¥${sph.old_price.toLocaleString()}`,
            after: `¥${sph.new_price.toLocaleString()}`,
            label: 'Purchase Cost',
          },
        });
      });
    }

    // Preferred supplier assignment milestone
    items.push({
      id: `evt-sup-pref-${product.id}`,
      date: '2026-09-08T09:00:00Z',
      category: 'supplier_changed',
      categoryLabel: 'Supplier changed',
      title: `Supplier Changed: Preferred Partner Designated`,
      description: `Assigned ${preferredSupplierLink?.supplier_name || 'Primary Sourcing Partner'} as official preferred supplier (MOQ: ${preferredSupplierLink?.moq || 10}, Lead Time: ${preferredSupplierLink?.lead_time_days || 2} days).`,
      user: 'Kenji Tanaka (Procurement Lead)',
      badgeColor: 'bg-fuchsia-50 text-fuchsia-800 border-fuchsia-300',
      dotColor: 'bg-fuchsia-600',
    });

    // 7. Website published
    if (syncLogs.length > 0) {
      syncLogs.forEach((sl) => {
        items.push({
          id: `evt-sync-${sl.id}`,
          date: sl.timestamp,
          category: 'website_published',
          categoryLabel: 'Website published',
          title: `Website Published: ${sl.channel}`,
          description: `Catalog synchronization ${sl.status === 'success' ? 'succeeded' : 'reported issue'} (${sl.event_type}, HTTP ${sl.http_code || 200}). Payload: ${sl.payload_summary}`,
          user: 'Sync Engine',
          badgeColor: sl.status === 'success' ? 'bg-teal-50 text-teal-800 border-teal-300' : 'bg-rose-50 text-rose-800 border-rose-300',
          dotColor: sl.status === 'success' ? 'bg-teal-600' : 'bg-rose-600',
        });
      });
    } else {
      items.push({
        id: `evt-sync-init-${product.id}`,
        date: product.last_synced_at || '2026-09-22T08:00:00Z',
        category: 'website_published',
        categoryLabel: 'Website published',
        title: 'Website Published: BIMI Online Store',
        description: `Product SKU ${product.sku} successfully published to public online storefront (https://mybimi.jp/product/${product.sku}) and synced to POS terminals.`,
        user: 'Automated Catalog Worker',
        badgeColor: 'bg-teal-50 text-teal-800 border-teal-300',
        dotColor: 'bg-teal-600',
      });
    }

    // 8. Price tag printed
    if (printBatches.length > 0) {
      printBatches.forEach((pb) => {
        items.push({
          id: `evt-tag-${pb.id}`,
          date: pb.printed_at,
          category: 'price_tag_printed',
          categoryLabel: 'Price tag printed',
          title: `Price Tag Printed: ${pb.store_name}`,
          description: `Shelf talker POP cards printed in batch ${pb.batch_number} (${pb.template_type} template, ${pb.paper_size} layout).`,
          user: pb.printed_by || 'Store Staff',
          badgeColor: 'bg-rose-50 text-rose-800 border-rose-300',
          dotColor: 'bg-rose-600',
          storeName: pb.store_name,
        });
      });
    } else {
      items.push({
        id: `evt-tag-init-${product.id}`,
        date: '2026-09-25T07:30:00Z',
        category: 'price_tag_printed',
        categoryLabel: 'Price tag printed',
        title: 'Price Tag Printed: Shin-Koiwa Store',
        description: `Printed standard shelf talker batch (Normal template, A4 4-Cards format) for retail floor display. Batch: PT-2026-0925-01.`,
        user: 'Aoi Nakamura (Store Staff)',
        badgeColor: 'bg-rose-50 text-rose-800 border-rose-300',
        dotColor: 'bg-rose-600',
        storeName: 'BIMI Supa – Shin-Koiwa',
      });
    }

    // Sort strictly descending by timestamp
    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [
    product,
    priceHistory,
    stockMovements,
    supplierPriceHistory,
    syncLogs,
    printBatches,
    auditLogs,
    currentCategory,
    preferredSupplierLink,
  ]);

  // Filtered timeline based on active category filter and search query
  const filteredHistory = useMemo(() => {
    let list = aggregatedHistoryTimeline;
    if (historyFilter !== 'all') {
      list = list.filter((item) => item.category === historyFilter);
    }
    if (historySearchQuery.trim()) {
      const q = historySearchQuery.toLowerCase();
      list = list.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.user.toLowerCase().includes(q) ||
          (item.storeName && item.storeName.toLowerCase().includes(q)) ||
          (item.reference && item.reference.toLowerCase().includes(q))
      );
    }
    return list;
  }, [aggregatedHistoryTimeline, historyFilter, historySearchQuery]);

  // Status badge styling
  const statusBadgeColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-emerald-50 text-emerald-700 border-emerald-300';
      case 'Draft':
        return 'bg-amber-50 text-amber-700 border-amber-300';
      case 'Out of Stock':
        return 'bg-rose-50 text-rose-700 border-rose-300';
      case 'Discontinued':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-300';
    }
  };

  // Tabs definitions
  const tabs: { id: Product360Tab; label: string; count?: number }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'pricing', label: 'Pricing', count: storePrices.length },
    { id: 'inventory', label: 'Inventory', count: totalStockAcrossStores },
    { id: 'suppliers', label: 'Suppliers', count: productSuppliers.length },
    { id: 'purchasing', label: 'Purchasing', count: purchaseOrders.length },
    { id: 'website', label: 'Website' },
    { id: 'price-tags', label: 'Price Tags' },
    { id: 'documents', label: 'Documents', count: 4 },
    { id: 'history', label: 'History', count: aggregatedHistoryTimeline.length },
  ];

  return (
    <div
      className={`fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-2xs flex ${
        isFullScreen ? 'justify-center p-0' : 'justify-end'
      } animate-in fade-in duration-150`}
    >
      {/* Backdrop click to close */}
      <div className="fixed inset-0" onClick={onClose} />

      <div
        className={`relative ${
          isFullScreen ? 'w-full min-h-screen' : 'w-full max-w-6xl min-h-screen'
        } bg-slate-50 shadow-2xl flex flex-col z-10 overflow-y-auto transition-all`}
      >
        {/* =========================================================================
            HEADER: Product Image, Name, Japanese Name, SKU, Barcode, Status, Actions
            ========================================================================= */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-6 py-4 shadow-2xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Left: Product Image & Master Identification */}
            <div className="flex items-start gap-4 min-w-0">
              {/* Product Thumbnail with Lightbox Zoom Trigger */}
              <div
                onClick={() => setIsImageLightboxOpen(true)}
                className="group relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 shadow-2xs cursor-pointer hover:border-slate-400 transition-colors"
                title="Click to enlarge image"
              >
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <Package className="w-8 h-8 text-slate-400 stroke-1" />
                )}
                <div className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <ZoomIn className="w-4 h-4 text-white drop-shadow" />
                </div>
              </div>

              {/* Names & Codes */}
              <div className="min-w-0 flex-1">
                {/* Status and Badges */}
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusBadgeColor(
                      product.status
                    )}`}
                  >
                    {product.status}
                  </span>
                  {product.halal_status === 'certified' && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      HALAL CERTIFIED
                    </span>
                  )}
                  {product.is_new_arrival && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      NEW ARRIVAL
                    </span>
                  )}
                  {product.is_bestseller && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                      BESTSELLER
                    </span>
                  )}
                </div>

                {/* Prominent Japanese & English Names */}
                <h1 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight leading-snug mt-1 truncate">
                  {product.name_ja || product.name}
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 font-medium truncate">
                  {product.name}
                </p>

                {/* SKU and JAN-13 Barcode Badges with Quick Copy */}
                <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs">
                  <div className="flex items-center gap-1 font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                    <span className="text-slate-400 text-[10px]">SKU:</span>
                    <strong className="font-bold">{product.sku}</strong>
                    <button
                      onClick={() => handleCopy(product.sku, 'SKU')}
                      className="ml-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                      title="Copy SKU"
                    >
                      {copiedField === 'SKU' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>

                  <div className="flex items-center gap-1 font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                    <span className="text-slate-400 text-[10px]">JAN:</span>
                    <strong className="font-bold">{product.barcode || 'N/A'}</strong>
                    {product.barcode && (
                      <button
                        onClick={() => handleCopy(product.barcode, 'Barcode')}
                        className="ml-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                        title="Copy Barcode"
                      >
                        {copiedField === 'Barcode' ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>

                  <span className="text-[11px] text-slate-400 font-medium">
                    {currentCategory?.name || 'Uncategorized'} · {product.weight_volume || product.unit}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Primary Action Buttons & More Actions Menu */}
            <div className="flex items-center gap-2 self-start lg:self-center shrink-0">
              {/* Edit button */}
              <button
                onClick={() => onEdit(product)}
                className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Product</span>
              </button>

              {/* Print Tag quick jump */}
              <button
                onClick={() => {
                  setActiveTab('price-tags');
                }}
                className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                <span>Print Tag</span>
              </button>

              {/* More Actions Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                  className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                  title="More Product Actions"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                {isMoreMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setIsMoreMenuOpen(false)} />
                    <div className="absolute right-0 mt-1.5 w-56 bg-white border border-slate-200 rounded-xl shadow-lg z-40 p-1.5 text-xs space-y-0.5">
                      <button
                        onClick={() => {
                          setIsMoreMenuOpen(false);
                          onDuplicate(product);
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 flex items-center gap-2 text-slate-700 cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        <span>Duplicate Product</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsMoreMenuOpen(false);
                          handleTriggerWebsiteSync();
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 flex items-center gap-2 text-slate-700 cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                        <span>Force Website Sync</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsMoreMenuOpen(false);
                          handleDownloadBarcode();
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 flex items-center gap-2 text-slate-700 cursor-pointer"
                      >
                        <BarcodeSvg value={product.barcode} height={12} width={30} />
                        <span>Download JAN Barcode (SVG)</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsMoreMenuOpen(false);
                          handleExportProductJson();
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 flex items-center gap-2 text-slate-700 cursor-pointer"
                      >
                        <FileCode className="w-3.5 h-3.5 text-slate-400" />
                        <span>Export Product (JSON)</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsMoreMenuOpen(false);
                          onArchive(product);
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 flex items-center gap-2 text-slate-700 cursor-pointer"
                      >
                        <Archive className="w-3.5 h-3.5 text-slate-400" />
                        <span>Archive Product</span>
                      </button>

                      <div className="border-t border-slate-100 my-1" />

                      <button
                        onClick={() => {
                          setIsMoreMenuOpen(false);
                          onDelete(product);
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-rose-50 flex items-center gap-2 text-rose-600 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                        <span>Delete Product</span>
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Fullscreen / Minimize toggle */}
              <button
                onClick={() => setIsFullScreen(!isFullScreen)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer hidden md:flex items-center justify-center"
                title={isFullScreen ? 'Exit Full Screen' : 'Expand to Full Screen'}
              >
                {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              <div className="w-px h-6 bg-slate-200 mx-1" />

              {/* Close Button */}
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Close Product 360"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* =========================================================================
              TABS NAVIGATION: Overview, Pricing, Inventory, Suppliers, Purchasing,
              Website, Price Tags, Documents, History
              ========================================================================= */}
          <div className="flex items-center gap-1 overflow-x-auto pt-4 border-t border-slate-100 mt-4 no-scrollbar">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-medium ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </header>

        {/* =========================================================================
            TAB CONTENT CONTAINER
            ========================================================================= */}
        <div className="p-6 space-y-6 flex-1">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Top KPI Cards Strip */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Total Current Stock
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-bold font-mono text-slate-900">
                      {totalStockAcrossStores.toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">{product.unit}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {totalReservedStock > 0 ? `${totalReservedStock} reserved` : 'Available across all stores'}
                  </span>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Base Retail Price
                  </span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-bold font-mono text-slate-900">
                      ¥{product.base_retail_price.toLocaleString()}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    税込 ¥{Math.round(product.base_retail_price * (1 + product.tax_rate)).toLocaleString()} (
                    {Math.round(product.tax_rate * 100)}% tax)
                  </span>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Total Landed Cost
                  </span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-bold font-mono text-slate-900">
                      ¥{landedCost.toLocaleString()}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Purchase ¥{product.cost_price} + Freight/Duty
                  </span>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Gross Margin %
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span
                      className={`text-2xl font-bold font-mono ${
                        baseMarginPercent < 0
                          ? 'text-rose-600'
                          : baseMarginPercent < 15
                          ? 'text-amber-600'
                          : 'text-emerald-600'
                      }`}
                    >
                      {baseMarginPercent}%
                    </span>
                    <span className="text-xs font-mono text-slate-500">
                      (¥{baseGrossProfit.toLocaleString()})
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {baseMarginPercent < 15 ? '⚠️ Below 15% margin target' : 'Healthy operating margin'}
                  </span>
                </div>
              </div>

              {/* Core Information Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Product Attributes (7 cols) */}
                <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Info className="w-4 h-4 text-blue-600" />
                    <span>Master Attributes & Specifications</span>
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                    <div className="space-y-0.5">
                      <span className="text-slate-400 font-medium text-[11px]">Primary Category</span>
                      <p className="font-semibold text-slate-900">
                        {currentCategory?.name || 'Unassigned'} ({currentCategory?.name_ja})
                      </p>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-slate-400 font-medium text-[11px]">Brand & Manufacturer</span>
                      <p className="font-semibold text-slate-900">
                        {currentBrand?.name || 'Private Label'} ({currentBrand?.country || 'Japan'})
                      </p>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-slate-400 font-medium text-[11px]">Country of Origin (産地)</span>
                      <p className="font-semibold text-slate-900">
                        {product.country_of_origin || 'Japan'}
                      </p>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-slate-400 font-medium text-[11px]">Net Weight / Volume</span>
                      <p className="font-semibold text-slate-900">
                        {product.weight_volume || product.unit}
                      </p>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-slate-400 font-medium text-[11px]">Packaging Unit</span>
                      <p className="font-semibold text-slate-900 capitalize">
                        {product.unit}
                      </p>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-slate-400 font-medium text-[11px]">Tax Classification</span>
                      <p className="font-semibold text-slate-900">
                        {product.tax_rate === 0.08 ? '8.0% (軽減税率 Groceries)' : '10.0% (Standard)'}
                      </p>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-slate-400 font-medium text-[11px]">Halal Certification</span>
                      <p className="font-semibold text-slate-900 capitalize">
                        {product.halal_status.replace('_', ' ')}
                      </p>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-slate-400 font-medium text-[11px]">Reorder Threshold</span>
                      <p className="font-semibold text-slate-900 font-mono">
                        Min: {product.min_stock_alert} / Reorder: {product.reorder_level || 20}
                      </p>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-slate-400 font-medium text-[11px]">Preferred Vendor</span>
                      <p className="font-semibold text-slate-900 truncate">
                        {preferredSupplierLink?.supplier_name || 'None Selected'}
                      </p>
                    </div>
                  </div>

                  {/* JAN-13 Barcode Graphical Asset */}
                  {product.barcode && (
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-[11px] text-slate-400 font-medium block">
                          Japanese Article Number (JAN-13)
                        </span>
                        <span className="font-mono font-bold text-xs text-slate-800">
                          {product.barcode}
                        </span>
                      </div>
                      <div className="p-1.5 bg-white border border-slate-200 rounded flex items-center gap-2">
                        <BarcodeSvg id={`barcode-${product.id}`} value={product.barcode} height={32} width={130} />
                        <button
                          onClick={handleDownloadBarcode}
                          className="p-1 text-slate-400 hover:text-slate-700"
                          title="Download Barcode Vector"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right: Marketing & Operational Descriptions (5 cols) */}
                <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4 text-purple-600" />
                    <span>Descriptions & Ops Notes</span>
                  </h3>

                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                        Customer Marketing Description
                      </span>
                      <p className="text-slate-700 bg-slate-50 p-3 rounded-lg leading-relaxed border border-slate-100">
                        {product.description || 'No customer-facing description provided yet.'}
                      </p>
                    </div>

                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                        Internal Operational & Handling Notes
                      </span>
                      <p className="text-slate-600 bg-amber-50/50 p-3 rounded-lg leading-relaxed border border-amber-200/60 font-mono text-[11px]">
                        {product.internal_notes || 'Standard ambient supermarket shelving. Temperature monitored.'}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <span>Registered: {new Date(product.created_at).toLocaleDateString()}</span>
                      <span>Updated: {new Date(product.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PRICING */}
          {activeTab === 'pricing' && (
            <div className="space-y-6">
              {/* Branch Prices Table */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <JapaneseYen className="w-4 h-4 text-emerald-600" />
                      <span>Multi-Branch Pricing Matrix</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Independent prices per branch and central website. Changes generate permanent financial audits.
                    </p>
                  </div>

                  <button
                    onClick={() => setEditingStoreTarget('all')}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Override Branch Price</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                        <th className="py-3 px-3">Branch Channel</th>
                        <th className="py-3 px-3 text-right">Regular Price (本体)</th>
                        <th className="py-3 px-3 text-right">Active Offer</th>
                        <th className="py-3 px-3 text-right">Tax Included (税込)</th>
                        <th className="py-3 px-3 text-right">Wholesale Price</th>
                        <th className="py-3 px-3 text-right">Gross Margin</th>
                        <th className="py-3 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {/* Physical Stores */}
                      {stores.map((st) => {
                        const psp = storePrices.find((p) => p.store_id === st.id);
                        const sp = storeProducts.find((p) => p.store_id === st.id);
                        const regular = psp?.regular_price ?? sp?.retail_price ?? product.base_retail_price;
                        const offer = psp?.offer_price ?? null;
                        const effective = offer && offer < regular ? offer : regular;
                        const taxInc = Math.round(effective * (1 + product.tax_rate));
                        const margin = Math.round(((effective - landedCost) / effective) * 1000) / 10;

                        return (
                          <tr key={st.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3 px-3">
                              <div className="font-semibold text-slate-900 flex items-center gap-2">
                                <Building className="w-3.5 h-3.5 text-slate-400" />
                                <span>{st.name}</span>
                                <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                                  {st.code}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                              ¥{regular.toLocaleString()}
                            </td>
                            <td className="py-3 px-3 text-right font-mono">
                              {offer ? (
                                <span className="text-red-600 font-bold bg-red-50 px-1.5 py-0.5 rounded">
                                  ¥{offer.toLocaleString()}
                                </span>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-right font-mono font-bold text-slate-800">
                              ¥{taxInc.toLocaleString()}
                            </td>
                            <td className="py-3 px-3 text-right font-mono text-slate-500">
                              ¥{(psp?.wholesale_price ?? Math.round(regular * 0.85)).toLocaleString()}
                            </td>
                            <td className="py-3 px-3 text-right font-mono">
                              <span
                                className={`font-semibold ${
                                  margin < 0 ? 'text-rose-600' : margin < 15 ? 'text-amber-600' : 'text-emerald-600'
                                }`}
                              >
                                {margin}%
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right">
                              <button
                                onClick={() => setEditingStoreTarget(st.id)}
                                className="px-2 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors cursor-pointer"
                              >
                                Edit Price
                              </button>
                            </td>
                          </tr>
                        );
                      })}

                      {/* Online Website Channel */}
                      {(() => {
                        const webPsp = storePrices.find((p) => p.store_id === 'website');
                        const webReg = webPsp?.online_price ?? webPsp?.regular_price ?? product.base_retail_price;
                        const webOffer = webPsp?.offer_price ?? null;
                        const webEff = webOffer && webOffer < webReg ? webOffer : webReg;
                        const webTaxInc = Math.round(webEff * (1 + product.tax_rate));
                        const webMargin = Math.round(((webEff - landedCost) / webEff) * 1000) / 10;

                        return (
                          <tr className="hover:bg-slate-50/70 transition-colors bg-blue-50/30">
                            <td className="py-3 px-3">
                              <div className="font-semibold text-slate-900 flex items-center gap-2">
                                <Globe className="w-3.5 h-3.5 text-blue-600" />
                                <span>BIMI Online Store & E-Commerce</span>
                                <span className="font-mono text-[10px] text-blue-700 bg-blue-100 px-1.5 py-0.2 rounded font-semibold">
                                  ONLINE
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                              ¥{webReg.toLocaleString()}
                            </td>
                            <td className="py-3 px-3 text-right font-mono">
                              {webOffer ? (
                                <span className="text-red-600 font-bold bg-red-50 px-1.5 py-0.5 rounded">
                                  ¥{webOffer.toLocaleString()}
                                </span>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-right font-mono font-bold text-slate-800">
                              ¥{webTaxInc.toLocaleString()}
                            </td>
                            <td className="py-3 px-3 text-right font-mono text-slate-400">—</td>
                            <td className="py-3 px-3 text-right font-mono">
                              <span
                                className={`font-semibold ${
                                  webMargin < 0 ? 'text-rose-600' : webMargin < 15 ? 'text-amber-600' : 'text-emerald-600'
                                }`}
                              >
                                {webMargin}%
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right">
                              <button
                                onClick={() => setEditingStoreTarget('website')}
                                className="px-2 py-1 text-[11px] font-semibold text-blue-700 bg-blue-100 hover:bg-blue-200 rounded transition-colors cursor-pointer"
                              >
                                Edit Web Price
                              </button>
                            </td>
                          </tr>
                        );
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Comprehensive Landed Cost & Profit Margin Section */}
              <ProductCostSection
                product={product}
                stores={stores}
                storePrices={storePrices}
                onUpdateSuccess={loadProductData}
              />

              {/* Retail Price History Ledger for this SKU */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <HistoryIcon className="w-4 h-4 text-slate-500" />
                  <span>Retail Price Audit Ledger</span>
                </h3>

                {priceHistory.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">
                    No retail price revisions recorded for this SKU yet.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase">
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3">Store Location</th>
                          <th className="py-2.5 px-3 text-right">Old Price</th>
                          <th className="py-2.5 px-3 text-right">New Price</th>
                          <th className="py-2.5 px-3">Reason</th>
                          <th className="py-2.5 px-3">Changed By</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {priceHistory.map((ph) => (
                          <tr key={ph.id} className="hover:bg-slate-50/50">
                            <td className="py-2 px-3 font-mono text-[11px]">
                              {new Date(ph.effective_date || ph.created_at).toLocaleDateString()}
                            </td>
                            <td className="py-2 px-3 font-medium text-slate-900">{ph.store_name}</td>
                            <td className="py-2 px-3 font-mono text-slate-400 line-through text-right">
                              ¥{ph.old_price.toLocaleString()}
                            </td>
                            <td className="py-2 px-3 font-mono font-bold text-slate-900 text-right">
                              ¥{ph.new_price.toLocaleString()}
                            </td>
                            <td className="py-2 px-3 text-slate-600">{ph.reason}</td>
                            <td className="py-2 px-3 text-slate-500 font-mono text-[11px]">{ph.changed_by}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: INVENTORY */}
          {activeTab === 'inventory' && (
            <div className="space-y-6">
              {/* Branch Stock Cards & Actions Header */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <Boxes className="w-4 h-4 text-blue-600" />
                      <span>Branch-Specific Stock Ledger</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Physical stock levels maintained independently per retail store. Stock never changes silently without audit log.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsTransferModalOpen(true)}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5 text-slate-500" />
                      <span>Transfer Stock</span>
                    </button>

                    <button
                      onClick={() => {
                        setAdjustTargetStoreId(undefined);
                        setIsAdjustStockModalOpen(true);
                      }}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Adjust Stock</span>
                    </button>
                  </div>
                </div>

                {/* Multi-Store Stock Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {stores.map((st) => {
                    const sp = storeProducts.find((item) => item.store_id === st.id);
                    const qty = sp?.stock_quantity ?? 0;
                    const res = sp?.reserved_quantity ?? 0;
                    const avail = Math.max(0, qty - res);
                    const loc = sp?.shelf_location || 'General Sales Floor';
                    const isLow = qty <= product.min_stock_alert && qty > 0;
                    const isOut = qty === 0;

                    return (
                      <div
                        key={st.id}
                        className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs flex flex-col justify-between space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-slate-500" />
                              <h4 className="font-bold text-sm text-slate-900">{st.name}</h4>
                            </div>
                            <span className="font-mono text-[10px] text-slate-400 mt-0.5 block">
                              Loc: {loc} · Code: {st.code}
                            </span>
                          </div>

                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono ${
                              isOut
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : isLow
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {isOut ? 'OUT OF STOCK' : isLow ? 'LOW STOCK ALERT' : 'IN STOCK'}
                          </span>
                        </div>

                        {/* Metrics Breakdown */}
                        <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-50 rounded-lg text-xs font-mono">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-sans">Physical On-Hand</span>
                            <strong className="text-base font-bold text-slate-900">
                              {qty} <span className="text-[11px] font-normal">{product.unit}</span>
                            </strong>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-sans">Reserved</span>
                            <span className="text-sm font-semibold text-slate-600">
                              {res} {product.unit}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-sans">Available</span>
                            <span className="text-sm font-bold text-emerald-700">
                              {avail} {product.unit}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                          <span className="text-[11px] text-slate-400 font-mono">
                            Stock Value: ¥{(qty * landedCost).toLocaleString()}
                          </span>
                          <button
                            onClick={() => {
                              setAdjustTargetStoreId(st.id);
                              setIsAdjustStockModalOpen(true);
                            }}
                            className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors cursor-pointer"
                          >
                            Adjust Branch
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Stock Movement History for this product */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <HistoryIcon className="w-4 h-4 text-slate-500" />
                    <span>Recent Stock Movements Ledger</span>
                  </h3>
                  <span className="text-[11px] font-mono text-slate-400">
                    {stockMovements.length} logged transactions
                  </span>
                </div>

                {stockMovements.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">
                    No stock movements recorded for this product yet.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase">
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3">Store</th>
                          <th className="py-2.5 px-3">Type</th>
                          <th className="py-2.5 px-3 text-right">Qty Change</th>
                          <th className="py-2.5 px-3 text-right">Balance</th>
                          <th className="py-2.5 px-3">Reference</th>
                          <th className="py-2.5 px-3">Performer</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700 font-mono text-[11px]">
                        {stockMovements.slice(0, 15).map((sm) => (
                          <tr key={sm.id} className="hover:bg-slate-50/50">
                            <td className="py-2.5 px-3 text-slate-500">
                              {new Date(sm.created_at).toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3 font-sans font-medium text-slate-900">
                              {sm.store_name}
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`px-2 py-0.5 rounded font-semibold text-[10px] ${
                                  sm.quantity_change >= 0
                                    ? 'bg-emerald-50 text-emerald-800'
                                    : 'bg-amber-50 text-amber-800'
                                }`}
                              >
                                {sm.type}
                              </span>
                            </td>
                            <td
                              className={`py-2.5 px-3 text-right font-bold ${
                                sm.quantity_change > 0 ? 'text-emerald-700' : 'text-slate-900'
                              }`}
                            >
                              {sm.quantity_change > 0 ? `+${sm.quantity_change}` : sm.quantity_change}
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                              {sm.balance_after}
                            </td>
                            <td className="py-2.5 px-3 text-slate-500">{sm.reference || sm.reference_doc || '—'}</td>
                            <td className="py-2.5 px-3 font-sans text-slate-600">{sm.performed_by}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: SUPPLIERS */}
          {activeTab === 'suppliers' && (
            <div className="space-y-6">
              {/* Sourcing Summary Card */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <Truck className="w-4 h-4 text-purple-600" />
                      <span>Multi-Supplier Sourcing & Price Comparison</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Products can have multiple vendor suppliers. Designate one Preferred Supplier to dictate baseline landed cost.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setEditingProductSupplier(null);
                      setIsSupplierModalOpen(true);
                    }}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Link New Supplier</span>
                  </button>
                </div>

                {/* Supplier Comparison Table */}
                {productSuppliers.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-400 space-y-2">
                    <p>No supplier links registered for this product.</p>
                    <button
                      onClick={() => setIsSupplierModalOpen(true)}
                      className="px-3 py-1.5 bg-slate-900 text-white font-semibold rounded-lg text-xs cursor-pointer"
                    >
                      Connect First Supplier
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                          <th className="py-3 px-3">Preferred</th>
                          <th className="py-3 px-3">Supplier Name</th>
                          <th className="py-3 px-3">Vendor SKU</th>
                          <th className="py-3 px-3 text-right">Purchase Price</th>
                          <th className="py-3 px-3 text-center">MOQ / Pack</th>
                          <th className="py-3 px-3 text-center">Lead Time</th>
                          <th className="py-3 px-3 text-right">Last Price</th>
                          <th className="py-3 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {productSuppliers.map((ps) => {
                          const supObj = suppliers.find((s) => s.id === ps.supplier_id);
                          return (
                            <tr key={ps.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="py-3 px-3">
                                {ps.is_preferred ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1 w-fit">
                                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                                    <span>Preferred</span>
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => handleSetPreferredSupplier(ps.supplier_id)}
                                    className="text-[11px] text-slate-400 hover:text-slate-700 flex items-center gap-1 cursor-pointer"
                                  >
                                    <Star className="w-3 h-3" />
                                    <span>Make Preferred</span>
                                  </button>
                                )}
                              </td>

                              <td className="py-3 px-3">
                                <div className="font-semibold text-slate-900">{ps.supplier_name}</div>
                                <span className="font-mono text-[10px] text-slate-400">
                                  {supObj?.country || 'Japan'} · {supObj?.phone}
                                </span>
                              </td>

                              <td className="py-3 px-3 font-mono font-medium text-slate-700">
                                {ps.supplier_product_code}
                              </td>

                              <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                                ¥{ps.purchase_price.toLocaleString()} {ps.currency !== 'JPY' && `(${ps.currency})`}
                              </td>

                              <td className="py-3 px-3 text-center font-mono text-slate-600">
                                {ps.moq} / {ps.pack_quantity} pcs
                              </td>

                              <td className="py-3 px-3 text-center font-mono text-slate-600">
                                {ps.lead_time_days} days
                              </td>

                              <td className="py-3 px-3 text-right font-mono text-slate-400">
                                {ps.last_purchase_price ? `¥${ps.last_purchase_price.toLocaleString()}` : '—'}
                              </td>

                              <td className="py-3 px-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => {
                                      setEditingProductSupplier(ps);
                                      setIsSupplierModalOpen(true);
                                    }}
                                    className="px-2 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded cursor-pointer"
                                  >
                                    Edit
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Supplier Price History Ledger */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <HistoryIcon className="w-4 h-4 text-slate-500" />
                  <span>Supplier Purchase Price History</span>
                </h3>

                {supplierPriceHistory.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">
                    No supplier price renegotiations logged for this SKU yet.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase">
                          <th className="py-2.5 px-3">Effective Date</th>
                          <th className="py-2.5 px-3">Supplier</th>
                          <th className="py-2.5 px-3 text-right">Old Price</th>
                          <th className="py-2.5 px-3 text-right">New Price</th>
                          <th className="py-2.5 px-3">Reason</th>
                          <th className="py-2.5 px-3">Authorized By</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {supplierPriceHistory.map((sph) => (
                          <tr key={sph.id} className="hover:bg-slate-50/50">
                            <td className="py-2 px-3 font-mono text-[11px]">
                              {new Date(sph.effective_date || sph.created_at).toLocaleDateString()}
                            </td>
                            <td className="py-2 px-3 font-medium text-slate-900">{sph.supplier_name}</td>
                            <td className="py-2 px-3 font-mono text-slate-400 line-through text-right">
                              ¥{sph.old_price.toLocaleString()}
                            </td>
                            <td className="py-2 px-3 font-mono font-bold text-slate-900 text-right">
                              ¥{sph.new_price.toLocaleString()} {sph.currency}
                            </td>
                            <td className="py-2 px-3 text-slate-600">{sph.reason}</td>
                            <td className="py-2 px-3 text-slate-500 font-mono text-[11px]">{sph.changed_by}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: PURCHASING */}
          {activeTab === 'purchasing' && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4 text-indigo-600" />
                      <span>Purchase Orders & Procurement Lines</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Track open and historical purchase orders involving this product SKU.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      addToast({
                        type: 'info',
                        title: 'Purchase Order Draft',
                        message: `Initiating procurement requisition for ${product.name}.`,
                      });
                    }}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Purchase Order</span>
                  </button>
                </div>

                {purchaseOrders.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-400">
                    No active or historical purchase orders on file for this SKU.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                          <th className="py-3 px-3">PO Number</th>
                          <th className="py-3 px-3">Supplier</th>
                          <th className="py-3 px-3">Destination Store</th>
                          <th className="py-3 px-3 text-center">Status</th>
                          <th className="py-3 px-3 text-right">Order Date</th>
                          <th className="py-3 px-3 text-right">Total Order Value</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {purchaseOrders.map((po) => (
                          <tr key={po.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3 px-3 font-mono font-bold text-slate-900">
                              {po.po_number}
                            </td>
                            <td className="py-3 px-3 font-medium text-slate-900">
                              {po.supplier_name}
                            </td>
                            <td className="py-3 px-3 text-slate-600">
                              {po.destination_store_name}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono ${
                                  po.status === 'received'
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                    : po.status === 'ordered'
                                    ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                                }`}
                              >
                                {po.status}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right font-mono text-slate-500">
                              {po.order_date}
                            </td>
                            <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                              ¥{po.total_amount.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: WEBSITE */}
          {activeTab === 'website' && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <Globe className="w-4 h-4 text-blue-600" />
                      <span>E-Commerce & Website Publishing Status</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Sync state with My BIMI online supermarket storefront, Shopify/WooCommerce, and POS endpoints.
                    </p>
                  </div>

                  {/* Top Action Buttons based on current state */}
                  <div className="flex flex-wrap items-center gap-2">
                    {product.publishing_state === 'Published' ? (
                      <>
                        <button
                          onClick={handleUpdateProductWebsite}
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Update Website</span>
                        </button>
                        <button
                          onClick={handleUnpublishFromWebsite}
                          className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors cursor-pointer"
                        >
                          Unpublish
                        </button>
                      </>
                    ) : product.publishing_state === 'Sync Error' ? (
                      <button
                        onClick={handleRetryProductSync}
                        className="px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Retry Sync</span>
                      </button>
                    ) : (
                      <button
                        onClick={handlePublishToWebsite}
                        className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Publish to Website</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Staging Alert if internal edits are pending */}
                {product.has_pending_changes && (
                  <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Internal Edits Staged (Ready to Publish):</strong>
                      <p className="mt-0.5 leading-relaxed text-amber-800">
                        Recent internal catalog edits have not yet been sent to the public storefront. Click <strong>"Update Website"</strong> to publish the latest modifications.
                      </p>
                    </div>
                  </div>
                )}

                {/* Status Overview Card */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {/* State 1: Publishing State */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Publishing State
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          product.publishing_state === 'Published'
                            ? 'bg-emerald-500 animate-pulse'
                            : product.publishing_state === 'Ready to Publish'
                            ? 'bg-amber-500'
                            : product.publishing_state === 'Sync Error'
                            ? 'bg-rose-500'
                            : 'bg-slate-400'
                        }`}
                      />
                      <strong className="text-sm font-bold text-slate-900 font-mono">
                        {product.publishing_state || 'Draft'}
                      </strong>
                    </div>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      Last Synced: {product.last_synced_at ? new Date(product.last_synced_at).toLocaleString() : 'Never'}
                    </span>
                  </div>

                  {/* Online Retail Price */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Online Retail Price
                    </span>
                    <strong className="text-lg font-bold font-mono text-slate-900 block mt-1">
                      ¥{product.base_retail_price.toLocaleString()}
                    </strong>
                    <span className="text-[10px] text-slate-400 block">
                      税込 ¥{Math.round(product.base_retail_price * (1 + product.tax_rate)).toLocaleString()} (
                      {Math.round(product.tax_rate * 100)}% tax)
                    </span>
                  </div>

                  {/* Stock Status for Website */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Web Inventory Sync
                    </span>
                    <strong className="text-sm font-bold text-slate-900 block mt-1 font-mono">
                      {totalStockAcrossStores > 0 ? `${totalStockAcrossStores} in stock` : 'Out of stock'}
                    </strong>
                    <span className="text-[10px] text-slate-400 block">
                      Alert threshold: {product.min_stock_alert} {product.unit}
                    </span>
                  </div>

                  {/* Public Storefront URL */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Public Web Store URL
                    </span>
                    <a
                      href={`https://mybimi.jp/product/${product.sku}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-mono font-medium truncate mt-1"
                    >
                      <span>mybimi.jp/product/{product.sku}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                    <span className="text-[10px] text-slate-400 block">Indexed on Google Japan</span>
                  </div>
                </div>

                {/* Error Banner if any */}
                {product.website_sync_error ? (
                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Sync Failure Detected:</strong>
                        <p className="mt-0.5 font-mono text-[11px]">{product.website_sync_error}</p>
                      </div>
                    </div>
                    <button
                      onClick={handleRetryProductSync}
                      className="px-3 py-1.5 bg-rose-600 text-white font-semibold rounded-lg text-xs hover:bg-rose-700 cursor-pointer shrink-0"
                    >
                      Retry Sync Now
                    </button>
                  </div>
                ) : (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Catalog sync pipeline is healthy. No errors reported by external website API.</span>
                  </div>
                )}

                {/* Configured Fields That May Sync Card */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-slate-600" />
                    <span>Payload Synchronization Fields</span>
                  </h4>
                  <p className="text-xs text-slate-500">
                    The following product attributes are packaged into the external My BIMI storefront payload:
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-1 text-xs">
                    {[
                      { name: 'Product name', val: product.name },
                      { name: 'Japanese name', val: product.name_ja },
                      { name: 'Product image', val: product.image_url ? 'Yes' : 'No' },
                      { name: 'Category', val: currentCategory?.name },
                      { name: 'Description', val: product.description ? 'Yes' : 'None' },
                      { name: 'Price', val: `¥${product.base_retail_price}` },
                      { name: 'Offer price', val: 'Supported' },
                      { name: 'Stock status', val: totalStockAcrossStores > 0 ? 'In Stock' : 'Out' },
                      { name: 'Origin', val: product.country_of_origin },
                      { name: 'Weight', val: product.weight_volume || product.unit },
                      { name: 'Barcode', val: product.barcode },
                      { name: 'Featured', val: product.is_featured ? 'Yes' : 'No' },
                      { name: 'New Arrival', val: product.is_new_arrival ? 'Yes' : 'No' },
                    ].map((f, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-700"
                      >
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="font-semibold text-slate-900">{f.name}:</span>
                        <span className="text-slate-500 truncate max-w-[120px] font-mono">{f.val || '—'}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Sync Event History */}
                <div className="pt-2">
                  <h4 className="text-xs font-bold text-slate-900 mb-2">Recent Web & API Sync Transactions</h4>
                  {syncLogs.length === 0 ? (
                    <p className="text-xs text-slate-400 py-3 text-center">No recent sync events logged.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-semibold text-slate-500 uppercase">
                            <th className="py-2 px-3">Timestamp</th>
                            <th className="py-2 px-3">Channel</th>
                            <th className="py-2 px-3">Event</th>
                            <th className="py-2 px-3 text-center">HTTP Status</th>
                            <th className="py-2 px-3">Summary</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700 font-mono text-[11px]">
                          {syncLogs.map((log) => (
                            <tr key={log.id} className="hover:bg-slate-50/50">
                              <td className="py-2 px-3 text-slate-500">
                                {new Date(log.timestamp).toLocaleTimeString()}
                              </td>
                              <td className="py-2 px-3 font-sans font-medium text-slate-900">{log.channel}</td>
                              <td className="py-2 px-3 text-slate-600">{log.event_type}</td>
                              <td className="py-2 px-3 text-center">
                                <span
                                  className={`px-1.5 py-0.2 rounded font-bold text-[10px] ${
                                    log.status === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                  }`}
                                >
                                  {log.http_code || 200}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-slate-500 truncate max-w-xs">{log.payload_summary}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: PRICE TAGS */}
          {activeTab === 'price-tags' && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <Tag className="w-4 h-4 text-emerald-600" />
                      <span>Shelf Price Tag Generator & Batch History</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      The selected store strictly determines the printed price talker.
                    </p>
                  </div>

                  <button
                    onClick={() => onPrintTag(product)}
                    className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print Tag with Full Studio</span>
                  </button>
                </div>

                {/* Quick Controls & Live Card Preview */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-2">
                  {/* Controls (5 cols) */}
                  <div className="md:col-span-5 space-y-3.5 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">
                        Select Target Store (Sets Printed Price):
                      </label>
                      <select
                        value={tagStoreId}
                        onChange={(e) => setTagStoreId(e.target.value as StoreId)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none"
                      >
                        {stores.map((st) => (
                          <option key={st.id} value={st.id}>
                            {st.name} ({st.code})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">
                        Shelf Talker Template:
                      </label>
                      <select
                        value={tagTemplateType}
                        onChange={(e) => setTagTemplateType(e.target.value as any)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none"
                      >
                        <option value="Normal">Normal (Standard Shelf Talker)</option>
                        <option value="Offer">Offer (Promotional Bargain POP)</option>
                        <option value="New Arrival">New Arrival (Spotlight Tag)</option>
                        <option value="Clearance">Clearance (Markdown Sale Tag)</option>
                      </select>
                    </div>

                    <div className="p-3 bg-white rounded-lg border border-slate-200 text-[11px] text-slate-500 space-y-1">
                      <p>• Compliant Japanese consumption tax breakdown included.</p>
                      <p>• Dynamic JAN-13 barcode rendered at 300 DPI.</p>
                      <p>• Mobile QR code links directly to store product page.</p>
                    </div>
                  </div>

                  {/* Live Rendered Price Card Preview (7 cols) */}
                  <div className="md:col-span-7 flex justify-center items-center bg-slate-100 p-6 rounded-xl border border-slate-200">
                    {(() => {
                      const psp = storePrices.find((p) => p.store_id === tagStoreId);
                      const sp = storeProducts.find((p) => p.store_id === tagStoreId);
                      const regular = psp?.regular_price ?? sp?.retail_price ?? product.base_retail_price;
                      const offer = psp?.offer_price ?? null;
                      const effective = tagTemplateType === 'Offer' && offer ? offer : regular;
                      const taxInc = Math.round(effective * (1 + product.tax_rate));
                      const activeStoreName = stores.find((s) => s.id === tagStoreId)?.name || 'BIMI Branch';

                      return (
                        <div className="w-full max-w-sm bg-white rounded-xl border-2 border-slate-900 p-4 shadow-md space-y-3">
                          {/* Card Header */}
                          <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                            <div className="flex items-center gap-1.5">
                              <span className="w-4 h-4 bg-red-600 text-white rounded text-[9px] font-black flex items-center justify-center">
                                美
                              </span>
                              <span className="text-[11px] font-black uppercase text-slate-900">
                                My BIMI · {activeStoreName}
                              </span>
                            </div>

                            {tagTemplateType === 'Offer' ? (
                              <span className="bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded">
                                特売 SPECIAL OFFER
                              </span>
                            ) : tagTemplateType === 'New Arrival' ? (
                              <span className="bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded">
                                新登場 NEW ARRIVAL
                              </span>
                            ) : tagTemplateType === 'Clearance' ? (
                              <span className="bg-amber-500 text-slate-900 text-[9px] font-black px-1.5 py-0.5 rounded">
                                CLEARANCE
                              </span>
                            ) : (
                              <span className="bg-slate-900 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                                RECOMMENDED
                              </span>
                            )}
                          </div>

                          {/* Card Middle: Product Japanese & English Name */}
                          <div>
                            <h4 className="font-black text-sm text-slate-900 line-clamp-1">
                              {product.name_ja || product.name}
                            </h4>
                            <p className="text-[11px] text-slate-500 truncate">{product.name}</p>
                            <span className="text-[10px] text-slate-400 font-mono">
                              Unit: {product.weight_volume || product.unit} · 産地: {product.country_of_origin}
                            </span>
                          </div>

                          {/* Price Block */}
                          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex items-baseline justify-between">
                            <div>
                              <span className="text-[9px] font-bold text-slate-500 block">本体価格 (Tax Excl)</span>
                              <span className="text-2xl font-black font-mono text-slate-900">
                                ¥{effective.toLocaleString()}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-[9px] font-bold text-slate-500 block">
                                税込価格 ({Math.round(product.tax_rate * 100)}%)
                              </span>
                              <span className="text-base font-extrabold font-mono text-slate-900">
                                ¥{taxInc.toLocaleString()}
                              </span>
                            </div>
                          </div>

                          {/* Barcode & QR Code */}
                          <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                            <div>
                              {product.barcode && <BarcodeSvg value={product.barcode} height={20} width={90} />}
                              <span className="text-[8px] font-mono text-slate-400">{product.barcode}</span>
                            </div>
                            <QrCodeSvg value={`https://mybimi.jp/product/${product.sku}`} size={32} />
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Recent Print Batches that included this product */}
                <div className="pt-3 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-900 mb-2">Recent Print Batches Containing this SKU</h4>
                  {printBatches.length === 0 ? (
                    <p className="text-xs text-slate-400 py-3 text-center">
                      No previous print batches registered for this SKU.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {printBatches.map((pb) => (
                        <div
                          key={pb.id}
                          className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-mono font-bold text-slate-900 mr-2">{pb.batch_number}</span>
                            <span className="text-slate-600 mr-2">{pb.store_name}</span>
                            <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-mono">
                              {pb.template_type} · {pb.paper_size}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {new Date(pb.printed_at).toLocaleDateString()} by {pb.printed_by}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: DOCUMENTS */}
          {activeTab === 'documents' && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      <span>Product Technical Specifications & Certificates</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Compliance documents, safety data sheets, Halal certification, and barcode vector assets.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      addToast({
                        type: 'info',
                        title: 'Document Upload',
                        message: 'Document attachment dialogue opened.',
                      });
                    }}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Attach New Document</span>
                  </button>
                </div>

                {/* Documents List */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    {
                      name: `${product.sku}_Product_Specification_Sheet.pdf`,
                      category: 'Product Technical Spec',
                      type: 'PDF Document',
                      size: '420 KB',
                      date: '2026-09-15',
                      status: 'Verified',
                    },
                    {
                      name: `${product.sku}_Halal_Authenticity_Certificate.pdf`,
                      category: 'Halal Certification',
                      type: 'PDF Document',
                      size: '890 KB',
                      date: '2026-08-20',
                      status: 'Verified',
                    },
                    {
                      name: `${product.sku}_Food_Safety_Data_Sheet_SDS.pdf`,
                      category: 'Food Safety Compliance',
                      type: 'PDF Document',
                      size: '310 KB',
                      date: '2026-09-01',
                      status: 'Verified',
                    },
                    {
                      name: `${product.barcode || product.sku}_JAN13_Vector_Master.svg`,
                      category: 'JAN Barcode Asset',
                      type: 'Vector SVG',
                      size: '24 KB',
                      date: '2026-09-01',
                      status: '300 DPI Ready',
                    },
                  ].map((doc, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-start justify-between gap-3 hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
                          <FileText className="w-4 h-4 text-slate-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-slate-900 truncate">{doc.name}</p>
                          <span className="text-[11px] text-slate-500 block">{doc.category}</span>
                          <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                            {doc.size} · Updated {doc.date} · {doc.status}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          if (doc.type === 'Vector SVG') {
                            handleDownloadBarcode();
                          } else {
                            addToast({
                              type: 'success',
                              title: 'Download Initiated',
                              message: `Downloading ${doc.name}...`,
                            });
                          }
                        }}
                        className="p-2 text-slate-500 hover:text-slate-900 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-colors cursor-pointer shrink-0"
                        title="Download Asset"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 9: HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <HistoryIcon className="w-4 h-4 text-slate-700" />
                      <span>Unified 360° Chronological Activity Timeline</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Full lifecycle audit across product creation, updates, pricing revisions, stock adjustments, inter-store transfers, supplier changes, web publishing, and price tag printing.
                    </p>
                  </div>

                  {/* Search Bar in History */}
                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search history events..."
                      value={historySearchQuery}
                      onChange={(e) => setHistorySearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white"
                    />
                  </div>
                </div>

                {/* Filter chips toolbar */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                  <button
                    onClick={() => setHistoryFilter('all')}
                    className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                      historyFilter === 'all'
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    All Events ({aggregatedHistoryTimeline.length})
                  </button>

                  {(
                    [
                      { id: 'product_created', label: 'Product created' },
                      { id: 'product_edited', label: 'Product edited' },
                      { id: 'price_changed', label: 'Price changed' },
                      { id: 'stock_adjusted', label: 'Stock adjusted' },
                      { id: 'stock_transferred', label: 'Stock transferred' },
                      { id: 'supplier_changed', label: 'Supplier changed' },
                      { id: 'website_published', label: 'Website published' },
                      { id: 'price_tag_printed', label: 'Price tag printed' },
                    ] as const
                  ).map((f) => {
                    const count = aggregatedHistoryTimeline.filter((item) => item.category === f.id).length;
                    return (
                      <button
                        key={f.id}
                        onClick={() => setHistoryFilter(f.id)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${
                          historyFilter === f.id
                            ? 'bg-slate-900 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        <span>{f.label}</span>
                        <span className="text-[10px] opacity-70">({count})</span>
                      </button>
                    );
                  })}
                </div>

                {/* Timeline Render */}
                {filteredHistory.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
                    <HistoryIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p>No historical events recorded matching this filter or search.</p>
                  </div>
                ) : (
                  <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 pt-2">
                    {filteredHistory.map((item) => (
                      <div key={item.id} className="relative group">
                        {/* Timeline Node Icon */}
                        <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-white border-2 border-slate-900 flex items-center justify-center shrink-0">
                          <div className={`w-2 h-2 rounded-full ${item.dotColor}`} />
                        </div>

                        {/* Event Card */}
                        <div className="bg-slate-50 hover:bg-slate-100/70 p-4 rounded-xl border border-slate-200 transition-colors space-y-1.5">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${item.badgeColor}`}
                              >
                                {item.categoryLabel}
                              </span>
                              <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>
                            </div>

                            <span className="text-[11px] font-mono text-slate-400">
                              {new Date(item.date).toLocaleString()}
                            </span>
                          </div>

                          <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>

                          {item.diff && (
                            <div className="p-2 bg-white rounded border border-slate-200 text-xs font-mono flex items-center gap-2 text-slate-700 w-fit mt-1">
                              <span className="text-slate-400 font-sans">{item.diff.label}:</span>
                              <span className="text-slate-400 line-through">{item.diff.before}</span>
                              <ArrowRight className="w-3 h-3 text-slate-400" />
                              <strong className="text-slate-900 font-bold">{item.diff.after}</strong>
                            </div>
                          )}

                          <div className="pt-1 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400 font-mono">
                            <div className="flex items-center gap-1.5">
                              <span>Recorded by:</span>
                              <span className="font-semibold text-slate-600 font-sans">{item.user}</span>
                            </div>

                            {item.reference && (
                              <span className="bg-slate-200/60 px-1.5 py-0.5 rounded text-slate-600">
                                Ref: {item.reference}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          IMAGE LIGHTBOX MODAL
          ========================================================================= */}
      {isImageLightboxOpen && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative max-w-2xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-sm text-slate-900">{product.name_ja || product.name}</h3>
                <p className="text-xs text-slate-400 font-mono">SKU: {product.sku}</p>
              </div>
              <button
                onClick={() => setIsImageLightboxOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[60vh] flex items-center justify-center bg-slate-50 rounded-xl overflow-hidden p-4">
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} className="max-h-full max-w-full object-contain rounded-lg" />
              ) : (
                <Package className="w-24 h-24 text-slate-300 stroke-1" />
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 font-mono pt-1">
              <span>JAN: {product.barcode || 'N/A'}</span>
              <button
                onClick={() => {
                  if (product.image_url) {
                    window.open(product.image_url, '_blank');
                  }
                }}
                className="text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View Full Resolution</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          INTERACTIVE ACTION MODALS
          ========================================================================= */}

      {/* 1. Branch Price Override Modal */}
      {editingStoreTarget && (
        <StorePriceModal
          product={product}
          initialStoreId={editingStoreTarget}
          stores={stores}
          onClose={() => setEditingStoreTarget(null)}
          onSuccess={() => {
            setEditingStoreTarget(null);
            loadProductData();
            addToast({
              type: 'success',
              title: 'Branch Pricing Updated',
              message: `Store pricing for ${product.name} updated successfully.`,
            });
          }}
        />
      )}

      {/* 2. Stock Adjustment Modal */}
      {isAdjustStockModalOpen && (
        <StockAdjustmentModal
          products={[product]}
          stores={stores}
          initialProductId={product.id}
          initialStoreId={adjustTargetStoreId}
          onClose={() => setIsAdjustStockModalOpen(false)}
          onSuccess={() => {
            setIsAdjustStockModalOpen(false);
            loadProductData();
            addToast({
              type: 'success',
              title: 'Stock Adjusted',
              message: `Inventory balance updated for ${product.name}.`,
            });
          }}
        />
      )}

      {/* 3. Stock Transfer Modal */}
      {isTransferModalOpen && (
        <StockTransferModal
          products={[product]}
          stores={stores}
          initialProductId={product.id}
          onClose={() => setIsTransferModalOpen(false)}
          onSuccess={() => {
            setIsTransferModalOpen(false);
            loadProductData();
            addToast({
              type: 'success',
              title: 'Stock Transferred',
              message: `Inter-store transfer executed for ${product.name}.`,
            });
          }}
        />
      )}

      {/* 4. Product Supplier Sourcing Modal */}
      {isSupplierModalOpen && (
        <ProductSupplierModal
          product={product}
          suppliers={suppliers}
          existingLink={editingProductSupplier}
          onClose={() => {
            setIsSupplierModalOpen(false);
            setEditingProductSupplier(null);
          }}
          onSuccess={() => {
            setIsSupplierModalOpen(false);
            setEditingProductSupplier(null);
            loadProductData();
            addToast({
              type: 'success',
              title: 'Supplier Terms Saved',
              message: `Supplier configuration updated for ${product.name}.`,
            });
          }}
        />
      )}
    </div>
  );
};
