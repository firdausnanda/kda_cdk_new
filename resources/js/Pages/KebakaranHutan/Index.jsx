import { useState, useCallback, useEffect } from 'react';
import { debounce } from 'lodash';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import StatusBadge from '@/Components/StatusBadge';
import { router } from '@inertiajs/react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

import TextInput from '@/Components/TextInput';
import Pagination from '@/Components/Pagination';
import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';

const MySwal = withReactContent(Swal);

export default function Index({ auth, datas, stats, filters, availableYears }) {
  const { flash } = usePage().props;
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Memproses...');
  const formatNumber = (num) => new Intl.NumberFormat('id-ID').format(num);

  const isAdmin = auth.user.roles.includes('admin');
  const isKasi = auth.user.roles.includes('kasi');
  const isKaCdk = auth.user.roles.includes('kacdk');
  const userPermissions = auth.user.permissions || [];

  const canCreate = userPermissions.includes('perlindungan.create') || isAdmin;
  const canEdit = userPermissions.includes('perlindungan.edit') || isAdmin;
  const canDelete = userPermissions.includes('perlindungan.delete') || isAdmin;
  const canApprove = userPermissions.includes('perlindungan.approve') || isAdmin;

  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [isSearching, setIsSearching] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);

  // Handle flash messages
  useEffect(() => {
    if (flash?.success) {
      MySwal.fire({
        title: 'Berhasil!',
        text: flash.success,
        icon: 'success',
        confirmButtonColor: '#15803d',
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
      });
    }
    if (flash?.import_errors) {
      const errorList = flash.import_errors.map(f => `Baris ${f.row()}: ${f.errors().join(', ')}`).join('<br>');
      MySwal.fire({
        title: 'Import Gagal',
        html: `<div class="text-left text-sm">${errorList}</div>`,
        icon: 'error',
        confirmButtonColor: '#dc2626',
      });
    }
  }, [flash]);

  const handleImportSubmit = (e) => {
    e.preventDefault();
    if (!importFile) return;
    setLoadingText('Mengimport Data...');
    setIsLoading(true);
    setShowImportModal(false);
    router.post(route('kebakaran-hutan.import'), { file: importFile }, {
      forceFormData: true,
      onFinish: () => {
        setIsLoading(false);
        setImportFile(null);
      }
    });
  };


  const handleYearChange = (year) => {
    setLoadingText('Sinkronisasi Tahun...');
    setIsLoading(true);
    router.get(route('kebakaran-hutan.index'), { year, search: searchTerm }, {
      preserveState: true,
      replace: true,
      onFinish: () => setIsLoading(false)
    });
  };

  const handleSearch = useCallback(
    debounce((value) => {
      router.get(
        route('kebakaran-hutan.index'),
        { search: value, year: filters.year },
        {
          preserveState: true,
          replace: true,
          preserveScroll: true,
          onStart: () => setIsSearching(true),
          onFinish: () => setIsSearching(false),

        }
      );
    }, 500),
    [filters.year]
  );

  const onSearchChange = (e) => {
    setSearchTerm(e.target.value);
    handleSearch(e.target.value);
  };

  const handleDelete = (id) => {
    MySwal.fire({
      title: 'Apakah Anda yakin?',
      text: "Data yang dihapus akan tidak bisa dikembalikan!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#15803d',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Ya, hapus!',
      cancelButtonText: 'Batal',
      background: '#ffffff',
      borderRadius: '1.25rem',
      customClass: {
        title: 'font-bold text-gray-900',
        popup: 'rounded-3xl shadow-2xl border-none',
        confirmButton: 'rounded-xl font-bold px-6 py-2.5',
        cancelButton: 'rounded-xl font-bold px-6 py-2.5'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        setLoadingText('Menghapus Data...');
        setIsLoading(true);
        router.delete(route('kebakaran-hutan.destroy', id), {
          preserveScroll: true,
          onSuccess: () => {
            setIsLoading(false);
            MySwal.fire({
              title: 'Terhapus!',
              text: 'Data laporan telah berhasil dihapus.',
              icon: 'success',
              confirmButtonColor: '#15803d',
              timer: 2000,
              timerProgressBar: true,
              showConfirmButton: false,
            });
          },
          onError: () => setIsLoading(false),
          onFinish: () => setIsLoading(false)
        });
      }
    });
  };

  const handleSubmit = (id) => {
    MySwal.fire({
      title: 'Ajukan Laporan?',
      text: "Laporan akan dikirim ke Kasi untuk diverifikasi.",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#15803d',
      confirmButtonText: 'Ya, Ajukan!',
      cancelButtonText: 'Batal',
      borderRadius: '1.25rem',
    }).then((result) => {
      if (result.isConfirmed) {
        setLoadingText('Mengajukan Laporan...');
        setIsLoading(true);
        router.post(route('kebakaran-hutan.submit', id), {}, {
          preserveScroll: true,
          onFinish: () => setIsLoading(false)
        });
      }
    });
  };

  const handleVerify = (id) => {
    MySwal.fire({
      title: 'Setujui Laporan?',
      text: "Apakah Anda yakin ingin menyetujui laporan ini?",
      icon: 'check-circle',
      showCancelButton: true,
      confirmButtonColor: '#15803d',
      confirmButtonText: 'Ya, Setujui',
      cancelButtonText: 'Batal',
      borderRadius: '1.25rem',
    }).then((result) => {
      if (result.isConfirmed) {
        setLoadingText('Memverifikasi...');
        setIsLoading(true);
        router.post(route('kebakaran-hutan.approve', id), {}, {
          preserveScroll: true,
          onFinish: () => setIsLoading(false)
        });
      }
    });
  };

  const handleReject = (id) => {
    MySwal.fire({
      title: 'Tolak Laporan?',
      text: "Berikan alasan penolakan:",
      input: 'textarea',
      inputPlaceholder: 'Tuliskan catatan penolakan di sini...',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Ya, Tolak',
      cancelButtonText: 'Batal',
      borderRadius: '1.25rem',
      inputValidator: (value) => {
        if (!value) {
          return 'Alasan penolakan harus diisi!'
        }
      }
    }).then((result) => {
      if (result.isConfirmed) {
        setLoadingText('Memproses Penolakan...');
        setIsLoading(true);
        router.post(route('kebakaran-hutan.reject', id), {
          rejection_note: result.value
        }, {
          preserveScroll: true,
          onFinish: () => setIsLoading(false)
        });
      }
    });
  };

  return (
    <>
      <AuthenticatedLayout
        user={auth.user}
        header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Kebakaran Hutan</h2>}
      >
        <Head title="Kebakaran Hutan" />

        {/* Fixed Loading Overlay */}
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

        <div className={`space-y-6 transition-all duration-700 ease-in-out ${isLoading ? 'opacity-30 blur-md grayscale-[0.5] pointer-events-none' : 'opacity-100 blur-0'}`}>
          {/* Modern Header Section */}
          <div className="bg-gradient-to-r from-red-800 to-red-600 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
            <div className="absolute right-0 top-0 h-full w-1/3 bg-white/5 transform skew-x-12 shrink-0"></div>
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-2xl font-bold font-display">Data Kebakaran Hutan</h3>
                <p className="mt-1 text-red-100 opacity-90 max-w-xl text-sm">
                  Rekapitulasi data kebakaran hutan, termasuk lokasi, luasan, dan penyebab kebakaran.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => window.location.href = route('kebakaran-hutan.export', { year: filters.year })}
                  className="flex items-center gap-2 px-4 py-2.5 bg-red-700 text-red-100 rounded-xl font-bold text-sm shadow-sm hover:bg-red-800 transition-colors border border-red-600/50"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Export
                </button>
                <button
                  onClick={() => setShowImportModal(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-red-700 text-red-100 rounded-xl font-bold text-sm shadow-sm hover:bg-red-800 transition-colors border border-red-600/50"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Import
                </button>
                {canCreate && (
                  <Link href={route('kebakaran-hutan.create')} className="shrink-0">
                    <button className="flex items-center gap-2 px-5 py-2.5 bg-white text-red-700 rounded-xl font-bold text-sm shadow-sm hover:bg-red-50 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Input Data Baru
                    </button>
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Kejadian {filters.year}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{formatNumber(stats.total_fires)} <span className="text-xs font-normal text-gray-400">Kali</span></p>
                </div>
                <div className="p-3 bg-red-50 rounded-lg text-red-600 shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Luasan {filters.year}</p>
                  <p className="text-2xl font-bold text-orange-600 mt-1">{stats.total_area} <span className="text-xs font-normal text-gray-400">Ha</span></p>
                </div>
                <div className="p-3 bg-orange-50 rounded-lg text-orange-600 shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Laporan</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">
                    {formatNumber(stats.total_count)}
                  </p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg text-blue-600 shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Table Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
              <div className="flex items-center gap-4 flex-1">
                <h3 className="font-bold text-gray-800">Daftar Laporan Kebakaran</h3>
                <div className="h-6 w-px bg-gray-200"></div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-400 uppercase">Tahun:</span>
                  <select
                    className="text-sm font-bold border-gray-200 rounded-lg focus:ring-red-500 focus:border-red-500 py-1"
                    value={filters.year}
                    onChange={(e) => handleYearChange(e.target.value)}
                  >
                    {availableYears.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                <div className="max-w-xs w-full ml-auto md:ml-4 relative">
                  <TextInput
                    type="text"
                    className="w-full text-sm pr-10"
                    placeholder="Cari Desa/Kec/Pengelola..."
                    value={searchTerm}
                    onChange={onSearchChange}
                  />
                  {isSearching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                  )}
                </div>
              </div>
              <div className="text-sm text-gray-400 font-bold bg-gray-50 px-3 py-1 rounded-full border border-gray-100 shrink-0">
                {datas.total} Data Item
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-500 min-w-[1000px]">
                <thead className="bg-gray-50/50 text-gray-700 uppercase tracking-wider text-[11px] font-bold">
                  <tr>
                    <th className="px-6 py-4">Bulan / Tahun</th>
                    <th className="px-6 py-4">Lokasi (Kec/Desa)</th>
                    <th className="px-6 py-4">Pengelola</th>
                    <th className="px-6 py-4">Fungsi Kawasan</th>
                    <th className="px-6 py-4 text-center">Jml Kejadian</th>
                    <th className="px-6 py-4 text-center">Luas (Ha)</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {datas.data.map((item) => (
                    <tr key={item.id} className="hover:bg-red-50/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900">{new Date(0, item.month - 1).toLocaleString('id-ID', { month: 'long' })}</div>
                        <div className="text-xs text-gray-400 font-semibold">{item.year}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-800">{item.district_name || 'N/A'}</div>
                        <div className="text-xs text-gray-500">{item.village_name || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-800">{item.pengelola_wisata?.name || '-'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                          {item.area_function}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-gray-900 font-bold">{formatNumber(item.number_of_fires)}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-orange-600 font-bold">{item.fire_area}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-2">
                          {/* Submit Button */}
                          {(canEdit && (item.status === 'draft' || item.status === 'rejected')) && (
                            <button
                              onClick={() => handleSubmit(item.id)}
                              className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors shadow-sm bg-blue-50"
                              title="Kirim ke Pimpinan"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 9l3 3m0 0l-3 3m3-3H9" />
                              </svg>
                            </button>
                          )}

                          {/* Verify & Reject for Kasi */}
                          {(canApprove && (isKasi || isAdmin) && item.status === 'waiting_kasi') && (
                            <>
                              <button
                                onClick={() => handleVerify(item.id)}
                                className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors shadow-sm bg-emerald-50"
                                title="Setujui Laporan"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleReject(item.id)}
                                className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors shadow-sm bg-red-50"
                                title="Tolak Laporan"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </>
                          )}

                          {/* Verify & Reject for KaCDK */}
                          {(canApprove && (isKaCdk || isAdmin) && item.status === 'waiting_cdk') && (
                            <>
                              <button
                                onClick={() => handleVerify(item.id)}
                                className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors shadow-sm bg-emerald-50"
                                title="Setujui Laporan"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleReject(item.id)}
                                className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors shadow-sm bg-red-50"
                                title="Tolak Laporan"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </button>
                            </>
                          )}

                          {/* Edit & Delete */}
                          {((canEdit && (item.status === 'draft' || item.status === 'rejected')) || isAdmin) && (
                            <>
                              <Link
                                href={route('kebakaran-hutan.edit', item.id)}
                                className="p-2 text-primary-600 hover:bg-primary-100 rounded-lg transition-colors shadow-sm bg-primary-50"
                                title="Edit Data"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                              </Link>
                              {(canDelete || isAdmin) && (
                                <button
                                  onClick={() => handleDelete(item.id)}
                                  className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors shadow-sm bg-red-50"
                                  title="Hapus Data"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {datas.data.length === 0 && (
                    <tr>
                      <td colSpan="8" className="text-center py-12">
                        <div className="flex flex-col items-center">
                          <div className="p-4 bg-gray-50 rounded-full mb-3 text-gray-300">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                          </div>
                          <p className="text-gray-400 font-medium tracking-tight whitespace-nowrap">Belum ada data laporan tersedia</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 border-t border-gray-100">
              <Pagination links={datas.links} />
            </div>
          </div>
        </div>
      </AuthenticatedLayout>

      {/* Import Modal */}
      <Modal show={showImportModal} onClose={() => setShowImportModal(false)}>
        <form onSubmit={handleImportSubmit} className="p-0 overflow-hidden">
          <div className="p-6 bg-slate-50 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Import Data Kebakaran Hutan</h2>
            <button type="button" onClick={() => setShowImportModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="p-6 space-y-8">
            {/* Step 1: Download Template */}
            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">1</div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-gray-900 mb-1">Unduh Template</h3>
                <p className="text-xs text-gray-500 mb-3 leading-relaxed">Gunakan template yang telah disediakan untuk memastikan format data sesuai.</p>
                <button type="button" onClick={() => window.location.href = route('kebakaran-hutan.template')} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download Template Excel
                </button>
              </div>
            </div>
            <div className="border-t border-gray-100"></div>
            {/* Step 2: Upload File */}
            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-sm">2</div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-gray-900 mb-1">Upload Data</h3>
                <p className="text-xs text-gray-500 mb-3 leading-relaxed">Pilih file yang telah diisi sesuai template (.xlsx, .xls, .csv).</p>
                <div className={`relative border-2 border-dashed rounded-xl p-6 transition-all duration-200 text-center cursor-pointer ${importFile ? 'border-red-500 bg-red-50/50' : 'border-gray-200 hover:border-red-300 hover:bg-gray-50'}`}>
                  <input type="file" accept=".xlsx,.xls,.csv" onChange={(e) => setImportFile(e.target.files[0])} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" id="file-upload" />
                  <div className="space-y-2 pointer-events-none">
                    <div className={`mx-auto h-12 w-12 rounded-full flex items-center justify-center transition-colors ${importFile ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-400'}`}>
                      {importFile ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      )}
                    </div>
                    {importFile ? (
                      <div>
                        <p className="text-sm font-bold text-red-800">{importFile.name}</p>
                        <p className="text-xs text-red-600 mt-1">{(importFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                    ) : (
                      <p className="text-sm font-medium text-gray-500">Klik untuk pilih file atau drag & drop</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="p-6 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
            <SecondaryButton onClick={() => setShowImportModal(false)}>Batal</SecondaryButton>
            <button type="submit" className="px-6 py-2 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all shadow-md shadow-red-200 disabled:opacity-50 disabled:shadow-none" disabled={!importFile}>Proses Import</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
