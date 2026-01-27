import { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
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

export default function Index({ auth, datas, stats, filters, availableYears }) {
  const { flash } = usePage().props;
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Memproses...');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [params, setParams] = useState({
    year: filters.year,
    search: filters.search || '',
    sort: filters.sort || '',
    direction: filters.direction || 'asc'
  });

  const formatNumber = (num) => new Intl.NumberFormat('id-ID').format(num);

  const isAdmin = auth.user.roles.includes('admin');
  const isKasi = auth.user.roles.includes('kasi');
  const isKaCdk = auth.user.roles.includes('kacdk');
  const userPermissions = auth.user.permissions || [];

  const canCreate = userPermissions.includes('pemberdayaan.create') || isAdmin;
  const canEdit = userPermissions.includes('pemberdayaan.edit') || isAdmin;
  const canDelete = userPermissions.includes('pemberdayaan.delete') || isAdmin;
  const canApprove = userPermissions.includes('pemberdayaan.approve') || isAdmin;

  useEffect(() => {
    if (flash?.import_errors) {
      let errorHtml = '<div class="text-left max-h-60 overflow-y-auto text-sm space-y-2">';
      flash.import_errors.forEach(fail => {
        errorHtml += `<div class="p-2 bg-red-50 rounded border border-red-100"><span class="font-bold text-red-700">Baris ${fail.row}:</span> <span class="text-gray-600">${fail.errors.join(', ')}</span></div>`;
      });
      errorHtml += '</div>';
      MySwal.fire({ title: 'Import Gagal Sebagian', html: errorHtml, icon: 'error', confirmButtonText: 'Tutup', confirmButtonColor: '#d33', width: '600px' });
    }
    if (flash?.success) {
      MySwal.fire({ title: 'Berhasil', text: flash.success, icon: 'success', timer: 2000, showConfirmButton: false });
    }
  }, [flash]);

  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [isSearching, setIsSearching] = useState(false);

  const handleImport = (e) => {
    // ... import logic unchanged ...
  };

  const handleYearChange = (year) => {
    setLoadingText('Sinkronisasi Tahun...');
    setIsLoading(true);
    const newParams = { ...params, year };
    setParams(newParams);
    router.get(route('perkembangan-kth.index'), newParams, {
      preserveState: true,
      replace: true,
      onFinish: () => setIsLoading(false)
    });
  };

  const handleSearch = useCallback(
    debounce((value) => {
      const newParams = { ...params, search: value };
      setParams(newParams);
      router.get(
        route('perkembangan-kth.index'),
        newParams,
        {
          preserveState: true,
          replace: true,
          preserveScroll: true,
          onStart: () => setIsSearching(true),
          onFinish: () => setIsSearching(false)
        }
      );
    }, 500),
    [params]
  );

  const onSearchChange = (e) => {
    setSearchTerm(e.target.value);
    handleSearch(e.target.value);
  };

  const handleSort = (field) => {
    let direction = 'asc';
    if (params.sort === field && params.direction === 'asc') {
      direction = 'desc';
    }
    const newParams = { ...params, sort: field, direction };
    setParams(newParams);

    router.get(route('perkembangan-kth.index'), newParams, {
      preserveState: true,
      preserveScroll: true
    });
  };

  const SortIcon = ({ field }) => {
    return (
      <div className="w-4 h-4 ml-1 text-gray-500">
        {params.sort === field ? (
          params.direction === 'asc' ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
        )}
      </div>
    );
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(datas.data.map((item) => item.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((itemId) => itemId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkAction = (action) => {
    if (selectedIds.length === 0) return;

    let title, text, routeName;

    if (action === 'delete') {
      title = 'Hapus data terpilih?';
      text = 'Data yang dihapus tidak dapat dikembalikan!';
      routeName = 'perkembangan-kth.bulk-delete';
    } else if (action === 'submit') {
      title = 'Submit data terpilih?';
      text = 'Data akan dikirim ke Kasi.';
      routeName = 'perkembangan-kth.bulk-submit';
    } else if (action === 'approve') {
      title = 'Setujui data terpilih?';
      text = 'Data akan disetujui.';
      routeName = 'perkembangan-kth.bulk-approve';
    }

    MySwal.fire({
      title: title,
      text: text,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: action === 'delete' ? '#d33' : '#15803d',
      confirmButtonText: 'Ya, Lanjutkan!',
      cancelButtonText: 'Batal'
    }).then((result) => {
      if (result.isConfirmed) {
        setLoadingText('Memproses Bulk Action...');
        setIsLoading(true);
        router.post(route(routeName), { ids: selectedIds }, {
          onFinish: () => {
            setIsLoading(false);
            setSelectedIds([]);
          }
        });
      }
    });
  };

  const handleDelete = (id) => {
    MySwal.fire({
      title: 'Apakah Anda yakin?',
      text: "Data yang dihapus tidak bisa dikembalikan!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#15803d',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Ya, hapus!',
      cancelButtonText: 'Batal',
    }).then((result) => {
      if (result.isConfirmed) {
        setLoadingText('Menghapus Data...');
        setIsLoading(true);
        router.delete(route('perkembangan-kth.destroy', id), {
          preserveScroll: true,
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
    }).then((result) => {
      if (result.isConfirmed) {
        setLoadingText('Mengajukan Laporan...');
        setIsLoading(true);
        router.post(route('perkembangan-kth.submit', id), {}, {
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
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#15803d',
      confirmButtonText: 'Ya, Setujui',
      cancelButtonText: 'Batal',
    }).then((result) => {
      if (result.isConfirmed) {
        setLoadingText('Memverifikasi...');
        setIsLoading(true);
        router.post(route('perkembangan-kth.approve', id), {}, {
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
      inputValidator: (value) => {
        if (!value) {
          return 'Alasan penolakan harus diisi!'
        }
      }
    }).then((result) => {
      if (result.isConfirmed) {
        setLoadingText('Memproses Penolakan...');
        setIsLoading(true);
        router.post(route('perkembangan-kth.reject', id), {
          rejection_note: result.value
        }, {
          preserveScroll: true,
          onFinish: () => setIsLoading(false)
        });
      }
    });
  };

  const getKelasLabel = (kelas) => {
    const labels = { pemula: 'Pemula', madya: 'Madya', utama: 'Utama' };
    return labels[kelas] || kelas;
  };

  const getKelasBadgeColor = (kelas) => {
    const colors = {
      pemula: 'bg-yellow-100 text-yellow-700',
      madya: 'bg-blue-100 text-blue-700',
      utama: 'bg-green-100 text-green-700'
    };
    return colors[kelas] || 'bg-gray-100 text-gray-700';
  };

  return (
    <>
      <AuthenticatedLayout
        user={auth.user}
        header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Perkembangan KTH</h2>}
      >
        <Head title="Perkembangan KTH" />

        {/* Loading Overlay */}
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
          {/* Header Section */}
          <div className="bg-gradient-to-r from-primary-800 to-primary-600 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
            <div className="absolute right-0 top-0 h-full w-1/3 bg-white/5 transform skew-x-12 shrink-0"></div>
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-2xl font-bold font-display">Data Perkembangan KTH</h3>
                <p className="mt-1 text-primary-100 opacity-90 max-w-xl text-sm">
                  Kelola dan pantau perkembangan Kelompok Tani Hutan di wilayah CDK Trenggalek.
                </p>
              </div>
              {canCreate && (
                <div className="flex gap-2">
                  <button
                    onClick={() => window.location.href = route('perkembangan-kth.export', { year: filters.year })}
                    className="flex items-center gap-2 px-4 py-2.5 bg-primary-700 text-primary-100 rounded-xl font-bold text-sm shadow-sm hover:bg-primary-800 transition-colors border border-primary-600/50"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Export
                  </button>
                  <button
                    onClick={() => setShowImportModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-primary-700 text-primary-100 rounded-xl font-bold text-sm shadow-sm hover:bg-primary-800 transition-colors border border-primary-600/50"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Import
                  </button>
                  <Link href={route('perkembangan-kth.create')} className="shrink-0">
                    <button className="flex items-center gap-2 px-5 py-2.5 bg-white text-primary-700 rounded-xl font-bold text-sm shadow-sm hover:bg-primary-50 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Input Data Baru
                    </button>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total KTH {filters.year}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{formatNumber(stats.total_kth)} <span className="text-xs font-normal text-gray-400">Kelompok</span></p>
                </div>
                <div className="p-3 bg-primary-50 rounded-lg text-primary-600 shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Anggota</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">{formatNumber(stats.total_anggota)} <span className="text-xs font-normal text-gray-400">Orang</span></p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg text-blue-600 shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Luas Kelola</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">{formatNumber(stats.total_luas)} <span className="text-xs font-normal text-gray-400">Ha</span></p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg text-green-600 shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Berdasarkan Kelas</p>
                <div className="flex gap-2">
                  <div className="flex-1 text-center p-2 bg-yellow-50 rounded-lg">
                    <p className="text-lg font-bold text-yellow-600">{stats.by_kelas?.pemula || 0}</p>
                    <p className="text-[10px] font-bold text-yellow-500 uppercase">Pemula</p>
                  </div>
                  <div className="flex-1 text-center p-2 bg-blue-50 rounded-lg">
                    <p className="text-lg font-bold text-blue-600">{stats.by_kelas?.madya || 0}</p>
                    <p className="text-[10px] font-bold text-blue-500 uppercase">Madya</p>
                  </div>
                  <div className="flex-1 text-center p-2 bg-green-50 rounded-lg">
                    <p className="text-lg font-bold text-green-600">{stats.by_kelas?.utama || 0}</p>
                    <p className="text-[10px] font-bold text-green-500 uppercase">Utama</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Table Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
              <div className="flex items-center gap-4 flex-1">
                <h3 className="font-bold text-gray-800">Daftar Data KTH</h3>
                <div className="h-6 w-px bg-gray-200"></div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-400 uppercase">Tahun:</span>
                  <select
                    className="text-sm font-bold border-gray-200 rounded-lg focus:ring-primary-500 focus:border-primary-500 py-1"
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
                    placeholder="Cari nama KTH, lokasi..."
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
                {stats.total_kth} Data Teritem
              </div>
            </div>
            <div className="overflow-x-auto min-h-[400px]">
              <table className="w-full text-left text-sm text-gray-500 min-w-[1000px]">
                <thead className="bg-gray-50/50 text-gray-700 uppercase tracking-wider text-[11px] font-bold">
                  <tr>
                    <th scope="col" className="px-6 py-4 w-12 text-center">
                      <div className="flex items-center justify-center">
                        <input
                          type="checkbox"
                          className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 transition duration-150 ease-in-out cursor-pointer"
                          checked={selectedIds.length === datas.data.length && datas.data.length > 0}
                          onChange={handleSelectAll}
                        />
                      </div>
                    </th>
                    <th className="px-6 py-4">Bulan / Tahun</th>
                    <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors group" onClick={() => handleSort('location')}>
                      <div className="flex items-center gap-1">
                        Lokasi
                        <SortIcon field="location" />
                      </div>
                    </th>
                    <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors group" onClick={() => handleSort('nama_kth')}>
                      <div className="flex items-center gap-1">
                        Nama KTH
                        <SortIcon field="nama_kth" />
                      </div>
                    </th>
                    <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors group" onClick={() => handleSort('nomor_register')}>
                      <div className="flex items-center gap-1">
                        No. Register
                        <SortIcon field="nomor_register" />
                      </div>
                    </th>
                    <th className="px-6 py-4 text-center cursor-pointer hover:bg-gray-100 transition-colors group" onClick={() => handleSort('kelas')}>
                      <div className="flex items-center justify-center gap-1">
                        Kelas
                        <SortIcon field="kelas" />
                      </div>
                    </th>
                    <th className="px-6 py-4 text-center cursor-pointer hover:bg-gray-100 transition-colors group" onClick={() => handleSort('anggota')}>
                      <div className="flex items-center justify-center gap-1">
                        Anggota
                        <SortIcon field="anggota" />
                      </div>
                    </th>
                    <th className="px-6 py-4 text-center cursor-pointer hover:bg-gray-100 transition-colors group" onClick={() => handleSort('luas')}>
                      <div className="flex items-center justify-center gap-1">
                        Luas (Ha)
                        <SortIcon field="luas" />
                      </div>
                    </th>
                    <th className="px-6 py-4 text-center cursor-pointer hover:bg-gray-100 transition-colors group" onClick={() => handleSort('status')}>
                      <div className="flex items-center justify-center gap-1">
                        Status
                        <SortIcon field="status" />
                      </div>
                    </th>
                    <th className="px-6 py-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {datas.data.map((item) => (
                    <tr key={item.id} className={`hover:bg-primary-50/30 transition-colors group ${selectedIds.includes(item.id) ? 'bg-blue-50/50' : ''}`}>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center">
                          <input
                            type="checkbox"
                            className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 transition duration-150 ease-in-out cursor-pointer"
                            checked={selectedIds.includes(item.id)}
                            onChange={() => handleSelect(item.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900">{new Date(0, item.month - 1).toLocaleString('id-ID', { month: 'long' })}</div>
                        <div className="text-xs text-gray-400 font-semibold">{item.year}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-800">{item.village_name || '-'}</div>
                        <div className="text-xs text-primary-600 font-bold uppercase tracking-tighter">
                          {item.district_name}, {item.regency_name}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900">{item.nama_kth}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-600">{item.nomor_register || '-'}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${getKelasBadgeColor(item.kelas_kelembagaan)}`}>
                          {getKelasLabel(item.kelas_kelembagaan)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-bold text-gray-900">{formatNumber(item.jumlah_anggota)}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-bold text-primary-700">{formatNumber(item.luas_kelola)}</span>
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
                                href={route('perkembangan-kth.edit', item.id)}
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
                      <td colSpan="10" className="text-center py-12">
                        <div className="flex flex-col items-center">
                          <div className="p-4 bg-gray-50 rounded-full mb-3 text-gray-300">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                          </div>
                          <p className="text-gray-400 font-medium tracking-tight whitespace-nowrap">Belum ada data KTH tersedia</p>
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
        {
          selectedIds.length > 0 && createPortal(
            <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 z-[9999] flex items-center gap-4 animate-in slide-in-from-bottom-5 duration-300">
              <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-lg">
                <span className="font-bold text-gray-700">{selectedIds.length}</span>
                <span className="text-xs font-semibold text-gray-500 uppercase">Dipilih</span>
              </div>
              <div className="h-8 w-px bg-gray-200"></div>
              <div className="flex items-center gap-2">
                {(canEdit || canCreate) && (
                  <button
                    onClick={() => handleBulkAction('submit')}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-colors shadow-sm shadow-blue-200"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 9l3 3m0 0l-3 3m3-3H9" />
                    </svg>
                    Ajukan
                  </button>
                )}
                {(canApprove) && (
                  <button
                    onClick={() => handleBulkAction('approve')}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition-colors shadow-sm shadow-emerald-200"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Setujui
                  </button>
                )}
                {(canDelete) && (
                  <button
                    onClick={() => handleBulkAction('delete')}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm transition-colors shadow-sm shadow-red-200"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Hapus
                  </button>
                )}
              </div>
            </div>,
            document.body
          )
        }
      </AuthenticatedLayout>
      <Modal show={showImportModal} onClose={() => setShowImportModal(false)}>
        <form onSubmit={(e) => { e.preventDefault(); if (!importFile) return; const formData = new FormData(); formData.append('file', importFile); setLoadingText('Mengimport Data...'); setIsLoading(true); setShowImportModal(false); router.post(route('perkembangan-kth.import'), formData, { forceFormData: true, preserveScroll: true, onFinish: () => { setIsLoading(false); setImportFile(null); }, onError: () => setIsLoading(false) }); }} className="p-0 overflow-hidden">
          <div className="p-6 bg-slate-50 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Import Data</h2>
            <button type="button" onClick={() => setShowImportModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="p-6 space-y-8">
            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">1</div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-gray-900 mb-1">Unduh Template</h3>
                <p className="text-xs text-gray-500 mb-3 leading-relaxed">Gunakan template yang telah disediakan untuk memastikan format data sesuai.</p>
                <button type="button" onClick={() => window.location.href = route('perkembangan-kth.template')} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  Download Template Excel
                </button>
              </div>
            </div>
            <div className="border-t border-gray-100"></div>
            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold text-sm">2</div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-gray-900 mb-1">Upload Data</h3>
                <p className="text-xs text-gray-500 mb-3 leading-relaxed">Pilih file yang telah diisi sesuai template (.xlsx, .xls, .csv).</p>
                <div className={`relative border-2 border-dashed rounded-xl p-6 transition-all duration-200 text-center cursor-pointer ${importFile ? 'border-primary-500 bg-primary-50/50' : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'}`}>
                  <input type="file" accept=".xlsx,.xls,.csv" onChange={(e) => setImportFile(e.target.files[0])} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  <div className="space-y-2 pointer-events-none">
                    <div className={`mx-auto h-12 w-12 rounded-full flex items-center justify-center transition-colors ${importFile ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-400'}`}>
                      {importFile ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                      )}
                    </div>
                    {importFile ? (
                      <div><p className="text-sm font-bold text-primary-800">{importFile.name}</p><p className="text-xs text-primary-600 mt-1">{(importFile.size / 1024).toFixed(1)} KB</p></div>
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
            <button type="submit" className="px-6 py-2 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-all shadow-md shadow-primary-200 disabled:opacity-50 disabled:shadow-none" disabled={!importFile}>Proses Import</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
