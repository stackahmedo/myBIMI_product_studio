import React, { useState } from 'react';
import {
  X,
  Palette,
  Type,
  Maximize2,
  Sparkles,
  RotateCcw,
  Check,
  Save,
  Sliders,
  ChevronRight,
  Plus,
  Minus,
  Eye,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { Product, CardDesignTheme, CardTextSizes } from '../../types/database';
import { BimiOfficialPriceTag } from './BimiOfficialPriceTag';

export interface CardDesignEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme?: CardDesignTheme;
  onApplyTheme: (theme: CardDesignTheme) => void;
  onSaveAsTemplate: (templateName: string, theme: CardDesignTheme) => void;
  products: Product[];
  activeStoreName?: string;
}

export const DEFAULT_DESIGN_THEME: CardDesignTheme = {
  themeName: 'BIMI Official Standard',
  ribbonColor: '#005A36',
  topBarColor: '#F25C05',
  priceColor: '#D6001C',
  footerLeftColor: '#005A36',
  footerRightColor: '#F25C05',
  ribbonJaText: '新鮮で美味しい',
  ribbonEnText: 'Fresh & Delicious',
  bottomLeftText: 'Good Food Better Life',
  bottomRightText: '安心・ハラール  Halal & Quality',
  originLabel: '原産国',
  taxLabel: '税込',
  titleLineLimit: 'auto',
  maxTitleCharsJa: 24,
  maxTitleCharsEn: 45,
  textSizes: {
    productNameJa: 20,
    productNameEn: 13,
    price: 52,
    priceCurrency: 24,
    taxPrice: 19,
    taxLabel: 14,
    ribbonJa: 13,
    ribbonEn: 9.5,
    weight: 24,
    origin: 18,
    footer: 9.5,
  },
};


export const PRESET_THEMES: Array<{
  id: string;
  name: string;
  description: string;
  theme: CardDesignTheme;
}> = [
  {
    id: 'bimi-official',
    name: 'BIMI Official Classic',
    description: 'Official store standard with emerald forest ribbon and warm orange accents',
    theme: {
      themeName: 'BIMI Official Classic',
      ribbonColor: '#005A36',
      topBarColor: '#F25C05',
      priceColor: '#D6001C',
      footerLeftColor: '#005A36',
      footerRightColor: '#F25C05',
      ribbonJaText: '新鮮で美味しい',
      ribbonEnText: 'Fresh & Delicious',
      bottomLeftText: 'Good Food Better Life',
      bottomRightText: '安心・ハラール  Halal & Quality',
      originLabel: '原産国',
      taxLabel: '税込',
    },
  },
  {
    id: 'hot-deal',
    name: 'Hot Deal POP / 特売・セール',
    description: 'Vibrant flame red and golden amber for high-visibility discount promotions',
    theme: {
      themeName: 'Hot Deal POP / 特売',
      ribbonColor: '#DC2626',
      topBarColor: '#F59E0B',
      priceColor: '#B91C1C',
      footerLeftColor: '#DC2626',
      footerRightColor: '#F59E0B',
      ribbonJaText: '特売・セール',
      ribbonEnText: 'Special Offer',
      bottomLeftText: 'Limited Bargain Sale',
      bottomRightText: 'お買い得価格  Special Value',
      originLabel: '産地',
      taxLabel: '税込',
    },
  },
  {
    id: 'chef-pick',
    name: "Chef's Pick / 本日のおすすめ",
    description: 'Warm terracotta and fresh emerald for daily specials and featured highlights',
    theme: {
      themeName: "Chef's Pick / 本日のおすすめ",
      ribbonColor: '#D97706',
      topBarColor: '#059669',
      priceColor: '#DC2626',
      footerLeftColor: '#D97706',
      footerRightColor: '#059669',
      ribbonJaText: '本日のおすすめ',
      ribbonEnText: "Chef's Recommendation",
      bottomLeftText: 'Handpicked Quality',
      bottomRightText: '本日のおすすめ品  Featured Pick',
      originLabel: '産地',
      taxLabel: '税込',
    },
  },
  {
    id: 'new-arrival',
    name: 'New Arrival / 新登場・入荷',
    description: 'Electric cobalt and bright cyan for new product introductions',
    theme: {
      themeName: 'New Arrival / 新登場',
      ribbonColor: '#2563EB',
      topBarColor: '#06B6D4',
      priceColor: '#DC2626',
      footerLeftColor: '#2563EB',
      footerRightColor: '#06B6D4',
      ribbonJaText: '新登場・入荷',
      ribbonEnText: 'New Arrival',
      bottomLeftText: 'New Product Arrival',
      bottomRightText: '新入荷アイテム  Just In',
      originLabel: '原産国',
      taxLabel: '税込',
    },
  },
  {
    id: 'halal-selected',
    name: 'Halal Selected / 厳選ハラール',
    description: 'Deep royal green and dark sapphire navy for premium 100% halal assurance',
    theme: {
      themeName: 'Halal Selected / 厳選ハラール',
      ribbonColor: '#047857',
      topBarColor: '#1E3A8A',
      priceColor: '#B91C1C',
      footerLeftColor: '#047857',
      footerRightColor: '#1E3A8A',
      ribbonJaText: 'ハラール厳選',
      ribbonEnText: 'Halal Selected',
      bottomLeftText: '100% Halal Guaranteed',
      bottomRightText: '安心ハラール認証  Certified Halal',
      originLabel: '原産国',
      taxLabel: '税込',
    },
  },
  {
    id: 'luxury-gold',
    name: 'Luxury Gold / 高級・特選',
    description: 'Rich amber bronze and obsidian black for premium Wagyu and gourmet lines',
    theme: {
      themeName: 'Luxury Gold / 高級特選',
      ribbonColor: '#78350F',
      topBarColor: '#D97706',
      priceColor: '#991B1B',
      footerLeftColor: '#18181B',
      footerRightColor: '#D97706',
      ribbonJaText: '店長イチオシ',
      ribbonEnText: 'Premium Selected',
      bottomLeftText: 'My BIMI Premium Reserve',
      bottomRightText: '至高の逸品  Exclusive Select',
      originLabel: '原産地',
      taxLabel: '税込',
    },
  },
  {
    id: 'clearance',
    name: 'Clearance / クリアランス',
    description: 'Deep crimson and vivid alert red for inventory markdown tags',
    theme: {
      themeName: 'Clearance / クリアランス',
      ribbonColor: '#7F1D1D',
      topBarColor: '#EF4444',
      priceColor: '#DC2626',
      footerLeftColor: '#7F1D1D',
      footerRightColor: '#EF4444',
      ribbonJaText: 'クリアランス',
      ribbonEnText: 'Clearance Sale',
      bottomLeftText: 'Final Stock Markdown',
      bottomRightText: '売り尽くしセール  Final Clearance',
      originLabel: '原産国',
      taxLabel: '税込',
    },
  },
];

// Text alternatives quick-pick options
const RIBBON_JA_OPTIONS = [
  '新鮮で美味しい',
  '特売・セール',
  '本日のおすすめ',
  '新登場・入荷',
  'ハラール厳選',
  '店長イチオシ',
  '数量限定',
  'クリアランス',
  'お買い得品',
  '週末限定特売',
];

const RIBBON_EN_OPTIONS = [
  'Fresh & Delicious',
  'Special Offer',
  "Chef's Recommendation",
  'New Arrival',
  'Halal Selected',
  'Clearance Sale',
  'Limited Time Only',
  "Manager's Special",
  'Best Value',
  'Weekend Bargain',
];

const ORIGIN_OPTIONS = [
  '原産国',
  '産地',
  '原産国 (Origin)',
  'Country of Origin',
  '産地 / Origin',
];

const TAX_OPTIONS = [
  '税込',
  '税抜',
  '消費税込',
  'Total (Tax Incl.)',
  '税込価格',
];

const FOOTER_LEFT_OPTIONS = [
  'Good Food Better Life',
  'My BIMI Quality',
  'Fresh Everyday',
  '100% Halal Guaranteed',
  'Premium Halal Food',
  'Everyday Low Price',
];

const FOOTER_RIGHT_OPTIONS = [
  '安心・ハラール  Halal & Quality',
  '厳選直輸入  Selected Imports',
  '自社直営店  Official Store',
  '産地直送  Direct from Farm',
  '美味 360 STORE',
  'お買い得価格  Special Value',
];

export const CardDesignEditorModal: React.FC<CardDesignEditorModalProps> = ({
  isOpen,
  onClose,
  currentTheme,
  onApplyTheme,
  onSaveAsTemplate,
  products,
  activeStoreName = 'My BIMI Branch',
}) => {
  if (!isOpen) return null;

  // Active theme editing state
  const [theme, setTheme] = useState<CardDesignTheme>(() => ({
    ...DEFAULT_DESIGN_THEME,
    ...currentTheme,
    textSizes: {
      ...DEFAULT_DESIGN_THEME.textSizes,
      ...(currentTheme?.textSizes || {}),
    },
  }));

  // Selected tab in editor
  const [activeTab, setActiveTab] = useState<'themes' | 'text' | 'sizes'>('themes');

  // Preview product selector
  const [previewProductIndex, setPreviewProductIndex] = useState<number>(0);
  const [previewScale, setPreviewScale] = useState<number>(1.25); // 1.25x scale for comfortable view

  // Save template dialog state
  const [isSaveInputOpen, setIsSaveInputOpen] = useState(false);
  const [templateNameInput, setTemplateNameInput] = useState(theme.themeName || 'Custom Card Design');

  // Active sample product for preview
  const sampleProduct: Product =
    products[previewProductIndex] || {
      id: 'sample-p1',
      sku: 'BIMI-CHICKEN-CUT',
      name: 'ProductName_EN',
      name_ja: '美味 チキンカット',
      barcode: '4901234567890',
      category_id: 'cat-meat',
      base_retail_price: 1291,
      cost_price: 850,
      tax_rate: 0.08,
      unit: 'gm',
      weight_volume: '1000gm',
      country_of_origin: 'Japan',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

  const samplePricing = {
    regularPrice: sampleProduct.base_retail_price,
    offerPrice: null,
    isOfferActive: false,
    effectivePrice: sampleProduct.base_retail_price,
    taxRate: 0.08,
    taxIncludedPrice: Math.round(sampleProduct.base_retail_price * 1.08),
  };

  // Helper to update text size
  const updateSize = (key: keyof CardTextSizes, val: number) => {
    setTheme((prev) => ({
      ...prev,
      textSizes: {
        ...prev.textSizes,
        [key]: Math.round(val * 10) / 10,
      },
    }));
  };

  // Helper to step text size (+ / -)
  const stepSize = (key: keyof CardTextSizes, step: number, min = 6, max = 70) => {
    const current = theme.textSizes?.[key] ?? DEFAULT_DESIGN_THEME.textSizes![key]!;
    const nextVal = Math.min(Math.max(current + step, min), max);
    updateSize(key, nextVal);
  };

  // Apply a preset
  const handleApplyPreset = (preset: typeof PRESET_THEMES[0]) => {
    setTheme((prev) => ({
      ...prev,
      ...preset.theme,
      themeName: preset.name,
      textSizes: {
        ...DEFAULT_DESIGN_THEME.textSizes,
        ...(prev.textSizes || {}),
      },
    }));
  };

  // Reset all to default BIMI standard
  const handleResetToDefault = () => {
    setTheme({ ...DEFAULT_DESIGN_THEME });
  };

  // Apply to current sheet
  const handleApply = () => {
    onApplyTheme(theme);
    onClose();
  };

  // Save as named preset template
  const handleSaveTemplateSubmit = () => {
    if (!templateNameInput.trim()) return;
    onSaveAsTemplate(templateNameInput.trim(), {
      ...theme,
      themeName: templateNameInput.trim(),
    });
    setIsSaveInputOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-2 sm:p-4 no-print overflow-hidden">
      <div className="bg-white rounded-2xl w-full max-w-6xl shadow-2xl border border-slate-200 flex flex-col h-[94vh] max-h-[850px] overflow-hidden">
        {/* Top Header */}
        <div className="px-6 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-emerald-600 text-white rounded-xl shadow-2xs">
              <Palette className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Price Tag Card Editor & Design Studio
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-100 text-emerald-800 rounded-md border border-emerald-200 font-mono">
                  90mm × 65mm Standard
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Redesign colors, replace promotional copy, and fine-tune exact typography font sizes.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetToDefault}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Body: Split Pane (Left: Live Preview / Right: Controls) */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* LEFT PANE: LIVE INTERACTIVE PREVIEW */}
          <div className="lg:w-1/2 p-6 bg-slate-100/70 border-r border-slate-200 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-4">
              {/* Preview Top Toolbar */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Live Card Preview</span>
                  </span>
                  <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono">
                    Aspect 1.385
                  </span>
                </div>

                {/* Scale buttons */}
                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5">
                  <button
                    onClick={() => setPreviewScale(1.0)}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      previewScale === 1.0 ? 'bg-slate-900 text-white' : 'text-slate-600'
                    }`}
                  >
                    100%
                  </button>
                  <button
                    onClick={() => setPreviewScale(1.25)}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      previewScale === 1.25 ? 'bg-slate-900 text-white' : 'text-slate-600'
                    }`}
                  >
                    125%
                  </button>
                  <button
                    onClick={() => setPreviewScale(1.4)}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      previewScale === 1.4 ? 'bg-slate-900 text-white' : 'text-slate-600'
                    }`}
                  >
                    140%
                  </button>
                </div>
              </div>

              {/* Sample Product Switcher */}
              <div className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                <label className="text-[11px] font-bold text-slate-600 shrink-0">
                  Sample Item:
                </label>
                <select
                  value={previewProductIndex}
                  onChange={(e) => setPreviewProductIndex(Number(e.target.value))}
                  className="flex-1 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 focus:outline-none"
                >
                  {products.map((p, idx) => (
                    <option key={p.id} value={idx}>
                      {p.name} ({p.name_ja})
                    </option>
                  ))}
                  {products.length === 0 && (
                    <option value={0}>Sample Wagyu Sirloin Steak A5</option>
                  )}
                </select>
              </div>

              {/* Centered Realistic 90mm x 65mm Card Showcase */}
              <div className="flex items-center justify-center p-6 bg-slate-200/50 rounded-2xl border border-dashed border-slate-300 min-h-[300px]">
                <div
                  className="shadow-xl rounded-sm transition-transform duration-150 origin-center bg-white"
                  style={{
                    width: `${90 * previewScale}mm`,
                    height: `${65 * previewScale}mm`,
                    maxWidth: '100%',
                  }}
                >
                  <BimiOfficialPriceTag
                    product={sampleProduct}
                    pricing={samplePricing}
                    designTheme={theme}
                    showCutLines={false}
                    cardWidth="100%"
                    cardHeight="100%"
                    logoUrl="/images/mybimi-logo.png"
                  />
                </div>
              </div>
            </div>

            {/* Quick Theme Summary Card */}
            <div className="mt-4 p-3 bg-white rounded-xl border border-slate-200 text-[11px] space-y-1.5 shadow-2xs">
              <div className="flex items-center justify-between text-slate-700 font-semibold">
                <span>Active Theme:</span>
                <span className="text-emerald-700">{theme.themeName || 'Custom'}</span>
              </div>
              <div className="flex items-center gap-2 pt-1 border-t border-slate-100 text-[10px] text-slate-500">
                <span className="flex items-center gap-1">
                  <span
                    className="w-3 h-3 rounded-full border border-slate-300 inline-block"
                    style={{ backgroundColor: theme.ribbonColor }}
                  />
                  Ribbon
                </span>
                <span className="flex items-center gap-1">
                  <span
                    className="w-3 h-3 rounded-full border border-slate-300 inline-block"
                    style={{ backgroundColor: theme.topBarColor }}
                  />
                  Accent
                </span>
                <span className="flex items-center gap-1">
                  <span
                    className="w-3 h-3 rounded-full border border-slate-300 inline-block"
                    style={{ backgroundColor: theme.priceColor }}
                  />
                  Price
                </span>
                <span className="flex items-center gap-1">
                  <span
                    className="w-3 h-3 rounded-full border border-slate-300 inline-block"
                    style={{ backgroundColor: theme.footerLeftColor }}
                  />
                  Footer
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT PANE: CONTROLS (THEMES, TEXT ALTERNATIVE, TEXT SIZES) */}
          <div className="lg:w-1/2 flex flex-col overflow-hidden bg-white">
            {/* Tabs Header */}
            <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-2 gap-2 shrink-0">
              <button
                onClick={() => setActiveTab('themes')}
                className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-colors flex items-center gap-1.5 cursor-pointer border-t border-x ${
                  activeTab === 'themes'
                    ? 'bg-white text-slate-900 border-slate-200 -mb-px'
                    : 'bg-transparent text-slate-500 hover:text-slate-800 border-transparent'
                }`}
              >
                <Palette className="w-3.5 h-3.5 text-emerald-600" />
                <span>Themes & Colors</span>
              </button>

              <button
                onClick={() => setActiveTab('text')}
                className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-colors flex items-center gap-1.5 cursor-pointer border-t border-x ${
                  activeTab === 'text'
                    ? 'bg-white text-slate-900 border-slate-200 -mb-px'
                    : 'bg-transparent text-slate-500 hover:text-slate-800 border-transparent'
                }`}
              >
                <Type className="w-3.5 h-3.5 text-blue-600" />
                <span>Text Alternatives</span>
              </button>

              <button
                onClick={() => setActiveTab('sizes')}
                className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-colors flex items-center gap-1.5 cursor-pointer border-t border-x ${
                  activeTab === 'sizes'
                    ? 'bg-white text-slate-900 border-slate-200 -mb-px'
                    : 'bg-transparent text-slate-500 hover:text-slate-800 border-transparent'
                }`}
              >
                <Sliders className="w-3.5 h-3.5 text-amber-600" />
                <span>Font & Text Sizes</span>
              </button>
            </div>

            {/* Tab 1: Themes & Colors Content */}
            {activeTab === 'themes' && (
              <div className="flex-1 overflow-y-auto p-5 space-y-6">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    1-Click Preset Design Themes
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {PRESET_THEMES.map((preset) => {
                      const isSelected = theme.themeName === preset.name;
                      return (
                        <div
                          key={preset.id}
                          onClick={() => handleApplyPreset(preset)}
                          className={`p-3 rounded-xl border text-left cursor-pointer transition-all hover:shadow-2xs ${
                            isSelected
                              ? 'border-emerald-600 bg-emerald-50/40 ring-2 ring-emerald-500/20'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-bold text-xs text-slate-900">
                              {preset.name}
                            </span>
                            {isSelected && (
                              <span className="w-4 h-4 bg-emerald-600 text-white rounded-full flex items-center justify-center">
                                <Check className="w-2.5 h-2.5" />
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 leading-snug mb-2 line-clamp-1">
                            {preset.description}
                          </p>
                          {/* Color Palette Preview Swatches */}
                          <div className="flex items-center gap-1.5">
                            <span
                              className="w-4 h-4 rounded-md border border-black/10 shadow-2xs"
                              style={{ backgroundColor: preset.theme.ribbonColor }}
                              title="Ribbon"
                            />
                            <span
                              className="w-4 h-4 rounded-md border border-black/10 shadow-2xs"
                              style={{ backgroundColor: preset.theme.topBarColor }}
                              title="Top Stripe"
                            />
                            <span
                              className="w-4 h-4 rounded-md border border-black/10 shadow-2xs"
                              style={{ backgroundColor: preset.theme.priceColor }}
                              title="Price"
                            />
                            <span
                              className="w-4 h-4 rounded-md border border-black/10 shadow-2xs"
                              style={{ backgroundColor: preset.theme.footerLeftColor }}
                              title="Footer Left"
                            />
                            <span
                              className="w-4 h-4 rounded-md border border-black/10 shadow-2xs"
                              style={{ backgroundColor: preset.theme.footerRightColor }}
                              title="Footer Right"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Granular Custom Color Pickers */}
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Custom Color Palette Controls
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {/* Ribbon Color */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
                      <label className="font-semibold text-slate-700 block">
                        Slanted Ribbon Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={theme.ribbonColor || '#005A36'}
                          onChange={(e) =>
                            setTheme({ ...theme, ribbonColor: e.target.value })
                          }
                          className="w-8 h-8 rounded border border-slate-300 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={theme.ribbonColor || '#005A36'}
                          onChange={(e) =>
                            setTheme({ ...theme, ribbonColor: e.target.value })
                          }
                          className="flex-1 font-mono text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800"
                        />
                      </div>
                    </div>

                    {/* Top Accent Stripe Color */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
                      <label className="font-semibold text-slate-700 block">
                        Top Accent Stripe
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={theme.topBarColor || '#F25C05'}
                          onChange={(e) =>
                            setTheme({ ...theme, topBarColor: e.target.value })
                          }
                          className="w-8 h-8 rounded border border-slate-300 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={theme.topBarColor || '#F25C05'}
                          onChange={(e) =>
                            setTheme({ ...theme, topBarColor: e.target.value })
                          }
                          className="flex-1 font-mono text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800"
                        />
                      </div>
                    </div>

                    {/* Price Color */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
                      <label className="font-semibold text-slate-700 block">
                        Main Price & Yen Symbol
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={theme.priceColor || '#D6001C'}
                          onChange={(e) =>
                            setTheme({ ...theme, priceColor: e.target.value })
                          }
                          className="w-8 h-8 rounded border border-slate-300 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={theme.priceColor || '#D6001C'}
                          onChange={(e) =>
                            setTheme({ ...theme, priceColor: e.target.value })
                          }
                          className="flex-1 font-mono text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800"
                        />
                      </div>
                    </div>

                    {/* Footer Left Wedge Color */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
                      <label className="font-semibold text-slate-700 block">
                        Footer Left Wedge Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={theme.footerLeftColor || '#005A36'}
                          onChange={(e) =>
                            setTheme({ ...theme, footerLeftColor: e.target.value })
                          }
                          className="w-8 h-8 rounded border border-slate-300 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={theme.footerLeftColor || '#005A36'}
                          onChange={(e) =>
                            setTheme({ ...theme, footerLeftColor: e.target.value })
                          }
                          className="flex-1 font-mono text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800"
                        />
                      </div>
                    </div>

                    {/* Footer Right Background Color */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5 sm:col-span-2">
                      <label className="font-semibold text-slate-700 block">
                        Footer Right Background Base
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={theme.footerRightColor || '#F25C05'}
                          onChange={(e) =>
                            setTheme({ ...theme, footerRightColor: e.target.value })
                          }
                          className="w-8 h-8 rounded border border-slate-300 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={theme.footerRightColor || '#F25C05'}
                          onChange={(e) =>
                            setTheme({ ...theme, footerRightColor: e.target.value })
                          }
                          className="flex-1 font-mono text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Text Alternatives Content */}
            {activeTab === 'text' && (
              <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
                {/* 1. Ribbon Japanese Copy */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800">
                      Slanted Ribbon Japanese Copy (上部リボン和文)
                    </label>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {theme.ribbonJaText?.length || 0} chars
                    </span>
                  </div>
                  <input
                    type="text"
                    value={theme.ribbonJaText || ''}
                    onChange={(e) =>
                      setTheme({ ...theme, ribbonJaText: e.target.value })
                    }
                    placeholder="e.g. 新鮮で美味しい, 特売・セール"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  {/* Quick-choice chips */}
                  <div className="flex flex-wrap gap-1.5">
                    {RIBBON_JA_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setTheme({ ...theme, ribbonJaText: opt })}
                        className={`px-2 py-1 text-[11px] rounded-md transition-colors cursor-pointer ${
                          theme.ribbonJaText === opt
                            ? 'bg-emerald-600 text-white font-semibold'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Ribbon English Copy */}
                <div className="space-y-2 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800">
                      Slanted Ribbon English Subtitle (上部リボン英文)
                    </label>
                  </div>
                  <input
                    type="text"
                    value={theme.ribbonEnText || ''}
                    onChange={(e) =>
                      setTheme({ ...theme, ribbonEnText: e.target.value })
                    }
                    placeholder="e.g. Fresh & Delicious, Special Offer"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  {/* Quick-choice chips */}
                  <div className="flex flex-wrap gap-1.5">
                    {RIBBON_EN_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setTheme({ ...theme, ribbonEnText: opt })}
                        className={`px-2 py-1 text-[11px] rounded-md transition-colors cursor-pointer ${
                          theme.ribbonEnText === opt
                            ? 'bg-emerald-600 text-white font-semibold'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Origin & Tax Label Alternatives */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                  <div className="space-y-2">
                    <label className="font-bold text-slate-800 block">
                      Origin Label (原産国ラベル)
                    </label>
                    <input
                      type="text"
                      value={theme.originLabel || '原産国'}
                      onChange={(e) =>
                        setTheme({ ...theme, originLabel: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium focus:outline-none"
                    />
                    <div className="flex flex-wrap gap-1">
                      {ORIGIN_OPTIONS.map((opt) => (
                        <button
                          key={opt}
                          onClick={() => setTheme({ ...theme, originLabel: opt })}
                          className={`px-1.5 py-0.5 text-[10px] rounded transition-colors cursor-pointer ${
                            theme.originLabel === opt
                              ? 'bg-slate-900 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="font-bold text-slate-800 block">
                      Tax Label (税込・税抜)
                    </label>
                    <input
                      type="text"
                      value={theme.taxLabel || '税込'}
                      onChange={(e) =>
                        setTheme({ ...theme, taxLabel: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium focus:outline-none"
                    />
                    <div className="flex flex-wrap gap-1">
                      {TAX_OPTIONS.map((opt) => (
                        <button
                          key={opt}
                          onClick={() => setTheme({ ...theme, taxLabel: opt })}
                          className={`px-1.5 py-0.5 text-[10px] rounded transition-colors cursor-pointer ${
                            theme.taxLabel === opt
                              ? 'bg-slate-900 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 4. Footer Slogans */}
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-800 block">
                      Footer Left Slogan (下部左側スローガン)
                    </label>
                    <input
                      type="text"
                      value={theme.bottomLeftText || ''}
                      onChange={(e) =>
                        setTheme({ ...theme, bottomLeftText: e.target.value })
                      }
                      placeholder="Good Food Better Life"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium focus:outline-none"
                    />
                    <div className="flex flex-wrap gap-1">
                      {FOOTER_LEFT_OPTIONS.map((opt) => (
                        <button
                          key={opt}
                          onClick={() => setTheme({ ...theme, bottomLeftText: opt })}
                          className={`px-1.5 py-0.5 text-[10px] rounded transition-colors cursor-pointer ${
                            theme.bottomLeftText === opt
                              ? 'bg-slate-900 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-800 block">
                      Footer Right Assurance (下部右側品質表記)
                    </label>
                    <input
                      type="text"
                      value={theme.bottomRightText || ''}
                      onChange={(e) =>
                        setTheme({ ...theme, bottomRightText: e.target.value })
                      }
                      placeholder="安心・ハラール  Halal & Quality"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium focus:outline-none"
                    />
                    <div className="flex flex-wrap gap-1">
                      {FOOTER_RIGHT_OPTIONS.map((opt) => (
                        <button
                          key={opt}
                          onClick={() => setTheme({ ...theme, bottomRightText: opt })}
                          className={`px-1.5 py-0.5 text-[10px] rounded transition-colors cursor-pointer ${
                            theme.bottomRightText === opt
                              ? 'bg-slate-900 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 5. Product Title Line Limit & Overflow Rules */}
                  <div className="space-y-3 pt-4 border-t border-slate-200">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                        <Type className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Title Line Limit & Overflow / 文字数制限・改行</span>
                      </label>
                      <span className="text-[10px] text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                        {theme.titleLineLimit === '1-line'
                          ? 'Strict 1-Line'
                          : theme.titleLineLimit === '2-lines'
                          ? '2-Lines Max'
                          : 'Auto-Fit (Smart)'}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500">
                      Prevents product titles from overflowing and colliding into the price, weight, or tax lines.
                    </p>

                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => setTheme({ ...theme, titleLineLimit: 'auto' })}
                        className={`p-2 rounded-lg border text-left cursor-pointer transition-all ${
                          (theme.titleLineLimit || 'auto') === 'auto'
                            ? 'border-emerald-500 bg-emerald-50/70 ring-1 ring-emerald-500'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="font-bold text-slate-900 text-[11px]">Auto-Fit (Smart)</div>
                        <div className="text-[9.5px] text-slate-500 mt-0.5 leading-tight">
                          Fits up to 23 chars on 1 line; scales down
                        </div>
                      </button>

                      <button
                        onClick={() => setTheme({ ...theme, titleLineLimit: '1-line' })}
                        className={`p-2 rounded-lg border text-left cursor-pointer transition-all ${
                          theme.titleLineLimit === '1-line'
                            ? 'border-emerald-500 bg-emerald-50/70 ring-1 ring-emerald-500'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="font-bold text-slate-900 text-[11px]">Strict 1-Line</div>
                        <div className="text-[9.5px] text-slate-500 mt-0.5 leading-tight">
                          1 line each with ellipsis (…) truncation
                        </div>
                      </button>

                      <button
                        onClick={() => setTheme({ ...theme, titleLineLimit: '2-lines' })}
                        className={`p-2 rounded-lg border text-left cursor-pointer transition-all ${
                          theme.titleLineLimit === '2-lines'
                            ? 'border-emerald-500 bg-emerald-50/70 ring-1 ring-emerald-500'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="font-bold text-slate-900 text-[11px]">2-Lines Max</div>
                        <div className="text-[9.5px] text-slate-500 mt-0.5 leading-tight">
                          Allows 2 wrapped lines with auto-shrink
                        </div>
                      </button>
                    </div>

                    {/* Character Limits */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold text-slate-700 block">
                          Japanese Character Limit (和文上限)
                        </label>
                        <div className="flex flex-wrap gap-1">
                          {[18, 22, 24, undefined].map((chars) => (
                            <button
                              key={chars ?? 'none'}
                              onClick={() => setTheme({ ...theme, maxTitleCharsJa: chars })}
                              className={`px-2 py-1 text-[10px] rounded transition-colors cursor-pointer ${
                                theme.maxTitleCharsJa === chars
                                  ? 'bg-emerald-600 text-white font-bold'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              {chars ? `${chars}字` : '無制限'}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold text-slate-700 block">
                          English Character Limit (英文上限)
                        </label>
                        <div className="flex flex-wrap gap-1">
                          {[30, 40, 50, undefined].map((chars) => (
                            <button
                              key={chars ?? 'none'}
                              onClick={() => setTheme({ ...theme, maxTitleCharsEn: chars })}
                              className={`px-2 py-1 text-[10px] rounded transition-colors cursor-pointer ${
                                theme.maxTitleCharsEn === chars
                                  ? 'bg-emerald-600 text-white font-bold'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              {chars ? `${chars}c` : 'None'}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}


            {/* Tab 3: Font & Text Sizes Content */}
            {activeTab === 'sizes' && (
              <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">
                      Granular Typography Size Controls
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Calibrated in pixel units for optimal clarity on physical 90mm × 65mm cards.
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      setTheme((prev) => ({
                        ...prev,
                        textSizes: { ...DEFAULT_DESIGN_THEME.textSizes },
                      }))
                    }
                    className="text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer"
                  >
                    Reset All Sizes
                  </button>
                </div>

                <div className="space-y-3.5">
                  {/* Japanese Product Title Size */}
                  <SizeControlRow
                    label="Japanese Product Name (日本語商品名)"
                    value={theme.textSizes?.productNameJa ?? 24}
                    min={14}
                    max={34}
                    step={0.5}
                    onStep={(delta) => stepSize('productNameJa', delta, 14, 34)}
                    onChange={(val) => updateSize('productNameJa', val)}
                    defaultVal={24}
                  />

                  {/* English Product Title Size */}
                  <SizeControlRow
                    label="English Product Name (英語商品名)"
                    value={theme.textSizes?.productNameEn ?? 14}
                    min={8}
                    max={20}
                    step={0.5}
                    onStep={(delta) => stepSize('productNameEn', delta, 8, 20)}
                    onChange={(val) => updateSize('productNameEn', val)}
                    defaultVal={14}
                  />

                  {/* Giant Price Figures Size */}
                  <SizeControlRow
                    label="Main Price Figures (本体特大価格)"
                    value={theme.textSizes?.price ?? 52}
                    min={28}
                    max={64}
                    step={1}
                    onStep={(delta) => stepSize('price', delta, 28, 64)}
                    onChange={(val) => updateSize('price', val)}
                    defaultVal={52}
                  />

                  {/* Price Currency Symbol (円) */}
                  <SizeControlRow
                    label="Currency Symbol (円マーク)"
                    value={theme.textSizes?.priceCurrency ?? 26}
                    min={14}
                    max={36}
                    step={1}
                    onStep={(delta) => stepSize('priceCurrency', delta, 14, 36)}
                    onChange={(val) => updateSize('priceCurrency', val)}
                    defaultVal={26}
                  />

                  {/* Tax-Included Price (税込価格) */}
                  <SizeControlRow
                    label="Tax-Included Price (税込金額)"
                    value={theme.textSizes?.taxPrice ?? 18}
                    min={10}
                    max={26}
                    step={0.5}
                    onStep={(delta) => stepSize('taxPrice', delta, 10, 26)}
                    onChange={(val) => updateSize('taxPrice', val)}
                    defaultVal={18}
                  />

                  {/* Tax Label (税込) */}
                  <SizeControlRow
                    label="Tax Label (税込ラベル)"
                    value={theme.textSizes?.taxLabel ?? 12}
                    min={8}
                    max={18}
                    step={0.5}
                    onStep={(delta) => stepSize('taxLabel', delta, 8, 18)}
                    onChange={(val) => updateSize('taxLabel', val)}
                    defaultVal={12}
                  />

                  {/* Slanted Ribbon Japanese */}
                  <SizeControlRow
                    label="Ribbon Japanese Text (リボン和文)"
                    value={theme.textSizes?.ribbonJa ?? 13}
                    min={9}
                    max={20}
                    step={0.5}
                    onStep={(delta) => stepSize('ribbonJa', delta, 9, 20)}
                    onChange={(val) => updateSize('ribbonJa', val)}
                    defaultVal={13}
                  />

                  {/* Slanted Ribbon English */}
                  <SizeControlRow
                    label="Ribbon English Text (リボン英文)"
                    value={theme.textSizes?.ribbonEn ?? 9}
                    min={6}
                    max={16}
                    step={0.5}
                    onStep={(delta) => stepSize('ribbonEn', delta, 6, 16)}
                    onChange={(val) => updateSize('ribbonEn', val)}
                    defaultVal={9}
                  />

                  {/* Weight / Volume */}
                  <SizeControlRow
                    label="Weight & Volume (内容量・規格)"
                    value={theme.textSizes?.weight ?? 25}
                    min={12}
                    max={34}
                    step={0.5}
                    onStep={(delta) => stepSize('weight', delta, 12, 34)}
                    onChange={(val) => updateSize('weight', val)}
                    defaultVal={25}
                  />

                  {/* Origin Text */}
                  <SizeControlRow
                    label="Country of Origin Text (原産国表記)"
                    value={theme.textSizes?.origin ?? 20}
                    min={10}
                    max={28}
                    step={0.5}
                    onStep={(delta) => stepSize('origin', delta, 10, 28)}
                    onChange={(val) => updateSize('origin', val)}
                    defaultVal={20}
                  />

                  {/* Footer Slogans */}
                  <SizeControlRow
                    label="Bottom Footer Text (フッター品質文)"
                    value={theme.textSizes?.footer ?? 9.5}
                    min={7}
                    max={16}
                    step={0.5}
                    onStep={(delta) => stepSize('footer', delta, 7, 16)}
                    onChange={(val) => updateSize('footer', val)}
                    defaultVal={9.5}
                  />
                </div>
              </div>
            )}

            {/* Bottom Modal Actions */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                {isSaveInputOpen ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={templateNameInput}
                      onChange={(e) => setTemplateNameInput(e.target.value)}
                      placeholder="Template preset name..."
                      className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none"
                    />
                    <button
                      onClick={handleSaveTemplateSubmit}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
                    >
                      Save Preset
                    </button>
                    <button
                      onClick={() => setIsSaveInputOpen(false)}
                      className="px-2 py-1.5 text-xs text-slate-500 hover:text-slate-700"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsSaveInputOpen(true)}
                    className="px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg shadow-2xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5 text-slate-500" />
                    <span>Save as Preset Template</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApply}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Apply Design to All Tags</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Sub-component for individual size control row with slider & +/- steppers
interface SizeControlRowProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  defaultVal: number;
  onStep: (delta: number) => void;
  onChange: (val: number) => void;
}

const SizeControlRow: React.FC<SizeControlRowProps> = ({
  label,
  value,
  min,
  max,
  step,
  defaultVal,
  onStep,
  onChange,
}) => {
  return (
    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-slate-800 text-[11px]">{label}</span>
        <div className="flex items-center gap-1.5 font-mono text-[11px]">
          <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
            {value} px
          </span>
          {value !== defaultVal && (
            <button
              onClick={() => onChange(defaultVal)}
              className="text-[10px] text-slate-400 hover:text-slate-600 cursor-pointer"
              title={`Reset to default (${defaultVal}px)`}
            >
              Reset
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 pt-0.5">
        <button
          onClick={() => onStep(-step)}
          className="w-6 h-6 bg-white border border-slate-200 hover:bg-slate-100 rounded-md flex items-center justify-center text-slate-600 cursor-pointer font-bold shrink-0"
        >
          <Minus className="w-3 h-3" />
        </button>

        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 accent-emerald-600 cursor-pointer"
        />

        <button
          onClick={() => onStep(step)}
          className="w-6 h-6 bg-white border border-slate-200 hover:bg-slate-100 rounded-md flex items-center justify-center text-slate-600 cursor-pointer font-bold shrink-0"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
