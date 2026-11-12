'use client';

/**
 * Grafik Tren Kehadiran Bulanan Siswa (Pure CSS/Flex Bar Chart dengan garis ambang 85%).
 */
export default function GrafikTrenSiswa({ trenBulanan = [], periodeAktif = 'semua', onPilihBulan }) {
  if (!trenBulanan.length) {
    return (
      <div className="bg-white rounded-card p-5 shadow-soft border border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-primary">bar_chart</span>
            <span>Tren Kehadiran Bulanan</span>
          </h3>
        </div>
        <p className="text-xs text-slate-400 py-6 text-center">
          Belum ada data pertemuan yang cukup untuk menampilkan grafik tren bulanan.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-card p-5 shadow-soft border border-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-primary">bar_chart</span>
            <span>Tren Kehadiran per Bulan</span>
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Ketuk batang bulan untuk menyaring riwayat; garis putus menandai batas minimal 85%
          </p>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-500">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-primary inline-block"></span>
            <span>≥ 85%</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block"></span>
            <span>&lt; 85%</span>
          </span>
        </div>
      </div>

      {/* Area Grafik */}
      <div className="relative pt-4 pb-1">
        {/* Garis Ambang Minimal 85% */}
        <div
          className="absolute left-0 right-0 border-t border-dashed border-amber-400/80 pointer-events-none z-10 flex justify-end"
          style={{ bottom: 'calc(52px + 0.85 * 128px)' }}
        >
          <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded -mt-2.5 border border-amber-200">
            Min. 85%
          </span>
        </div>

        <div className="grid gap-3 items-end" style={{ gridTemplateColumns: `repeat(${Math.max(trenBulanan.length, 1)}, minmax(0, 1fr))` }}>
          {trenBulanan.map((item) => {
            const isSelected = periodeAktif === item.key;
            const isLow = item.persentase < 85;
            const barHeight = Math.max(Math.round((item.persentase / 100) * 128), 10);

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onPilihBulan?.(isSelected ? 'semua' : item.key)}
                title={`${item.labelLengkap}: ${item.persentase}% (${item.hadir}H / ${item.sakit}S / ${item.izin}I / ${item.alfa}A)`}
                className={`min-h-0 flex flex-col items-center group rounded-xl p-1.5 transition-all ${
                  isSelected ? 'bg-primary-light/70 ring-1 ring-primary' : 'hover:bg-slate-50'
                }`}
              >
                <span className={`text-[11px] font-extrabold mb-1 ${isLow ? 'text-amber-600' : 'text-slate-700'}`}>
                  {item.persentase}%
                </span>

                <div className="w-full max-w-[44px] h-[128px] bg-slate-100 rounded-xl flex items-end overflow-hidden p-1">
                  <div
                    className={`w-full rounded-lg transition-all duration-300 ${
                      isLow
                        ? 'bg-amber-400 group-hover:bg-amber-500'
                        : isSelected
                          ? 'bg-primary-hover'
                          : 'bg-primary group-hover:bg-primary-hover'
                    }`}
                    style={{ height: `${barHeight}px` }}
                  />
                </div>

                <span className="text-[11px] font-bold text-slate-700 mt-1.5">{item.label}</span>
                <span className="text-[10px] text-slate-400">
                  {item.hadir}H · {item.sakit}S · {item.izin}I · {item.alfa}A
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

