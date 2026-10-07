import React from 'react';
import { Product, CuttingGuideStyle, CardDesignTheme } from '../../types/database';

export interface BimiOfficialPriceTagProps {
  product: Product;
  pricing: {
    regularPrice: number;
    offerPrice: number | null;
    isOfferActive: boolean;
    effectivePrice: number;
    taxRate: number;
    taxIncludedPrice: number;
    location?: string;
  };
  showCutLines?: boolean;
  cuttingStyle?: CuttingGuideStyle;
  cardWidth?: string;
  cardHeight?: string;
  logoUrl?: string;
  topRibbonJa?: string;
  topRibbonEn?: string;
  bottomLeftText?: string;
  bottomRightText?: string;
  designTheme?: CardDesignTheme;
  titleLineLimit?: 'auto' | '1-line' | '2-lines';
  maxTitleCharsJa?: number;
  maxTitleCharsEn?: number;
}

export const BimiOfficialPriceTag: React.FC<BimiOfficialPriceTagProps> = ({
  product,
  pricing,
  showCutLines = true,
  cuttingStyle = 'crop-marks',
  logoUrl = '/images/mybimi-logo.png',
  topRibbonJa = '新鮮で美味しい',
  topRibbonEn = 'Fresh & Delicious',
  bottomLeftText = 'Good Food Better Life',
  bottomRightText = '安心・ハラール  Halal & Quality',
  designTheme,
  titleLineLimit,
  maxTitleCharsJa,
  maxTitleCharsEn,
}) => {
  // Compute price values (ensure integer values with no decimals for Yen pricing)
  const displayPrice = Math.round(pricing.effectivePrice);
  const taxRate = pricing.taxRate ?? 0.08;
  const rawTaxPrice = pricing.taxIncludedPrice ?? (displayPrice * (1 + taxRate));
  const formattedTaxPrice = Math.round(rawTaxPrice).toLocaleString();

  // Resolve design theme colors, texts, and text sizes
  const ribbonColor = designTheme?.ribbonColor || '#005A36';
  const topBarColor = designTheme?.topBarColor || '#F25C05';
  const priceColor = designTheme?.priceColor || '#D6001C';
  const footerLeftColor = designTheme?.footerLeftColor || '#005A36';
  const footerRightColor = designTheme?.footerRightColor || '#F25C05';

  const ribbonJa = designTheme?.ribbonJaText || topRibbonJa;
  const ribbonEn = designTheme?.ribbonEnText || topRibbonEn;
  const blText = designTheme?.bottomLeftText || bottomLeftText;
  const brText = designTheme?.bottomRightText || bottomRightText;
  const taxLbl = designTheme?.taxLabel || '税込';

  const rawNameJa = product.name_ja || product.name || '美味 チキンカット';
  const rawNameEn = product.name || 'ProductName_EN';

  // Text limit and overflow handling
  const lineLimitMode = titleLineLimit || designTheme?.titleLineLimit || 'auto';
  const effectiveMaxJa = maxTitleCharsJa ?? designTheme?.maxTitleCharsJa;
  const effectiveMaxEn = maxTitleCharsEn ?? designTheme?.maxTitleCharsEn;

  // Apply optional character limit truncations
  const displayNameJa = effectiveMaxJa && rawNameJa.length > effectiveMaxJa
    ? `${rawNameJa.slice(0, effectiveMaxJa)}…`
    : rawNameJa;
  const displayNameEn = effectiveMaxEn && rawNameEn.length > effectiveMaxEn
    ? `${rawNameEn.slice(0, effectiveMaxEn)}…`
    : rawNameEn;

  const enLen = displayNameEn.length;
  const jaLen = displayNameJa.length;

  // Base font sizes (from theme or defaults)
  const baseJaSize = designTheme?.textSizes?.productNameJa ?? 20;
  const baseEnSize = designTheme?.textSizes?.productNameEn ?? 13;

  // Smart dynamic font scaling based on text length and line limit mode
  let computedJaSize = baseJaSize;
  let computedEnSize = baseEnSize;

  if (lineLimitMode === '1-line') {
    // In strict 1-line mode, scale down smoothly so longer titles fit on 1 line before truncating
    if (jaLen > 24) computedJaSize = Math.min(baseJaSize * 0.65, 13);
    else if (jaLen > 18) computedJaSize = Math.min(baseJaSize * 0.72, 14.5);
    else if (jaLen > 12) computedJaSize = Math.min(baseJaSize * 0.85, 17);

    if (enLen > 40) computedEnSize = Math.min(baseEnSize * 0.8, 10.5);
    else if (enLen > 25) computedEnSize = Math.min(baseEnSize * 0.88, 11.5);
  } else if (lineLimitMode === 'auto') {
    // In auto mode: English is 1 line (truncate); Japanese fits up to ~23 chars on 1 line (at ~14px)
    // If Japanese is longer than 23 chars, it wraps to 2 lines at 13px
    if (jaLen > 24) computedJaSize = Math.min(baseJaSize * 0.65, 13);
    else if (jaLen > 17) computedJaSize = Math.min(baseJaSize * 0.7, 14);
    else if (jaLen > 11) computedJaSize = Math.min(baseJaSize * 0.85, 17);

    if (enLen > 40) computedEnSize = Math.min(baseEnSize * 0.8, 10.5);
    else if (enLen > 25) computedEnSize = Math.min(baseEnSize * 0.88, 11.5);
  } else {
    // '2-lines' mode: both can wrap to 2 lines, scale down to prevent collision into price
    if (jaLen > 24) computedJaSize = Math.min(baseJaSize * 0.65, 13);
    else if (jaLen > 16) computedJaSize = Math.min(baseJaSize * 0.75, 15);

    if (enLen > 40) computedEnSize = Math.min(baseEnSize * 0.8, 10.5);
    else if (enLen > 25) computedEnSize = Math.min(baseEnSize * 0.88, 11.5);
  }

  const displayPriceStr = displayPrice.toLocaleString();
  const defaultPriceSize = displayPriceStr.length >= 6 ? 44 : displayPriceStr.length >= 5 ? 48 : 52;

  const sizes = {
    productNameJa: computedJaSize,
    productNameEn: computedEnSize,
    price: designTheme?.textSizes?.price ?? defaultPriceSize,
    priceCurrency: designTheme?.textSizes?.priceCurrency ?? 24,
    taxPrice: designTheme?.textSizes?.taxPrice ?? 19,
    taxLabel: designTheme?.textSizes?.taxLabel ?? 14,
    ribbonJa: designTheme?.textSizes?.ribbonJa ?? 13,
    ribbonEn: designTheme?.textSizes?.ribbonEn ?? 9.5,
    weight: designTheme?.textSizes?.weight ?? 24,
    origin: designTheme?.textSizes?.origin ?? 18,
    footer: designTheme?.textSizes?.footer ?? 9.5,
  };


  // Determine weight / quantity (e.g. 1000gm)
  const weightPrimary = product.weight_volume || (product.unit ? `1${product.unit}` : '1000gm');

  // Map or resolve country of origin to Japanese display (matching reference image)
  const resolveCountryJa = (country?: string): string => {
    if (!country) return '日本';
    const trimmed = country.trim();
    const map: Record<string, string> = {
      Japan: '日本',
      Brazil: 'ブラジル',
      USA: 'アメリカ',
      'United States': 'アメリカ',
      Norway: 'ノルウェー',
      Thailand: 'タイ',
      India: 'インド',
      Pakistan: 'パキスタン',
      Australia: 'オーストラリア',
      Canada: 'カナダ',
      NewZealand: 'ニュージーランド',
      'New Zealand': 'ニュージーランド',
      Vietnam: 'ベトナム',
      China: '中国',
    };
    if (map[trimmed]) return map[trimmed];
    if (trimmed.includes('/')) {
      const firstPart = trimmed.split('/')[0].trim();
      return map[firstPart] || firstPart;
    }
    return trimmed;
  };

  const originLabel = designTheme?.originLabel || '原産国';
  const rawOrigin = product.country_of_origin;
  const originFormatted = rawOrigin && (rawOrigin.includes(':') || rawOrigin.includes('：'))
    ? rawOrigin
    : `${originLabel}:${resolveCountryJa(rawOrigin)}`;

  // Determine border styling based on cutting option
  let cutLineClass = 'border border-transparent';
  if (showCutLines) {
    if (cuttingStyle === 'dashed') {
      cutLineClass = 'border border-dashed border-slate-300';
    } else if (cuttingStyle === 'solid') {
      cutLineClass = 'border border-slate-300';
    } else if (cuttingStyle === 'crop-marks') {
      cutLineClass = 'border border-dashed border-slate-200/50';
    }
  }

  return (
    <div
      className={`bimi-price-tag-card relative bg-white flex flex-col justify-between overflow-hidden select-none box-border ${cutLineClass}`}
      style={{
        width: '100%',
        height: '100%',
        aspectRatio: '1024 / 708',
      }}
    >
      {/* 1. TOP ORANGE ACCENT STRIPE */}
      <div
        className="w-full shrink-0"
        style={{
          height: '2.8%',
          backgroundColor: topBarColor,
        }}
      />

      {/* 2. HEADER SECTION (LOGO ON LEFT & SLANTED GREEN RIBBON ON RIGHT) */}
      <div
        className="w-full relative flex items-center justify-between shrink-0"
        style={{ height: '18.6%' }}
      >
        {/* Left: Brand Logo */}
        <div
          className="flex items-center h-full pl-[4.2%] shrink-0"
          style={{ width: '45%' }}
        >
          <img
            src={logoUrl}
            alt="MyBIMI HALAL 360 STORE"
            className="h-[76%] max-h-12 w-auto object-contain"
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              if (img.src.includes('/images/mybimi-logo.png')) {
                img.src = '/mybimi-logo.png';
              }
            }}
          />
        </div>

        {/* Right: Slanted Ribbon */}
        <div
          className="relative h-full flex items-center justify-end shrink-0"
          style={{ width: '42%' }}
        >
          <svg
            viewBox="0 0 200 60"
            preserveAspectRatio="none"
            className="absolute inset-0 w-full h-full"
            style={{ display: 'block' }}
          >
            {/* Top-left: x=0, y=0. Top-right: x=200, y=0. Bottom-right: x=200, y=60. Bottom-left: x=42, y=60. Rounded Q 35 60 33 50. Slant up to (0,0). */}
            <path
              d="M 0 0 L 200 0 L 200 60 L 42 60 Q 35 60 33 50 L 0 0 Z"
              fill={ribbonColor}
            />
          </svg>

          {/* Ribbon Content */}
          <div className="relative z-10 flex flex-col items-center justify-center text-center pl-8 pr-4 w-full">
            <span
              className="font-black tracking-wider leading-tight text-white whitespace-nowrap"
              style={{
                fontSize: `${sizes.ribbonJa}px`,
                fontFamily: '"Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif',
              }}
            >
              {ribbonJa}
            </span>
            <span
              className="font-bold leading-tight mt-0.5 tracking-tight text-white whitespace-nowrap"
              style={{
                fontSize: `${sizes.ribbonEn}px`,
                fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
              }}
            >
              {ribbonEn}
            </span>
          </div>
        </div>
      </div>

      {/* 3. PRODUCT TITLE ZONE (ENGLISH ON TOP, JAPANESE UNDERNEATH) */}
      <div
        className="px-[4.2%] pt-1 flex flex-col justify-start shrink-0 overflow-hidden"
        style={{
          maxHeight: lineLimitMode === '1-line' ? '24%' : '30%',
        }}
      >
        {/* Line 1: English Product Name */}
        <div
          className={`font-bold text-black ${
            lineLimitMode === '2-lines' ? 'line-clamp-2 break-words' : 'line-clamp-1 truncate'
          }`}
          style={{
            fontSize: `${sizes.productNameEn}px`,
            lineHeight: '1.16',
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
            letterSpacing: '-0.2px',
          }}
          title={rawNameEn}
        >
          {displayNameEn}
        </div>

        {/* Line 2: Japanese Product Name */}
        <div
          className={`font-black text-black mt-0.5 ${
            lineLimitMode === '1-line'
              ? 'line-clamp-1 truncate'
              : (lineLimitMode === 'auto' && jaLen <= 23)
                ? 'line-clamp-1 truncate'
                : 'line-clamp-2 break-words'
          }`}
          style={{
            fontSize: `${sizes.productNameJa}px`,
            lineHeight: '1.16',
            fontFamily: '"Hiragino Kaku Gothic ProN", "Noto Sans JP", "Meiryo", sans-serif',
            letterSpacing: '-0.4px',
          }}
          title={rawNameJa}
        >
          {displayNameJa}
        </div>
      </div>

      {/* 4. MAIN BODY: TWO CLEAN ROWS (ROW 1: WEIGHT + MAIN PRICE, ROW 2: ORIGIN + TAX PRICE) */}
      <div className="flex-1 flex flex-col justify-end px-[4.2%] pb-2.5 w-full overflow-hidden min-h-0">
        {/* Row 1: Weight on Left | Huge Crimson Price on Right */}
        <div className="flex items-baseline justify-between w-full">
          {/* Main Weight (e.g. 1000gm) */}
          <div
            className="font-black text-black leading-none tracking-tight shrink-0"
            style={{
              fontSize: `${sizes.weight}px`,
              fontFamily: 'Inter, "Arial Black", sans-serif',
            }}
          >
            {weightPrimary}
          </div>

          {/* Huge Crimson Red Price & Red 円 */}
          <div className="flex items-baseline justify-end leading-none shrink-0">
            <span
              className="font-black tracking-tight"
              style={{
                color: priceColor,
                fontSize: `${sizes.price}px`,
                lineHeight: '0.85',
                fontFamily: 'Impact, "Arial Black", "Trebuchet MS", sans-serif',
                letterSpacing: '-1.5px',
              }}
            >
              {displayPriceStr}
            </span>
            <span
              className="font-black ml-1"
              style={{
                color: priceColor,
                fontSize: `${sizes.priceCurrency}px`,
                lineHeight: '1',
                fontFamily: '"Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif',
              }}
            >
              円
            </span>
          </div>
        </div>

        {/* Row 2: Country of Origin on Left | Tax Included on Right */}
        <div className="flex items-baseline justify-between w-full mt-2">
          {/* Origin (e.g. 原産国:日本, wraps to 2nd line on overflow) */}
          <div
            className="font-black text-black leading-tight shrink-0 line-clamp-2 break-words max-w-[55%]"
            style={{
              fontSize: `${sizes.origin}px`,
              fontFamily: '"Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif',
              letterSpacing: '-0.3px',
            }}
          >
            {originFormatted}
          </div>

          {/* Tax Included (e.g. 税込 1291円) */}
          <div className="flex items-baseline justify-end gap-1.5 text-black shrink-0">
            <span
              className="font-black"
              style={{
                fontSize: `${sizes.taxLabel}px`,
                fontFamily: '"Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif',
              }}
            >
              {taxLbl}
            </span>
            <span
              className="font-black tracking-tight"
              style={{
                fontSize: `${sizes.taxPrice}px`,
                fontFamily: 'Impact, "Arial Black", "Hiragino Kaku Gothic ProN", sans-serif',
                letterSpacing: '-0.3px',
              }}
            >
              {formattedTaxPrice}円
            </span>
          </div>
        </div>
      </div>

      {/* 5. BOTTOM TWO-TONE FOOTER (Exact forward diagonal cut /) */}
      <div
        className="w-full relative flex items-center overflow-hidden shrink-0"
        style={{
          height: '10.3%',
          backgroundColor: footerRightColor, // Right orange base
        }}
      >
        {/* Left Green Block with Forward Diagonal Slash Cut / */}
        <div
          className="absolute top-0 left-0 bottom-0 flex items-center pl-[4.2%]"
          style={{
            width: '49%',
            backgroundColor: footerLeftColor,
            clipPath: 'polygon(0 0, 100% 0, calc(100% - 22px) 100%, 0 100%)',
          }}
        >
          <span
            className="text-white font-bold tracking-normal whitespace-nowrap"
            style={{
              fontSize: `${sizes.footer}px`,
              fontFamily: 'Inter, system-ui, sans-serif',
            }}
          >
            {blText}
          </span>
        </div>

        {/* Right Orange Block Content */}
        <div className="w-full flex items-center justify-end pr-[4.2%]">
          <span
            className="text-white font-bold tracking-normal whitespace-nowrap"
            style={{
              fontSize: `${sizes.footer}px`,
              fontFamily: '"Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif',
            }}
          >
            {brText}
          </span>
        </div>
      </div>
    </div>
  );
};
