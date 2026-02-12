import React, { useMemo } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import { formatNumber } from './utils';

const ProductionSlide = ({ source, stats, currentYear, commonOptions }) => {
  const woodTrendData = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    const labels = months.map(m => {
      const date = new Date();
      date.setMonth(m - 1);
      return date.toLocaleString('id-ID', { month: 'short' });
    });

    return {
      labels,
      datasets: [
        {
          label: 'Kayu (M³)',
          data: months.map(m => stats?.bina_usaha[source.key]?.kayu_monthly?.[m] || 0),
          borderColor: source.color,
          backgroundColor: `${source.color}20`,
          fill: true,
          tension: 0.4,
        }
      ]
    };
  }, [stats?.bina_usaha, source.key, source.color]);

  const nonWoodTrendData = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    const labels = months.map(m => {
      const date = new Date();
      date.setMonth(m - 1);
      return date.toLocaleString('id-ID', { month: 'short' });
    });

    return {
      labels,
      datasets: [
        {
          label: 'Bukan Kayu (Kg)',
          data: months.map(m => stats?.bina_usaha[source.key]?.bukan_kayu_monthly?.[m] || 0),
          borderColor: '#f59e0b',
          backgroundColor: '#f59e0b20',
          fill: true,
          tension: 0.4,
          borderDash: [5, 5]
        }
      ]
    };
  }, [stats?.bina_usaha, source.key]);

  const topWoodData = useMemo(() => {
    return {
      labels: stats?.bina_usaha[source.key]?.kayu_commodity ? Object.keys(stats.bina_usaha[source.key].kayu_commodity) : [],
      datasets: [{
        label: 'Volume (M³)',
        data: stats?.bina_usaha[source.key]?.kayu_commodity ? Object.values(stats.bina_usaha[source.key].kayu_commodity) : [],
        backgroundColor: source.color,
        borderRadius: 6
      }]
    };
  }, [stats?.bina_usaha, source.key, source.color]);

  const topNonWoodData = useMemo(() => {
    return {
      labels: stats?.bina_usaha[source.key]?.bukan_kayu_commodity ? Object.keys(stats.bina_usaha[source.key].bukan_kayu_commodity) : [],
      datasets: [{
        label: 'Produksi',
        data: stats?.bina_usaha[source.key]?.bukan_kayu_commodity ? Object.values(stats.bina_usaha[source.key].bukan_kayu_commodity) : [],
        backgroundColor: '#f59e0bCC',
        borderRadius: 6
      }]
    };
  }, [stats?.bina_usaha, source.key]);

  const barOptions = useMemo(() => ({
    ...commonOptions,
    indexAxis: 'y',
    maintainAspectRatio: false,
    plugins: {
      ...commonOptions.plugins,
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const total = ctx.dataset.data.reduce((a, b) => Number(a) + Number(b), 0);
            const percentage = total > 0 ? ((Number(ctx.raw) / total) * 100).toFixed(1) : 0;
            const unit = ctx.dataset.label.includes('Volume') ? 'M³' : 'Kg';
            return ` ${ctx.label}: ${formatNumber(ctx.raw)} ${unit} (${percentage}%)`;
          }
        }
      }
    },
    scales: { y: { grid: { display: false }, ticks: { font: { size: 10, weight: 'bold' } } }, x: { grid: { display: false } } }
  }), [commonOptions]);

  const lineOptions = useMemo(() => ({
    ...commonOptions,
    maintainAspectRatio: false
  }), [commonOptions]);

  return (
    <div className="min-w-full px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left: Professional Stats Card */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-b from-white to-gray-50 rounded-[2rem] blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
              <div className="relative bg-white p-8 rounded-[2rem] shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-gray-100 flex flex-col overflow-hidden">
                {/* Decorative Circle */}
                <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full opacity-[0.03] pointer-events-none" style={{ backgroundColor: source.color }}></div>

                <div className="flex flex-col h-full relative z-10 gap-6">
                  {/* Title Section */}
                  <div className="text-center">
                    <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-gray-50 text-gray-500 border border-gray-100">
                      Ringkasan Produksi
                    </span>
                  </div>

                  {/* Wood Production Section */}
                  <div className="flex-1 bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-100 flex flex-col items-center justify-center text-center group/card transition-all hover:shadow-md">
                    <div className="mb-4 p-3 rounded-xl bg-white shadow-sm border border-gray-100 text-gray-700 group-hover/card:scale-110 transition-transform duration-300">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3c-4.418 0-8 2.686-8 6h3c0 1.657 2.239 3 5 3s5-1.343 5-3h3c0-3.314-3.582-6-8-6z m0 12c-1.105 0-2 .895-2 2v4h4v-4c0-1.105-.895-2-2-2z" />
                      </svg>
                    </div>
                    <span className="text-[9px] uppercase font-bold text-gray-400 tracking-widest mb-1">Total Produksi Kayu</span>
                    <h3 className="text-4xl font-black text-gray-900 leading-none mb-1 tabular-nums tracking-tight">
                      {formatNumber(stats?.bina_usaha[source.key]?.kayu_total || 0)}
                    </h3>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-md bg-opacity-10`} style={{ backgroundColor: source.color + '20', color: source.color }}>Meter Kubik (M³)</span>
                  </div>

                  {/* Non-Wood Production Section */}
                  <div className="flex-1 bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-100 flex flex-col items-center justify-center text-center group/card transition-all hover:shadow-md">
                    <div className="mb-4 p-3 rounded-xl bg-white shadow-sm border border-gray-100 text-amber-500 group-hover/card:scale-110 transition-transform duration-300">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-[9px] uppercase font-bold text-gray-400 tracking-widest mb-1">Total Bukan Kayu</span>
                      <h3 className="text-3xl font-black text-gray-900 leading-none mb-1 tabular-nums tracking-tight">
                        {formatNumber(stats?.bina_usaha[source.key]?.bukan_kayu_total || 0)}
                      </h3>
                      <span className="text-xs font-bold text-amber-600 px-2 py-0.5 rounded-md bg-amber-50">Kg</span>
                    </div>
                  </div>

                  {/* Bambu Production Section */}
                  <div className="flex-1 bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-100 flex flex-col items-center justify-center text-center group/card transition-all hover:shadow-md">
                    <div className="mb-4 p-3 rounded-xl bg-white shadow-sm border border-gray-100 text-green-500 group-hover/card:scale-110 transition-transform duration-300">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v18m7-18v18m7-18v18M5 9h7m0 6h7" />
                      </svg>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-[9px] uppercase font-bold text-gray-400 tracking-widest mb-1">Total Bambu</span>
                      <h3 className="text-3xl font-black text-gray-900 leading-none mb-1 tabular-nums tracking-tight">
                        {formatNumber(stats?.bina_usaha[source.key]?.bambu_total || 0)}
                      </h3>
                      <span className="text-xs font-bold text-green-600 px-2 py-0.5 rounded-md bg-green-50">Batang</span>
                    </div>
                  </div>

                  <div className="text-center mt-2">
                    <p className="text-[9px] text-gray-400 uppercase font-black tracking-[0.2em] opacity-60">Data Terupdate {currentYear}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Charts Grid */}
          <div className="md:col-span-3 space-y-6">
            {/* Monthly Trends (Stacked) */}
            <div className="grid grid-cols-1 gap-6">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-4">Tren Produksi Kayu Bulanan</h4>
                <div className="h-[200px]">
                  <Line
                    data={woodTrendData}
                    options={lineOptions}
                  />
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-4">Tren Produksi Bukan Kayu Bulanan</h4>
                <div className="h-[200px]">
                  <Line
                    data={nonWoodTrendData}
                    options={lineOptions}
                  />
                </div>
              </div>
            </div>

            {/* Top Commodities (Side by Side) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-4">5 Komoditas Terbesar (Kayu)</h4>
                <div className="h-[200px]">
                  <Bar
                    data={topWoodData}
                    options={barOptions}
                  />
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-4">5 Komoditas Terbesar (Bukan Kayu)</h4>
                <div className="h-[200px]">
                  <Bar
                    data={topNonWoodData}
                    options={barOptions}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(ProductionSlide);
