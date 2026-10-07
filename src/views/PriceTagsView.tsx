import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Tag,
  Printer,
  FileDown,
  CheckSquare,
  Square,
  Sparkles,
  Layers,
  Store as StoreIcon,
  Search,
  Filter,
  Save,
  RotateCcw,
  History,
  Eye,
  Settings2,
  Sliders,
  Check,
  AlertCircle,
  HelpCircle,
  X,
  Plus,
  Trash2,
  Copy,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  QrCode,
  Barcode as BarcodeIcon,
  Flame,
  BadgePercent,
  Calendar,
  Scissors,
  Download,
  Loader2,
  Palette,
  Type,
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { dataService } from '../services/dataService';
import {
  Product,
  StoreProduct,
  StoreId,
  PaperSize,
  PriceTagTemplate,
  PriceTagTemplateType,
  PriceTagContentConfig,
  PrintBatchRecord,
  ProductStorePrice,
  Category,
  CuttingGuideStyle,
  CardDesignTheme,
} from '../types/database';
import { BarcodeSvg } from '../components/common/BarcodeSvg';
import { QrCodeSvg } from '../components/common/QrCodeSvg';
import { BimiOfficialPriceTag } from '../components/pricing/BimiOfficialPriceTag';
import { PageCuttingGuides } from '../components/pricing/PageCuttingGuides';
import {
  CardDesignEditorModal,
  DEFAULT_DESIGN_THEME,
} from '../components/pricing/CardDesignEditorModal';

// Paper size card layouts presets (A5=4 tags, A4=8 tags, A3=16 tags)
const LAYOUT_OPTIONS: Record<PaperSize, number[]> = {
  A4: [8, 4, 2, 1],
  A5: [4, 2, 1],
  A3: [16, 8, 4, 2],
};

const DEFAULT_CONFIG: PriceTagContentConfig = {
  showLogo: true,
  showProductImage: true,
  showJapaneseName: true,
  showEnglishName: true,
  showWeightVolume: true,
  showOrigin: true,
  showRegularPrice: true,
  showOfferPrice: true,
  showTaxIncluded: true,
  showBarcode: true,
  showQrCode: true,
  showNewArrivalBadge: true,
  showOfferBadge: true,
  showStoreName: true,
  showShelfLocation: true,
  showCutLines: true,
};

export const PriceTagsView: React.FC = () => {
  const { stores, selectedStoreId, currentStore, addToast } = useApp();
  const { profile } = useAuth();

  // Data states
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [storeProducts, setStoreProducts] = useState<StoreProduct[]>([]);
  const [productStorePrices, setProductStorePrices] = useState<ProductStorePrice[]>([]);
  const [templates, setTemplates] = useState<PriceTagTemplate[]>([]);
  const [printBatches, setPrintBatches] = useState<PrintBatchRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Studio Configuration State
  const [targetStoreId, setTargetStoreId] = useState<StoreId>(selectedStoreId || 'store-shin-koiwa');
  const [paperSize, setPaperSize] = useState<PaperSize>('A4');
  const [cardsPerPage, setCardsPerPage] = useState<number>(8);
  const [selectedTemplateType, setSelectedTemplateType] = useState<PriceTagTemplateType>('Normal');
  const [config, setConfig] = useState<PriceTagContentConfig>(DEFAULT_CONFIG);
  const [activeDesignTheme, setActiveDesignTheme] = useState<CardDesignTheme>(DEFAULT_DESIGN_THEME);
  const [customBadgeText, setCustomBadgeText] = useState<string>('BIMI SPECIAL');
  const [cuttingStyle, setCuttingStyle] = useState<CuttingGuideStyle>('crop-marks');
  const [showMarginGuides, setShowMarginGuides] = useState<boolean>(true);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<string>('');

  // Product Selection & Filter State
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [stockOnlyFilter, setStockOnlyFilter] = useState(false);

  // Modals & Panels
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [isDesignEditorOpen, setIsDesignEditorOpen] = useState(false);
  const [isBatchHistoryOpen, setIsBatchHistoryOpen] = useState(false);
  const [zoomMode, setZoomMode] = useState<'fit' | '100' | '75'>('fit');
  const sheetContainerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  useEffect(() => {
    if (!sheetContainerRef.current) return;
    const updateWidth = () => {
      if (sheetContainerRef.current) {
        setContainerWidth(sheetContainerRef.current.clientWidth);
      }
    };
    updateWidth();
    const ro = new ResizeObserver(updateWidth);
    ro.observe(sheetContainerRef.current);
    window.addEventListener('resize', updateWidth);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateWidth);
    };
  }, []);

  // Load initial data
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [prodList, catList, spList, pspList, tmplList, batchList] = await Promise.all([
        dataService.getProducts(),
        dataService.getCategories(),
        dataService.getStoreProducts(),
        dataService.getProductStorePrices(),
        dataService.getPriceTagTemplates(),
        dataService.getPrintBatches(),
      ]);
      setProducts(prodList);
      setCategories(catList);
      setStoreProducts(spList);
      setProductStorePrices(pspList);
      setTemplates(tmplList);
      setPrintBatches(batchList);

      // Select first 6 products by default if none selected
      if (selectedProductIds.length === 0 && prodList.length > 0) {
        setSelectedProductIds(prodList.slice(0, 6).map((p) => p.id));
      }
    } catch (err) {
      console.error('Failed to load Price Tag Studio data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Sync store selection if parent app changes
  useEffect(() => {
    if (selectedStoreId && stores.some((s) => s.id === selectedStoreId)) {
      setTargetStoreId(selectedStoreId);
    }
  }, [selectedStoreId, stores]);

  // Adjust cards per page when paper size changes (A5=4, A4=8, A3=16)
  const handlePaperSizeChange = (newSize: PaperSize) => {
    setPaperSize(newSize);
    if (newSize === 'A5') {
      setCardsPerPage(4);
    } else if (newSize === 'A4') {
      setCardsPerPage(8);
    } else if (newSize === 'A3') {
      setCardsPerPage(16);
    }
  };

  // Template switch handler
  const handleSelectTemplate = (type: PriceTagTemplateType) => {
    setSelectedTemplateType(type);
    const matched = templates.find((t) => t.type === type);
    if (matched) {
      setConfig({ ...matched.config });
      if (matched.paper_size) setPaperSize(matched.paper_size);
      if (matched.cards_per_page) setCardsPerPage(matched.cards_per_page);
      if (matched.custom_badge_text) setCustomBadgeText(matched.custom_badge_text);
      if (matched.config?.designTheme) {
        setActiveDesignTheme(matched.config.designTheme);
      }
    } else {
      // Preset defaults by type
      switch (type) {
        case 'Offer':
          setConfig({
            ...DEFAULT_CONFIG,
            showOfferPrice: true,
            showOfferBadge: true,
            showNewArrivalBadge: false,
          });
          setActiveDesignTheme((prev) => ({
            ...prev,
            themeName: 'Hot Deal POP / 特売',
            ribbonColor: '#DC2626',
            topBarColor: '#F59E0B',
            priceColor: '#B91C1C',
            footerLeftColor: '#DC2626',
            footerRightColor: '#F59E0B',
            ribbonJaText: '特売・セール',
            ribbonEnText: 'Special Offer',
          }));
          break;
        case 'New Arrival':
          setConfig({
            ...DEFAULT_CONFIG,
            showOfferPrice: false,
            showOfferBadge: false,
            showNewArrivalBadge: true,
          });
          setActiveDesignTheme((prev) => ({
            ...prev,
            themeName: 'New Arrival / 新登場',
            ribbonColor: '#2563EB',
            topBarColor: '#06B6D4',
            priceColor: '#DC2626',
            footerLeftColor: '#2563EB',
            footerRightColor: '#06B6D4',
            ribbonJaText: '新登場・入荷',
            ribbonEnText: 'New Arrival',
          }));
          break;
        case 'Clearance':
          setConfig({
            ...DEFAULT_CONFIG,
            showOfferPrice: true,
            showOfferBadge: true,
            showNewArrivalBadge: false,
          });
          setCustomBadgeText('クリアランス / CLEARANCE');
          setActiveDesignTheme((prev) => ({
            ...prev,
            themeName: 'Clearance / クリアランス',
            ribbonColor: '#7F1D1D',
            topBarColor: '#EF4444',
            priceColor: '#DC2626',
            footerLeftColor: '#7F1D1D',
            footerRightColor: '#EF4444',
            ribbonJaText: 'クリアランス',
            ribbonEnText: 'Clearance Sale',
          }));
          break;
        case 'Normal':
        default:
          setConfig({
            ...DEFAULT_CONFIG,
            showOfferPrice: false,
            showOfferBadge: false,
            showNewArrivalBadge: false,
          });
          setActiveDesignTheme((prev) => ({
            ...prev,
            themeName: 'BIMI Official Standard',
            ribbonColor: '#005A36',
            topBarColor: '#F25C05',
            priceColor: '#D6001C',
            footerLeftColor: '#005A36',
            footerRightColor: '#F25C05',
            ribbonJaText: '新鮮で美味しい',
            ribbonEnText: 'Fresh & Delicious',
          }));
          break;
      }
    }
  };

  const activeStore = useMemo(() => {
    return stores.find((s) => s.id === targetStoreId) || stores[0];
  }, [stores, targetStoreId]);

  // STORE DETERMINED PRICING:
  // If Shin-Koiwa is selected, use Shin-Koiwa price. If Yotsugi is selected, use Yotsugi price.
  // Never accidentally use another store's price!
  const getProductStorePriceInfo = (p: Product) => {
    // 1. Check dedicated product_store_prices table for exact match
    const psp = productStorePrices.find(
      (item) => item.product_id === p.id && item.store_id === targetStoreId && item.is_active
    );

    // 2. Check store_products table
    const sp = storeProducts.find(
      (item) => item.product_id === p.id && item.store_id === targetStoreId
    );

    const regularPrice = psp?.regular_price ?? sp?.retail_price ?? p.base_retail_price;
    const offerPrice = psp?.offer_price ?? null;
    const isOfferActive = offerPrice !== null && offerPrice < regularPrice;
    const effectivePrice = isOfferActive && config.showOfferPrice ? offerPrice : regularPrice;
    const taxRate = psp?.tax_rate ?? p.tax_rate ?? 0.08;
    const taxIncludedPrice = Math.round(effectivePrice * (1 + taxRate));
    const location = sp?.shelf_location || 'Sales Floor Shelf';
    const currentStock = sp?.stock_quantity ?? 0;

    return {
      regularPrice,
      offerPrice,
      isOfferActive,
      effectivePrice,
      taxRate,
      taxIncludedPrice,
      location,
      currentStock,
      hasStoreOverride: !!psp || (sp && sp.retail_price !== p.base_retail_price),
    };
  };

  // Filtered product catalog for selection
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.name_ja.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.barcode.includes(searchQuery);

      const matchesCat =
        selectedCategoryId === 'all' || p.category_id === selectedCategoryId;

      const sp = storeProducts.find(
        (item) => item.product_id === p.id && item.store_id === targetStoreId
      );
      const matchesStock = !stockOnlyFilter || (sp && sp.stock_quantity > 0);

      return matchesSearch && matchesCat && matchesStock;
    });
  }, [products, searchQuery, selectedCategoryId, stockOnlyFilter, storeProducts, targetStoreId]);

  // Selected products list for preview
  const selectedProducts = useMemo(() => {
    return products.filter((p) => selectedProductIds.includes(p.id));
  }, [products, selectedProductIds]);

  // Pagination calculation: split selected products into physical pages
  const pages = useMemo(() => {
    const list: Product[][] = [];
    for (let i = 0; i < selectedProducts.length; i += cardsPerPage) {
      list.push(selectedProducts.slice(i, i + cardsPerPage));
    }
    return list;
  }, [selectedProducts, cardsPerPage]);

  // Toggle selection
  const toggleSelectProduct = (id: string) => {
    if (selectedProductIds.includes(id)) {
      setSelectedProductIds(selectedProductIds.filter((pId) => pId !== id));
    } else {
      setSelectedProductIds([...selectedProductIds, id]);
    }
  };

  const selectAllFiltered = () => {
    const filteredIds = filteredProducts.map((p) => p.id);
    const allSelected = filteredIds.every((id) => selectedProductIds.includes(id));
    if (allSelected) {
      setSelectedProductIds(selectedProductIds.filter((id) => !filteredIds.includes(id)));
    } else {
      const merged = Array.from(new Set([...selectedProductIds, ...filteredIds]));
      setSelectedProductIds(merged);
    }
  };

  const clearSelection = () => {
    setSelectedProductIds([]);
  };

  // Direct Browser Print Handler
  const handlePrint = async () => {
    if (selectedProducts.length === 0) {
      addToast({
        type: 'warning',
        title: 'No Products Selected',
        message: 'Please select at least one product to generate and print price tags.',
      });
      return;
    }

    // Record print batch record for audit and reprint
    const batchNumber = `BATCH-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(
      100 + Math.random() * 900
    )}`;

    try {
      const recorded = await dataService.recordPrintBatch({
        batch_number: batchNumber,
        store_id: targetStoreId,
        store_name: activeStore?.name || 'My BIMI Branch',
        template_type: selectedTemplateType,
        paper_size: paperSize,
        cards_per_page: cardsPerPage,
        total_cards: selectedProducts.length,
        total_pages: pages.length,
        product_ids: selectedProducts.map((p) => p.id),
        product_names: selectedProducts.map((p) => p.name),
        printed_by: profile?.name || 'Store Staff',
      });

      setPrintBatches((prev) => [recorded, ...prev]);

      addToast({
        type: 'success',
        title: 'Print Batch Generated',
        message: `Registered ${batchNumber} (${selectedProducts.length} tags · 90x65mm). Opening print dialog...`,
      });

      // Trigger browser print dialog with print-friendly CSS
      setTimeout(() => {
        window.print();
      }, 200);
    } catch (err) {
      console.error('Failed to record print batch:', err);
      window.print();
    }
  };

  // Direct High-Resolution PDF File Generator & Downloader (using jsPDF + html2canvas)
  const handleDirectPdfExport = async () => {
    if (selectedProducts.length === 0) {
      addToast({
        type: 'warning',
        title: 'No Products Selected',
        message: 'Please select at least one product to generate PDF.',
      });
      return;
    }

    setIsExportingPdf(true);
    setExportProgress('Preparing sheets for 90x65mm high-resolution PDF...');

    try {
      const batchNumber = `BATCH-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(
        100 + Math.random() * 900
      )}`;

      await dataService.recordPrintBatch({
        batch_number: batchNumber,
        store_id: targetStoreId,
        store_name: activeStore?.name || 'My BIMI Branch',
        template_type: selectedTemplateType,
        paper_size: paperSize,
        cards_per_page: cardsPerPage,
        total_cards: selectedProducts.length,
        total_pages: pages.length,
        product_ids: selectedProducts.map((p) => p.id),
        product_names: selectedProducts.map((p) => p.name),
        printed_by: profile?.name || 'Store Staff',
      });

      const pdf = new jsPDF({
        orientation: paperSize === 'A3' ? 'landscape' : 'portrait',
        unit: 'mm',
        format: paperSize.toLowerCase() as any,
        compress: true,
      });

      const pageElements = document.querySelectorAll('.print-page');

      for (let i = 0; i < pageElements.length; i++) {
        setExportProgress(`Rendering high-res page ${i + 1} of ${pageElements.length}...`);
        const el = pageElements[i] as HTMLElement;

        // Temporarily hide no-print elements on the node if any
        const noPrintElements = el.querySelectorAll('.no-print');
        noPrintElements.forEach((np) => ((np as HTMLElement).style.display = 'none'));

        const canvas = await html2canvas(el, {
          scale: 2.2, // ~300 DPI high resolution
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false,
        });

        // Restore no-print elements
        noPrintElements.forEach((np) => ((np as HTMLElement).style.display = ''));

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        if (i > 0) {
          pdf.addPage(paperSize.toLowerCase(), paperSize === 'A3' ? 'landscape' : 'portrait');
        }

        const pageWidth = paperSize === 'A3' ? 420 : 210;
        const pageHeight = paperSize === 'A5' ? 148.5 : 297;
        pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight);
      }

      const fileName = `MyBIMI_PriceTags_90x65mm_${activeStore?.code || 'TOKYO'}_${batchNumber}.pdf`;
      pdf.save(fileName);

      addToast({
        type: 'success',
        title: 'Direct PDF Generated & Downloaded',
        message: `Saved ${fileName} (90x65mm cards, ${selectedProducts.length} tags across ${pages.length} sheets).`,
      });
    } catch (err) {
      console.error('Failed to export direct PDF:', err);
      addToast({
        type: 'error',
        title: 'PDF Export Failed',
        message: 'Could not generate direct PDF file. Falling back to browser print dialog.',
      });
      window.print();
    } finally {
      setIsExportingPdf(false);
      setExportProgress('');
    }
  };

  // Save Custom Template
  const handleSaveTemplate = async () => {
    if (!newTemplateName.trim()) {
      addToast({
        type: 'warning',
        title: 'Template Name Required',
        message: 'Please provide a name for this custom price card template.',
      });
      return;
    }

    try {
      const saved = await dataService.savePriceTagTemplate({
        name: newTemplateName.trim(),
        type: selectedTemplateType,
        paper_size: paperSize,
        cards_per_page: cardsPerPage,
        orientation: 'portrait',
        config: {
          ...config,
          designTheme: activeDesignTheme,
        },
        custom_badge_text: customBadgeText,
      });

      setTemplates((prev) => {
        const idx = prev.findIndex((t) => t.id === saved.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = saved;
          return updated;
        }
        return [...prev, saved];
      });

      addToast({
        type: 'success',
        title: 'Template Saved',
        message: `Saved "${saved.name}" to your Price Tag Studio presets.`,
      });
      setIsTemplateModalOpen(false);
      setNewTemplateName('');
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Save Error',
        message: 'Could not save the custom template.',
      });
    }
  };

  // Card Design Theme handlers (Applied from CardDesignEditorModal)
  const handleApplyDesignTheme = (theme: CardDesignTheme) => {
    setActiveDesignTheme(theme);
    setConfig((prev) => ({
      ...prev,
      designTheme: theme,
    }));
    addToast({
      type: 'success',
      title: 'Card Design Updated',
      message: `Applied "${theme.themeName || 'Custom'}" styling and font sizes to all cards.`,
    });
  };

  const handleSaveThemeAsTemplate = async (templateName: string, themeToSave: CardDesignTheme) => {
    try {
      const saved = await dataService.savePriceTagTemplate({
        name: templateName,
        type: 'Custom',
        paper_size: paperSize,
        cards_per_page: cardsPerPage,
        orientation: 'portrait',
        config: {
          ...config,
          designTheme: themeToSave,
        },
        custom_badge_text: themeToSave.ribbonJaText || customBadgeText,
      });

      setTemplates((prev) => {
        const idx = prev.findIndex((t) => t.id === saved.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = saved;
          return updated;
        }
        return [saved, ...prev];
      });

      setActiveDesignTheme(themeToSave);
      addToast({
        type: 'success',
        title: 'Design Preset Saved',
        message: `Saved "${templateName}" to your template presets.`,
      });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Save Error',
        message: 'Could not save custom card design template.',
      });
    }
  };

  // Reprint Previous Batch
  const handleReprintBatch = (batch: PrintBatchRecord) => {
    setTargetStoreId(batch.store_id);
    setPaperSize(batch.paper_size);
    setCardsPerPage(batch.cards_per_page);
    handleSelectTemplate(batch.template_type);

    // Restore products from batch
    const availableBatchProdIds = batch.product_ids.filter((id) =>
      products.some((p) => p.id === id)
    );
    setSelectedProductIds(availableBatchProdIds);

    setIsBatchHistoryOpen(false);
    addToast({
      type: 'info',
      title: 'Batch Loaded for Reprint',
      message: `Restored ${batch.batch_number} (${availableBatchProdIds.length} products) at ${batch.store_name}.`,
    });
  };

  // Grid styling for preview sheet (A5=2 cols x 2 rows, A4=2 cols x 4 rows, A3=4 cols x 4 rows)
  const getGridColsClass = (count: number) => {
    if (paperSize === 'A3') {
      return count === 16 ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-2';
    }
    if (paperSize === 'A5') {
      return count === 4 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1';
    }
    // A4 (8 cards = 2 cols x 4 rows)
    return count === 8 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1';
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Action Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 no-print">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-emerald-600 text-white rounded-lg shadow-2xs">
              <Tag className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Price Tag Studio & POP Signage
            </h1>
            <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">
              Multi-Store Sync
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Generate compliant Japanese retail shelf talkers, promotional POPs, and JAN barcodes.
            The selected store directly determines the printed retail price.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Card Design Editor Button */}
          <button
            onClick={() => setIsDesignEditorOpen(true)}
            className="px-3 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Open Card Design Editor to customize colors, text alternatives & font sizes"
          >
            <Palette className="w-3.5 h-3.5 text-emerald-600" />
            <span>Card Design Editor</span>
            <span className="px-1.5 py-0.2 text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 rounded">
              {activeDesignTheme.themeName || 'Custom'}
            </span>
          </button>

          {/* History / Reprint Button */}
          <button
            onClick={() => setIsBatchHistoryOpen(true)}
            className="px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <History className="w-3.5 h-3.5 text-slate-500" />
            <span>Reprint Previous Batch ({printBatches.length})</span>
          </button>

          {/* Save Template Button */}
          <button
            onClick={() => setIsTemplateModalOpen(true)}
            className="px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5 text-slate-500" />
            <span>Save Template</span>
          </button>

          {/* Direct PDF File Download Button */}
          <button
            onClick={handleDirectPdfExport}
            disabled={selectedProducts.length === 0 || isExportingPdf}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 rounded-lg shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            {isExportingPdf ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FileDown className="w-3.5 h-3.5" />
            )}
            <span>{isExportingPdf ? 'Exporting PDF...' : 'Download Direct PDF'}</span>
          </button>

          {/* Direct Browser Print Button */}
          <button
            onClick={handlePrint}
            disabled={selectedProducts.length === 0 || isExportingPdf}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-lg shadow-sm transition-all flex items-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Direct Print ({selectedProducts.length} Tags · {pages.length} A4 Pages)</span>
          </button>
        </div>
      </div>

      {/* Control Configuration Bar */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs no-print space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Target Branch Selection (CRITICAL) */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <StoreIcon className="w-3.5 h-3.5 text-emerald-600" />
              <span>Target Store (Determines Printed Price)</span>
            </label>
            <div className="relative">
              <select
                value={targetStoreId}
                onChange={(e) => setTargetStoreId(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
              >
                {stores.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name} ({st.code})
                  </option>
                ))}
              </select>
            </div>
            <p className="text-[10px] text-emerald-700 font-medium">
              ✓ Using branch-specific price table for {activeStore?.name}
            </p>
          </div>

          {/* 2. Paper Size & Card Size Calibration */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span>Paper & Card Size</span>
            </label>
            <div className="flex bg-slate-100 p-1 rounded-lg">
              {(['A4', 'A5', 'A3'] as PaperSize[]).map((size) => (
                <button
                  key={size}
                  onClick={() => handlePaperSizeChange(size)}
                  className={`flex-1 py-1 text-xs font-semibold rounded-md transition-colors ${
                    paperSize === size
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between text-[10px] text-emerald-700 font-medium">
              <span>Card: 90mm × 65mm (Ratio 1.38)</span>
              <span className="font-mono bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                8 Tags / A4
              </span>
            </div>
          </div>

          {/* 3. Page Cutting Options (CRITICAL) */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Scissors className="w-3.5 h-3.5 text-emerald-600" />
              <span>Page Cutting Options</span>
            </label>
            <select
              value={cuttingStyle}
              onChange={(e) => setCuttingStyle(e.target.value as CuttingGuideStyle)}
              className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none"
            >
              <option value="crop-marks">Crop Marks & Margin Guides (Standard)</option>
              <option value="dashed">Full Dashed Grid Lines (Easy Scissors)</option>
              <option value="solid">Fine Solid Hairlines (0.5pt)</option>
              <option value="none">None (Borderless Sheet)</option>
            </select>
            <p className="text-[10px] text-emerald-700 font-medium">
              {cuttingStyle === 'crop-marks'
                ? '✓ Outer trim marks & center crosshairs for guillotine'
                : cuttingStyle === 'dashed'
                ? '✓ Dotted cut guide around each 90x65mm card'
                : cuttingStyle === 'solid'
                ? '✓ 0.5pt solid hairline along borders'
                : '✓ Edge-to-edge tags without cut indicators'}
            </p>
          </div>

          {/* 4. Template Preset Selection */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Tag Template</span>
            </label>
            <select
              value={selectedTemplateType}
              onChange={(e) => handleSelectTemplate(e.target.value as PriceTagTemplateType)}
              className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none"
            >
              <option value="Normal">Normal (Standard Shelf Talker)</option>
              <option value="Offer">Offer (Promotional Bargain POP)</option>
              <option value="New Arrival">New Arrival (Spotlight Tag)</option>
              <option value="Clearance">Clearance (Inventory Markdown)</option>
              <option value="Custom">Custom (Manual Config)</option>
            </select>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-400">
                {pages.length} sheet{pages.length !== 1 ? 's' : ''} for {selectedProducts.length} items
              </span>
              <button
                onClick={() => setIsDesignEditorOpen(true)}
                className="text-emerald-700 hover:text-emerald-900 font-semibold flex items-center gap-0.5 cursor-pointer"
              >
                <Palette className="w-3 h-3 text-emerald-600" />
                <span>Card Editor →</span>
              </button>
            </div>
          </div>
        </div>

        {/* Detailed Tag Content Toggles */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1 font-semibold text-slate-700">
            <Settings2 className="w-3.5 h-3.5 text-slate-400" />
            <span>Tag Content:</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 hover:text-slate-900">
              <input
                type="checkbox"
                checked={config.showLogo}
                onChange={(e) => setConfig({ ...config, showLogo: e.target.checked })}
                className="rounded border-slate-300 text-slate-900 focus:ring-0"
              />
              <span>My BIMI Logo</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 hover:text-slate-900">
              <input
                type="checkbox"
                checked={config.showProductImage}
                onChange={(e) => setConfig({ ...config, showProductImage: e.target.checked })}
                className="rounded border-slate-300 text-slate-900 focus:ring-0"
              />
              <span>Product Image</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 hover:text-slate-900">
              <input
                type="checkbox"
                checked={config.showJapaneseName}
                onChange={(e) => setConfig({ ...config, showJapaneseName: e.target.checked })}
                className="rounded border-slate-300 text-slate-900 focus:ring-0"
              />
              <span>Japanese Name</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 hover:text-slate-900">
              <input
                type="checkbox"
                checked={config.showOrigin}
                onChange={(e) => setConfig({ ...config, showOrigin: e.target.checked })}
                className="rounded border-slate-300 text-slate-900 focus:ring-0"
              />
              <span>Country Origin</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 hover:text-slate-900">
              <input
                type="checkbox"
                checked={config.showOfferPrice}
                onChange={(e) => setConfig({ ...config, showOfferPrice: e.target.checked })}
                className="rounded border-slate-300 text-slate-900 focus:ring-0"
              />
              <span>Offer / Sale Price</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 hover:text-slate-900">
              <input
                type="checkbox"
                checked={config.showTaxIncluded}
                onChange={(e) => setConfig({ ...config, showTaxIncluded: e.target.checked })}
                className="rounded border-slate-300 text-slate-900 focus:ring-0"
              />
              <span>税込 (Tax Included)</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 hover:text-slate-900">
              <input
                type="checkbox"
                checked={config.showBarcode}
                onChange={(e) => setConfig({ ...config, showBarcode: e.target.checked })}
                className="rounded border-slate-300 text-slate-900 focus:ring-0"
              />
              <span>Barcode (JAN-13)</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 hover:text-slate-900">
              <input
                type="checkbox"
                checked={config.showQrCode}
                onChange={(e) => setConfig({ ...config, showQrCode: e.target.checked })}
                className="rounded border-slate-300 text-slate-900 focus:ring-0"
              />
              <span>QR Code</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 hover:text-slate-900">
              <input
                type="checkbox"
                checked={config.showCutLines}
                onChange={(e) => setConfig({ ...config, showCutLines: e.target.checked })}
                className="rounded border-slate-300 text-slate-900 focus:ring-0"
              />
              <span>Cut Lines</span>
            </label>
          </div>

          {/* Quick Title Limit & Overflow Controls */}
          <div className="flex items-center gap-1.5 bg-slate-100/90 p-1 rounded-lg border border-slate-200/60 shrink-0">
            <span className="text-[11px] font-bold text-slate-600 px-1.5 flex items-center gap-1">
              <Type className="w-3 h-3 text-emerald-600" />
              <span>Title Limit:</span>
            </span>
            {(['auto', '1-line', '2-lines'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => {
                  const updatedTheme: CardDesignTheme = {
                    ...activeDesignTheme,
                    titleLineLimit: mode,
                  };
                  setActiveDesignTheme(updatedTheme);
                  setConfig((prev) => ({ ...prev, designTheme: updatedTheme }));
                }}
                className={`px-2.5 py-0.5 text-[11px] font-semibold rounded transition-all cursor-pointer ${
                  (activeDesignTheme.titleLineLimit || 'auto') === mode
                    ? 'bg-white text-emerald-800 shadow-2xs font-bold border border-emerald-300'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title={
                  mode === 'auto'
                    ? 'Auto-Fit (Smart): Scales down long titles so Japanese fits cleanly on 1 line up to 23 chars, English 1 line'
                    : mode === '1-line'
                    ? 'Strict 1-Line: Truncates long titles with (...) to preserve exact mockup spacing'
                    : '2-Lines Max: Allows titles to wrap into 2 lines with auto-shrink'
                }
              >
                {mode === 'auto' ? 'Auto-Fit' : mode === '1-line' ? 'Strict 1-Line' : '2-Lines'}
              </button>
            ))}
          </div>
        </div>
      </div>


      {/* Main Workspace: Left Column (Catalog Selection) & Right Column (Print Sheet Preview) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 price-tags-workspace">
        {/* Left Column: Product Selector & Filtering (4 cols) */}
        <div className="price-tags-catalog-col lg:col-span-4 space-y-4 no-print">
          <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs space-y-3">
            {/* Header with counts and shortcuts */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-xs font-bold text-slate-900">Product Studio Catalog</h3>
                <p className="text-[11px] text-slate-400">Select items to generate price tags</p>
              </div>
              <span className="px-2 py-0.5 text-xs font-mono font-semibold bg-slate-100 text-slate-800 rounded-md">
                {selectedProductIds.length} / {products.length}
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search name, Japanese, SKU, JAN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
              >
                <option value="all">All Categories ({categories.length})</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.name_ja})
                  </option>
                ))}
              </select>
            </div>

            {/* Quick action buttons */}
            <div className="flex items-center justify-between text-xs pt-1">
              <button
                onClick={selectAllFiltered}
                className="text-emerald-700 hover:text-emerald-800 font-medium flex items-center gap-1 cursor-pointer"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>Select Filtered ({filteredProducts.length})</span>
              </button>
              <button
                onClick={clearSelection}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                Clear Selection
              </button>
            </div>

            {/* Scrollable Products Checklist */}
            <div className="space-y-1.5 max-h-[560px] overflow-y-auto pr-1">
              {filteredProducts.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No products matched the search query or category filter.
                </div>
              ) : (
                filteredProducts.map((p) => {
                  const isSelected = selectedProductIds.includes(p.id);
                  const pricing = getProductStorePriceInfo(p);

                  return (
                    <div
                      key={p.id}
                      onClick={() => toggleSelectProduct(p.id)}
                      className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all flex items-center justify-between ${
                        isSelected
                          ? 'border-emerald-300 bg-emerald-50/50 text-slate-900 shadow-2xs'
                          : 'border-slate-100 hover:border-slate-200 bg-white text-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate mr-2">
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-300 shrink-0" />
                        )}

                        <div className="truncate">
                          <p className="font-semibold text-slate-900 truncate">
                            {p.name_ja || p.name}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate">{p.name}</p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                            <span>{p.sku}</span>
                            <span>·</span>
                            <span>{p.weight_volume || p.unit}</span>
                            {pricing.hasStoreOverride && (
                              <span className="text-emerald-600 font-sans font-medium">
                                • Branch Price
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        {pricing.isOfferActive && config.showOfferPrice ? (
                          <div>
                            <span className="text-[10px] text-slate-400 line-through font-mono block">
                              ¥{Math.round(pricing.regularPrice).toLocaleString()}
                            </span>
                            <span className="font-mono font-bold text-red-600 text-xs">
                              ¥{Math.round(pricing.offerPrice || 0).toLocaleString()}
                            </span>
                          </div>
                        ) : (
                          <span className="font-mono font-bold text-slate-900 text-xs">
                            ¥{Math.round(pricing.regularPrice).toLocaleString()}
                          </span>
                        )}
                        <span className="text-[9px] text-slate-400 block font-mono">
                          込¥{Math.round(pricing.taxIncludedPrice).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Live Printable Sheet Canvas (8 cols) */}
        <div className="price-tags-sheet-col lg:col-span-8 flex flex-col space-y-4">
          {/* Sheet Preview Navigation Banner (no-print) */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3 no-print">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs text-slate-900">Print Preview:</span>
              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs font-mono font-medium rounded">
                {paperSize} Portrait
              </span>
              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs font-mono font-medium rounded">
                {cardsPerPage} cards / page
              </span>
              <span className="text-xs text-slate-500">
                · {selectedProducts.length} tags across {pages.length} page{pages.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsDesignEditorOpen(true)}
                className="px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Open Card Design Editor to customize colors, text alternatives & font sizes"
              >
                <Palette className="w-3.5 h-3.5" />
                <span>Card Design & Font Editor</span>
              </button>

              {/* Responsive Zoom Controls */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setZoomMode('fit')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                    zoomMode === 'fit'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Fit sheet to container width without horizontal overflow"
                >
                  Fit View
                </button>
                <button
                  type="button"
                  onClick={() => setZoomMode('100')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                    zoomMode === '100'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Actual print scale (100%)"
                >
                  100%
                </button>
                <button
                  type="button"
                  onClick={() => setZoomMode('75')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                    zoomMode === '75'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="75% scale"
                >
                  75%
                </button>
              </div>
            </div>
          </div>

          {/* Printable Sheet Pages Container */}
          <div
            ref={sheetContainerRef}
            className="printable-sheet-container space-y-8 overflow-x-auto w-full pb-6"
          >
            {pages.length === 0 ? (
              <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-16 text-center space-y-3 no-print">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                  <Tag className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">No Products Selected</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Select products from the catalog on the left to generate shelf price tags.
                </p>
                <button
                  type="button"
                  onClick={() => setSelectedProductIds(products.slice(0, 8).map((p) => p.id))}
                  className="px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg cursor-pointer transition-colors"
                >
                  Select Sample 8 Products
                </button>
              </div>
            ) : (
              pages.map((pageProducts, pageIdx) => {
                const paperWidthPx = paperSize === 'A3' ? 1587 : 794;
                const paperHeightPx = paperSize === 'A5' ? 561 : 1123;
                const paperWidthCss = paperSize === 'A4' ? '210mm' : paperSize === 'A5' ? '210mm' : '420mm';
                const paperHeightCss = paperSize === 'A4' ? '297mm' : paperSize === 'A5' ? '148.5mm' : '297mm';
                const paperPaddingCss = paperSize === 'A4' ? '18.5mm 15mm' : paperSize === 'A5' ? '9.25mm 15mm' : '18.5mm 30mm';

                const fitScale = containerWidth > 100 ? Math.min(1, (containerWidth - 28) / paperWidthPx) : 0.85;
                const previewScale = zoomMode === '100' ? 1 : zoomMode === '75' ? 0.75 : fitScale;

                return (
                  <div
                    key={`page-block-${pageIdx}`}
                    className="sheet-preview-block flex flex-col items-center w-full"
                    style={{
                      minHeight: `${Math.round(paperHeightPx * previewScale + 44)}px`,
                    }}
                  >
                    {/* Page header banner for on-screen preview (OUTSIDE print-page so internal dimensions stay exact) */}
                    <div
                      className="sheet-preview-header w-full flex items-center justify-between pb-2 mb-2 no-print text-[11px] text-slate-500"
                      style={{
                        maxWidth: `${Math.round(paperWidthPx * previewScale)}px`,
                      }}
                    >
                      <span className="font-mono font-semibold text-slate-700">
                        PAGE {pageIdx + 1} OF {pages.length} · {activeStore?.name}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[10px]">
                          Tag: 90mm × 65mm (Ratio 1.38)
                        </span>
                        <span className="font-mono font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px]">
                          {paperSize} Sheet · {cardsPerPage} Tags/Page
                        </span>
                      </div>
                    </div>

                    {/* Scaled Preview Frame */}
                    <div
                      className="sheet-scale-wrapper origin-top transition-transform"
                      style={{
                        transform: `scale(${previewScale})`,
                        transformOrigin: 'top center',
                        width: paperWidthCss,
                        height: paperHeightCss,
                      }}
                    >
                      <div
                        id={`print-page-${pageIdx}`}
                        className={`print-page print-page-${paperSize.toLowerCase()} bg-white border border-slate-200/90 rounded-xl shadow-md relative`}
                        style={{
                          width: paperWidthCss,
                          height: paperHeightCss,
                          minHeight: paperHeightCss,
                          margin: '0 auto',
                          padding: paperPaddingCss,
                          boxSizing: 'border-box',
                          position: 'relative',
                        }}
                      >
                        {/* Professional SVG Cutting Marks & Margin Guides */}
                        <PageCuttingGuides
                          paperSize={paperSize}
                          cuttingStyle={cuttingStyle}
                          showMarginGuides={showMarginGuides}
                        />

                        {/* Grid of 90mm x 65mm Price Cards (180mm x 260mm centered) */}
                        <div
                          className={`print-sheet-grid print-sheet-grid-${paperSize.toLowerCase()} grid grid-cols-2 gap-0 relative z-10`}
                          style={{
                            width: '180mm',
                            height: '260mm',
                            margin: '0 auto',
                            boxSizing: 'border-box',
                          }}
                        >
                          {pageProducts.map((product) => {
                            const pricing = getProductStorePriceInfo(product);

                            let topRibbonJa = '新鮮で美味しい';
                            let topRibbonEn = 'Fresh & Delicious';
                            if (selectedTemplateType === 'Offer') {
                              topRibbonJa = '特売・セール';
                              topRibbonEn = 'Special Offer';
                            } else if (selectedTemplateType === 'New Arrival') {
                              topRibbonJa = '新登場・入荷';
                              topRibbonEn = 'New Arrival';
                            } else if (selectedTemplateType === 'Clearance') {
                              topRibbonJa = 'クリアランス';
                              topRibbonEn = 'Clearance Sale';
                            }

                            return (
                              <div
                                key={`card-${product.id}-${pageIdx}`}
                                className="price-card-item relative transition-all overflow-hidden group cursor-pointer"
                                style={{
                                  width: '90mm',
                                  height: '65mm',
                                  boxSizing: 'border-box',
                                }}
                                onClick={() => setIsDesignEditorOpen(true)}
                                title="Click to customize card design and typography sizes"
                              >
                                {/* Hover edit badge (hidden in print) */}
                                <div className="absolute top-1.5 right-1.5 z-30 opacity-0 group-hover:opacity-100 transition-opacity no-print pointer-events-none">
                                  <span className="px-2 py-0.5 bg-slate-900/85 backdrop-blur-xs text-white text-[10px] font-semibold rounded shadow-sm flex items-center gap-1">
                                    <Palette className="w-3 h-3 text-emerald-400" />
                                    <span>Edit Design</span>
                                  </span>
                                </div>

                                <BimiOfficialPriceTag
                                  product={product}
                                  pricing={pricing}
                                  showCutLines={config.showCutLines}
                                  cuttingStyle={cuttingStyle}
                                  cardWidth="90mm"
                                  cardHeight="65mm"
                                  logoUrl="/images/mybimi-logo.png"
                                  topRibbonJa={topRibbonJa}
                                  topRibbonEn={topRibbonEn}
                                  bottomLeftText="Good Food Better Life"
                                  bottomRightText="安心・ハラール  Halal & Quality"
                                  designTheme={activeDesignTheme}
                                  titleLineLimit={activeDesignTheme.titleLineLimit}
                                  maxTitleCharsJa={activeDesignTheme.maxTitleCharsJa}
                                  maxTitleCharsEn={activeDesignTheme.maxTitleCharsEn}
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Save Template Modal */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 no-print">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Save Custom Price Tag Template</h3>
              <button
                onClick={() => setIsTemplateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Template Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Endcap Promotional 4-Card A4"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Custom Badge Banner Text
                </label>
                <input
                  type="text"
                  placeholder="e.g. 今週の特売 / WEEKLY SPECIAL"
                  value={customBadgeText}
                  onChange={(e) => setCustomBadgeText(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:outline-none"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-lg text-[11px] text-slate-500 space-y-1">
                <p>
                  <strong>Paper Size:</strong> {paperSize} ({cardsPerPage} cards per page)
                </p>
                <p>
                  <strong>Style Type:</strong> {selectedTemplateType}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsTemplateModalOpen(false)}
                className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTemplate}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
              >
                Save Template Preset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch History & Reprint Drawer/Modal */}
      {isBatchHistoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 no-print">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl space-y-4 border border-slate-200 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Reprint Previous Price Tag Batches
                </h3>
                <p className="text-xs text-slate-500">
                  Reload previously printed batches with identical store prices and templates.
                </p>
              </div>
              <button
                onClick={() => setIsBatchHistoryOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {printBatches.length === 0 ? (
                <div className="text-center py-12 text-xs text-slate-400">
                  No previous print batches recorded yet.
                </div>
              ) : (
                printBatches.map((batch) => (
                  <div
                    key={batch.id}
                    className="p-3 border border-slate-200 rounded-xl hover:border-slate-300 transition-colors bg-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900">
                          {batch.batch_number}
                        </span>
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-semibold rounded text-[10px]">
                          {batch.store_name}
                        </span>
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-semibold rounded text-[10px]">
                          {batch.template_type} · {batch.paper_size}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                        {batch.product_names.join(', ')}
                      </p>
                      <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono mt-1">
                        <span>{batch.total_cards} cards ({batch.total_pages} sheets)</span>
                        <span>·</span>
                        <span>By {batch.printed_by}</span>
                        <span>·</span>
                        <span>{new Date(batch.printed_at).toLocaleString()}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleReprintBatch(batch)}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 shrink-0 self-start sm:self-auto cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reprint Batch</span>
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setIsBatchHistoryOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Card Design Editor Modal */}
      <CardDesignEditorModal
        isOpen={isDesignEditorOpen}
        onClose={() => setIsDesignEditorOpen(false)}
        currentTheme={activeDesignTheme}
        onApplyTheme={handleApplyDesignTheme}
        onSaveAsTemplate={handleSaveThemeAsTemplate}
        products={products}
        activeStoreName={activeStore?.name}
      />
    </div>
  );
};
