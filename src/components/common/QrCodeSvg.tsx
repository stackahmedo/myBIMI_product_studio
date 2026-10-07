import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface QrCodeSvgProps {
  value: string;
  size?: number;
  className?: string;
}

export const QrCodeSvg: React.FC<QrCodeSvgProps> = ({
  value,
  size = 56,
  className = '',
}) => {
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    QRCode.toDataURL(value || 'https://mybimi.jp', {
      width: size * 2,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => {
        if (isMounted) setDataUrl(url);
      })
      .catch((err) => {
        console.error('QR code generation error:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [value, size]);

  if (!dataUrl) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`bg-slate-100 rounded flex items-center justify-center text-[8px] text-slate-400 font-mono ${className}`}
      >
        QR
      </div>
    );
  }

  return (
    <img
      src={dataUrl}
      alt="QR Code"
      style={{ width: size, height: size }}
      className={`block object-contain shrink-0 ${className}`}
    />
  );
};
