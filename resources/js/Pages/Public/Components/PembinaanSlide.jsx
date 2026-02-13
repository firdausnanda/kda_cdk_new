import React, { useMemo } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import StatsCard from './StatsCard';
import { formatNumber } from './utils';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement, Filler } from 'chart.js';

// Register ChartJS components in case this component is used independently, 
// though usually registered in parent. Duplicate registration is harmless.
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement, Filler);

const PembinaanSlide = ({ section, currentYear, commonOptions }) => {

  const percentage = useMemo(() => {

    if (section.total > 0 && section.targetTotal <= 0) {
      return 100;
    }
    return section.targetTotal > 0 ? (section.total / section.targetTotal) * 100 : 0;
  }, [section.total, section.targetTotal]);

  const trendChartData = useMemo(() => {
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
          label: 'Realisasi ' + section.label,
          data: months.map(m => section.chart?.[m] || 0),
          borderColor: section.color,
          backgroundColor: section.color + '20',
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          order: 1
        },
        {
          label: 'Target ' + section.label,
          data: months.map(m => section.targetChart?.[m] || 0),
          borderColor: '#9ca3af', // gray-400
          backgroundColor: '#9ca3af20',
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          borderDash: [5, 5],
          order: 2
        }
      ]
    };
  }, [section.chart, section.targetChart, section.label, section.color]);

  const fundChartData = useMemo(() => {
    return {
      labels: section.fund ? Object.keys(section.fund) : [],
      datasets: [{
        data: section.fund ? Object.values(section.fund) : [],
        backgroundColor: section.color + 'CC',
        borderRadius: 6
      }]
    };
  }, [section.fund, section.color]);

  const regencyChartData = useMemo(() => {
    const dataObj = section.regency || section.types || {};
    return {
      labels: Object.keys(dataObj),
      datasets: [{
        data: Object.values(dataObj),
        backgroundColor: section.color + 'AA',
        borderRadius: 6
      }]
    };
  }, [section.regency, section.types, section.color]);

  const totalFundReports = useMemo(() => {
    return Object.values(section.fund || {}).reduce((a, b) => a + (parseInt(b) || 0), 0);
  }, [section.fund]);

  const totalRegencyItems = useMemo(() => {
    return Object.keys(section.regency || section.types || {}).length;
  }, [section.regency, section.types]);

  return (
    <div className="min-w-full px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left: Professional Stats Card */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <StatsCard
              title="Total Realisasi"
              total={section.total}
              unit={section.unit}
              progress={percentage}
              target={section.targetTotal}
              color={section.color}
              year={currentYear}
            />
          </div>

          {/* Right: Charts Grid */}
          <div className="md:col-span-3 space-y-6">
            {/* Combined Trend Chart: Realization vs Target */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Tren Target & Realisasi Bulanan</h4>
                <div className="flex gap-4">
                  <span className="flex items-center gap-1.5 text-[8px] font-bold uppercase" style={{ color: section.color }}>
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: section.color }}></span> Realisasi
                  </span>
                  <span className="flex items-center gap-1.5 text-[8px] font-bold text-gray-400 uppercase">
                    <span className="w-2 h-2 rounded-full bg-gray-400"></span> Target
                  </span>
                </div>
              </div>
              <div className="h-[200px]">
                <Line
                  data={trendChartData}
                  options={{
                    ...commonOptions,
                    maintainAspectRatio: false,
                    plugins: { ...commonOptions.plugins, legend: { display: false } },
                    scales: {
                      y: {
                        display: true,
                        beginAtZero: true,
                        grid: { color: 'rgba(0, 0, 0, 0.05)' },
                        ticks: {
                          font: { size: 10, weight: 'bold' }
                        }
                      },
                      x: { grid: { display: false } }
                    }
                  }}
                />
              </div>
            </div>

            {/* Bottom Charts: Fund & Regency (Pemberdayaan Style) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Fund Source Card */}
              <div className={`bg-white rounded-3xl p-6 shadow-sm border flex flex-col h-full`} style={{ borderColor: section.color + '30' }}>
                <div className="flex items-center gap-4 mb-6">
                  <div className={`p-3 rounded-2xl`} style={{ backgroundColor: section.color + '15', color: section.color }}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Sumber Dana</h3>
                    <p className="text-xs text-gray-500">Distribusi Pendanaan</p>
                  </div>
                </div>
                <div className="flex flex-col gap-6 flex-1">
                  <div className={`flex flex-col items-center justify-center p-4 rounded-2xl border`} style={{ backgroundColor: section.color + '05', borderColor: section.color + '20' }}>
                    <span className={`text-[10px] font-bold uppercase tracking-widest mb-1`} style={{ color: section.color }}>Total Laporan</span>
                    <span className="text-4xl font-black text-gray-900">
                      {formatNumber(totalFundReports)}
                    </span>
                    <span className="text-xs font-medium text-gray-400 mt-1">Laporan Terdaftar</span>
                  </div>
                  <div className="w-full h-[180px]">
                    <Bar
                      data={fundChartData}
                      options={{
                        ...commonOptions,
                        indexAxis: 'y',
                        maintainAspectRatio: false,
                        plugins: {
                          ...commonOptions.plugins,
                          legend: { display: false },
                          tooltip: {
                            callbacks: {
                              label: (context) => ` Jumlah: ${context.raw} Laporan`
                            }
                          }
                        },
                        scales: {
                          x: { grid: { display: false }, ticks: { display: false } },
                          y: { grid: { display: false }, ticks: { font: { size: 10, weight: 'bold' } } }
                        }
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Regency Card */}
              <div className={`bg-white rounded-3xl p-6 shadow-sm border flex flex-col h-full`} style={{ borderColor: section.color + '30' }}>
                <div className="flex items-center gap-4 mb-6">
                  <div className={`p-3 rounded-2xl`} style={{ backgroundColor: section.color + '15', color: section.color }}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{section.regency ? 'Wilayah' : 'Jenis Bangunan'}</h3>
                    <p className="text-xs text-gray-500">{section.regency ? 'Distribusi Kabupaten/Kota' : 'Jenis Bangunan KTA'}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-6 flex-1">
                  {(section.regency || section.types) ? (
                    <>
                      <div className={`flex flex-col items-center justify-center p-4 rounded-2xl border`} style={{ backgroundColor: section.color + '05', borderColor: section.color + '20' }}>
                        <span className={`text-[10px] font-bold uppercase tracking-widest mb-1`} style={{ color: section.color }}>{section.regency ? 'Total Wilayah' : 'Total Jenis'}</span>
                        <span className="text-4xl font-black text-gray-900">
                          {formatNumber(totalRegencyItems)}
                        </span>
                        <span className="text-xs font-medium text-gray-400 mt-1">{section.regency ? 'Kabupaten/Kota Terjangkau' : 'Bangunan Terdaftar'}</span>
                      </div>
                      <div className="w-full h-[180px]">
                        <Bar
                          data={regencyChartData}
                          options={{
                            ...commonOptions,
                            indexAxis: 'y',
                            maintainAspectRatio: false,
                            plugins: {
                              ...commonOptions.plugins,
                              legend: { display: false },
                              tooltip: {
                                callbacks: {
                                  label: (context) => ` Jumlah: ${context.raw} ${section.regency ? 'Laporan' : 'Unit'}`
                                }
                              }
                            },
                            scales: {
                              x: { grid: { display: false }, ticks: { display: false } },
                              y: { grid: { display: false }, ticks: { font: { size: 10, weight: 'bold' } } }
                            }
                          }}
                        />
                      </div>
                    </>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2 py-12">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                      <p className="text-xs italic font-medium">Data Lokasi Belum Tersedia</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(PembinaanSlide);
