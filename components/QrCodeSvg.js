'use client';

import { useMemo } from 'react';
import { buatMatriksQR } from '../lib/qrCode';

/**
 * Komponen QR Code berbasis SVG murni tanpa pustaka eksternal.
 */
export default function QrCodeSvg({
  value,
  size = 184,
  quietZone = 3,
  className = '',
  fgColor = '#1E293B',
  bgColor = '#FFFFFF',
}) {
  const matriks = useMemo(() => {
    if (!value) return null;
    try {
      return buatMatriksQR(String(value));
    } catch {
      return null;
    }
  }, [value]);

  if (!matriks) {
    return (
      <div
        className={`flex items-center justify-center rounded-2xl bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-500 p-4 text-center ${className}`}
        style={{ width: size, height: size }}
      >
        QR tidak tersedia
      </div>
    );
  }

  const n = matriks.length;
  const total = n + quietZone * 2;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${total} ${total}`}
      shapeRendering="crispEdges"
      role="img"
      aria-label={`Kode QR untuk ${value}`}
      className={`rounded-2xl shadow-sm border border-slate-200 ${className}`}
    >
      <rect width={total} height={total} fill={bgColor} />
      {matriks.map((baris, r) =>
        baris.map((sel, c) =>
          sel ? (
            <rect
              key={`${r}-${c}`}
              x={c + quietZone}
              y={r + quietZone}
              width={1}
              height={1}
              fill={fgColor}
            />
          ) : null
        )
      )}
    </svg>
  );
}

