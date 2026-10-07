import React from 'react';
import { PaperSize, CuttingGuideStyle } from '../../types/database';

interface PageCuttingGuidesProps {
  paperSize: PaperSize;
  cuttingStyle?: CuttingGuideStyle;
  showMarginGuides?: boolean;
}

/**
 * Professional Retail Print Cutting Guides & Crop Marks
 * Calibrated specifically for 90mm x 65mm shelf price tags on A4 (2x4 = 8 tags).
 * Renders precise hairline trim marks and center crosshairs for guillotine and scissors.
 */
export const PageCuttingGuides: React.FC<PageCuttingGuidesProps> = ({
  paperSize,
  cuttingStyle = 'crop-marks',
  showMarginGuides = true,
}) => {
  if (cuttingStyle === 'none') {
    return null;
  }

  // A4 specific layout (210mm x 297mm, 2 cols of 90mm, 4 rows of 65mm)
  if (paperSize === 'A4') {
    const xLines = [15, 105, 195];
    const yLines = [18.5, 83.5, 148.5, 213.5, 278.5];

    return (
      <svg
        viewBox="0 0 210 297"
        className="absolute inset-0 w-full h-full pointer-events-none z-20 print:block"
        style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
      >
        <defs>
          <style>{`
            .crop-line { stroke: #94A3B8; stroke-width: 0.35; stroke-linecap: square; }
            .crop-dash { stroke: #CBD5E1; stroke-width: 0.3; stroke-dasharray: 2 2; }
          `}</style>
        </defs>

        {/* 1. Top Margin Trim Ticks (Hairline guides in top 18.5mm margin) */}
        {showMarginGuides && (
          <g>
            {xLines.map((x) => (
              <line key={`top-x-${x}`} x1={x} y1={0} x2={x} y2={10} className="crop-line" />
            ))}
          </g>
        )}

        {/* 2. Bottom Margin Trim Ticks (Hairline guides in bottom 18.5mm margin) */}
        {showMarginGuides && (
          <g>
            {xLines.map((x) => (
              <line key={`bot-x-${x}`} x1={x} y1={287} x2={x} y2={297} className="crop-line" />
            ))}
          </g>
        )}

        {/* 3. Left Margin Trim Ticks (Hairline guides in left 15mm margin) */}
        {showMarginGuides && (
          <g>
            {yLines.map((y) => (
              <line key={`left-y-${y}`} x1={0} y1={y} x2={10} y2={y} className="crop-line" />
            ))}
          </g>
        )}

        {/* 4. Right Margin Trim Ticks (Hairline guides in right 15mm margin) */}
        {showMarginGuides && (
          <g>
            {yLines.map((y) => (
              <line key={`right-y-${y}`} x1={200} y1={y} x2={210} y2={y} className="crop-line" />
            ))}
          </g>
        )}

        {/* 5. Corner Trim Marks (Crosshairs at sheet boundaries) */}
        {cuttingStyle === 'crop-marks' && (
          <g>
            {/* 4 Outer Corner Marks */}
            {/* Top-Left */}
            <path d="M 8 18.5 L 15 18.5 L 15 11.5" fill="none" className="crop-line" />
            {/* Top-Right */}
            <path d="M 202 18.5 L 195 18.5 L 195 11.5" fill="none" className="crop-line" />
            {/* Bottom-Left */}
            <path d="M 8 278.5 L 15 278.5 L 15 285.5" fill="none" className="crop-line" />
            {/* Bottom-Right */}
            <path d="M 202 278.5 L 195 278.5 L 195 285.5" fill="none" className="crop-line" />

            {/* Center Intersection Crosshairs (+) */}
            {yLines.slice(1, -1).map((y) => (
              <g key={`center-cross-${y}`}>
                <line x1={103} y1={y} x2={107} y2={y} className="crop-line" />
                <line x1={105} y1={y - 2} x2={105} y2={y + 2} className="crop-line" />
              </g>
            ))}
          </g>
        )}

        {/* 6. Full Dashed Grid Lines (If user selects full dashed line style) */}
        {cuttingStyle === 'dashed' && (
          <g>
            {/* Vertical Center Split */}
            <line x1={105} y1={18.5} x2={105} y2={278.5} className="crop-dash" />
            {/* Horizontal Splits */}
            {yLines.slice(1, -1).map((y) => (
              <line key={`full-dash-${y}`} x1={15} y1={y} x2={195} y2={y} className="crop-dash" />
            ))}
          </g>
        )}
      </svg>
    );
  }

  // A5 specific layout (210mm x 148.5mm, 2 cols of 90mm, 2 rows of 65mm)
  if (paperSize === 'A5') {
    const xLines = [15, 105, 195];
    const yLines = [9.25, 74.25, 139.25];

    return (
      <svg
        viewBox="0 0 210 148.5"
        className="absolute inset-0 w-full h-full pointer-events-none z-20 print:block"
        style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
      >
        <defs>
          <style>{`
            .crop-line { stroke: #94A3B8; stroke-width: 0.35; stroke-linecap: square; }
            .crop-dash { stroke: #CBD5E1; stroke-width: 0.3; stroke-dasharray: 2 2; }
          `}</style>
        </defs>

        {showMarginGuides && (
          <g>
            {xLines.map((x) => (
              <line key={`top-x-${x}`} x1={x} y1={0} x2={x} y2={6} className="crop-line" />
            ))}
            {xLines.map((x) => (
              <line key={`bot-x-${x}`} x1={x} y1={142.5} x2={x} y2={148.5} className="crop-line" />
            ))}
            {yLines.map((y) => (
              <line key={`left-y-${y}`} x1={0} y1={y} x2={10} y2={y} className="crop-line" />
            ))}
            {yLines.map((y) => (
              <line key={`right-y-${y}`} x1={200} y1={y} x2={210} y2={y} className="crop-line" />
            ))}
          </g>
        )}

        {cuttingStyle === 'crop-marks' && (
          <g>
            <path d="M 8 9.25 L 15 9.25 L 15 4" fill="none" className="crop-line" />
            <path d="M 202 9.25 L 195 9.25 L 195 4" fill="none" className="crop-line" />
            <path d="M 8 139.25 L 15 139.25 L 15 144.5" fill="none" className="crop-line" />
            <path d="M 202 139.25 L 195 139.25 L 195 144.5" fill="none" className="crop-line" />

            <g key="center-cross-74.25">
              <line x1={103} y1={74.25} x2={107} y2={74.25} className="crop-line" />
              <line x1={105} y1={72.25} x2={105} y2={76.25} className="crop-line" />
            </g>
          </g>
        )}

        {cuttingStyle === 'dashed' && (
          <g>
            <line x1={105} y1={9.25} x2={105} y2={139.25} className="crop-dash" />
            <line x1={15} y1={74.25} x2={195} y2={74.25} className="crop-dash" />
          </g>
        )}
      </svg>
    );
  }

  return null;
};
