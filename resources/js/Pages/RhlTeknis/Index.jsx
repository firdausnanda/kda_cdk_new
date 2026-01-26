import { useState, useCallback, useEffect } from 'react';
import { debounce } from 'lodash';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import StatusBadge from '@/Components/StatusBadge';
import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';
import { router } from '@inertiajs/react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

import TextInput from '@/Components/TextInput';
import Pagination from '@/Components/Pagination';

const MySwal = withReactContent(Swal);

export default function Index({ auth, datas, stats, filters, availableYears, sumberDana }) {
  const { flash } = usePage().props;
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Memproses...');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const formatNumber = (num) => new Intl.NumberFormat('id-ID').format(num);

  const isAdmin = auth.user.roles.includes('admin');
  const isKasi = auth.user.roles.includes('kasi');
  const isKaCdk = auth.user.roles.includes('kacdk');
  const userPermissions = auth.user.permissions || [];

  const canCreate = userPermissions.includes('rehab.create') || isAdmin;
  const canEdit = userPermissions.includes('rehab.edit') || isAdmin;
  const canDelete = userPermissions.includes('rehab.delete') || isAdmin;
  const canApprove = userPermissions.includes('rehab.approve') || isAdmin;

  useEffect(() => {
    if (flash?.import_errors) {
      let errorHtml = '<div class="text-left max-h-60 overflow-y-auto text-sm space-y-2">';
      flash.import_errors.forEach(fail => { errorHtml += `<div class="p-2 bg-red-50 rounded border border-red-100"><span class="font-bold text-red-700">Baris ${fail.row}:</span> <span class="text-gray-600">${fail.errors.join(', ')}</span></div>`; });
      errorHtml += '</div>';
      MySwal.fire({ title: 'Import Gagal Sebagian', html: errorHtml, icon: 'error', confirmButtonText: 'Tutup', confirmButtonColor: '#d33', width: '600px' });
    }
    if (flash?.success) { MySwal.fire({ title: 'Berhasil', text: flash.success, icon: 'success', timer: 2000, showConfirmButton: false }); }
  }, [flash]);

  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [isSearching, setIsSearching] = useState(false);

  const handleYearChange = (year) => {
    setLoadingText('Sinkronisasi Tahun...');
    setIsLoading(true);
    router.get(route('rhl-teknis.index'), { year, search: searchTerm }, {
      preserveState: true,
      replace: true,
      onFinish: () => setIsLoading(false)
    });
  };

  const handleSearch = useCallback(
    debounce((value) => {
      router.get(
        route('rhl-teknis.index'),
        { search: value, year: filters.year },
        {
          preserveState: true,
          replace: true,
          preserveScroll: true,
          onStart: () => setIsSearching(true),
          onFinish: () => setIsSearching(false)
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
      borderRadius: '1.25rem',
    }).then((result) => {
      if (result.isConfirmed) {
        setLoadingText('Menghapus Data...');
        setIsLoading(true);
        router.delete(route('rhl-teknis.destroy', id), {
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
        router.post(route('rhl-teknis.submit', id), {}, {
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
        router.post(route('rhl-teknis.approve', id), {}, {
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
        router.post(route('rhl-teknis.reject', id), {
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
        header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">RHL Bangunan Konservasi Tanah dan Air</h2>}
      >
        <Head title="Bangunan Konservasi Tanah dan Air" />

        {/* Loading Overlay */}
        {isLoading && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-primary-950/20 backdrop-blur-[4px] transition-all duration-300">
            <div className="bg-white/95 p-6 rounded-3xl shadow-xl flex items-center gap-5 border border-white animate-in fade-in zoom-in duration-300">
              <svg className="animate-spin h-10 w-10 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <div className="flex flex-col">
                <span className="text-lg font-black text-gray-900 tracking-tight leading-tight">Mohon Tunggu</span>
                <span className="text-xs text-primary-600 font-bold uppercase tracking-widest mt-0.5">{loadingText}</span>
              </div>
            </div>
          </div>
        )}

        <div className={`space-y-6 transition-all duration-700 ease-in-out ${isLoading ? 'opacity-30 blur-md grayscale-[0.5] pointer-events-none' : 'opacity-100 blur-0'}`}>
          {/* Header Section */}
          <div className="bg-gradient-to-r from-emerald-800 to-green-600 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
            <div className="absolute right-0 top-0 h-full w-1/3 bg-white/5 transform skew-x-12 shrink-0"></div>
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-2xl font-bold font-display">Data RHL Bangunan Konservasi Tanah dan Air</h3>
                <p className="mt-1 text-primary-100 opacity-90 some max-w-xl text-sm">
                  Kelola dan pantau capaian pembangunan sarana teknis konservasi tanah dan air (Bangunan KTA).
                </p>
              </div>
              {canCreate && (
                <div className="flex gap-2">
                  <button onClick={() => window.location.href = route('rhl-teknis.export', { year: filters.year })} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-700 text-emerald-100 rounded-xl font-bold text-sm shadow-sm hover:bg-emerald-800 transition-colors border border-emerald-600/50">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    Export
                  </button>
                  <button onClick={() => setShowImportModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-700 text-emerald-100 rounded-xl font-bold text-sm shadow-sm hover:bg-emerald-800 transition-colors border border-emerald-600/50">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                    Import
                  </button>
                  <Link href={route('rhl-teknis.create')} className="shrink-0">
                    <button className="flex items-center gap-2 px-5 py-2.5 bg-white text-emerald-700 rounded-xl font-bold text-sm shadow-sm hover:bg-emerald-50 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                      Input Data Baru
                    </button>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Target Tahunan {filters.year}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatNumber(stats.total_target)} <span className="text-xs font-normal text-gray-400">Unit</span></p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Realisasi Unit</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{formatNumber(stats.total_units)} <span className="text-xs font-normal text-gray-400">Unit</span></p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Laporan Selesai</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">
                {stats.total_count} <span className="text-xs font-normal text-gray-400">Laporan</span>
              </p>
            </div>
          </div>

          {/* Table Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
              <div className="flex items-center gap-4 flex-1">
                <h3 className="font-bold text-gray-800">Daftar Laporan</h3>
                <div className="h-6 w-px bg-gray-200"></div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-400 uppercase">Tahun:</span>
                  <select
                    className="text-sm font-bold border-gray-200 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 py-1"
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
                    placeholder="Cari Sumber Dana..."
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
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-500 min-w-[800px]">
                <thead className="bg-gray-50/50 text-gray-700 uppercase tracking-wider text-[11px] font-bold">
                  <tr>
                    <th className="px-6 py-4">Periode</th>
                    <th className="px-6 py-4">Lokasi</th>
                    <th className="px-6 py-4">Detail Bangunan</th>
                    <th className="px-6 py-4 text-center">Capaian & Target</th>
                    <th className="px-6 py-4">Sumber Dana</th>
                    <th className="px-6 py-4 text-center">Input Oleh</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {datas.data.map((item) => {
                    const totalUnits = item.details.reduce((sum, d) => sum + d.unit_amount, 0);
                    const percentage = item.target_annual > 0 ? (totalUnits / item.target_annual) * 100 : 0;

                    return (
                      <tr key={item.id} className="hover:bg-emerald-50/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-900">{new Date(0, item.month - 1).toLocaleString('id-ID', { month: 'long' })}</div>
                          <div className="text-[10px] text-gray-400 font-semibold">{item.year}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-gray-900 text-xs">{item.regency_name?.toLowerCase().replace(/(^|\s)\S/g, l => l.toUpperCase())}</span>
                            <span className="text-[10px] text-gray-500">Kec. {item.district_name?.toLowerCase().replace(/(^|\s)\S/g, l => l.toUpperCase())}</span>
                            <span className="text-[10px] text-gray-500">Desa {item.village_name?.toLowerCase().replace(/(^|\s)\S/g, l => l.toUpperCase())}</span>
                            {item.coordinates && (
                              <a
                                href={`https://www.google.com/maps/search/?api=1&query=${item.coordinates}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[9px] text-blue-500 hover:underline flex items-center gap-1 mt-1"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                </svg>
                                {item.coordinates}
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1.5 min-w-[200px]">
                            {item.details.map((detail, idx) => (
                              <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-100/50 hover:bg-white hover:border-emerald-200 hover:shadow-sm transition-all group">
                                <div className="flex items-center gap-2.5 overflow-hidden">
                                  <div className="shrink-0 p-1.5 bg-emerald-100 text-emerald-600 rounded-md group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                      <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                                    </svg>
                                  </div>
                                  <span className="text-xs font-bold text-gray-700 group-hover:text-gray-900 truncate" title={detail.bangunan_kta?.name}>{detail.bangunan_kta?.name || '-'}</span>
                                </div>
                                <div className="shrink-0 ml-2">
                                  <span className="text-[10px] font-mono font-bold text-gray-600 bg-white border border-gray-200 px-2 py-0.5 rounded-md shadow-sm group-hover:border-emerald-200 group-hover:text-emerald-700 transition-colors">
                                    {detail.unit_amount}
                                  </span>
                                </div>
                              </div>
                            ))}
                            {item.details.length === 0 && (
                              <div className="flex items-center justify-center p-3 rounded-lg border border-dashed border-gray-200 bg-gray-50/50">
                                <span className="text-gray-400 italic text-xs">Tidak ada detail</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex flex-col items-center gap-1.5">
                            <div className="flex items-baseline gap-1">
                              <span className="text-base font-black text-emerald-700">{formatNumber(totalUnits)}</span>
                              <span className="text-[10px] font-bold text-gray-400 uppercase">/ {formatNumber(item.target_annual)} Unit</span>
                            </div>
                            <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden border border-gray-50">
                              <div
                                className={`h-full transition-all duration-500 rounded-full ${percentage >= 100 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-blue-500'}`}
                                style={{ width: `${Math.min(percentage, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-[10px] font-bold uppercase whitespace-nowrap">
                            {item.fund_source}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-gray-800">{item.creator?.name || 'Sistem'}</span>
                            <span className="text-[9px] text-gray-400 font-medium italic">{new Date(item.created_at).toLocaleDateString('id-ID')}</span>
                          </div>
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
                                className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors bg-blue-50"
                                title="Ajukan Laporan"
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
                                  className="p-1.5 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors bg-emerald-50"
                                  title="Setujui Final (KaCDK)"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleReject(item.id)}
                                  className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-colors bg-red-50"
                                  title="Tolak Laporan"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </>
                            )}

                            {/* Reject Action */}
                            {/* This section is now redundant as reject buttons are included in Kasi and KaCDK sections */}
                            {/* {(canApprove && (item.status === 'waiting_kasi' || item.status === 'waiting_cdk')) && (
                            <button
                              onClick={() => handleReject(item.id)}
                              className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-colors bg-red-50"
                              title="Tolak Laporan"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}

                          {/* Edit/Delete */}
                            {((canEdit && (item.status === 'draft' || item.status === 'rejected')) || isAdmin) && (
                              <>
                                <Link
                                  href={route('rhl-teknis.edit', item.id)}
                                  className="p-1.5 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors bg-emerald-50"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                  </svg>
                                </Link>
                                {(canDelete || isAdmin) && (
                                  <button
                                    onClick={() => handleDelete(item.id)}
                                    className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-colors bg-red-50"
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
                    );
                  })}
                  {datas.data.length === 0 && (
                    <tr>
                      <td colSpan="7" className="text-center py-12 text-gray-400">Belum ada data tersedia</td>
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
      <Modal show={showImportModal} onClose={() => setShowImportModal(false)}>
        <form onSubmit={(e) => { e.preventDefault(); if (!importFile) return; const formData = new FormData(); formData.append('file', importFile); setLoadingText('Mengimport Data...'); setIsLoading(true); setShowImportModal(false); router.post(route('rhl-teknis.import'), formData, { forceFormData: true, preserveScroll: true, onFinish: () => { setIsLoading(false); setImportFile(null); }, onError: () => setIsLoading(false) }); }} className="p-0 overflow-hidden">
          <div className="p-6 bg-slate-50 border-b border-gray-100 flex items-center justify-between"><h2 className="text-lg font-bold text-gray-900">Import Data</h2><button type="button" onClick={() => setShowImportModal(false)} className="text-gray-400 hover:text-gray-600"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button></div>
          <div className="p-6 space-y-8">
            <div className="flex gap-4 items-start"><div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">1</div><div className="flex-1"><h3 className="text-sm font-bold text-gray-900 mb-1">Unduh Template</h3><p className="text-xs text-gray-500 mb-3">Gunakan template yang telah disediakan.</p><button type="button" onClick={() => window.location.href = route('rhl-teknis.template')} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg border border-blue-100 hover:bg-blue-100"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>Download Template</button></div></div>
            <div className="border-t border-gray-100"></div>
            <div className="flex gap-4 items-start"><div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-sm">2</div><div className="flex-1"><h3 className="text-sm font-bold text-gray-900 mb-1">Upload Data</h3><p className="text-xs text-gray-500 mb-3">Pilih file Excel/CSV.</p><div className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer ${importFile ? 'border-emerald-500 bg-emerald-50/50' : 'border-gray-200 hover:border-emerald-300'}`}><input type="file" accept=".xlsx,.xls,.csv" onChange={(e) => setImportFile(e.target.files[0])} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" /><div className="space-y-2 pointer-events-none"><div className={`mx-auto h-12 w-12 rounded-full flex items-center justify-center ${importFile ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>{importFile ? <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> : <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>}</div>{importFile ? <div><p className="text-sm font-bold text-emerald-800">{importFile.name}</p><p className="text-xs text-emerald-600 mt-1">{(importFile.size / 1024).toFixed(1)} KB</p></div> : <p className="text-sm font-medium text-gray-500">Klik untuk pilih file</p>}</div></div></div></div>
          </div>
          <div className="p-6 bg-gray-50 flex justify-end gap-3 border-t border-gray-100"><SecondaryButton onClick={() => setShowImportModal(false)}>Batal</SecondaryButton><button type="submit" className="px-6 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 disabled:opacity-50" disabled={!importFile}>Proses Import</button></div>
        </form>
      </Modal>
    </>
  );
}
