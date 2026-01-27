import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage, router } from '@inertiajs/react';
import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { debounce } from 'lodash';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';

const MySwal = withReactContent(Swal);
import Pagination from '@/Components/Pagination';
import TextInput from '@/Components/TextInput';

export default function Index({ auth, datas, filters, stats, available_years }) {
  const { flash } = usePage().props;
  const [year, setYear] = useState(filters.year || new Date().getFullYear());

  const isAdmin = auth.user.roles.includes('admin');
  const isKasi = auth.user.roles.includes('kasi');
  const isKaCdk = auth.user.roles.includes('kacdk');
  const userPermissions = auth.user.permissions || [];

  const canCreate = userPermissions.includes('bina-usaha.create') || isAdmin;
  const canEdit = userPermissions.includes('bina-usaha.edit') || isAdmin;
  const canDelete = userPermissions.includes('bina-usaha.delete') || isAdmin;
  const canApprove = userPermissions.includes('bina-usaha.approve') || isAdmin;

  const yearOptions = available_years?.length > 0 ? available_years : [new Date().getFullYear()];

  useEffect(() => {
    if (flash?.success) {
      MySwal.fire({
        title: 'Berhasil',
        text: flash.success,
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
    }

    if (flash?.error) {
      MySwal.fire({
        title: 'Gagal',
        text: flash.error,
        icon: 'error',
        confirmButtonText: 'Tutup',
        confirmButtonColor: '#d33',
      });
    }

    if (flash?.import_errors) {
      const errorList = flash.import_errors.map(f => `Baris ${f.row}: ${Array.isArray(f.errors) ? f.errors.join(', ') : f.errors}`).join('<br>');
      MySwal.fire({
        title: 'Import Gagal',
        html: `<div class="text-left text-sm">${errorList}</div>`,
        icon: 'error',
        confirmButtonColor: '#dc2626',
      });
    }
  }, [flash]);

  /* Selection State */
  const [selectedIds, setSelectedIds] = useState([]);

  /* Handlers */
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allIds = datas.data.map(item => item.id);
      setSelectedIds(allIds);
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(itemId => itemId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleSort = (field) => {
    const currentSort = filters.sort;
    const currentDirection = filters.direction;

    let newDirection = 'asc';
    if (currentSort === field && currentDirection === 'asc') {
      newDirection = 'desc';
    }

    router.get(
      route('realisasi-pnbp.index'),
      {
        search: searchTerm,
        year: filters.year,
        sort: field,
        direction: newDirection
      },
      {
        preserveState: true,
        preserveScroll: true,
        replace: true
      }
    );
  };

  const handleBulkAction = (action) => {
    if (selectedIds.length === 0) return;

    let title = '';
    let routeName = '';
    let confirmText = '';
    let color = '#3085d6';

    switch (action) {
      case 'delete':
        title = 'Hapus Data Terpilih?';
        confirmText = 'Ya, Hapus!';
        routeName = 'realisasi-pnbp.bulk-delete';
        color = '#d33';
        break;
      case 'submit':
        title = 'Ajukan Data Terpilih?';
        confirmText = 'Ya, Ajukan!';
        routeName = 'realisasi-pnbp.bulk-submit';
        color = '#15803d';
        break;
      case 'approve':
        title = 'Setujui Data Terpilih?';
        confirmText = 'Ya, Setujui!';
        routeName = 'realisasi-pnbp.bulk-approve';
        color = '#15803d';
        break;
      default:
        return;
    }

    MySwal.fire({
      title: title,
      text: `${selectedIds.length} data terpilih akan diproses.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: color,
      confirmButtonText: confirmText,
      cancelButtonText: 'Batal',
      borderRadius: '1.25rem',
    }).then((result) => {
      if (result.isConfirmed) {
        setLoadingText('Memproses Aksi Massal...');
        setIsLoading(true);
        router.post(route(routeName), { ids: selectedIds }, {
          preserveScroll: true,
          onSuccess: () => {
            setSelectedIds([]);
            MySwal.fire({
              title: 'Berhasil!',
              text: 'Aksi massal berhasil dilakukan.',
              icon: 'success',
              timer: 2000,
              showConfirmButton: false
            });
          },
          onFinish: () => setIsLoading(false)
        });
      }
    });
  };

  const SortIcon = ({ field }) => {
    if (filters.sort !== field) return <div className="w-4 h-4 ml-1 opacity-20"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg></div>;

    return (
      <div className="w-4 h-4 ml-1 text-emerald-600">
        {filters.direction === 'asc' ? (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
        )}
      </div>
    );
  };

  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Memproses...');

  const handleYearChange = (e) => {
    const newYear = e.target.value;
    setYear(newYear);
    setLoadingText('Sinkronisasi Tahun...');
    setIsLoading(true);
    router.get(route('realisasi-pnbp.index'), {
      year: newYear,
      search: searchTerm,
      sort: filters.sort,
      direction: filters.direction
    }, {
      preserveState: true,
      preserveScroll: true,
      onFinish: () => setIsLoading(false)
    });
  };

  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [isSearching, setIsSearching] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);

  const handleImportSubmit = (e) => {
    e.preventDefault();
    if (!importFile) return;
    setLoadingText('Mengimport Data...');
    setIsLoading(true);
    setShowImportModal(false);
    router.post(route('realisasi-pnbp.import'), { file: importFile }, {
      forceFormData: true,
      onFinish: () => {
        setIsLoading(false);
        setImportFile(null);
      }
    });
  };

  const handleSearch = useCallback(
    debounce((value) => {
      router.get(
        route('realisasi-pnbp.index'),
        {
          year: year,
          search: value,
          sort: filters.sort,
          direction: filters.direction
        },
        {
          preserveState: true,
          replace: true,
          preserveScroll: true,
          onStart: () => setIsSearching(true),
          onFinish: () => setIsSearching(false)
        }
      );
    }, 500),
    [year]
  );

  const onSearchChange = (e) => {
    setSearchTerm(e.target.value);
    handleSearch(e.target.value);
  };

  const handleDelete = (id) => {
    MySwal.fire({
      title: 'Apakah anda yakin?',
      text: "Data yang dihapus tidak dapat dikembalikan!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, hapus!',
      cancelButtonText: 'Batal'
    }).then((result) => {
      if (result.isConfirmed) {
        setLoadingText('Menghapus Data...');
        setIsLoading(true);
        router.delete(route('realisasi-pnbp.destroy', id), {
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
      confirmButtonText: 'Ya, Ajukan',
      cancelButtonText: 'Batal'
    }).then((result) => {
      if (result.isConfirmed) {
        setLoadingText('Mengajukan Laporan...');
        setIsLoading(true);
        router.post(route('realisasi-pnbp.submit', id), {}, {
          preserveScroll: true,
          onFinish: () => setIsLoading(false)
        });
      }
    });
  };

  const handleApprove = (id, currentStatus) => {
    const nextStep = currentStatus === 'waiting_kasi' ? 'KaCDK' : 'Final';
    MySwal.fire({
      title: 'Setuji Laporan?',
      text: `Laporan akan disetujui dan diteruskan ke ${nextStep}.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Setujui',
      confirmationButtonColor: '#10b981',
      cancelButtonText: 'Batal'
    }).then((result) => {
      if (result.isConfirmed) {
        setLoadingText('Memverifikasi...');
        setIsLoading(true);
        router.post(route('realisasi-pnbp.approve', id), {}, {
          preserveScroll: true,
          onFinish: () => setIsLoading(false)
        });
      }
    });
  };

  const handleReject = (id) => {
    MySwal.fire({
      title: 'Tolak Laporan',
      input: 'textarea',
      inputLabel: 'Alasan Penolakan',
      inputPlaceholder: 'Tuliskan alasan penolakan...',
      inputAttributes: {
        'aria-label': 'Tuliskan alasan penolakan'
      },
      showCancelButton: true,
      confirmButtonText: 'Tolak',
      confirmButtonColor: '#d33',
      showLoaderOnConfirm: true,
      preConfirm: (note) => {
        if (!note) {
          MySwal.showValidationMessage('Alasan penolakan harus diisi');
        }
        return note;
      }
    }).then((result) => {
      if (result.isConfirmed) {
        setLoadingText('Memproses Penolakan...');
        setIsLoading(true);
        router.post(route('realisasi-pnbp.reject', id), {
          rejection_note: result.value
        }, {
          preserveScroll: true,
          onFinish: () => setIsLoading(false)
        });
      }
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'draft':
        return <span className="px-3 py-1 text-xs font-bold text-gray-700 bg-gray-100 rounded-full border border-gray-200">Draft</span>;
      case 'waiting_kasi':
        return <span className="px-3 py-1 text-xs font-bold text-blue-700 bg-blue-100 rounded-full border border-blue-200">Menunggu Kasi</span>;
      case 'waiting_cdk':
        return <span className="px-3 py-1 text-xs font-bold text-orange-700 bg-orange-100 rounded-full border border-orange-200">Menunggu KaCDK</span>;
      case 'final':
        return <span className="px-3 py-1 text-xs font-bold text-emerald-700 bg-emerald-100 rounded-full border border-emerald-200">Final</span>;
      case 'rejected':
        return <span className="px-3 py-1 text-xs font-bold text-red-700 bg-red-100 rounded-full border border-red-200">Ditolak</span>;
      default:
        return <span className="px-3 py-1 text-xs font-bold text-gray-500 bg-gray-100 rounded-full border border-gray-200">{status}</span>;
    }
  };

  const userCanEdit = (item) => {
    if (isAdmin) return true;
    if (canEdit && (item.status === 'draft' || item.status === 'rejected')) return true;
    return false;
  };

  const userCanDelete = (item) => {
    if (isAdmin) return true;
    if (canDelete && (item.status === 'draft' || item.status === 'rejected')) return true;
    return false;
  };

  const userCanSubmit = (item) => {
    if (isAdmin && item.status === 'draft') return true;
    if (canEdit && (item.status === 'draft' || item.status === 'rejected')) return true;
    return false;
  };

  const userCanApprove = (item) => {
    if (isAdmin) return item.status === 'waiting_kasi' || item.status === 'waiting_cdk';
    if (canApprove) {
      if (item.status === 'waiting_kasi' && isKasi) return true;
      if (item.status === 'waiting_cdk' && isKaCdk) return true;
    }
    return false;
  };

  const userCanReject = (item) => {
    if (isAdmin) return item.status === 'waiting_kasi' || item.status === 'waiting_cdk';
    if (canApprove) {
      if (item.status === 'waiting_kasi' && isKasi) return true;
      if (item.status === 'waiting_cdk' && isKaCdk) return true;
    }
    return false;
  };

  const getHeaderColor = () => {
    return 'from-emerald-800 to-emerald-600';
  };

  return (
    <>
      <AuthenticatedLayout
        user={auth.user}
        header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">PNBP</h2>}
      >
        <Head title="PNBP" />

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
                <div className="absolute inset-0 flex items-center justify-center z-20">
                  <div className="h-2.5 w-2.5 bg-primary-600 rounded-full animate-ping"></div>
                </div>
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
          <div className={`bg-gradient-to-r ${getHeaderColor()} rounded-2xl p-8 text-white shadow-lg relative overflow-hidden`}>
            <div className="absolute right-0 top-0 h-full w-1/3 bg-white/5 transform skew-x-12 shrink-0"></div>
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-2xl font-bold font-display">Data PNBP</h3>
                <p className="mt-1 text-emerald-100 opacity-90 max-w-xl text-sm">
                  Kelola data Penerimaan Negara Bukan Pajak dari hasil hutan.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => window.location.href = route('realisasi-pnbp.export', { year: filters.year })}
                  className="flex items-center gap-2 px-4 py-2.5 bg-emerald-700 text-emerald-100 rounded-xl font-bold text-sm shadow-sm hover:bg-emerald-800 transition-colors border border-emerald-600/50"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Export
                </button>
                <button
                  onClick={() => setShowImportModal(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-emerald-700 text-emerald-100 rounded-xl font-bold text-sm shadow-sm hover:bg-emerald-800 transition-colors border border-emerald-600/50"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Import
                </button>
                {canCreate && (
                  <Link href={route('realisasi-pnbp.create')} className="shrink-0">
                    <button className="flex items-center gap-2 px-5 py-2.5 bg-white text-emerald-700 rounded-xl font-bold text-sm shadow-sm hover:bg-emerald-50 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Input Data Baru
                    </button>
                  </Link>
                )}
              </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 relative z-10 w-full">
              {/* Year Filter */}
              <div className="relative group shrink-0 w-full sm:w-48">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-20">
                  <svg className="h-5 w-5 text-emerald-100 group-hover:text-white transition-colors" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <select
                  value={year}
                  onChange={handleYearChange}
                  className="w-full pl-11 pr-10 py-3 bg-white/10 backdrop-blur-md text-white text-sm rounded-xl border border-white/20 focus:ring-2 focus:ring-white/30 focus:border-white/30 font-medium shadow-sm transition-all hover:bg-white/20 cursor-pointer appearance-none outline-none"
                >
                  {yearOptions.map((y) => (
                    <option key={y} value={y} className="text-gray-900 bg-white">{y}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none z-20">
                  <svg className="h-4 w-4 text-emerald-100" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Search Input */}
              <div className="relative w-full sm:max-w-md group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-20">
                  <svg className="h-5 w-5 text-emerald-100 group-focus-within:text-white transition-colors" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  className="w-full pl-11 pr-10 py-3 bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-emerald-100/70 focus:ring-2 focus:ring-white/30 focus:border-white/30 rounded-xl shadow-sm transition-all hover:bg-white/20"
                  placeholder="Cari Hasil Hutan, Lokasi..."
                  value={searchTerm}
                  onChange={onSearchChange}
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Data */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className="absolute right-0 top-0 w-24 h-24 bg-gradient-to-br from-emerald-50 to-transparent rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider relative z-10">Total Data</p>
              <div className="flex items-baseline gap-2 mt-2 relative z-10">
                <span className="text-3xl font-black text-gray-900 tracking-tight">{stats.total_count}</span>
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Laporan</span>
              </div>
            </div>

            {/* Verified Data */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className="absolute right-0 top-0 w-24 h-24 bg-gradient-to-br from-blue-50 to-transparent rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider relative z-10">Terverifikasi</p>
              <div className="flex items-baseline gap-2 mt-2 relative z-10">
                <span className="text-3xl font-black text-gray-900 tracking-tight">{stats.verified_count}</span>
                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Final</span>
              </div>
            </div>
          </div>

          {/* Data Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full min-w-[1200px] text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 w-4">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-emerald-600 shadow-sm focus:ring-emerald-500"
                        onChange={handleSelectAll}
                        checked={datas.data.length > 0 && selectedIds.length === datas.data.length}
                      />
                    </th>
                    <th
                      className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors group"
                      onClick={() => handleSort('month')}
                    >
                      <div className="flex items-center gap-1">
                        Waktu & Lokasi
                        <SortIcon field="month" />
                      </div>
                    </th>
                    <th
                      className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors group"
                      onClick={() => handleSort('pengelola')}
                    >
                      <div className="flex items-center gap-1">
                        Pengelola
                        <SortIcon field="pengelola" />
                      </div>
                    </th>
                    <th
                      className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors group"
                      onClick={() => handleSort('forest_product')}
                    >
                      <div className="flex items-center gap-1">
                        Jenis Hasil Hutan
                        <SortIcon field="forest_product" />
                      </div>
                    </th>
                    <th
                      className="px-6 py-4 text-right cursor-pointer hover:bg-gray-100 transition-colors group"
                      onClick={() => handleSort('target')}
                    >
                      <div className="flex items-center justify-end gap-1">
                        Target PNBP
                        <SortIcon field="target" />
                      </div>
                    </th>
                    <th
                      className="px-6 py-4 text-right cursor-pointer hover:bg-gray-100 transition-colors group"
                      onClick={() => handleSort('realization')}
                    >
                      <div className="flex items-center justify-end gap-1">
                        Realisasi PNBP
                        <SortIcon field="realization" />
                      </div>
                    </th>

                    <th
                      className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors group"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center gap-1">
                        Status
                        <SortIcon field="status" />
                      </div>
                    </th>
                    <th className="px-6 py-4 font-bold tracking-wider text-center whitespace-nowrap">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {datas.data.length > 0 ? (
                    datas.data.map((item, index) => (
                      <tr key={index} className={`hover:bg-emerald-50/30 transition-colors group ${selectedIds.includes(item.id) ? 'bg-emerald-50/50' : ''}`}>
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 text-emerald-600 shadow-sm focus:ring-emerald-500"
                            onChange={() => handleSelect(item.id)}
                            checked={selectedIds.includes(item.id)}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-900">
                              {new Date(0, item.month - 1).toLocaleString('id-ID', { month: 'long' })} {item.year}
                            </span>
                            <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500">
                              {item.regency?.name && <span>{item.regency.name}</span>}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{item.pengelola_wisata?.name}</td>
                        <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{item.types_of_forest_products}</td>
                        <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap text-right">
                          {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(item.pnbp_target)}
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap text-right">
                          {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(item.pnbp_realization)}
                        </td>

                        <td className="px-6 py-4">
                          {getStatusBadge(item.status)}
                          {item.status === 'rejected' && item.rejection_note && (
                            <div className="text-xs text-red-500 mt-1 italic max-w-[150px] truncate" title={item.rejection_note}>
                              "{item.rejection_note}"
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center gap-2">
                            {userCanApprove(item) && (
                              <>
                                <button
                                  onClick={() => handleApprove(item.id, item.status)}
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
                            {userCanSubmit(item) && (
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
                            {userCanEdit(item) && (
                              <Link
                                href={route('realisasi-pnbp.edit', item.id)}
                                className="p-2 text-amber-600 hover:bg-amber-100 rounded-lg transition-colors shadow-sm bg-amber-50"
                                title="Edit Data"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                              </Link>
                            )}
                            {userCanDelete(item) && (
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
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="px-6 py-12 text-center text-gray-500 bg-gray-50/20 italic">
                        Belum ada data PNBP yang ditemukan.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
              {datas.total > 0 ? (
                <div className="text-xs text-gray-500 font-medium">
                  Menampilkan {datas.from || 0} sampai {datas.to || 0} dari {datas.total || 0} data
                </div>
              ) : (
                <div></div>
              )}
              <Pagination links={datas.links} />
            </div>
          </div>
        </div>
      </AuthenticatedLayout>
      {selectedIds.length > 0 && createPortal(
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 z-[9999] flex items-center gap-4 animate-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-lg">
            <span className="font-bold text-gray-700">{selectedIds.length}</span>
            <span className="text-xs font-semibold text-gray-500 uppercase">Dipilih</span>
          </div>
          <div className="h-8 w-px bg-gray-200"></div>
          <div className="flex items-center gap-2">
            {(canEdit || isAdmin) && (
              <button
                onClick={() => handleBulkAction('submit')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-colors shadow-sm shadow-blue-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Ajukan
              </button>
            )}
            {(canApprove || isAdmin) && (
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
            {(canDelete || isAdmin) && (
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
          <button
            onClick={() => setSelectedIds([])}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
            title="Batalkan Pilihan"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>,
        document.body
      )}

      {/* Import Modal */}
      <Modal show={showImportModal} onClose={() => setShowImportModal(false)}>
        <form onSubmit={handleImportSubmit} className="p-0 overflow-hidden">
          <div className="p-6 bg-slate-50 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Import Data PNBP</h2>
            <button type="button" onClick={() => setShowImportModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="p-6 space-y-8">
            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">1</div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-gray-900 mb-1">Unduh Template</h3>
                <p className="text-xs text-gray-500 mb-3 leading-relaxed">Gunakan template yang telah disediakan untuk memastikan format data sesuai.</p>
                <button type="button" onClick={() => window.location.href = route('realisasi-pnbp.template')} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download Template Excel
                </button>
              </div>
            </div>
            <div className="border-t border-gray-100"></div>
            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-sm">2</div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-gray-900 mb-1">Upload Data</h3>
                <p className="text-xs text-gray-500 mb-3 leading-relaxed">Pilih file yang telah diisi sesuai template (.xlsx, .xls, .csv).</p>
                <div className={`relative border-2 border-dashed rounded-xl p-6 transition-all duration-200 text-center cursor-pointer ${importFile ? 'border-emerald-500 bg-emerald-50/50' : 'border-gray-200 hover:border-emerald-300 hover:bg-gray-50'}`}>
                  <input type="file" accept=".xlsx,.xls,.csv" onChange={(e) => setImportFile(e.target.files[0])} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  <div className="space-y-2 pointer-events-none">
                    <div className={`mx-auto h-12 w-12 rounded-full flex items-center justify-center transition-colors ${importFile ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                      {importFile ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                      )}
                    </div>
                    {importFile ? (
                      <div><p className="text-sm font-bold text-emerald-800">{importFile.name}</p><p className="text-xs text-emerald-600 mt-1">{(importFile.size / 1024).toFixed(1)} KB</p></div>
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
            <button type="submit" className="px-6 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-md shadow-emerald-200 disabled:opacity-50 disabled:shadow-none" disabled={!importFile}>Proses Import</button>
          </div>
        </form>
      </Modal>
    </>
  );

}
