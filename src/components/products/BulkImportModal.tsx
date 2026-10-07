import React, { useState, useRef, useMemo } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  Link2,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  X,
  Download,
  RefreshCw,
  ArrowRight,
  ArrowLeft,
  Database,
  Store as StoreIcon,
  HelpCircle,
  FileText,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { dataService } from '../../services/dataService';
import {
  Product,
  Category,
  Brand,
  Supplier,
  StoreId,
  ProductUnit,
  HalalStatus,
  ProductStatus,
} from '../../types/database';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  brands: Brand[];
  suppliers: Supplier[];
  onImportSuccess?: () => void;
}

interface ParsedProductRow {
  rowNum: number;
  isValid: boolean;
  errors: string[];
  warnings: string[];
  productData: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'website_sync_status'>;
  initialStock: number;
  shelfLocation: string;
}

const SAMPLE_CSV_HEADERS = [
  'SKU',
  'Barcode',
  'Name_EN',
  'Name_JA',
  'Category',
  'Brand',
  'Retail_Price',
  'Cost_Price',
  'Tax_Rate',
  'Unit',
  'Weight_Volume',
  'Country_of_Origin',
  'Halal_Status',
  'Initial_Stock',
  'Shelf_Location',
  'Description',
];

const SAMPLE_CSV_ROWS = [
  [
    'BIMI-SPICE-001',
    '4901234567890',
    'Chili Powder Extra Hot',
    'チリパウダー 激辛',
    'Spices & Seasonings',
    'My BIMI Kitchen',
    '480',
    '260',
    '0.08',
    'pcs',
    '200g',
    'India',
    'certified',
    '60',
    'Aisle 2 - Spice Rack',
    'Premium hot chili powder ground from natural sun-dried peppers',
  ],
  [
    'BIMI-GRAIN-002',
    '4901234567891',
    'Basmati Rice Royal Select',
    'バスマティライス 高級ブレンド',
    'Rice & Grains',
    'Royal Crown',
    '2400',
    '1550',
    '0.08',
    'pack',
    '5kg',
    'Pakistan',
    'certified',
    '40',
    'Pallet 4',
    'Aromatic long grain basmati rice aged for 2 years',
  ],
  [
    'BIMI-SNACK-003',
    '4901234567892',
    'Crispy Banana Chips Salted',
    'クリスピーバナナチップス 塩味',
    'Snacks & Confectionery',
    'Tropical Taste',
    '220',
    '110',
    '0.08',
    'pcs',
    '120g',
    'Philippines',
    'certified',
    '80',
    'Aisle 1 - Snack Bar',
    'Thin-sliced golden banana chips with sea salt',
  ],
];

export const BulkImportModal: React.FC<BulkImportModalProps> = ({
  isOpen,
  onClose,
  categories,
  brands,
  suppliers,
  onImportSuccess,
}) => {
  const { stores, triggerRefresh, addToast } = useApp();
  const { profile, role } = useAuth();

  // Mode: 'file' (XLSX, CSV, Google Sheet download) or 'link' (Google Sheet live URL)
  const [importSource, setImportSource] = useState<'file' | 'link'>('file');

  // Step 1: Input/Upload, Step 2: Preview & Confirm
  const [currentStep, setCurrentStep] = useState<'input' | 'preview'>('input');

  // File Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Google Sheet Link State
  const [googleSheetUrl, setGoogleSheetUrl] = useState('');
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Parsed Data State
  const [parsedRows, setParsedRows] = useState<ParsedProductRow[]>([]);
  const [previewFilter, setPreviewFilter] = useState<'all' | 'valid' | 'errors'>('all');
  const [targetStoreId, setTargetStoreId] = useState<StoreId | 'all'>('all');
  const [isImporting, setIsImporting] = useState(false);

  // Reset modal state
  const handleReset = () => {
    setSelectedFile(null);
    setGoogleSheetUrl('');
    setFetchError(null);
    setParsedRows([]);
    setCurrentStep('input');
    setIsImporting(false);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  // Convert raw row keys to lowercase trimmed keys
  const normalizeRow = (rawRow: Record<string, any>): Record<string, any> => {
    const clean: Record<string, any> = {};
    Object.keys(rawRow).forEach((key) => {
      const normalizedKey = key.trim().toLowerCase().replace(/[\s\-_]+/g, '');
      clean[normalizedKey] = rawRow[key];
    });
    return clean;
  };

  // Parse raw sheet data into typed product rows
  const processRawData = (rows: Record<string, any>[]) => {
    if (!rows || rows.length === 0) {
      setFetchError('The file or sheet is empty. Please provide data with column headers.');
      return;
    }

    const defaultCategoryId = categories[0]?.id || 'cat-general';
    const defaultBrandId = brands[0]?.id || 'brand-generic';
    const defaultSupplierId = suppliers[0]?.id || 'sup-general';

    const processed: ParsedProductRow[] = rows.map((raw, idx) => {
      const rowNum = idx + 2; // header is row 1
      const n = normalizeRow(raw);

      // SKU Resolution
      const rawSku = n['sku'] || n['code'] || n['itemcode'] || n['productcode'] || n['商品コード'];
      const sku = rawSku ? String(rawSku).trim() : `BIMI-${Date.now().toString(36).toUpperCase()}-${idx + 1}`;

      // Barcode Resolution
      const rawBarcode = n['barcode'] || n['jan'] || n['jancode'] || n['upc'] || n['ean'] || n['ean13'] || n['バーコード'];
      const barcode = rawBarcode
        ? String(rawBarcode).trim()
        : `49${Math.floor(10000000000 + Math.random() * 90000000000)}`;

      // English Name
      const name = String(n['name'] || n['nameen'] || n['productname'] || n['title'] || n['itemname'] || n['商品名'] || '').trim();

      // Japanese Name
      const nameJa = String(n['nameja'] || n['japanesename'] || n['japanese'] || n['namejp'] || n['商品名（日本語）'] || name).trim();

      // Category matching
      const catInput = String(n['category'] || n['categoryname'] || n['cat'] || n['カテゴリ'] || '').trim().toLowerCase();
      const matchedCat = categories.find(
        (c) => c.name.toLowerCase() === catInput || c.name_ja.toLowerCase() === catInput || c.slug.toLowerCase() === catInput
      );
      const category_id = matchedCat ? matchedCat.id : defaultCategoryId;

      // Brand matching
      const brandInput = String(n['brand'] || n['brandname'] || n['ブランド'] || '').trim().toLowerCase();
      const matchedBrand = brands.find((b) => b.name.toLowerCase() === brandInput);
      const brand_id = matchedBrand ? matchedBrand.id : defaultBrandId;

      // Retail Price
      const rawPrice = n['retailprice'] || n['price'] || n['baseretailprice'] || n['sellingprice'] || n['販売価格'];
      const base_retail_price = Math.max(0, Number(rawPrice) || 0);

      // Cost Price
      const rawCost = n['costprice'] || n['cost'] || n['purchaseprice'] || n['仕入価格'];
      const cost_price = Math.max(0, Number(rawCost) || Math.round(base_retail_price * 0.65));

      // Tax Rate
      const rawTax = String(n['taxrate'] || n['tax'] || n['消費税'] || '0.08');
      const tax_rate = rawTax.includes('10') ? 0.1 : 0.08;

      // Unit
      const rawUnit = String(n['unit'] || n['単位'] || 'pcs').trim().toLowerCase();
      const validUnits: ProductUnit[] = ['pcs', 'kg', 'g', 'L', 'ml', 'pack', 'box'];
      const unit: ProductUnit = validUnits.includes(rawUnit as any) ? (rawUnit as ProductUnit) : 'pcs';

      // Weight / Volume
      const weight_volume = String(n['weightvolume'] || n['weight'] || n['size'] || n['容量'] || n['重量'] || '1 unit').trim();

      // Country of origin
      const country_of_origin = String(n['countryoforigin'] || n['origin'] || n['country'] || n['原産国'] || 'Japan').trim();

      // Halal Status
      const rawHalal = String(n['halalstatus'] || n['halal'] || n['ハラール'] || 'certified').trim().toLowerCase();
      const halal_status: HalalStatus = rawHalal.includes('cert')
        ? 'certified'
        : rawHalal.includes('muslim') || rawHalal.includes('friendly')
        ? 'muslim_friendly'
        : rawHalal.includes('non')
        ? 'non_halal'
        : 'certified';

      // Initial Stock
      const rawStock = n['initialstock'] || n['stock'] || n['qty'] || n['quantity'] || n['在庫数'];
      const initialStock = Math.max(0, Number(rawStock) || 0);

      // Shelf Location
      const shelfLocation = String(n['shelflocation'] || n['location'] || n['棚位置'] || 'Storage').trim();

      // Description
      const description = String(n['description'] || n['desc'] || n['説明'] || `${name} (${country_of_origin})`).trim();

      // Validation Rules
      const errors: string[] = [];
      const warnings: string[] = [];

      if (!name) {
        errors.push('Product name is required.');
      }
      if (base_retail_price <= 0) {
        warnings.push('Retail price is 0 or unassigned.');
      }
      if (cost_price >= base_retail_price && base_retail_price > 0) {
        warnings.push('Cost price is equal or higher than retail price.');
      }

      return {
        rowNum,
        isValid: errors.length === 0,
        errors,
        warnings,
        initialStock,
        shelfLocation,
        productData: {
          sku,
          barcode,
          name,
          name_ja: nameJa,
          brand_id,
          category_id,
          subcategory: 'General',
          description,
          internal_notes: `Bulk imported on ${new Date().toLocaleDateString()}`,
          image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80',
          country_of_origin,
          weight_volume,
          unit,
          tax_rate,
          cost_price,
          base_retail_price,
          min_stock_alert: 5,
          status: 'Active' as ProductStatus,
          halal_status,
          is_new_arrival: true,
          is_featured: false,
          is_bestseller: false,
          supplier_id: defaultSupplierId,
          is_active: true,
        },
      };
    });

    setParsedRows(processed);
    setCurrentStep('preview');
  };

  // Parse dropped / selected file
  const handleFileChange = async (file: File) => {
    setSelectedFile(file);
    setFetchError(null);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) {
        throw new Error('Workbook contains no worksheets.');
      }
      const sheet = workbook.Sheets[firstSheetName];
      const json = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: '' });
      processRawData(json);
    } catch (err: any) {
      console.error('File parsing error:', err);
      setFetchError(err.message || 'Failed to parse file. Ensure it is a valid .xlsx, .xls, or .csv file.');
    }
  };

  // Parse Google Sheet URL and extract CSV endpoint
  const handleFetchGoogleSheet = async () => {
    setFetchError(null);
    const url = googleSheetUrl.trim();

    if (!url) {
      setFetchError('Please enter a valid Google Sheet URL.');
      return;
    }

    // Extract spreadsheet ID: https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/...
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (!match || !match[1]) {
      setFetchError('Invalid Google Sheets URL format. URL must contain "/spreadsheets/d/<sheet_id>/".');
      return;
    }

    const spreadsheetId = match[1];

    // Extract gid if present
    const gidMatch = url.match(/gid=([0-9]+)/);
    const gid = gidMatch ? gidMatch[1] : '0';

    // Google Sheets public CSV export endpoint
    const csvExportUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&gid=${gid}`;

    setIsFetchingUrl(true);
    try {
      const response = await fetch(csvExportUrl);
      if (!response.ok) {
        throw new Error(
          `Google Sheets returned HTTP status ${response.status}. Please confirm the spreadsheet sharing is set to "Anyone with the link can view".`
        );
      }
      const csvText = await response.text();
      const workbook = XLSX.read(csvText, { type: 'string' });
      const firstSheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[firstSheetName];
      const json = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: '' });
      processRawData(json);
    } catch (err: any) {
      console.error('Google Sheet fetch error:', err);
      setFetchError(
        err.message ||
          'Failed to fetch Google Sheet. Make sure the document sharing setting is "Anyone with the link can view" (Public/Viewer).'
      );
    } finally {
      setIsFetchingUrl(false);
    }
  };

  // Download Sample Template
  const handleDownloadTemplate = () => {
    const csvContent = [
      SAMPLE_CSV_HEADERS.join(','),
      ...SAMPLE_CSV_ROWS.map((row) =>
        row
          .map((val) => {
            const str = String(val);
            return str.includes(',') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
          })
          .join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'bimi_product_catalog_import_template.csv';
    link.click();
    URL.revokeObjectURL(link.href);

    addToast({
      type: 'info',
      title: 'Template Downloaded',
      message: 'bimi_product_catalog_import_template.csv is ready to open in Excel or Google Sheets.',
    });
  };

  // Confirm and Execute Import
  const handleExecuteImport = async () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      addToast({
        type: 'error',
        title: 'No Valid Products',
        message: 'No valid product rows to import. Please check your data errors.',
      });
      return;
    }

    setIsImporting(true);
    try {
      const itemsToImport = validRows.map((r) => ({
        productData: r.productData,
        initialStock: r.initialStock,
        shelfLocation: r.shelfLocation,
        assignedStoreId: targetStoreId,
      }));

      const res = await dataService.bulkImportProducts(
        itemsToImport,
        {
          name: profile?.name || profile?.username || 'Tohriyo',
          role: role || 'ADMIN',
        }
      );

      triggerRefresh();
      if (onImportSuccess) {
        onImportSuccess();
      }

      addToast({
        type: 'success',
        title: 'Bulk Import Completed',
        message: `Successfully added ${res.importedCount} product(s) to master catalog.`,
      });

      handleClose();
    } catch (err: any) {
      console.error('Bulk import error:', err);
      addToast({
        type: 'error',
        title: 'Import Failed',
        message: err.message || 'An error occurred during bulk intake.',
      });
    } finally {
      setIsImporting(false);
    }
  };

  const validCount = parsedRows.filter((r) => r.isValid).length;
  const errorCount = parsedRows.filter((r) => !r.isValid).length;
  const filteredRows = useMemo(() => {
    if (previewFilter === 'valid') return parsedRows.filter((r) => r.isValid);
    if (previewFilter === 'errors') return parsedRows.filter((r) => !r.isValid);
    return parsedRows;
  }, [parsedRows, previewFilter]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in-50 zoom-in-95">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <UploadCloud className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Bulk Product Catalog Import
                </h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Excel • CSV • Google Sheets
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Import large batches of products with SKU, barcodes, retail & cost pricing, and initial stock.
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEP 1: INPUT / UPLOAD */}
        {currentStep === 'input' && (
          <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
            {/* Source Tab Selector (Option 1 vs Option 2) */}
            <div className="grid grid-cols-2 gap-3 p-1 bg-slate-100/80 rounded-xl">
              <button
                type="button"
                onClick={() => setImportSource('file')}
                className={`py-3 px-4 rounded-lg font-semibold flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
                  importSource === 'file'
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <div className="text-left">
                  <p className="text-xs font-bold leading-tight">Option 1: File Upload</p>
                  <p className="text-[10px] text-slate-400 font-normal leading-tight">
                    .xlsx, .xls, .csv, Google Sheet export
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setImportSource('link')}
                className={`py-3 px-4 rounded-lg font-semibold flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
                  importSource === 'link'
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Link2 className="w-4 h-4 text-blue-600" />
                <div className="text-left">
                  <p className="text-xs font-bold leading-tight">Option 2: Google Sheet Link</p>
                  <p className="text-[10px] text-slate-400 font-normal leading-tight">
                    Direct live link import via web URL
                  </p>
                </div>
              </button>
            </div>

            {/* Error Banner */}
            {fetchError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-semibold">Import Issue Detected</p>
                  <p className="text-[11px] leading-relaxed">{fetchError}</p>
                </div>
              </div>
            )}

            {/* OPTION 1 CONTENT: File Upload */}
            {importSource === 'file' && (
              <div className="space-y-4">
                {/* Drag and Drop Zone */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleFileChange(file);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                    isDragging
                      ? 'border-emerald-500 bg-emerald-50/50 scale-[0.99]'
                      : 'border-slate-300 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-50'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv,.tsv"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileChange(file);
                    }}
                  />
                  <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center mx-auto text-slate-700 mb-3">
                    <FileSpreadsheet className="w-7 h-7 text-emerald-600" />
                  </div>
                  <p className="text-sm font-bold text-slate-800">
                    Click to browse or drag and drop spreadsheet file
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Supports Microsoft Excel (.xlsx, .xls), Comma-Separated Values (.csv), or Google Sheet (.tsv)
                  </p>
                  <span className="inline-block mt-3 px-3 py-1 rounded-full text-[10px] font-mono font-semibold bg-white border border-slate-200 text-slate-600">
                    Max size: 15MB • UTF-8 & Shift-JIS compatible
                  </span>
                </div>

                {/* Template Download Bar */}
                <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-slate-500 shrink-0" />
                    <div>
                      <p className="font-semibold text-slate-800">Need the standardized column format?</p>
                      <p className="text-[11px] text-slate-400">
                        Download our pre-structured template containing sample products, SKU patterns, and Japanese labels.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-800 font-semibold border border-slate-200 rounded-lg shadow-2xs flex items-center gap-2 transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-600" />
                    <span>Download CSV Template</span>
                  </button>
                </div>
              </div>
            )}

            {/* OPTION 2 CONTENT: Google Sheet Live Link */}
            {importSource === 'link' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block font-semibold text-slate-800">
                    Google Sheets Public or Shared Web Link *
                  </label>
                  <div className="relative">
                    <Link2 className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="url"
                      value={googleSheetUrl}
                      onChange={(e) => setGoogleSheetUrl(e.target.value)}
                      placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit#gid=0"
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Paste the browser URL directly from your Google Sheet address bar.
                  </p>
                </div>

                {/* Instructions Box */}
                <div className="p-4 bg-blue-50/70 border border-blue-200/80 rounded-xl space-y-2 text-blue-950">
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span>How to connect your Google Sheet in 10 seconds:</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-blue-900 leading-relaxed pl-1">
                    <li>Open your Google Sheet with your product catalog rows.</li>
                    <li>
                      Click the top-right <strong>Share</strong> button and set general access to{' '}
                      <strong>"Anyone with the link can view"</strong>.
                    </li>
                    <li>Copy the sheet URL and paste it in the box above.</li>
                    <li>
                      Click <strong>"Fetch & Inspect Sheet"</strong> to automatically parse and preview your products.
                    </li>
                  </ol>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    disabled={isFetchingUrl || !googleSheetUrl.trim()}
                    onClick={handleFetchGoogleSheet}
                    className="py-2.5 px-5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
                  >
                    {isFetchingUrl ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                        <span>Fetching Google Sheet...</span>
                      </>
                    ) : (
                      <>
                        <ArrowRight className="w-4 h-4" />
                        <span>Fetch & Inspect Sheet</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: PREVIEW & CONFIRM */}
        {currentStep === 'preview' && (
          <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
            {/* Summary KPI Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                  Total Rows Scanned
                </span>
                <p className="text-xl font-bold text-slate-900 mt-0.5">{parsedRows.length}</p>
                <p className="text-[10px] text-slate-500 mt-1">Detected in source spreadsheet</p>
              </div>

              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                <span className="text-[10px] font-mono text-emerald-700 uppercase tracking-wider block font-bold">
                  Valid Ready to Import
                </span>
                <p className="text-xl font-bold text-emerald-800 mt-0.5">{validCount}</p>
                <p className="text-[10px] text-emerald-600 mt-1">Full compliance with master schema</p>
              </div>

              <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl">
                <span className="text-[10px] font-mono text-amber-700 uppercase tracking-wider block font-bold">
                  Issues / Warnings
                </span>
                <p className="text-xl font-bold text-amber-800 mt-0.5">{errorCount}</p>
                <p className="text-[10px] text-amber-600 mt-1">Missing required values or duplicate SKU</p>
              </div>
            </div>

            {/* Target Store Assignment & Filter Controls */}
            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <StoreIcon className="w-4 h-4 text-slate-500 shrink-0" />
                <div>
                  <span className="font-semibold text-slate-800 block text-xs">
                    Target Branch for Initial Stock Intake:
                  </span>
                  <select
                    value={targetStoreId}
                    onChange={(e) => setTargetStoreId(e.target.value as StoreId | 'all')}
                    className="mt-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer shadow-2xs"
                  >
                    <option value="all">All Branches (Central Enterprise Stock)</option>
                    {stores.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name} ({st.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Filter tabs */}
              <div className="flex bg-slate-200/70 p-0.5 rounded-lg self-start sm:self-auto text-xs">
                <button
                  type="button"
                  onClick={() => setPreviewFilter('all')}
                  className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                    previewFilter === 'all'
                      ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({parsedRows.length})
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewFilter('valid')}
                  className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                    previewFilter === 'valid'
                      ? 'bg-white text-emerald-800 font-semibold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Valid ({validCount})
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewFilter('errors')}
                  className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                    previewFilter === 'errors'
                      ? 'bg-white text-rose-800 font-semibold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Errors ({errorCount})
                </button>
              </div>
            </div>

            {/* Preview Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs max-h-72 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-slate-100/90 backdrop-blur-xs border-b border-slate-200 text-slate-600 font-medium">
                  <tr>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">SKU</th>
                    <th className="py-2.5 px-3">Barcode</th>
                    <th className="py-2.5 px-3">Product Name (EN / JA)</th>
                    <th className="py-2.5 px-3">Retail Price</th>
                    <th className="py-2.5 px-3">Cost Price</th>
                    <th className="py-2.5 px-3">Initial Stock</th>
                    <th className="py-2.5 px-3">Origin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRows.map((r) => {
                    const p = r.productData;
                    return (
                      <tr
                        key={r.rowNum}
                        className={`hover:bg-slate-50 transition-colors ${
                          !r.isValid ? 'bg-rose-50/40' : r.warnings.length > 0 ? 'bg-amber-50/30' : ''
                        }`}
                      >
                        <td className="py-2 px-3">
                          {r.isValid ? (
                            <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>READY</span>
                            </span>
                          ) : (
                            <span
                              title={r.errors.join(', ')}
                              className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 cursor-help"
                            >
                              <AlertCircle className="w-3 h-3" />
                              <span>ERROR</span>
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 font-mono font-semibold text-slate-800">{p.sku}</td>
                        <td className="py-2 px-3 font-mono text-slate-500">{p.barcode}</td>
                        <td className="py-2 px-3">
                          <p className="font-semibold text-slate-900 leading-tight">{p.name}</p>
                          {p.name_ja && (
                            <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">{p.name_ja}</p>
                          )}
                        </td>
                        <td className="py-2 px-3 font-mono font-semibold text-slate-900">
                          ¥{p.base_retail_price.toLocaleString()}
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-500">
                          ¥{p.cost_price.toLocaleString()}
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-700">
                          {r.initialStock} {p.unit}
                        </td>
                        <td className="py-2 px-3 text-slate-600">{p.country_of_origin}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
          {currentStep === 'preview' ? (
            <button
              type="button"
              onClick={() => setCurrentStep('input')}
              className="py-2 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Upload</span>
            </button>
          ) : (
            <div className="text-[11px] text-slate-400">
              Need assistance? Check the downloadable sample template.
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="py-2 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>

            {currentStep === 'preview' && (
              <button
                type="button"
                disabled={isImporting || validCount === 0}
                onClick={handleExecuteImport}
                className="py-2 px-5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {isImporting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                    <span>Importing {validCount} Products...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Confirm & Import {validCount} Products</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
