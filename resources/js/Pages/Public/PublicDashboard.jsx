import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import Select from 'react-select';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement } from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement);

export default function PublicDashboard({ currentYear, availableYears, stats }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const modules = [
    { id: 0, title: 'Pembinaan Hutan', color: 'bg-emerald-600', text: 'text-emerald-600' },
    { id: 1, title: 'Perlindungan Hutan', color: 'bg-red-600', text: 'text-red-600' },
    { id: 2, title: 'Bina Usaha', color: 'bg-blue-600', text: 'text-blue-600' },
    { id: 3, title: 'Pemberdayaan', color: 'bg-indigo-600', text: 'text-indigo-600' },
  ];

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % modules.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + modules.length) % modules.length);

  // Auto-slide effect
  useEffect(() => {
    const interval = setInterval(nextSlide, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleYearChange = (selectedOption) => {
    router.get(route('public.dashboard'), { year: selectedOption.value }, {
      preserveScroll: true,
      onStart: () => setIsLoading(true),
      onFinish: () => setIsLoading(false),
    });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('id-ID').format(value);
  };

  // --- Chart Data Generators ---

  // 1. Pembinaan Chart (Rehab Lahan) -> Line Chart
  const rehabChartData = {
    labels: Object.keys(stats.pembinaan.rehab_chart).map(m => {
      const date = new Date();
      date.setMonth(m - 1);
      return date.toLocaleString('id-ID', { month: 'short' });
    }),
    datasets: [{
      label: 'Realisasi Rehabilitasi (Ha)',
      data: Object.values(stats.pembinaan.rehab_chart),
      borderColor: 'rgb(16, 185, 129)',
      backgroundColor: 'rgba(16, 185, 129, 0.5)',
      tension: 0.3
    }]
  };

  // --- 2. Perlindungan Charts ---
  // Kebakaran Monthly (Line)
  const kebakaranMonthlyData = {
    labels: Object.keys(stats.perlindungan.kebakaranMonthly).map(m => {
      const date = new Date();
      date.setMonth(m - 1);
      return date.toLocaleString('id-ID', { month: 'short' });
    }),
    datasets: [{
      label: 'Kejadian Kebakaran',
      data: Object.values(stats.perlindungan.kebakaranMonthly),
      borderColor: 'rgb(220, 38, 38)', // Red-600
      backgroundColor: 'rgba(220, 38, 38, 0.5)',
      tension: 0.3
    }]
  };

  // Wisata Monthly (Line)
  const wisataMonthlyData = {
    labels: Object.keys(stats.perlindungan.wisataMonthly).map(m => {
      const date = new Date();
      date.setMonth(m - 1);
      return date.toLocaleString('id-ID', { month: 'short' });
    }),
    datasets: [{
      label: 'Pengunjung',
      data: Object.values(stats.perlindungan.wisataMonthly),
      borderColor: 'rgb(79, 70, 229)', // Indigo-600
      backgroundColor: 'rgba(79, 70, 229, 0.5)',
      tension: 0.3
    }]
  };

  // --- 3. Bina Usaha Charts ---
  // Kayu Monthly (Line)
  const kayuMonthlyData = {
    labels: Object.keys(stats.bina_usaha.kayuMonthly).map(m => {
      const date = new Date();
      date.setMonth(m - 1);
      return date.toLocaleString('id-ID', { month: 'short' });
    }),
    datasets: [{
      label: 'Volume Produksi (M3)',
      data: Object.values(stats.bina_usaha.kayuMonthly),
      borderColor: 'rgb(59, 130, 246)', // Blue-500
      backgroundColor: 'rgba(59, 130, 246, 0.5)',
      tension: 0.3
    }]
  };

  // Kayu Commodity (Bar)
  const kayuCommodityData = {
    labels: Object.keys(stats.bina_usaha.kayuCommodity),
    datasets: [{
      label: 'Volume (M3)',
      data: Object.values(stats.bina_usaha.kayuCommodity).map(v => parseFloat(v)),
      backgroundColor: 'rgba(37, 99, 235, 0.8)', // Blue-600
      borderRadius: 4,
    }]
  };

  // Bukan Kayu Monthly (Line)
  const bukanKayuMonthlyData = {
    labels: Object.keys(stats.bina_usaha.bukanKayuMonthly).map(m => {
      const date = new Date();
      date.setMonth(m - 1);
      return date.toLocaleString('id-ID', { month: 'short' });
    }),
    datasets: [{
      label: 'Produksi (Ton/Ltr)',
      data: Object.values(stats.bina_usaha.bukanKayuMonthly),
      borderColor: 'rgb(245, 158, 11)', // Amber-500
      backgroundColor: 'rgba(245, 158, 11, 0.5)',
      tension: 0.3
    }]
  };

  // Bukan Kayu Commodity (Bar)
  const bukanKayuCommodityData = {
    labels: Object.keys(stats.bina_usaha.bukanKayuCommodity),
    datasets: [{
      label: 'Produksi (Ton/Ltr)',
      data: Object.values(stats.bina_usaha.bukanKayuCommodity).map(v => parseFloat(v)),
      backgroundColor: 'rgba(217, 119, 6, 0.8)', // Amber-600
      borderRadius: 4,
    }]
  };

  // 4. Pemberdayaan Charts (KUPS) -> Doughnut
  const kupsChartData = {
    labels: Object.keys(stats.pemberdayaan.kups.classes),
    datasets: [{
      data: Object.values(stats.pemberdayaan.kups.classes),
      backgroundColor: [
        'rgba(54, 162, 235, 0.8)',   // Blue
        'rgba(201, 203, 207, 0.8)', // Silver
        'rgba(255, 205, 86, 0.8)',  // Gold
        'rgba(75, 192, 192, 0.8)',  // Platinum (Teal-ish)
      ],
      borderWidth: 0
    }]
  };

  const commonOptions = {
    responsive: true,
    plugins: { legend: { position: 'bottom', labels: { font: { family: "'Inter', sans-serif" } } } },
    scales: { y: { beginAtZero: true, grid: { color: 'rgba(0, 0, 0, 0.05)' } }, x: { grid: { display: false } } }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans flex flex-col relative">
      <Head title="Dashboard Monitoring Program Kehutanan" />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-[60] bg-white/50 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-emerald-700 font-semibold text-sm">Memuat Data...</span>
          </div>
        </div>
      )}

      {/* Navbar */}
      <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-3 group">
                <div className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-sm border border-gray-100 group-hover:scale-105 transition-transform">
                  <img src="/img/logo.webp" alt="Logo" className="w-8 h-8 object-contain" />
                </div>
                <div className="flex flex-col">
                  <span className="font-display font-bold text-lg text-gray-900 leading-tight">Dashboard Monitoring</span>
                  <span className={`text-[10px] uppercase tracking-wider font-bold ${modules[currentSlide].text}`}>
                    CDK Trenggalek
                  </span>
                </div>
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-48">
                <Select
                  value={{ value: currentYear, label: `Tahun ${currentYear}` }}
                  onChange={handleYearChange}
                  options={availableYears ? availableYears.map(y => ({ value: y, label: `Tahun ${y}` })) : [{ value: currentYear, label: `Tahun ${currentYear}` }]}
                  className="text-sm font-bold text-gray-700"
                  placeholder="Pilih Tahun"
                  styles={{
                    control: (base, state) => ({
                      ...base,
                      borderRadius: '0.75rem', // rounded-xl
                      padding: '0.125rem',
                      borderColor: state.isFocused ? '#10b981' : '#e5e7eb', // emerald-500 or gray-200
                      boxShadow: state.isFocused ? '0 0 0 2px rgba(16, 185, 129, 0.2)' : '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                      '&:hover': {
                        borderColor: '#d1d5db' // gray-300
                      }
                    }),
                    option: (base, state) => ({
                      ...base,
                      backgroundColor: state.isSelected ? '#10b981' : state.isFocused ? '#d1fae5' : null, // emerald-500 : emerald-50
                      color: state.isSelected ? 'white' : '#374151',
                      cursor: 'pointer'
                    }),
                    singleValue: (base) => ({
                      ...base,
                      color: '#374151'
                    })
                  }}
                />
              </div>
              <Link href="/" className="hidden sm:inline-flex px-5 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-semibold text-sm hover:bg-gray-200 transition-colors">
                Kembali
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content (Carousel Area) */}
      <main className="flex-1 flex flex-col justify-center py-8 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full z-10">

          {/* Carousel Navigation & Header */}
          <div className="flex items-center justify-between mb-8">
            <button onClick={prevSlide} className="p-2 rounded-full hover:bg-gray-200 transition-colors text-gray-400 hover:text-gray-900">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>

            <div className="text-center">
              <h2 className={`text-4xl font-bold mb-2 transition-colors duration-500 ${modules[currentSlide].text}`}>
                {modules[currentSlide].title}
              </h2>
              <div className="flex justify-center gap-2">
                {modules.map((m, i) => (
                  <button
                    key={m.id}
                    onClick={() => setCurrentSlide(i)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${currentSlide === i ? `w-8 ${m.color}` : 'w-2 bg-gray-300'}`}
                    aria-label={`Go to slide ${i + 1}`}
                  />
                ))}
              </div>
            </div>

            <button onClick={nextSlide} className="p-2 rounded-full hover:bg-gray-200 transition-colors text-gray-400 hover:text-gray-900">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>

          {/* Slides Content (Sliding Track) */}
          <div className="relative overflow-hidden min-h-[550px]">
            <div
              className="flex transition-transform duration-700 ease-in-out will-change-transform"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >

              {/* Slide 0: Pembinaan Hutan */}
              <div className="min-w-full px-1">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Stats Cards */}
                  <div className="col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-emerald-100">
                      <p className="text-sm font-medium text-emerald-600/80 uppercase tracking-wider mb-2">Total Rehabilitasi Lahan</p>
                      <h3 className="text-4xl font-extrabold text-emerald-900">{formatNumber(stats.pembinaan.rehab_total)} <span className="text-xl font-normal text-emerald-600">Ha</span></h3>
                      <p className="text-sm text-gray-500 mt-2">Realisasi penanaman tahun {currentYear}</p>
                    </div>
                    <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100">
                      <h4 className="font-bold text-emerald-900 mb-2">Program Unggulan</h4>
                      <ul className="space-y-2 text-sm text-emerald-800">
                        <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>Rehabilitasi Hutan Lindung</li>
                        <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>Penghijauan Lingkungan</li>
                        <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>RHL Teknis</li>
                      </ul>
                    </div>
                  </div>
                  {/* Chart */}
                  <div className="col-span-1 lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-6">Tren Rehabilitasi Lahan Bulanan</h3>
                    <div className="h-[350px]">
                      <Line data={rehabChartData} options={{ ...commonOptions, maintainAspectRatio: false }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Slide 1: Perlindungan Hutan */}
              <div className="min-w-full px-1">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-red-100 relative overflow-hidden">
                    <div className="absolute right-0 top-0 p-3 opacity-10"><svg className="w-24 h-24 text-red-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" /></svg></div>
                    <p className="text-sm font-bold text-red-500 uppercase">Kebakaran Hutan</p>
                    <h3 className="text-3xl font-bold text-gray-900 mt-2">{formatNumber(stats.perlindungan.kebakaran_kejadian)}</h3>
                    <p className="text-gray-500 text-sm">Kejadian Tahun Ini</p>
                  </div>

                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-red-100 relative overflow-hidden">
                    <div className="absolute right-0 top-0 p-3 opacity-10"><svg className="w-24 h-24 text-red-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" /></svg></div>
                    <p className="text-sm font-bold text-red-500 uppercase">Area Terbakar</p>
                    <h3 className="text-3xl font-bold text-gray-900 mt-2">{formatNumber(stats.perlindungan.kebakaran_area)}</h3>
                    <p className="text-gray-500 text-sm">Hektar</p>
                  </div>

                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-indigo-100 relative overflow-hidden">
                    <div className="absolute right-0 top-0 p-3 opacity-10"><svg className="w-24 h-24 text-indigo-600" fill="currentColor" viewBox="0 0 20 20"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" /></svg></div>
                    <p className="text-sm font-bold text-indigo-500 uppercase">Pengunjung Wisata Alam</p>
                    <h3 className="text-3xl font-bold text-gray-900 mt-2">{formatNumber(stats.perlindungan.wisata_visitors)}</h3>
                    <p className="text-gray-500 text-sm">Orang</p>
                  </div>

                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-emerald-100 relative overflow-hidden">
                    <div className="absolute right-0 top-0 p-3 opacity-10"><svg className="w-24 h-24 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
                    <p className="text-sm font-bold text-emerald-500 uppercase">Pendapatan Wisata</p>
                    <h3 className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(stats.perlindungan.wisata_income)}</h3>
                    <p className="text-gray-500 text-sm">Rupiah</p>
                  </div>
                </div>

                {/* Monthly Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                  {/* Kebakaran Chart */}
                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-red-50">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <span className="w-2 h-8 rounded-full bg-red-500"></span>
                      Tren Kebakaran Hutan
                    </h3>
                    <div className="h-[250px]">
                      <Line data={kebakaranMonthlyData} options={{ ...commonOptions, maintainAspectRatio: false }} />
                    </div>
                  </div>

                  {/* Wisata Chart */}
                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-indigo-50">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <span className="w-2 h-8 rounded-full bg-indigo-500"></span>
                      Tren Kunjungan Wisata
                    </h3>
                    <div className="h-[250px]">
                      <Line data={wisataMonthlyData} options={{ ...commonOptions, maintainAspectRatio: false }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Slide 2: Bina Usaha */}
              <div className="min-w-full px-1">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div className="bg-white p-6 rounded-3xl border border-blue-100">
                    <p className="text-xs font-bold text-blue-500 uppercase mb-2">Penerimaan Negara (PNBP)</p>
                    <h3 className="text-2xl font-bold">{formatCurrency(stats.bina_usaha.pnbp)}</h3>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-blue-100">
                    <p className="text-xs font-bold text-blue-500 uppercase mb-2">Industri Berizin</p>
                    <h3 className="text-3xl font-bold">{stats.bina_usaha.industri} <span className="text-base font-normal text-gray-400">Unit</span></h3>
                  </div>
                </div>

                {/* Main Charts Area */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                  {/* Column 1: Hasil Hutan Kayu */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">Hasil Hutan Kayu</h3>
                    </div>

                    {/* Monthly Trend */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                      <p className="text-sm font-bold text-gray-400 mb-4">Tren Produksi Bulanan</p>
                      <div className="h-[250px]">
                        <Line data={kayuMonthlyData} options={{ ...commonOptions, maintainAspectRatio: false }} />
                      </div>
                    </div>

                    {/* Top Commodities */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                      <p className="text-sm font-bold text-gray-400 mb-4">5 Komoditas Terbesar</p>
                      <div className="h-[250px]">
                        <Bar data={kayuCommodityData} options={{ ...commonOptions, indexAxis: 'y', maintainAspectRatio: false }} />
                      </div>
                    </div>
                  </div>

                  {/* Column 2: Hasil Hutan Bukan Kayu */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">Hasil Hutan Bukan Kayu</h3>
                    </div>

                    {/* Monthly Trend */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                      <p className="text-sm font-bold text-gray-400 mb-4">Tren Produksi Bulanan</p>
                      <div className="h-[250px]">
                        <Line data={bukanKayuMonthlyData} options={{ ...commonOptions, maintainAspectRatio: false }} />
                      </div>
                    </div>

                    {/* Top Commodities */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                      <p className="text-sm font-bold text-gray-400 mb-4">5 Komoditas Terbesar</p>
                      <div className="h-[250px]">
                        <Bar data={bukanKayuCommodityData} options={{ ...commonOptions, indexAxis: 'y', maintainAspectRatio: false }} />
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Slide 3: Pemberdayaan */}
              <div className="min-w-full px-1">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
                  <div className="col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-3xl border border-indigo-100">
                      <p className="text-sm font-bold text-indigo-500 uppercase mb-2">SK Perhutanan Sosial</p>
                      <h3 className="text-4xl font-extrabold text-indigo-900">{stats.pemberdayaan.skps} <span className="text-xl font-normal text-gray-400">SK</span></h3>
                      <p className="text-sm text-gray-500 mt-2">Akses Legal Masyarakat</p>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-indigo-100">
                      <p className="text-sm font-bold text-indigo-500 uppercase mb-2">Total KUPS</p>
                      <h3 className="text-4xl font-extrabold text-indigo-900">{stats.pemberdayaan.kups.total} <span className="text-xl font-normal text-gray-400">Unit</span></h3>
                      <p className="text-sm text-gray-500 mt-2">{stats.pemberdayaan.kups.active} Unit Aktif Beroperasi</p>
                    </div>
                  </div>
                  <div className="col-span-1 lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-8 items-center">
                    <div className="w-full md:w-1/2">
                      <Doughnut data={kupsChartData} options={{ ...commonOptions, plugins: { ...commonOptions.plugins, legend: { position: 'right' } } }} />
                    </div>
                    <div className="w-full md:w-1/2 space-y-4">
                      <h3 className="font-bold text-lg text-gray-900">Sebaran Kelas KUPS</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        Klasifikasi KUPS menggambarkan tingkat kemandirian kelompok usaha.
                        Dari pemula (Blue) hingga mandiri (Platinum).
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(stats.pemberdayaan.kups.classes).map(([key, val]) => (
                          <div key={key} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                            <span className="text-xs font-bold text-gray-500 uppercase">{key}</span>
                            <span className="font-bold text-gray-900">{val}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Background Decor */}
        <div className="absolute top-0 left-0 w-full h-full -z-10 bg-gradient-to-br from-gray-50 to-gray-100/50"></div>
        <div className={`absolute -right-20 top-20 w-96 h-96 rounded-full blur-3xl opacity-20 transition-colors duration-1000 ${modules[currentSlide].color}`}></div>
        <div className={`absolute -left-20 bottom-20 w-80 h-80 rounded-full blur-3xl opacity-20 transition-colors duration-1000 ${modules[currentSlide].color}`}></div>
      </main>
    </div>
  );
}
