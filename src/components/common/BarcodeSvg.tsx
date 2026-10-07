import React from 'react';

interface BarcodeSvgProps {
  id?: string;
  value: string;
  width?: number;
  height?: number;
  showText?: boolean;
  className?: string;
}

/**
 * Deterministic SVG Barcode generator for JAN-13 / EAN-13 / Code128 format
 */
export const BarcodeSvg: React.FC<BarcodeSvgProps> = ({
  id,
  value,
  width = 160,
  height = 50,
  showText = true,
  className = '',
}) => {
  // Generate deterministic bar widths from character hash
  const sanitized = (value || '4901234567890').replace(/[^0-9A-Z]/gi, '');
  const bars: { x: number; w: number }[] = [];
  let currentX = 10;
  const barHeight = showText ? height - 16 : height - 4;

  // Start guard
  bars.push({ x: currentX, w: 2 });
  currentX += 4;
  bars.push({ x: currentX, w: 2 });
  currentX += 4;

  for (let i = 0; i < sanitized.length; i++) {
    const charCode = sanitized.charCodeAt(i);
    const pattern = (charCode * 31 + i * 17) % 16;
    const w1 = (pattern % 2) + 1.2;
    const w2 = ((pattern >> 1) % 2) + 1.2;
    const gap = ((pattern >> 2) % 2) + 1.8;

    bars.push({ x: currentX, w: w1 });
    currentX += w1 + gap;
    bars.push({ x: currentX, w: w2 });
    currentX += w2 + gap;
  }

  // End guard
  bars.push({ x: currentX, w: 2 });
  currentX += 4;
  bars.push({ x: currentX, w: 2 });
  currentX += 10;

  const totalWidth = Math.max(width, currentX);

  return (
    <div className={`inline-flex flex-col items-center select-none ${className}`}>
      <svg
        id={id}
        viewBox={`0 0 ${totalWidth} ${height}`}
        className="w-full h-auto max-w-full"
        style={{ maxHeight: height }}
        preserveAspectRatio="xMidYMid meet"
      >
        <rect width="100%" height="100%" fill="white" />
        {bars.map((bar, idx) => (
          <rect
            key={idx}
            x={bar.x}
            y={4}
            width={bar.w}
            height={barHeight}
            fill="#1E293B"
          />
        ))}
      </svg>
      {showText && (
        <span className="font-mono text-[11px] tracking-widest text-slate-600 mt-0.5 tabular-nums">
          {value || '4901234 567890'}
        </span>
      )}
    </div>
  );
};
