import React, { useMemo } from 'react';
import { Doughnut, Bar } from 'react-chartjs-2';
import { formatNumber, formatCurrency } from './utils';

const KelembagaanPsSlide = ({ stats, commonOptions }) => {
  const schemeData = useMemo(() => {
    return {
      labels: stats?.kelembagaan_ps?.scheme_distribution ? stats.kelembagaan_ps.scheme_distribution.map(d => d.scheme) : [],
      datasets: [{
        data: stats?.kelembagaan_ps?.scheme_distribution ? stats.kelembagaan_ps.scheme_distribution.map(d => d.count) : [],
        backgroundColor: [
          '#10b981', // Emerald Green
          '#f59e0b', // Amber
          '#2d2d2dff', // Bright Blue
          '#ec4899', // Hot Pink
          '#8b5cf6', // Violet/Purple
          '#ef4444'  // Red
        ],
        borderWidth: 2,
        borderColor: '#ffffff',
        hoverOffset: 10,
      }]
    };
  }, [stats?.kelembagaan_ps?.scheme_distribution]);

  const economicData = useMemo(() => {
    return {
      labels: stats?.kelembagaan_ps?.economic_by_regency ? Object.keys(stats.kelembagaan_ps.economic_by_regency) : [],
      datasets: [{
        label: 'NEKON (Rp)',
        data: stats?.kelembagaan_ps?.economic_by_regency ? Object.values(stats.kelembagaan_ps.economic_by_regency) : [],
        backgroundColor: '#10b981CC',
        borderRadius: 6
      }]
    };
  }, [stats?.kelembagaan_ps?.economic_by_regency]);

  const doughnutPlugins = useMemo(() => [{
    id: 'centerTextPs',
    beforeDraw: (chart) => {
      const { ctx, chartArea: { top, bottom, left, right, width, height } } = chart;
      ctx.save();
      const text = stats?.kelembagaan_ps?.kelompok_count || 0;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = '900 24px Inter, sans-serif'; ctx.fillStyle = '#1e293b';
      ctx.fillText(text, left + width / 2, top + height / 2 - 6);
      ctx.font = 'bold 8px Inter, sans-serif'; ctx.fillStyle = '#64748b';
      ctx.letterSpacing = '1px';
      ctx.fillText('TOTAL KELOMPOK', left + width / 2, top + height / 2 + 14); ctx.restore();
    }
  }], [stats?.kelembagaan_ps?.kelompok_count]);

  const doughnutOptions = useMemo(() => ({
    maintainAspectRatio: false,
    cutout: '70%',
    layout: { padding: 10 },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 20,
          font: { weight: '600', size: 10, family: "'Inter', sans-serif" },
          color: '#475569'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1e293b',
        bodyColor: '#475569',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        callbacks: {
          label: (ctx) => {
            const total = ctx.dataset.data.reduce((a, b) => Number(a) + Number(b), 0);
            const percentage = total > 0 ? ((Number(ctx.raw) / total) * 100).toFixed(1) : 0;
            return ` ${ctx.label}: ${ctx.raw} Kelompok (${percentage}%)`;
          },
          labelColor: function (context) {
            return {
              borderColor: context.dataset.backgroundColor[context.dataIndex],
              backgroundColor: context.dataset.backgroundColor[context.dataIndex]
            };
          }
        }
      }
    }
  }), []);

  const barOptions = useMemo(() => ({
    ...commonOptions,
    maintainAspectRatio: false,
    plugins: { ...commonOptions.plugins, legend: { display: false } },
    scales: {
      y: { grid: { display: false }, ticks: { callback: (val) => 'Rp ' + formatNumber(val) } },
      x: { grid: { display: false } }
    }
  }), [commonOptions]);

  const topGroupsData = useMemo(() => {
    return {
      labels: stats?.kelembagaan_ps?.top_groups ? Object.keys(stats.kelembagaan_ps.top_groups) : [],
      datasets: [{
        label: 'NEKON (Rp)',
        data: stats?.kelembagaan_ps?.top_groups ? Object.values(stats.kelembagaan_ps.top_groups) : [],
        backgroundColor: '#f59e0bCC',
        borderRadius: 6
      }]
    };
  }, [stats?.kelembagaan_ps?.top_groups]);

  const topGroupsOptions = useMemo(() => ({
    ...commonOptions,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: { ...commonOptions.plugins, legend: { display: false } },
    scales: {
      y: {
        grid: { display: false },
        ticks: {
          font: { size: 9, family: "'Inter', sans-serif" },
          callback: function (value) {
            const label = this.getLabelForValue(value);
            return label.length > 20 ? label.substring(0, 20) + '…' : label;
          }
        }
      },
      x: { grid: { display: false } }
    }
  }), [commonOptions]);

  return (
    <div className="min-w-full px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top: Metric Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Card: Total Kelompok */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-2">Total Kelompok</p>
            <h3 className="text-3xl font-black text-gray-900">{formatNumber(stats?.kelembagaan_ps?.kelompok_count || 0)}</h3>
            <p className="text-[9px] text-gray-400 mt-1 uppercase font-bold">Unit Kelompok</p>
          </div>
          {/* Card: Total Luas */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-2">Total Luas</p>
            <h3 className="text-3xl font-black text-gray-900">{formatNumber(stats?.kelembagaan_ps?.area_total || 0)}</h3>
            <p className="text-[9px] text-gray-400 mt-1 uppercase font-bold">Hektar (Ha)</p>
          </div>
          {/* Card: Total KK */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-2">Total KK</p>
            <h3 className="text-3xl font-black text-gray-900">{formatNumber(stats?.kelembagaan_ps?.kk_total || 0)}</h3>
            <p className="text-[9px] text-gray-400 mt-1 uppercase font-bold">Kepala Keluarga</p>
          </div>
          {/* Card: Total NEKON */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-2">Total NEKON</p>
            <h3 className="text-xl font-black text-gray-900">{formatCurrency(stats?.kelembagaan_ps?.nekon_total || 0)}</h3>
            <p className="text-[9px] text-gray-400 mt-1 uppercase font-bold">Nilai Ekonomi</p>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chart 1: Skema Perhutanan Sosial (Pie) */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col h-full">
            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-6">Skema Perhutanan Sosial (Persentase & Jumlah)</h4>
            <div className="h-[320px] mt-auto relative">
              <Doughnut
                data={schemeData}
                plugins={doughnutPlugins}
                options={doughnutOptions}
              />
            </div>
          </div>

          {/* Chart 2: Nilai Ekonomi (NEKON) per Pengelola */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col h-full">
            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-6">Nilai Ekonomi (NEKON) Per Kabupaten</h4>
            <div className="h-[320px] mt-auto">
              <Bar
                data={economicData}
                options={barOptions}
              />
            </div>
          </div>

          {/* Chart 3: Top 5 Pengelola (NEKON) */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col h-full">
            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-6">5 Pengelola Terbesar (NEKON)</h4>
            <div className="h-[320px] mt-auto">
              <Bar
                data={topGroupsData}
                options={topGroupsOptions}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(KelembagaanPsSlide);
