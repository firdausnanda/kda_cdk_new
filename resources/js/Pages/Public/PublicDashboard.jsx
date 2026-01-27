import React, { useState, useEffect } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import Select from 'react-select';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement, Filler } from 'chart.js';
import { Doughnut, Bar, Line, Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement, Filler);

export default function PublicDashboard({ currentYear, availableYears, stats }) {
  const { auth } = usePage().props;
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Memuat Data...');
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const modules = [
    { id: 0, title: 'Rehabilitasi Lahan', color: 'bg-emerald-600', text: 'text-emerald-600' },
    { id: 1, title: 'Penghijauan Lingkungan', color: 'bg-teal-600', text: 'text-teal-600' },
    { id: 2, title: 'Rehabilitasi Mangrove', color: 'bg-cyan-600', text: 'text-cyan-600' },
    { id: 3, title: 'Bangunan Konservasi Tanah dan Air', color: 'bg-orange-600', text: 'text-orange-600' },
    { id: 4, title: 'Reboisasi Area Perhutanan Sosial', color: 'bg-pink-600', text: 'text-pink-600' },
    { id: 5, title: 'Kebakaran Hutan', color: 'bg-red-600', text: 'text-red-600' },
    { id: 6, title: 'Jasa Lingkungan', color: 'bg-indigo-600', text: 'text-indigo-600' },
    { id: 7, title: 'Produksi Hutan Negara', color: 'bg-blue-600', text: 'text-blue-600' },
    { id: 8, title: 'Produksi Perhutanan Sosial', color: 'bg-sky-600', text: 'text-sky-600' },
    { id: 9, title: 'Produksi Hutan Rakyat', color: 'bg-cyan-600', text: 'text-cyan-600' },
    { id: 10, title: 'PBPHH', color: 'bg-slate-600', text: 'text-slate-600' },
    { id: 11, title: 'Penerimaan Negara (PNBP)', color: 'bg-amber-600', text: 'text-amber-600' },
    { id: 12, title: 'Kelembagaan Perhutanan Sosial', color: 'bg-emerald-600', text: 'text-emerald-600' },
    { id: 13, title: 'Kelembagaan Hutan Rakyat', color: 'bg-lime-600', text: 'text-lime-600' },
  ];

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % modules.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + modules.length) % modules.length);

  // Auto-slide effect
  useEffect(() => {
    const interval = setInterval(nextSlide, 25000);
    return () => clearInterval(interval);
  }, []);

  const handleYearChange = (selectedOption) => {
    router.get(route('public.dashboard'), { year: selectedOption.value }, {
      preserveScroll: true,
      onStart: () => {
        setLoadingText('Mengambil Data Tahun ' + selectedOption.value + '...');
        setIsLoading(true);
      },
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

  const truncateName = (name, length = 15) => {
    if (!name) return '';
    return name.length > length ? name.substring(0, length) + '...' : name;
  };

  // --- Chart Data Generators ---

  // 1. Pembinaan Chart (Rehab Lahan) -> Line Chart
  // 1. Pembinaan Chart (Rehab Lahan) -> Line Chart
  const rehabChartData = {
    labels: stats?.pembinaan?.rehab_chart ? Object.keys(stats.pembinaan.rehab_chart).map(m => {
      const date = new Date();
      date.setMonth(m - 1);
      return date.toLocaleString('id-ID', { month: 'short' });
    }) : [],
    datasets: [{
      label: 'Realisasi Rehabilitasi (Ha)',
      data: stats?.pembinaan?.rehab_chart ? Object.values(stats.pembinaan.rehab_chart) : [],
      borderColor: 'rgb(16, 185, 129)',
      backgroundColor: 'rgba(16, 185, 129, 0.5)',
      tension: 0.3
    }]
  };

  // --- 2. Perlindungan Charts ---
  // --- 3. Bina Usaha Charts ---
  // (No longer needed, charts are built inline for each source)

  // 4. Pemberdayaan Charts ---

  // 4. Pemberdayaan Charts
  // SKPS (Bar)
  const skpsChartData = {
    labels: stats?.pemberdayaan?.skps_chart?.labels || [],
    datasets: [{
      label: 'Jumlah SK',
      data: stats?.pemberdayaan?.skps_chart?.data || [],
      backgroundColor: 'rgba(5, 150, 105, 0.8)', // Emerald-600
      borderRadius: 4,
      barThickness: 20,
    }]
  };

  // KUPS (Bar)
  const kupsChartData = {
    labels: stats?.pemberdayaan?.kups?.classes ? Object.keys(stats.pemberdayaan.kups.classes) : [],
    datasets: [{
      label: 'Jumlah Unit',
      data: stats?.pemberdayaan?.kups?.classes ? Object.values(stats.pemberdayaan.kups.classes) : [],
      backgroundColor: [
        'rgba(59, 130, 246, 0.8)',   // Blue
        'rgba(156, 163, 175, 0.8)', // Platinum/Silver (Gray-400)
        'rgba(234, 179, 8, 0.8)',   // Gold (Yellow-500)
        'rgba(14, 165, 233, 0.8)',  // Platinum (Sky-500)
      ],
      borderRadius: 4,
      barThickness: 20,
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

      {/* Custom Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-primary-950/20 backdrop-blur-[4px] transition-all duration-300">
          <div className="bg-white/95 p-6 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] flex items-center gap-5 border border-white animate-in fade-in zoom-in duration-300 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary-50/30 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
            <div className="relative">
              <div className="absolute -inset-1 bg-primary-200 rounded-full animate-pulse blur-sm opacity-50"></div>
              <svg className="animate-spin h-10 w-10 text-primary-600 relative z-10" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <div className="flex flex-col relative z-10">
              <span className="text-lg font-black text-gray-900 tracking-tight leading-tight">Mohon Tunggu</span>
              <span className="text-xs text-primary-600 font-bold uppercase tracking-widest mt-0.5">{loadingText}</span>
            </div>
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
                <div className="hidden md:flex flex-col">
                  <span className="font-display font-bold text-lg text-gray-900 leading-tight">Dashboard Monitoring</span>
                  <span className={`text-[10px] uppercase tracking-wider font-bold ${modules[currentSlide].text}`}>
                    CDK Wilayah Trenggalek
                  </span>
                </div>
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-32 sm:w-48">
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

              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 sm:gap-3 pl-1 sm:pl-2 pr-1 sm:pr-3 py-1 sm:py-1.5 rounded-full hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100 focus:outline-none"
                >
                  <img
                    src={auth.user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(auth.user?.name || 'User')}&background=random`}
                    alt="Profile"
                    className="w-10 h-10 rounded-full object-cover shadow-sm border border-gray-100"
                  />
                  <div className="flex flex-col items-start hidden sm:flex">
                    <span className="text-sm font-bold text-gray-700 leading-none">{truncateName(auth.user?.name)}</span>
                    <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">{auth.user?.roles?.[0] || 'User'}</span>
                  </div>
                  <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isProfileOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)}></div>
                    <div className="absolute right-0 mt-3 w-60 bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-gray-100 py-3 z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                      <div className="px-5 py-3 border-b border-gray-50 mb-2">
                        <p className="text-sm font-bold text-gray-900 truncate">{auth.user?.name}</p>
                        <p className="text-xs text-gray-500 truncate">{auth.user?.email}</p>
                      </div>

                      {auth.user?.roles?.length > 0 && (
                        <Link
                          href={route('dashboard')}
                          className="flex items-center gap-3 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors hover:text-emerald-600"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                          Admin Dashboard
                        </Link>
                      )}

                      <Link
                        href={route('logout')}
                        method="post"
                        as="button"
                        className="w-full flex items-center gap-3 px-5 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        Sign Out
                      </Link>
                    </div>
                  </>
                )}
              </div>
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

              {/* Slides 0-5: Specific Pembinaan Sections */}
              {[
                { label: 'Rehabilitasi Lahan', total: stats?.pembinaan?.rehab_total, targetTotal: stats?.pembinaan?.rehab_target_total, chart: stats?.pembinaan?.rehab_chart, targetChart: stats?.pembinaan?.rehab_target_chart, fund: stats?.pembinaan?.rehab_fund, regency: stats?.pembinaan?.rehab_regency, color: '#10b981', unit: 'Ha' },
                { label: 'Penghijauan Lingkungan', total: stats?.pembinaan?.penghijauan_total, targetTotal: stats?.pembinaan?.penghijauan_target_total, chart: stats?.pembinaan?.penghijauan_chart, targetChart: stats?.pembinaan?.penghijauan_target_chart, fund: stats?.pembinaan?.penghijauan_fund, regency: stats?.pembinaan?.penghijauan_regency, color: '#14b8a6', unit: 'Ha' },
                { label: 'Rehabilitasi Mangrove', total: stats?.pembinaan?.manggrove_total, targetTotal: stats?.pembinaan?.manggrove_target_total, chart: stats?.pembinaan?.manggrove_chart, targetChart: stats?.pembinaan?.manggrove_target_chart, fund: stats?.pembinaan?.manggrove_fund, regency: stats?.pembinaan?.manggrove_regency, color: '#06b6d4', unit: 'Ha' },
                { label: 'Bangunan Konservasi Tanah dan Air', total: stats?.pembinaan?.rhl_teknis_total, targetTotal: stats?.pembinaan?.rhl_teknis_target_total, chart: stats?.pembinaan?.rhl_teknis_chart, targetChart: stats?.pembinaan?.rhl_teknis_target_chart, fund: stats?.pembinaan?.rhl_teknis_fund, regency: null, types: stats?.pembinaan?.rhl_teknis_type, color: '#f97316', unit: 'Unit' },
                { label: 'Reboisasi Area PS', total: stats?.pembinaan?.reboisasi_total, targetTotal: stats?.pembinaan?.reboisasi_target_total, chart: stats?.pembinaan?.reboisasi_chart, targetChart: stats?.pembinaan?.reboisasi_target_chart, fund: stats?.pembinaan?.reboisasi_fund, regency: stats?.pembinaan?.reboisasi_regency, color: '#ec4899', unit: 'Ha' },
              ].map((section, idx) => {
                const percentage = section.targetTotal > 0 ? (section.total / section.targetTotal) * 100 : 0;

                return (
                  <div key={idx} className="min-w-full px-4">
                    <div className="max-w-7xl mx-auto space-y-8">
                      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        {/* Left: Professional Stats Card */}
                        <div className="lg:col-span-1 flex flex-col gap-6">
                          <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-b from-white to-gray-50 rounded-[2rem] blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                            <div className="relative bg-white p-8 rounded-[2rem] shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-gray-100 flex flex-col overflow-hidden">
                              {/* Decorative Circle */}
                              <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full opacity-[0.03] pointer-events-none" style={{ backgroundColor: section.color }}></div>

                              <div className="flex flex-col items-center justify-between h-full relative z-10">
                                <div className="text-center w-full">
                                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg transform group-hover:scale-110 transition-transform duration-500`} style={{ background: `linear-gradient(135deg, ${section.color}, ${section.color}DD)`, color: 'white' }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                    </svg>
                                  </div>
                                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 block mb-2">Total Realisasi</span>
                                  <div className="flex flex-col gap-1 items-center justify-center">
                                    <h3 className="text-6xl font-black text-gray-900 leading-none tabular-nums tracking-tighter">
                                      {formatNumber(section.total || 0)}
                                    </h3>
                                    <span className="text-xl font-bold text-gray-400" style={{ letterSpacing: '-0.02em' }}>{section.unit}</span>
                                  </div>
                                </div>

                                <div className="w-full mt-8 pt-8 border-t border-gray-50">
                                  <div className="flex justify-between items-end mb-3">
                                    <div className="flex flex-col">
                                      <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Progress</span>
                                      <span className="text-2xl font-black text-gray-900">{percentage.toFixed(1)}%</span>
                                    </div>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mb-1">Target: {formatNumber(section.targetTotal || 0)}</span>
                                  </div>
                                  <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden shadow-inner p-0.5">
                                    <div
                                      className="h-full rounded-full transition-all duration-1000 ease-out shadow-sm relative overflow-hidden"
                                      style={{ width: `${Math.min(percentage, 100)}%`, backgroundColor: section.color }}
                                    >
                                      <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:20px_20px] animate-[shimmer_2s_linear_infinite]"></div>
                                    </div>
                                  </div>
                                  <p className="text-[9px] text-gray-400 mt-4 uppercase font-black text-center tracking-[0.2em]">Data Terverifikasi {currentYear}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Right: Charts Grid */}
                        <div className="md:col-span-3 space-y-6">
                          {/* Monthly Trend Charts Group */}
                          <div className="grid grid-cols-1 gap-6">
                            {/* Realization Trend Chart */}
                            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                              <div className="flex items-center justify-between mb-4">
                                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Tren Realisasi Bulanan</h4>
                                <span className="px-2 py-1 rounded-full bg-blue-50 text-[8px] font-bold text-blue-500 uppercase">Realization</span>
                              </div>
                              <div className="h-[180px]">
                                <Line
                                  data={{
                                    labels: section.chart ? Object.keys(section.chart).map(m => {
                                      const date = new Date();
                                      date.setMonth(m - 1);
                                      return date.toLocaleString('id-ID', { month: 'short' });
                                    }) : [],
                                    datasets: [{
                                      label: section.label,
                                      data: section.chart ? Object.values(section.chart) : [],
                                      borderColor: section.color,
                                      backgroundColor: section.color + '20',
                                      fill: true,
                                      tension: 0.4,
                                      pointRadius: 2
                                    }]
                                  }}
                                  options={{
                                    ...commonOptions,
                                    maintainAspectRatio: false,
                                    plugins: { ...commonOptions.plugins, legend: { display: false } },
                                    scales: { y: { ...commonOptions.scales.y, display: true }, x: { grid: { display: false } } }
                                  }}
                                />
                              </div>
                            </div>

                            {/* Target Trend Chart */}
                            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                              <div className="flex items-center justify-between mb-4">
                                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Tren Target Bulanan</h4>
                                <span className="px-2 py-1 rounded-full bg-gray-50 text-[8px] font-bold text-gray-400 uppercase">Target</span>
                              </div>
                              <div className="h-[180px]">
                                <Line
                                  data={{
                                    labels: section.targetChart ? Object.keys(section.targetChart).map(m => {
                                      const date = new Date();
                                      date.setMonth(m - 1);
                                      return date.toLocaleString('id-ID', { month: 'short' });
                                    }) : [],
                                    datasets: [{
                                      label: 'Target ' + section.label,
                                      data: section.targetChart ? Object.values(section.targetChart) : [],
                                      borderColor: '#94a3b8',
                                      backgroundColor: '#94a3b820',
                                      fill: true,
                                      tension: 0.4,
                                      pointRadius: 2,
                                      borderDash: [5, 5]
                                    }]
                                  }}
                                  options={{
                                    ...commonOptions,
                                    maintainAspectRatio: false,
                                    plugins: { ...commonOptions.plugins, legend: { display: false } },
                                    scales: { y: { ...commonOptions.scales.y, display: true }, x: { grid: { display: false } } }
                                  }}
                                />
                              </div>
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
                                    {formatNumber(Object.values(section.fund || {}).reduce((a, b) => a + (parseInt(b) || 0), 0))}
                                  </span>
                                  <span className="text-xs font-medium text-gray-400 mt-1">Laporan Terdaftar</span>
                                </div>
                                <div className="w-full h-[180px]">
                                  <Bar
                                    data={{
                                      labels: section.fund ? Object.keys(section.fund) : [],
                                      datasets: [{
                                        data: section.fund ? Object.values(section.fund) : [],
                                        backgroundColor: section.color + 'CC',
                                        borderRadius: 6
                                      }]
                                    }}
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
                                {section.regency || section.types ? (
                                  <>
                                    <div className={`flex flex-col items-center justify-center p-4 rounded-2xl border`} style={{ backgroundColor: section.color + '05', borderColor: section.color + '20' }}>
                                      <span className={`text-[10px] font-bold uppercase tracking-widest mb-1`} style={{ color: section.color }}>{section.regency ? 'Total Wilayah' : 'Total Jenis'}</span>
                                      <span className="text-4xl font-black text-gray-900">
                                        {formatNumber(Object.keys(section.regency || section.types || {}).length)}
                                      </span>
                                      <span className="text-xs font-medium text-gray-400 mt-1">{section.regency ? 'Kabupaten/Kota Terjangkau' : 'Bangunan Terdaftar'}</span>
                                    </div>
                                    <div className="w-full h-[180px]">
                                      <Bar
                                        data={{
                                          labels: Object.keys(section.regency || section.types || {}),
                                          datasets: [{
                                            data: Object.values(section.regency || section.types || {}),
                                            backgroundColor: section.color + 'AA',
                                            borderRadius: 6
                                          }]
                                        }}
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
              })}
              {/* Slide 5: Kebakaran Hutan (Premium Redesign) */}
              <div className="min-w-full px-4">
                <div className="max-w-7xl mx-auto space-y-8">
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Left: Professional Stats Card */}
                    <div className="lg:col-span-1 flex flex-col gap-6">
                      <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-b from-white to-gray-50 rounded-[2rem] blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                        <div className="relative bg-white p-8 rounded-[2rem] shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-gray-100 flex flex-col overflow-hidden">
                          {/* Decorative Circle */}
                          <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full opacity-[0.03] pointer-events-none bg-red-600"></div>

                          <div className="flex flex-col items-center justify-between relative z-10">
                            <div className="text-center w-full">
                              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg transform group-hover:scale-110 transition-transform duration-500`} style={{ background: `linear-gradient(135deg, #dc2626, #dc2626DD)`, color: 'white' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.99 7.99 0 0120 13a7.99 7.99 0 01-2.343 5.657z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14l.879 2.121z" />
                                </svg>
                              </div>
                              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 block mb-2">Total Kejadian</span>
                              <div className="flex flex-col gap-1 items-center justify-center">
                                <h3 className="text-6xl font-black text-gray-900 leading-none tabular-nums tracking-tighter">
                                  {formatNumber(stats?.perlindungan?.kebakaran_kejadian || 0)}
                                </h3>
                                <span className="text-xl font-bold text-gray-400" style={{ letterSpacing: '-0.02em' }}>Kejadian</span>
                              </div>
                            </div>

                            <div className="w-full mt-8 pt-8 border-t border-gray-50">
                              <div className="flex justify-between items-end mb-3">
                                <div className="flex flex-col">
                                  <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Luas Area</span>
                                  <span className="text-2xl font-black text-gray-900">{formatNumber(stats?.perlindungan?.kebakaran_area || 0)}</span>
                                </div>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mb-1">Hektar (Ha)</span>
                              </div>
                              <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden shadow-inner p-0.5">
                                <div
                                  className="h-full rounded-full transition-all duration-1000 ease-out shadow-sm relative overflow-hidden bg-red-500"
                                  style={{ width: `100%` }}
                                >
                                  <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:20px_20px] animate-[shimmer_2s_linear_infinite]"></div>
                                </div>
                              </div>
                              <p className="text-[9px] text-gray-400 mt-4 uppercase font-black text-center tracking-[0.2em]">Monitoring Karhutla {currentYear}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right: Charts Grid */}
                    <div className="md:col-span-3 space-y-6">
                      {/* Trend Chart: Luas vs Kejadian */}
                      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Tren Luas Area & Jumlah Kejadian</h4>
                          <div className="flex gap-4">
                            <span className="flex items-center gap-1.5 text-[8px] font-bold text-red-500 uppercase">
                              <span className="w-2 h-2 rounded-full bg-red-500"></span> Kejadian
                            </span>
                            <span className="flex items-center gap-1.5 text-[8px] font-bold text-orange-400 uppercase">
                              <span className="w-2 h-2 rounded-full bg-orange-400"></span> Luas Area
                            </span>
                          </div>
                        </div>
                        <div className="h-[200px]">
                          <Line
                            data={{
                              labels: stats?.perlindungan?.kebakaranMonthly ? Object.keys(stats.perlindungan.kebakaranMonthly).map(m => {
                                const date = new Date();
                                date.setMonth(m - 1);
                                return date.toLocaleString('id-ID', { month: 'short' });
                              }) : [],
                              datasets: [
                                {
                                  label: 'Jumlah Kejadian',
                                  data: stats?.perlindungan?.kebakaranMonthly ? Object.values(stats.perlindungan.kebakaranMonthly).map(d => d.incidents) : [],
                                  borderColor: '#dc2626',
                                  backgroundColor: '#dc262620',
                                  fill: true,
                                  tension: 0.4,
                                  pointRadius: 3,
                                  yAxisID: 'y',
                                },
                                {
                                  label: 'Luas Area (Ha)',
                                  data: stats?.perlindungan?.kebakaranMonthly ? Object.values(stats.perlindungan.kebakaranMonthly).map(d => d.area) : [],
                                  borderColor: '#f9f111ff',
                                  backgroundColor: '#fb923c20',
                                  fill: true,
                                  tension: 0.4,
                                  pointRadius: 3,
                                  borderDash: [5, 5],
                                  yAxisID: 'y1',
                                }
                              ]
                            }}
                            options={{
                              ...commonOptions,
                              maintainAspectRatio: false,
                              plugins: { ...commonOptions.plugins, legend: { display: false } },
                              scales: {
                                y: {
                                  type: 'linear',
                                  display: true,
                                  position: 'left',
                                  title: { display: true, text: 'Kejadian', font: { size: 10, weight: 'bold' } },
                                  grid: { display: false }
                                },
                                y1: {
                                  type: 'linear',
                                  display: true,
                                  position: 'right',
                                  title: { display: true, text: 'Luas (Ha)', font: { size: 10, weight: 'bold' } },
                                  grid: { drawOnChartArea: false }
                                },
                                x: { grid: { display: false } }
                              }
                            }}
                          />
                        </div>
                      </div>

                      {/* Pengelola Bar Chart */}
                      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Luas Kebakaran Berdasarkan Pengelola</h4>
                          <span className="px-2 py-1 rounded-full bg-red-50 text-[8px] font-bold text-red-500 uppercase">Pengelola</span>
                        </div>
                        <div className="h-[400px]">
                          <Bar
                            data={{
                              labels: stats?.perlindungan?.kebakaranByPengelola ? Object.keys(stats.perlindungan.kebakaranByPengelola) : [],
                              datasets: [{
                                label: 'Luas Area (Ha)',
                                data: stats?.perlindungan?.kebakaranByPengelola ? Object.values(stats.perlindungan.kebakaranByPengelola).map(d => d.area) : [],
                                backgroundColor: '#dc2626CC',
                                borderRadius: 6
                              }]
                            }}
                            options={{
                              ...commonOptions,
                              indexAxis: 'y',
                              maintainAspectRatio: false,
                              plugins: { ...commonOptions.plugins, legend: { display: false } },
                              scales: {
                                x: { grid: { display: false }, ticks: { display: true } },
                                y: {
                                  grid: { display: false },
                                  ticks: {
                                    autoSkip: false,
                                    font: { size: 9, weight: 'bold' }
                                  }
                                }
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Slide 6: Jasa Lingkungan (Premium Redesign) */}
              <div className="min-w-full px-4">
                <div className="max-w-7xl mx-auto space-y-8">
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Left: Professional Stats Card */}
                    <div className="lg:col-span-1 flex flex-col gap-6">
                      <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-b from-white to-gray-50 rounded-[2rem] blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                        <div className="relative bg-white p-8 rounded-[2rem] shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-gray-100 flex flex-col overflow-hidden">
                          {/* Decorative Circle */}
                          <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full opacity-[0.03] pointer-events-none bg-indigo-600"></div>

                          <div className="flex flex-col items-center justify-between relative z-10">
                            <div className="text-center w-full">
                              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg transform group-hover:scale-110 transition-transform duration-500`} style={{ background: `linear-gradient(135deg, #4f46e5, #4f46e5DD)`, color: 'white' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                              </div>
                              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 block mb-2">Total Pengunjung</span>
                              <div className="flex flex-col gap-1 items-center justify-center">
                                <h3 className="text-6xl font-black text-gray-900 leading-none tabular-nums tracking-tighter">
                                  {formatNumber(stats?.perlindungan?.wisata_visitors || 0)}
                                </h3>
                                <span className="text-xl font-bold text-gray-400" style={{ letterSpacing: '-0.02em' }}>Orang</span>
                              </div>
                            </div>

                            <div className="w-full mt-8 pt-8 border-t border-gray-50">
                              <div className="flex justify-between items-end mb-3">
                                <div className="flex flex-col">
                                  <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Pendapatan</span>
                                  <span className="text-2xl font-black text-gray-900">{formatCurrency(stats?.perlindungan?.wisata_income || 0)}</span>
                                </div>
                              </div>
                              <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden shadow-inner p-0.5">
                                <div
                                  className="h-full rounded-full transition-all duration-1000 ease-out shadow-sm relative overflow-hidden bg-indigo-500"
                                  style={{ width: `100%` }}
                                >
                                  <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:20px_20px] animate-[shimmer_2s_linear_infinite]"></div>
                                </div>
                              </div>
                              <p className="text-[9px] text-gray-400 mt-4 uppercase font-black text-center tracking-[0.2em]">Jasa Lingkungan {currentYear}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right: Charts Grid */}
                    <div className="md:col-span-3 space-y-6">
                      {/* Trend Chart: Pengunjung vs Pendapatan */}
                      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Tren Pengunjung & Pendapatan</h4>
                          <div className="flex gap-4">
                            <span className="flex items-center gap-1.5 text-[8px] font-bold text-indigo-500 uppercase">
                              <span className="w-2 h-2 rounded-full bg-indigo-500"></span> Pengunjung
                            </span>
                            <span className="flex items-center gap-1.5 text-[8px] font-bold text-emerald-400 uppercase">
                              <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Pendapatan
                            </span>
                          </div>
                        </div>
                        <div className="h-[200px]">
                          <Line
                            data={{
                              labels: stats?.perlindungan?.wisataMonthly ? Object.keys(stats.perlindungan.wisataMonthly).map(m => {
                                const date = new Date();
                                date.setMonth(m - 1);
                                return date.toLocaleString('id-ID', { month: 'short' });
                              }) : [],
                              datasets: [
                                {
                                  label: 'Jumlah Pengunjung',
                                  data: stats?.perlindungan?.wisataMonthly ? Object.values(stats.perlindungan.wisataMonthly).map(d => d.visitors) : [],
                                  borderColor: '#4f46e5',
                                  backgroundColor: '#4f46e520',
                                  fill: true,
                                  tension: 0.4,
                                  pointRadius: 3,
                                  yAxisID: 'y',
                                },
                                {
                                  label: 'Pendapatan (Rp)',
                                  data: stats?.perlindungan?.wisataMonthly ? Object.values(stats.perlindungan.wisataMonthly).map(d => d.income) : [],
                                  borderColor: '#10b981',
                                  backgroundColor: '#10b98120',
                                  fill: true,
                                  tension: 0.4,
                                  pointRadius: 3,
                                  borderDash: [5, 5],
                                  yAxisID: 'y1',
                                }
                              ]
                            }}
                            options={{
                              ...commonOptions,
                              maintainAspectRatio: false,
                              plugins: { ...commonOptions.plugins, legend: { display: false } },
                              scales: {
                                y: {
                                  type: 'linear',
                                  display: true,
                                  position: 'left',
                                  title: { display: true, text: 'Pengunjung', font: { size: 10, weight: 'bold' } },
                                  grid: { display: false }
                                },
                                y1: {
                                  type: 'linear',
                                  display: true,
                                  position: 'right',
                                  title: { display: true, text: 'Pendapatan', font: { size: 10, weight: 'bold' } },
                                  grid: { drawOnChartArea: false }
                                },
                                x: { grid: { display: false } }
                              }
                            }}
                          />
                        </div>
                      </div>

                      {/* Pengelola Bar Chart */}
                      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Jumlah Pengunjung Berdasarkan Pengelola</h4>
                          <span className="px-2 py-1 rounded-full bg-indigo-50 text-[8px] font-bold text-indigo-500 uppercase">Pengelola</span>
                        </div>
                        <div className="h-[400px]">
                          <Bar
                            data={{
                              labels: stats?.perlindungan?.wisataByPengelola ? Object.keys(stats.perlindungan.wisataByPengelola) : [],
                              datasets: [{
                                label: 'Jumlah Pengunjung',
                                data: stats?.perlindungan?.wisataByPengelola ? Object.values(stats.perlindungan.wisataByPengelola).map(d => d.visitors) : [],
                                backgroundColor: '#4f46e5CC',
                                borderRadius: 6
                              }]
                            }}
                            options={{
                              ...commonOptions,
                              indexAxis: 'y',
                              maintainAspectRatio: false,
                              plugins: { ...commonOptions.plugins, legend: { display: false } },
                              scales: {
                                x: { grid: { display: false }, ticks: { display: true } },
                                y: {
                                  grid: { display: false },
                                  ticks: {
                                    autoSkip: false,
                                    font: { size: 9, weight: 'bold' }
                                  }
                                }
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Slides 7-9: Production Source Breakdown (Negara, PS, Rakyat) */}
              {[
                { key: 'hutan_negara', id: 7, title: 'Hutan Negara', color: '#2563eb', bg: 'bg-blue-600' },
                { key: 'perhutanan_sosial', id: 8, title: 'Perhutanan Sosial', color: '#0ea5e9', bg: 'bg-sky-600' },
                { key: 'hutan_rakyat', id: 9, title: 'Hutan Rakyat', color: '#0891b2', bg: 'bg-cyan-600' }
              ].map((source) => (
                <div key={source.key} className="min-w-full px-4">
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
                                  <span className="text-xs font-bold text-amber-600 px-2 py-0.5 rounded-md bg-amber-50">Kg/Liter</span>
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
                                data={{
                                  labels: stats?.bina_usaha[source.key]?.kayu_monthly ? Object.keys(stats.bina_usaha[source.key].kayu_monthly).map(m => {
                                    const date = new Date();
                                    date.setMonth(m - 1);
                                    return date.toLocaleString('id-ID', { month: 'short' });
                                  }) : [],
                                  datasets: [
                                    {
                                      label: 'Kayu (M³)',
                                      data: stats?.bina_usaha[source.key]?.kayu_monthly ? Object.values(stats.bina_usaha[source.key].kayu_monthly) : [],
                                      borderColor: source.color,
                                      backgroundColor: `${source.color}20`,
                                      fill: true,
                                      tension: 0.4,
                                    }
                                  ]
                                }}
                                options={{ ...commonOptions, maintainAspectRatio: false }}
                              />
                            </div>
                          </div>

                          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-4">Tren Produksi Bukan Kayu Bulanan</h4>
                            <div className="h-[200px]">
                              <Line
                                data={{
                                  labels: stats?.bina_usaha[source.key]?.bukan_kayu_monthly ? Object.keys(stats.bina_usaha[source.key].bukan_kayu_monthly).map(m => {
                                    const date = new Date();
                                    date.setMonth(m - 1);
                                    return date.toLocaleString('id-ID', { month: 'short' });
                                  }) : [],
                                  datasets: [
                                    {
                                      label: 'Bukan Kayu (Kg/Liter)',
                                      data: stats?.bina_usaha[source.key]?.bukan_kayu_monthly ? Object.values(stats.bina_usaha[source.key].bukan_kayu_monthly) : [],
                                      borderColor: '#f59e0b',
                                      backgroundColor: '#f59e0b20',
                                      fill: true,
                                      tension: 0.4,
                                      borderDash: [5, 5]
                                    }
                                  ]
                                }}
                                options={{ ...commonOptions, maintainAspectRatio: false }}
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
                                data={{
                                  labels: stats?.bina_usaha[source.key]?.kayu_commodity ? Object.keys(stats.bina_usaha[source.key].kayu_commodity) : [],
                                  datasets: [{
                                    label: 'Volume (M³)',
                                    data: stats?.bina_usaha[source.key]?.kayu_commodity ? Object.values(stats.bina_usaha[source.key].kayu_commodity) : [],
                                    backgroundColor: source.color,
                                    borderRadius: 6
                                  }]
                                }}
                                options={{
                                  ...commonOptions,
                                  indexAxis: 'y',
                                  maintainAspectRatio: false,
                                  plugins: { ...commonOptions.plugins, legend: { display: false } },
                                  scales: { y: { grid: { display: false }, ticks: { font: { size: 10, weight: 'bold' } } }, x: { grid: { display: false } } }
                                }}
                              />
                            </div>
                          </div>

                          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-4">5 Komoditas Terbesar (Bukan Kayu)</h4>
                            <div className="h-[200px]">
                              <Bar
                                data={{
                                  labels: stats?.bina_usaha[source.key]?.bukan_kayu_commodity ? Object.keys(stats.bina_usaha[source.key].bukan_kayu_commodity) : [],
                                  datasets: [{
                                    label: 'Produksi',
                                    data: stats?.bina_usaha[source.key]?.bukan_kayu_commodity ? Object.values(stats.bina_usaha[source.key].bukan_kayu_commodity) : [],
                                    backgroundColor: '#f59e0bCC',
                                    borderRadius: 6
                                  }]
                                }}
                                options={{
                                  ...commonOptions,
                                  indexAxis: 'y',
                                  maintainAspectRatio: false,
                                  plugins: { ...commonOptions.plugins, legend: { display: false } },
                                  scales: { y: { grid: { display: false }, ticks: { font: { size: 10, weight: 'bold' } } }, x: { grid: { display: false } } }
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Slide 10: PBPHH (Enhanced Redesign) */}
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
                          data={{
                            labels: stats?.bina_usaha?.pbphh?.by_regency ? Object.keys(stats.bina_usaha.pbphh.by_regency) : [],
                            datasets: [{
                              label: 'Unit',
                              data: stats?.bina_usaha?.pbphh?.by_regency ? Object.values(stats.bina_usaha.pbphh.by_regency) : [],
                              backgroundColor: '#475569CC',
                              borderRadius: 4
                            }]
                          }}
                          options={{ ...commonOptions, indexAxis: 'y', maintainAspectRatio: false, plugins: { ...commonOptions.plugins, legend: { display: false } } }}
                        />
                      </div>
                    </div>

                    {/* Jenis Produksi (%) */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col h-full">
                      <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-6">Jenis Produksi (%)</h4>
                      <div className="h-[250px] mt-auto">
                        <Bar
                          data={{
                            labels: stats?.bina_usaha?.pbphh?.by_production_type ? stats.bina_usaha.pbphh.by_production_type.map(d => d.type) : [],
                            datasets: [{
                              label: 'Persentase (%)',
                              data: stats?.bina_usaha?.pbphh?.by_production_type ? stats.bina_usaha.pbphh.by_production_type.map(d => (d.count / (stats.bina_usaha.pbphh.total_units || 1)) * 100) : [],
                              backgroundColor: '#4f46e5CC',
                              borderRadius: 4
                            }]
                          }}
                          options={{
                            ...commonOptions,
                            maintainAspectRatio: false,
                            plugins: {
                              ...commonOptions.plugins,
                              legend: { display: false },
                              tooltip: { callbacks: { label: (ctx) => `${ctx.raw.toFixed(1)}%` } }
                            },
                            scales: { ...commonOptions.scales, y: { ...commonOptions.scales.y, ticks: { callback: (val) => `${val}%` } } }
                          }}
                        />
                      </div>
                    </div>

                    {/* Kondisi Saat Ini */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col h-full">
                      <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-6">Kondisi Operasional (Total & %)</h4>
                      <div className="h-[250px] mt-auto relative">
                        <Pie
                          data={{
                            labels: stats?.bina_usaha?.pbphh?.by_condition ? stats.bina_usaha.pbphh.by_condition.map(d => String(d.condition_name) === '1' ? 'Aktif' : 'Tidak Aktif') : [],
                            datasets: [{
                              data: stats?.bina_usaha?.pbphh?.by_condition ? stats.bina_usaha.pbphh.by_condition.map(d => d.count) : [],
                              backgroundColor: stats?.bina_usaha?.pbphh?.by_condition ? stats.bina_usaha.pbphh.by_condition.map(d => String(d.condition_name) === '1' ? '#16a34a' : '#dc2626') : [],
                              borderWidth: 2,
                              borderColor: '#ffffff',
                              hoverOffset: 10,
                              borderRadius: 4,
                            }]
                          }}
                          options={{
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
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Slide 11: PNBP (Premium Redesign) */}
              <div className="min-w-full px-4">
                <div className="max-w-7xl mx-auto space-y-8">
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Left: Professional Stats Card */}
                    <div className="lg:col-span-1 flex flex-col gap-6">
                      <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-b from-white to-gray-50 rounded-[2rem] blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                        <div className="relative bg-white p-8 rounded-[2rem] shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-gray-100 flex flex-col overflow-hidden">
                          {/* Decorative Circle */}
                          <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full opacity-[0.03] pointer-events-none bg-amber-600"></div>

                          <div className="flex flex-col items-center justify-between relative z-10">
                            <div className="text-center w-full">
                              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg transform group-hover:scale-110 transition-transform duration-500`} style={{ background: `linear-gradient(135deg, #d33c06, #d33c06DD)`, color: 'white' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 block mb-2">Total PNBP</span>
                              <div className="flex flex-col gap-1 items-center justify-center">
                                <h3 className="text-4xl font-black text-gray-900 leading-none tabular-nums tracking-tighter">
                                  {formatCurrency(stats?.bina_usaha?.pnbp?.total_realization || 0)}
                                </h3>
                              </div>
                            </div>

                            <div className="w-full mt-8 pt-8 border-t border-gray-50">
                              <div className="flex justify-between items-end mb-3">
                                <div className="flex flex-col">
                                  <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Target Tahunan</span>
                                  <span className="text-xl font-black text-gray-500">{formatCurrency(stats?.bina_usaha?.pnbp?.total_target || 0)}</span>
                                </div>
                              </div>
                              <p className="text-[9px] text-gray-400 mt-4 uppercase font-black text-center tracking-[0.2em]">Penerimaan Negara {currentYear}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right: Charts Grid */}
                    <div className="md:col-span-3 space-y-6">
                      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                        <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-4">Tren Penerimaan Bulanan</h4>
                        <div className="h-[250px]">
                          <Line
                            data={{
                              labels: stats?.bina_usaha?.pnbp?.monthly ? Object.keys(stats.bina_usaha.pnbp.monthly).map(m => {
                                const date = new Date();
                                date.setMonth(m - 1);
                                return date.toLocaleString('id-ID', { month: 'short' });
                              }) : [],
                              datasets: [
                                {
                                  label: 'Realisasi',
                                  data: stats?.bina_usaha?.pnbp?.monthly ? Object.values(stats.bina_usaha.pnbp.monthly).map(d => d.realization) : [],
                                  borderColor: '#d97706',
                                  backgroundColor: '#d9770620',
                                  fill: true,
                                  tension: 0.4,
                                },
                                {
                                  label: 'Target',
                                  data: stats?.bina_usaha?.pnbp?.monthly ? Object.values(stats.bina_usaha.pnbp.monthly).map(d => d.target) : [],
                                  borderColor: '#cbd5e1',
                                  borderDash: [5, 5],
                                  tension: 0.4,
                                }
                              ]
                            }}
                            options={{ ...commonOptions, maintainAspectRatio: false }}
                          />
                        </div>
                      </div>
                      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                        <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-4">Realisasi per Kabupaten</h4>
                        <div className="h-[150px]">
                          <Bar
                            data={{
                              labels: stats?.bina_usaha?.pnbp?.by_regency ? Object.keys(stats.bina_usaha.pnbp.by_regency) : [],
                              datasets: [{
                                label: 'Realisasi (Rp)',
                                data: stats?.bina_usaha?.pnbp?.by_regency ? Object.values(stats.bina_usaha.pnbp.by_regency) : [],
                                backgroundColor: '#d97706CC',
                                borderRadius: 6
                              }]
                            }}
                            options={{
                              ...commonOptions,
                              indexAxis: 'y',
                              maintainAspectRatio: false,
                              plugins: { ...commonOptions.plugins, legend: { display: false } },
                              scales: { y: { grid: { display: false }, ticks: { font: { size: 10, weight: 'bold' } } }, x: { grid: { display: false } } }
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Slide 12: Kelembagaan Perhutanan Sosial */}
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
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Chart 1: Skema Perhutanan Sosial (Pie) */}
                    <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col h-full">
                      <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-8">Skema Perhutanan Sosial (Persentase & Jumlah)</h4>
                      <div className="h-[300px] mt-auto relative">
                        <Doughnut
                          data={{
                            labels: stats?.kelembagaan_ps?.scheme_distribution ? stats.kelembagaan_ps.scheme_distribution.map(d => d.scheme) : [],
                            datasets: [{
                              data: stats?.kelembagaan_ps?.scheme_distribution ? stats.kelembagaan_ps.scheme_distribution.map(d => d.count) : [],
                              backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'],
                              borderWidth: 0
                            }]
                          }}
                          plugins={[{
                            id: 'centerTextPs',
                            afterDraw: (chart) => {
                              const { ctx, chartArea: { top, bottom, left, right, width, height } } = chart;
                              ctx.save();
                              const text = stats?.kelembagaan_ps?.kelompok_count || 0;
                              ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                              ctx.font = '900 72px Inter, sans-serif'; ctx.fillStyle = '#111827';
                              ctx.fillText(text, left + width / 2, top + height / 2 - 10);
                              ctx.font = 'bold 10px Inter, sans-serif'; ctx.fillStyle = '#9ca3af';
                              ctx.fillText('KELOMPOK', left + width / 2, top + height / 2 + 10); ctx.restore();
                            }
                          }]}
                          options={{
                            maintainAspectRatio: false, cutout: '70%',
                            plugins: {
                              legend: { position: 'right', labels: { usePointStyle: true, font: { weight: 'bold', size: 10 } } },
                              tooltip: {
                                callbacks: {
                                  label: (ctx) => {
                                    const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = ((ctx.raw / total) * 100).toFixed(1);
                                    return ` ${ctx.label}: ${ctx.raw} Kelompok (${percentage}%)`;
                                  }
                                }
                              }
                            }
                          }}
                        />
                      </div>
                    </div>

                    {/* Chart 2: Nilai Ekonomi (NEKON) per Pengelola */}
                    <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col h-full">
                      <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-8">Nilai Ekonomi (NEKON) Per Kabupaten</h4>
                      <div className="h-[300px] mt-auto">
                        <Bar
                          data={{
                            labels: stats?.kelembagaan_ps?.economic_by_regency ? Object.keys(stats.kelembagaan_ps.economic_by_regency) : [],
                            datasets: [{
                              label: 'NEKON (Rp)',
                              data: stats?.kelembagaan_ps?.economic_by_regency ? Object.values(stats.kelembagaan_ps.economic_by_regency) : [],
                              backgroundColor: '#10b981CC',
                              borderRadius: 6
                            }]
                          }}
                          options={{
                            ...commonOptions,
                            maintainAspectRatio: false,
                            plugins: { ...commonOptions.plugins, legend: { display: false } },
                            scales: {
                              y: { grid: { display: false }, ticks: { callback: (val) => 'Rp ' + formatNumber(val) } },
                              x: { grid: { display: false } }
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Slide 13: Kelembagaan Hutan Rakyat */}
              <div className="min-w-full px-4">
                <div className="max-w-7xl mx-auto space-y-8">
                  {/* Top: Metric Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                      <p className="text-[10px] font-black uppercase tracking-widest text-lime-600 mb-2">Total Kelompok</p>
                      <h3 className="text-3xl font-black text-gray-900">{formatNumber(stats?.kelembagaan_hr?.kelompok_count || 0)}</h3>
                      <p className="text-[9px] text-gray-400 mt-1 uppercase font-bold">Unit Kelompok</p>
                    </div>
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                      <p className="text-[10px] font-black uppercase tracking-widest text-lime-600 mb-2">Total Luas</p>
                      <h3 className="text-3xl font-black text-gray-900">{formatNumber(stats?.kelembagaan_hr?.area_total || 0)}</h3>
                      <p className="text-[9px] text-gray-400 mt-1 uppercase font-bold">Hektar (Ha)</p>
                    </div>
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                      <p className="text-[10px] font-black uppercase tracking-widest text-lime-600 mb-2">Jumlah Anggota</p>
                      <h3 className="text-3xl font-black text-gray-900">{formatNumber(stats?.kelembagaan_hr?.anggota_total || 0)}</h3>
                      <p className="text-[9px] text-gray-400 mt-1 uppercase font-bold">Orang Anggota</p>
                    </div>
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                      <p className="text-[10px] font-black uppercase tracking-widest text-lime-600 mb-2">Total NTE</p>
                      <h3 className="text-xl font-black text-gray-900">{formatCurrency(stats?.kelembagaan_hr?.nte_total || 0)}</h3>
                      <p className="text-[9px] text-gray-400 mt-1 uppercase font-bold">Nilai Transaksi Ekonomi</p>
                    </div>
                  </div>

                  {/* Charts Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Kelas Kelembagaan (Pie) */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col h-full">
                      <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-6">Kelas Kelembagaan (Persentase & Jumlah)</h4>
                      <div className="h-[250px] mt-auto relative">
                        <Doughnut
                          data={{
                            labels: stats?.kelembagaan_hr?.class_distribution ? stats.kelembagaan_hr.class_distribution.map(d => d.class_name) : [],
                            datasets: [{
                              data: stats?.kelembagaan_hr?.class_distribution ? stats.kelembagaan_hr.class_distribution.map(d => d.count) : [],
                              backgroundColor: ['#84cc16', '#a3e635', '#bef264', '#d9f99d'],
                              borderWidth: 0
                            }]
                          }}
                          plugins={[{
                            id: 'centerTextHr',
                            afterDraw: (chart) => {
                              const { ctx, chartArea: { top, bottom, left, right, width, height } } = chart;
                              ctx.save();
                              const text = stats?.kelembagaan_hr?.kelompok_count || 0;
                              ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                              ctx.font = 'black 24px Inter, sans-serif'; ctx.fillStyle = '#111827';
                              ctx.fillText(text, left + width / 2, top + height / 2 - 10);
                              ctx.font = 'bold 10px Inter, sans-serif'; ctx.fillStyle = '#9ca3af';
                              ctx.fillText('KELOMPOK', left + width / 2, top + height / 2 + 10); ctx.restore();
                            }
                          }]}
                          options={{
                            maintainAspectRatio: false, cutout: '70%',
                            plugins: {
                              legend: { position: 'bottom', labels: { usePointStyle: true, font: { weight: 'bold', size: 9 } } },
                              tooltip: {
                                callbacks: {
                                  label: (ctx) => {
                                    const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = ((ctx.raw / total) * 100).toFixed(1);
                                    return ` ${ctx.label}: ${ctx.raw} Kelompok (${percentage}%)`;
                                  }
                                }
                              }
                            }
                          }}
                        />
                      </div>
                    </div>

                    {/* Nilai Ekonomi Per Kabupaten (Bar) */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col h-full">
                      <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-6">Nilai Transaksi Ekonomi (NTE) Per Kabupaten</h4>
                      <div className="h-[250px] mt-auto">
                        <Bar
                          data={{
                            labels: stats?.kelembagaan_hr?.economic_by_regency ? Object.keys(stats.kelembagaan_hr.economic_by_regency) : [],
                            datasets: [{
                              label: 'NTE (Rp)',
                              data: stats?.kelembagaan_hr?.economic_by_regency ? Object.values(stats.kelembagaan_hr.economic_by_regency) : [],
                              backgroundColor: '#84cc16CC',
                              borderRadius: 4
                            }]
                          }}
                          options={{
                            ...commonOptions,
                            maintainAspectRatio: false,
                            indexAxis: 'y',
                            plugins: { ...commonOptions.plugins, legend: { display: false } }
                          }}
                        />
                      </div>
                    </div>

                    {/* Komoditas Terbesar (Bar) */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col h-full">
                      <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-6">5 Komoditas Terbesar (NTE)</h4>
                      <div className="h-[250px] mt-auto">
                        <Bar
                          data={{
                            labels: stats?.kelembagaan_hr?.top_commodities ? Object.keys(stats.kelembagaan_hr.top_commodities) : [],
                            datasets: [{
                              label: 'Nilai Transaksi',
                              data: stats?.kelembagaan_hr?.top_commodities ? Object.values(stats.kelembagaan_hr.top_commodities) : [],
                              backgroundColor: '#65a30dCC',
                              borderRadius: 4
                            }]
                          }}
                          options={{
                            ...commonOptions,
                            maintainAspectRatio: false,
                            plugins: { ...commonOptions.plugins, legend: { display: false } }
                          }}
                        />
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
      </main >
    </div >
  );
}
