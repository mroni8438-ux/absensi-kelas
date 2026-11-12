'use client';

import { useMemo } from 'react';
import {
  HARI_KALENDER,
  NAMA_BULAN,
  formatTanggalIndonesia,
  getStatusStyle,
} from '../../lib/siswaHelper';

const PRIORITAS_STATUS = { Alfa: 4, Sakit: 3, Izin: 2, Hadir: 1 };

function geserBulan(ym, delta) {
  const [y, m] = ym.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1 + delta, 1));
  const tahunBaru = dt.getUTCFullYear();
  const bulanBaru = String(dt.getUTCMonth() + 1).padStart(2, '0');
  return `${tahunBaru}-${bulanBaru}`;
}

/**
 * Kalender Kehadiran Bulanan interaktif dengan indikator warna H/S/I/A per tanggal.
 */
export default function KalenderKehadiranSiswa({
  riwayat = [],
  bulanKalender,
  onUbahBulanKalender,
  tanggalTerpilih,
  onPilihTanggal,
}) {
  const [tahun, bulan] = (bulanKalender || '2026-11').split('-').map(Number);
  const labelBulan = `${NAMA_BULAN[(bulan || 11) - 1]} ${tahun}`;

  const { selTanggal, jumlahHariBulan, offsetAwal } = useMemo(() => {
    const mapTanggal = {};
    riwayat.forEach((r) => {
      if (!r.tanggal || !r.tanggal.startsWith(`${tahun}-${String(bulan).padStart(2, '0')}`)) return;
      if (!mapTanggal[r.tanggal]) mapTanggal[r.tanggal] = [];
      mapTanggal[r.tanggal].push(r);
    });

    const totalHari = new Date(Date.UTC(tahun, bulan, 0)).getUTCDate();
    const hariPertama = new Date(Date.UTC(tahun, bulan - 1, 1)).getUTCDay(); // 0 = Minggu
    const offset = hariPertama === 0 ? 6 : hariPertama - 1; // Senin = 0 .. Minggu = 6

    return {
      selTanggal: mapTanggal,
      jumlahHariBulan: totalHari,
      offsetAwal: offset,
    };
  }, [riwayat, tahun, bulan]);

  const catatanTanggalTerpilih = tanggalTerpilih ? selTanggal[tanggalTerpilih] || [] : [];

  return (
    <div id="kalender" className="bg-white rounded-card p-5 shadow-soft border border-slate-200 scroll-mt-20">
      {/* Header Kalender */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-primary">calendar_month</span>
            <span>Kalender Kehadiran Bulanan</span>
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Ketuk tanggal bertanda warna untuk melihat materi dan catatan guru
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-full border border-slate-200">
          <button
            type="button"
            onClick={() => {
              onPilihTanggal?.(null);
              onUbahBulanKalender?.(geserBulan(bulanKalender, -1));
            }}
            className="min-h-0 w-8 h-8 rounded-full hover:bg-white text-slate-600 flex items-center justify-center transition-colors"
            title="Bulan Sebelumnya"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
          </button>
          <span className="text-xs font-extrabold text-slate-700 px-2 min-w-[112px] text-center">
            {labelBulan}
          </span>
          <button
            type="button"
            onClick={() => {
              onPilihTanggal?.(null);
              onUbahBulanKalender?.(geserBulan(bulanKalender, 1));
            }}
            className="min-h-0 w-8 h-8 rounded-full hover:bg-white text-slate-600 flex items-center justify-center transition-colors"
            title="Bulan Berikutnya"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
          </button>
        </div>
      </div>

      {/* Nama Hari */}
      <div className="grid grid-cols-7 gap-1.5 mb-1.5">
        {HARI_KALENDER.map((hari) => (
          <div key={hari} className="text-center text-[11px] font-bold text-slate-400 py-1">
            {hari}
          </div>
        ))}
      </div>

      {/* Grid Tanggal */}
      <div className="grid grid-cols-7 gap-1.5">
        {Array.from({ length: offsetAwal }).map((_, idx) => (
          <div key={`kosong-${idx}`} className="h-11 rounded-xl bg-slate-50/40" />
        ))}

        {Array.from({ length: jumlahHariBulan }).map((_, idx) => {
          const day = idx + 1;
          const dateStr = `${tahun}-${String(bulan).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const entries = selTanggal[dateStr] || [];
          const isSelected = tanggalTerpilih === dateStr;

          let mainEntry = null;
          if (entries.length > 0) {
            mainEntry = entries.reduce((acc, cur) =>
              (PRIORITAS_STATUS[cur.status] || 0) > (PRIORITAS_STATUS[acc.status] || 0) ? cur : acc
            );
          }

          const style = mainEntry ? getStatusStyle(mainEntry.status) : null;

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => onPilihTanggal?.(isSelected ? null : dateStr)}
              className={`min-h-0 h-11 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-0.5 transition-all ${
                isSelected
                  ? 'ring-2 ring-primary border-primary bg-primary-light/60 text-slate-900'
                  : style
                    ? `${style.cellClass} hover:brightness-95`
                    : 'border-slate-100 bg-slate-50/70 text-slate-400 hover:bg-slate-100'
              }`}
              title={mainEntry ? `${formatTanggalIndonesia(dateStr)} — ${mainEntry.status}` : formatTanggalIndonesia(dateStr)}
            >
              <span>{day}</span>
              {style ? (
                <span className={`w-1.5 h-1.5 rounded-full ${style.dotClass}`} />
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-transparent" />
              )}
            </button>
          );
        })}
      </div>

      {/* Legenda */}
      <div className="flex flex-wrap items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-100">
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold text-slate-500">
          {['Hadir', 'Sakit', 'Izin', 'Alfa'].map((st) => {
            const s = getStatusStyle(st);
            return (
              <span key={st} className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${s.dotClass}`} />
                <span>{s.label}</span>
              </span>
            );
          })}
        </div>
        {tanggalTerpilih && (
          <button
            type="button"
            onClick={() => onPilihTanggal?.(null)}
            className="min-h-0 text-[11px] font-bold text-primary hover:underline px-2 py-1"
          >
            Tampilkan semua tanggal
          </button>
        )}
      </div>

      {/* Detail Tanggal Terpilih */}
      {tanggalTerpilih && (
        <div className="mt-3 p-3.5 rounded-2xl bg-page/80 border border-slate-200">
          <p className="text-xs font-extrabold text-slate-800 mb-2">
            Detail Tanggal: {formatTanggalIndonesia(tanggalTerpilih)}
          </p>
          {catatanTanggalTerpilih.length > 0 ? (
            <div className="flex flex-col gap-2">
              {catatanTanggalTerpilih.map((item) => {
                const s = getStatusStyle(item.status);
                return (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl bg-white border border-slate-100 flex items-start justify-between gap-3"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-800">{item.judul_materi}</p>
                      {item.catatan && item.catatan !== '-' && (
                        <p className="text-[11px] text-slate-600 mt-0.5">Catatan: {item.catatan}</p>
                      )}
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0 ${s.badgeClass}`}>
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-500">
              Tidak ada sesi pertemuan kelas yang tercatat pada tanggal ini.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

