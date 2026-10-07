import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  Package,
  Upload,
  AlertCircle,
  Sparkles,
  DollarSign,
  Boxes,
  Building,
  Tag,
  Scale,
  Globe,
  Info,
  Layers,
} from 'lucide-react';
import { Product, Store, Category, Brand, Supplier, StoreId, ProductStatus, ProductUnit, HalalStatus } from '../../types/database';
import { dataService } from '../../services/dataService';
import { BarcodeSvg } from '../common/BarcodeSvg';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (product: Product, message: string) => void;
  initialProduct?: Product | null;
  mode: 'create' | 'edit' | 'duplicate';
  stores: Store[];
  categories: Category[];
  brands: Brand[];
  suppliers: Supplier[];
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialProduct,
  mode,
  stores,
  categories,
  brands,
  suppliers,
}) => {
  // Form fields
  const [name, setName] = useState('');
  const [nameJa, setNameJa] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [brandId, setBrandId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [countryOfOrigin, setCountryOfOrigin] = useState('Japan');
  const [weightVolume, setWeightVolume] = useState('200g');
  const [unit, setUnit] = useState<ProductUnit>('pack');
  const [taxRate, setTaxRate] = useState(0.08);
  const [costPrice, setCostPrice] = useState(1000);
  const [baseRetailPrice, setBaseRetailPrice] = useState(1500);
  const [minStockAlert, setMinStockAlert] = useState(15);
  const [status, setStatus] = useState<ProductStatus>('Active');
  const [halalStatus, setHalalStatus] = useState<HalalStatus>('muslim_friendly');
  const [isNewArrival, setIsNewArrival] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isBestseller, setIsBestseller] = useState(false);
  const [description, setDescription] = useState('');
  const [internalNotes, setInternalNotes] = useState('');

  // Store inventory inputs
  const [storeStockInputs, setStoreStockInputs] = useState<Record<StoreId, { price: number; stock: number; location: string }>>({});

  // Validation error state
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setErrorMessage(null);

    if (initialProduct) {
      if (mode === 'duplicate') {
        setName(`${initialProduct.name} (Copy)`);
        setNameJa(initialProduct.name_ja ? `${initialProduct.name_ja} (コピー)` : '');
        setSku(`BIMI-COPY-${Math.floor(1000 + Math.random() * 9000)}`);
        setBarcode(`4901${Math.floor(100000000 + Math.random() * 900000000)}`);
        setStatus('Draft');
      } else {
        setName(initialProduct.name);
        setNameJa(initialProduct.name_ja);
        setSku(initialProduct.sku);
        setBarcode(initialProduct.barcode);
        setStatus(initialProduct.status || 'Active');
      }

      setBrandId(initialProduct.brand_id);
      setCategoryId(initialProduct.category_id);
      setSubcategory(initialProduct.subcategory || '');
      setSupplierId(initialProduct.supplier_id);
      setImageUrl(initialProduct.image_url || '');
      setCountryOfOrigin(initialProduct.country_of_origin || 'Japan');
      setWeightVolume(initialProduct.weight_volume || '200g');
      setUnit(initialProduct.unit || 'pack');
      setTaxRate(initialProduct.tax_rate ?? 0.08);
      setCostPrice(initialProduct.cost_price);
      setBaseRetailPrice(initialProduct.base_retail_price);
      setMinStockAlert(initialProduct.min_stock_alert || 15);
      setHalalStatus(initialProduct.halal_status || 'not_applicable');
      setIsNewArrival(initialProduct.is_new_arrival ?? false);
      setIsFeatured(initialProduct.is_featured ?? false);
      setIsBestseller(initialProduct.is_bestseller ?? false);
      setDescription(initialProduct.description || '');
      setInternalNotes(initialProduct.internal_notes || '');

      // Load existing store inventory
      dataService.getStoreProducts().then((sps) => {
        const inputs: Record<StoreId, { price: number; stock: number; location: string }> = {};
        stores.forEach((st) => {
          const sp = sps.find((item) => item.product_id === initialProduct.id && item.store_id === st.id);
          inputs[st.id] = {
            price: sp ? sp.retail_price : initialProduct.base_retail_price,
            stock: mode === 'duplicate' ? 0 : sp ? sp.stock_quantity : 0,
            location: sp ? sp.shelf_location : 'Aisle 1',
          };
        });
        setStoreStockInputs(inputs);
      });
    } else {
      // New Product Mode Defaults
      setName('');
      setNameJa('');
      setSku(`BIMI-SKU-${Math.floor(1000 + Math.random() * 9000)}`);
      setBarcode(`4901${Math.floor(100000000 + Math.random() * 900000000)}`);
      setBrandId(brands[0]?.id || '');
      setCategoryId(categories[0]?.id || '');
      setSubcategory('');
      setSupplierId(suppliers[0]?.id || '');
      setImageUrl('');
      setCountryOfOrigin('Japan');
      setWeightVolume('250g');
      setUnit('pack');
      setTaxRate(0.08);
      setCostPrice(800);
      setBaseRetailPrice(1280);
      setMinStockAlert(15);
      setStatus('Active');
      setHalalStatus('muslim_friendly');
      setIsNewArrival(true);
      setIsFeatured(false);
      setIsBestseller(false);
      setDescription('');
      setInternalNotes('');

      const inputs: Record<StoreId, { price: number; stock: number; location: string }> = {};
      stores.forEach((st) => {
        inputs[st.id] = { price: 1280, stock: 20, location: 'Sales Floor' };
      });
      setStoreStockInputs(inputs);
    }
  }, [isOpen, initialProduct, mode, stores, categories, brands, suppliers]);

  if (!isOpen) return null;

  // Handle local image file selection
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    if (!name.trim()) {
      setErrorMessage('English product name is required.');
      return;
    }
    if (!sku.trim()) {
      setErrorMessage('SKU identifier is required.');
      return;
    }
    if (costPrice <= 0) {
      setErrorMessage('Cost price must be greater than zero.');
      return;
    }
    if (baseRetailPrice <= 0) {
      setErrorMessage('Retail price must be greater than zero.');
      return;
    }

    // Check duplicate SKU
    const excludeId = mode === 'edit' && initialProduct ? initialProduct.id : undefined;
    if (!dataService.isSkuUnique(sku, excludeId)) {
      setErrorMessage(`SKU "${sku}" is already assigned to another product in the catalog.`);
      return;
    }

    // Check duplicate Barcode
    if (barcode.trim() && !dataService.isBarcodeUnique(barcode, excludeId)) {
      setErrorMessage(`Barcode / JAN "${barcode}" is already registered in the catalog.`);
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'edit' && initialProduct) {
        const updated = await dataService.updateProduct(initialProduct.id, {
          name,
          name_ja: nameJa || name,
          sku: sku.trim().toUpperCase(),
          barcode: barcode.trim(),
          brand_id: brandId,
          category_id: categoryId,
          subcategory,
          supplier_id: supplierId,
          image_url: imageUrl,
          country_of_origin: countryOfOrigin,
          weight_volume: weightVolume,
          unit,
          tax_rate: Number(taxRate),
          cost_price: Number(costPrice),
          base_retail_price: Number(baseRetailPrice),
          min_stock_alert: Number(minStockAlert),
          status,
          halal_status: halalStatus,
          is_new_arrival: isNewArrival,
          is_featured: isFeatured,
          is_bestseller: isBestseller,
          description,
          internal_notes: internalNotes,
        });

        onSuccess(updated, `Product "${updated.name}" updated successfully.`);
      } else {
        // Create or Duplicate
        const created = await dataService.addProduct(
          {
            name,
            name_ja: nameJa || name,
            sku: sku.trim().toUpperCase(),
            barcode: barcode.trim(),
            brand_id: brandId,
            category_id: categoryId,
            subcategory,
            supplier_id: supplierId,
            image_url: imageUrl,
            country_of_origin: countryOfOrigin,
            weight_volume: weightVolume,
            unit,
            tax_rate: Number(taxRate),
            cost_price: Number(costPrice),
            base_retail_price: Number(baseRetailPrice),
            min_stock_alert: Number(minStockAlert),
            status,
            halal_status: halalStatus,
            is_new_arrival: isNewArrival,
            is_featured: isFeatured,
            is_bestseller: isBestseller,
            description,
            internal_notes: internalNotes,
            is_active: status === 'Active',
          },
          storeStockInputs
        );

        onSuccess(
          created,
          mode === 'duplicate'
            ? `Cloned product as "${created.name}" (SKU: ${created.sku}).`
            : `Created new master product "${created.name}".`
        );
      }
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while saving.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculatedMargin = baseRetailPrice > 0 ? Math.round(((baseRetailPrice - costPrice) / baseRetailPrice) * 100) : 0;
  const calculatedMarkup = costPrice > 0 ? Math.round(((baseRetailPrice - costPrice) / costPrice) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-2xs transition-opacity" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-4 sm:pl-10">
        <div className="w-screen max-w-3xl bg-white border-l border-slate-200 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {mode === 'edit' ? 'Edit Product Master' : mode === 'duplicate' ? 'Duplicate Product' : 'Add New Master Product'}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Central BIMI Product Studio catalog definition and multi-store settings
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mx-6 mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold">Validation Error:</span> {errorMessage}
              </div>
              <button onClick={() => setErrorMessage(null)} className="text-rose-500 hover:text-rose-700">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Section 1: Product Identity */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <Package className="w-4 h-4 text-slate-500" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  1. Product Identity & Hierarchy
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    English Product Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Japanese Wagyu A5 Sirloin Steak (200g)"
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Japanese Name (for Shelf Tags & Japanese POS)
                  </label>
                  <input
                    type="text"
                    value={nameJa}
                    onChange={(e) => setNameJa(e.target.value)}
                    placeholder="e.g. 黒毛和牛 A5 サーロインステーキ 200g"
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-slate-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    SKU Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="e.g. BIMI-MEAT-001"
                    className="w-full text-xs font-mono uppercase px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-slate-400"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Must be unique across catalog</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Barcode / JAN / EAN
                  </label>
                  <input
                    type="text"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    placeholder="e.g. 4901234567890"
                    className="w-full text-xs font-mono px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-slate-400"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Standard 13-digit barcode</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Catalog Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ProductStatus)}
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-slate-400"
                  >
                    <option value="Active">Active</option>
                    <option value="Draft">Draft</option>
                    <option value="Out of Stock">Out of Stock</option>
                    <option value="Discontinued">Discontinued</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Brand</label>
                  <select
                    value={brandId}
                    onChange={(e) => setBrandId(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-slate-400"
                  >
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-slate-400"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.name_ja})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Subcategory</label>
                  <input
                    type="text"
                    value={subcategory}
                    onChange={(e) => setSubcategory(e.target.value)}
                    placeholder="e.g. Beef & Steak, Sashimi"
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-slate-400"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Media & Image */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <Upload className="w-4 h-4 text-slate-500" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  2. Product Image & Visual Assets
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                <div className="sm:col-span-4 flex flex-col items-center">
                  <div className="w-full aspect-square bg-slate-50 rounded-xl border border-slate-200 overflow-hidden flex items-center justify-center relative">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt="Product preview"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="text-center p-4 text-slate-400">
                        <Package className="w-8 h-8 mx-auto mb-1 stroke-1" />
                        <span className="text-[11px]">No Image Loaded</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="sm:col-span-8 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Image URL
                    </label>
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://example.com/product-image.jpg"
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-slate-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Or Upload Image File
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Physical Attributes & Halal */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <Scale className="w-4 h-4 text-slate-500" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  3. Specifications, Origin & Dietary Flags
                </h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Country of Origin
                  </label>
                  <input
                    type="text"
                    value={countryOfOrigin}
                    onChange={(e) => setCountryOfOrigin(e.target.value)}
                    placeholder="e.g. Japan, Norway, USA"
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Weight / Volume
                  </label>
                  <input
                    type="text"
                    value={weightVolume}
                    onChange={(e) => setWeightVolume(e.target.value)}
                    placeholder="e.g. 200g, 5kg, 1L"
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Unit Type
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value as ProductUnit)}
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-slate-400"
                  >
                    <option value="pack">pack</option>
                    <option value="pcs">pcs</option>
                    <option value="g">g</option>
                    <option value="kg">kg</option>
                    <option value="L">L</option>
                    <option value="ml">ml</option>
                    <option value="box">box</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Halal Status
                  </label>
                  <select
                    value={halalStatus}
                    onChange={(e) => setHalalStatus(e.target.value as HalalStatus)}
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-slate-400"
                  >
                    <option value="certified">Halal Certified</option>
                    <option value="muslim_friendly">Muslim Friendly</option>
                    <option value="not_applicable">Not Applicable</option>
                    <option value="non_halal">Non-Halal</option>
                  </select>
                </div>
              </div>

              {/* Badges / Merchandising Flags */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="text-xs font-semibold text-slate-700 block mb-2">
                  Merchandising Flags
                </span>
                <div className="flex flex-wrap gap-4 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isNewArrival}
                      onChange={(e) => setIsNewArrival(e.target.checked)}
                      className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                    />
                    <span className="text-slate-800 font-medium">New Arrival</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isFeatured}
                      onChange={(e) => setIsFeatured(e.target.checked)}
                      className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                    />
                    <span className="text-slate-800 font-medium">Featured Item</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isBestseller}
                      onChange={(e) => setIsBestseller(e.target.checked)}
                      className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                    />
                    <span className="text-slate-800 font-medium">Bestseller</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Section 4: Pricing & Financials */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <DollarSign className="w-4 h-4 text-slate-500" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  4. Cost, Base Retail Price & Margins
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Purchase Cost (JPY) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={costPrice}
                    onChange={(e) => setCostPrice(Number(e.target.value))}
                    className="w-full text-xs font-mono font-bold px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Base Retail (Tax-Excluded) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={baseRetailPrice}
                    onChange={(e) => setBaseRetailPrice(Number(e.target.value))}
                    className="w-full text-xs font-mono font-bold px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tax Rate
                  </label>
                  <select
                    value={taxRate}
                    onChange={(e) => setTaxRate(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-slate-400"
                  >
                    <option value={0.08}>8% (Reduced Rate - Food & Groceries)</option>
                    <option value={0.10}>10% (Standard Rate - Alcohol & Non-Food)</option>
                  </select>
                </div>
              </div>

              {/* Live Margin & Tax-Included Preview */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-medium block">TAX-INCL PRICE</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    ¥{Math.round(baseRetailPrice * (1 + taxRate)).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-medium block">GROSS MARGIN</span>
                  <span className="font-mono font-bold text-emerald-700 text-sm">
                    {calculatedMargin}%
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-medium block">MARKUP</span>
                  <span className="font-mono font-bold text-slate-800 text-sm">
                    +{calculatedMarkup}%
                  </span>
                </div>
              </div>
            </div>

            {/* Section 5: Store Stock Allocation (for Create / Duplicate) */}
            {mode !== 'edit' && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <Boxes className="w-4 h-4 text-slate-500" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    5. Initial Inventory & Shelf Locations by Store
                  </h3>
                </div>

                <div className="space-y-3">
                  {stores.map((st) => {
                    const current = storeStockInputs[st.id] || { price: baseRetailPrice, stock: 10, location: 'Sales Floor' };
                    return (
                      <div
                        key={st.id}
                        className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-3"
                      >
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">{st.name}</h4>
                          <span className="text-[10px] text-slate-400 font-mono">{st.code}</span>
                        </div>

                        <div>
                          <label className="block text-[10px] text-slate-500 font-semibold mb-1">
                            Initial Units in Stock
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={current.stock}
                            onChange={(e) =>
                              setStoreStockInputs({
                                ...storeStockInputs,
                                [st.id]: { ...current, stock: Number(e.target.value) },
                              })
                            }
                            className="w-full text-xs font-mono px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] text-slate-500 font-semibold mb-1">
                            Shelf / Bay Location
                          </label>
                          <input
                            type="text"
                            value={current.location}
                            onChange={(e) =>
                              setStoreStockInputs({
                                ...storeStockInputs,
                                [st.id]: { ...current, location: e.target.value },
                              })
                            }
                            placeholder="e.g. Aisle 3 - Chilled S-1"
                            className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Section 6: Descriptions & Internal Notes */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <Info className="w-4 h-4 text-slate-500" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  6. Descriptions & Internal Operations Notes
                </h3>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Public Customer Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter detailed description of taste, ingredients, cooking suggestions, and quality certifications..."
                  className="w-full text-xs p-3 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Internal Staff & Procurement Notes
                </label>
                <textarea
                  rows={2}
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  placeholder="Storage temperature, shelf rotation schedule, vendor delivery requirements..."
                  className="w-full text-xs p-3 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-slate-400"
                />
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between sticky bottom-0 bg-white py-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-lg shadow-2xs flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>
                  {isSubmitting
                    ? 'Saving Master...'
                    : mode === 'edit'
                    ? 'Save Changes'
                    : mode === 'duplicate'
                    ? 'Create Cloned Product'
                    : 'Add Product to Catalog'}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
