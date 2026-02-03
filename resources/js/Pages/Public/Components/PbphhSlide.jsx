import React, { useMemo } from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import { formatNumber, formatCurrency } from './utils';

const PbphhSlide = ({ stats, commonOptions }) => {
  const regencyChartData = useMemo(() => {
    return {
      labels: stats?.bina_usaha?.pbphh?.by_regency ? Object.keys(stats.bina_usaha.pbphh.by_regency) : [],
      datasets: [{
        label: 'Unit',
        data: stats?.bina_usaha?.pbphh?.by_regency ? Object.values(stats.bina_usaha.pbphh.by_regency) : [],
        backgroundColor: '#475569CC',
        borderRadius: 4
      }]
    };
  }, [stats?.bina_usaha?.pbphh?.by_regency]);

  const productionTypeChartData = useMemo(() => {
    return {
      labels: stats?.bina_usaha?.pbphh?.by_production_type ? stats.bina_usaha.pbphh.by_production_type.map(d => d.type) : [],
      datasets: [{
        label: 'Persentase (%)',
        data: stats?.bina_usaha?.pbphh?.by_production_type ? stats.bina_usaha.pbphh.by_production_type.map(d => (d.count / (stats.bina_usaha.pbphh.total_units || 1)) * 100) : [],
        backgroundColor: '#4f46e5CC',
        borderRadius: 4
      }]
    };
  }, [stats?.bina_usaha?.pbphh?.by_production_type, stats?.bina_usaha?.pbphh?.total_units]);

  const conditionChartData = useMemo(() => {
    return {
      labels: stats?.bina_usaha?.pbphh?.by_condition ? stats.bina_usaha.pbphh.by_condition.map(d => String(d.condition_name) === '1' ? 'Beroperasi' : 'Tidak Beroperasi') : [],
      datasets: [{
        data: stats?.bina_usaha?.pbphh?.by_condition ? stats.bina_usaha.pbphh.by_condition.map(d => d.count) : [],
        backgroundColor: stats?.bina_usaha?.pbphh?.by_condition ? stats.bina_usaha.pbphh.by_condition.map(d => String(d.condition_name) === '1' ? '#16a34a' : '#dc2626') : [],
        borderWidth: 2,
        borderColor: '#ffffff',
        hoverOffset: 10,
        borderRadius: 4,
      }]
    };
  }, [stats?.bina_usaha?.pbphh?.by_condition]);

  const barOptions = useMemo(() => ({
    ...commonOptions,
    indexAxis: 'y',
    maintainAspectRatio: false,
    plugins: { ...commonOptions.plugins, legend: { display: false } }
  }), [commonOptions]);

  const percentageBarOptions = useMemo(() => ({
    ...commonOptions,
    maintainAspectRatio: false,
    plugins: {
      ...commonOptions.plugins,
      legend: { display: false },
      tooltip: { callbacks: { label: (ctx) => `${ctx.raw.toFixed(1)}%` } }
    },
    scales: { ...commonOptions.scales, y: { ...commonOptions.scales.y, ticks: { callback: (val) => `${val}%` } } }
  }), [commonOptions]);

  const pieOptions = useMemo(() => ({
    layout: {
      padding: 20
    },
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: { weight: 'bold', size: 10, family: "'Inter', sans-serif" },
          color: '#64748b'
        }
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1e293b',
        bodyColor: '#475569',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 12,
        displayColors: true,
        boxPadding: 6,
        callbacks: {
          label: (ctx) => {
            const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((ctx.raw / total) * 100).toFixed(1);
            return ` ${ctx.label}: ${ctx.raw} Unit (${percentage}%)`;
          },
          labelColor: (ctx) => {
            const isAktif = ctx.raw.label === 'Aktif' || String(stats?.bina_usaha?.pbphh?.by_condition[ctx.dataIndex]?.condition_name) === '1';
            return {
              borderColor: isAktif ? '#16a34a' : '#dc2626',
              backgroundColor: isAktif ? '#16a34a' : '#dc2626',
            };
          }
        }
      }
    }
  }), [stats?.bina_usaha?.pbphh?.by_condition]);

  return (
    <div className="min-w-full px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top: Metric Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Total PBPHH */}
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-slate-600 flex items-center justify-center text-white shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total PBPHH</p>
              <h3 className="text-3xl font-black text-gray-900 leading-tight">
                {formatNumber(stats?.bina_usaha?.pbphh?.total_units || 0)} <span className="text-sm font-bold text-gray-400">Unit</span>
              </h3>
            </div>
          </div>

          {/* Card 2: Total Investasi */}
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Investasi</p>
              <h3 className="text-xl font-black text-gray-900 leading-tight">
                {formatCurrency(stats?.bina_usaha?.pbphh?.total_investment || 0)}
              </h3>
            </div>
          </div>

          {/* Card 3: Total Tenaga Kerja */}
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Tenaga Kerja</p>
              <h3 className="text-3xl font-black text-gray-900 leading-tight">
                {formatNumber(stats?.bina_usaha?.pbphh?.total_workers || 0)} <span className="text-sm font-bold text-gray-400">Orang</span>
              </h3>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sebaran per Kabupaten */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col h-full">
            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-6">Sebaran Unit per Kabupaten</h4>
            <div className="h-[250px] mt-auto">
              <Bar
                data={regencyChartData}
                options={barOptions}
              />
            </div>
          </div>

          {/* Jenis Produksi (%) */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col h-full">
            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-6">Jenis Produksi (%)</h4>
            <div className="h-[250px] mt-auto">
              <Bar
                data={productionTypeChartData}
                options={percentageBarOptions}
              />
            </div>
          </div>

          {/* Kondisi Saat Ini */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col h-full">
            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-6">Kondisi Operasional (Total & %)</h4>
            <div className="h-[250px] mt-auto relative">
              <Pie
                data={conditionChartData}
                options={pieOptions}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(PbphhSlide);
