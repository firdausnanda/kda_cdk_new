import { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { debounce } from 'lodash';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import StatusBadge from '@/Components/StatusBadge';
import { router } from '@inertiajs/react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import Pagination from '@/Components/Pagination';
import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';
import LoadingOverlay from '@/Components/LoadingOverlay';
import BulkActionToolbar from '@/Components/BulkActionToolbar';

const MySwal = withReactContent(Swal);

export default function Index({ auth, datas, stats, filters = {} }) {
  const { flash } = usePage().props;
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Memproses...');
  const formatNumber = (num) => new Intl.NumberFormat('id-ID').format(num);

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
      route('skps.index'),
      {
        search: searchTerm,
        sort: field,
        direction: newDirection,
        per_page: filters.per_page
      },
      {
        preserveState: true,
        preserveScroll: true,
        replace: true
      }
    );
  };



  const handlePerPageChange = (perPage) => {
    setLoadingText('Memuat Ulang...');
    setIsLoading(true);
    router.get(
      route('skps.index'),
      {
        search: searchTerm,
        sort: filters.sort,
        direction: filters.direction,
        per_page: perPage
      },
      {
        preserveState: true,
        preserveScroll: true,
        replace: true,
        onFinish: () => setIsLoading(false)
      }
    );
  };

  const handleBulkAction = (action) => {
    if (selectedIds.length === 0) return;

    let title = '';
    let confirmText = '';
    const routeName = 'skps.bulk-workflow-action';
    let color = '#3085d6';
    let showInput = false;

    switch (action) {
      case 'delete':
        title = 'Hapus Data Terpilih?';
        confirmText = 'Ya, Hapus!';
        color = '#d33';
        break;
      case 'submit':
        title = 'Ajukan Data Terpilih?';
        confirmText = 'Ya, Ajukan!';
        color = '#15803d';
        break;
      case 'approve':
        title = 'Setujui Data Terpilih?';
        confirmText = 'Ya, Setujui!';
        color = '#15803d';
        break;
      case 'reject':
        title = 'Tolak Data Terpilih?';
        confirmText = 'Ya, Tolak!';
        color = '#d33';
        showInput = true;
        break;
      default:
        return;
    }

    MySwal.fire({
      title: title,
      text: showInput ? 'Berikan alasan penolakan:' : `${selectedIds.length} data terpilih akan diproses.`,
      icon: 'warning',
      input: showInput ? 'textarea' : undefined,
      inputPlaceholder: showInput ? 'Tuliskan catatan penolakan di sini...' : undefined,
      inputValidator: showInput ? (value) => {
        if (!value) {
          return 'Alasan penolakan harus diisi!'
        }
      } : undefined,
      showCancelButton: true,
      confirmButtonColor: color,
      confirmButtonText: confirmText,
      cancelButtonText: 'Batal',
      borderRadius: '1.25rem',
    }).then((result) => {
      if (result.isConfirmed) {
        setLoadingText('Memproses Aksi Massal...');
        setIsLoading(true);
        router.post(route(routeName), {
          ids: selectedIds,
          action: action,
          rejection_note: showInput ? result.value : undefined
        }, {
          preserveScroll: true,
          onSuccess: () => {
            setSelectedIds([]);
          },
          onError: (errors) => {
            MySwal.fire({
              title: 'Gagal!',
              text: errors?.message || 'Terjadi kesalahan saat memproses aksi massal.',
              icon: 'error',
              confirmButtonColor: '#d33',
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

  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);

  useEffect(() => {
    if (flash?.success) {
      MySwal.fire({ title: 'Berhasil', text: flash.success, icon: 'success', timer: 2000, showConfirmButton: false });
    }
    if (flash?.error) {
      MySwal.fire({ title: 'Gagal', text: flash.error, icon: 'error', confirmButtonColor: '#d33' });
    }
    if (flash?.import_errors) {
      const errorList = flash.import_errors.map(f => `Baris ${f.row}: ${Array.isArray(f.errors) ? f.errors.join(', ') : f.errors}`).join('<br>');
      MySwal.fire({ title: 'Import Gagal', html: `<div class="text-left text-sm">${errorList}</div>`, icon: 'error', confirmButtonColor: '#dc2626' });
    }
  }, [flash]);

  const handleImportSubmit = (e) => {
    e.preventDefault();
    if (!importFile) return;
    setLoadingText('Mengimport Data...');
    setIsLoading(true);
    setShowImportModal(false);
    router.post(route('skps.import'), { file: importFile }, {
      forceFormData: true,
      onFinish: () => { setIsLoading(false); setImportFile(null); }
    });
  };

  const handleSearch = useCallback(
    debounce((value) => {
      router.get(
        route('skps.index'),
        {
          search: value,
          sort: filters.sort,
          direction: filters.direction,
          per_page: filters.per_page
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
    [filters.per_page]
  );

  const onSearchChange = (e) => {
    setSearchTerm(e.target.value);
    handleSearch(e.target.value);
  };

  const user = auth.user;
  const userPermissions = user.permissions || [];
  const isAdmin = user.roles.includes('admin') || (Array.isArray(user.roles) && user.roles.some(r => r.name === 'admin'));
  const isKasi = user.roles.includes('kasi') || (Array.isArray(user.roles) && user.roles.some(r => r.name === 'kasi'));
  const isKaCdk = user.roles.includes('kacdk') || (Array.isArray(user.roles) && user.roles.some(r => r.name === 'kacdk'));

  const canCreate = userPermissions.includes('pemberdayaan.create') || isAdmin;
  const canEdit = userPermissions.includes('pemberdayaan.edit') || isAdmin;
  const canDelete = userPermissions.includes('pemberdayaan.delete') || isAdmin;
  const canApprove = userPermissions.includes('pemberdayaan.approve') || isAdmin;
  const canReject = userPermissions.includes('pemberdayaan.approve') || isAdmin;
  const canSubmit = userPermissions.includes('pemberdayaan.edit') || isAdmin;


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
        router.delete(route('skps.destroy', id), {
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
        router.post(route('skps.submit', id), {}, {
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
        router.post(route('skps.approve', id), {}, {
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
        router.post(route('skps.reject', id), {
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
        header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Perkembangan SK PS</h2>}
      >
        <Head title="Perkembangan SK PS" />

        {/* Fixed Loading Overlay */}
        <LoadingOverlay isLoading={isLoading} text={loadingText} />

        <div className={`space-y-6 transition-all duration-700 ease-in-out ${isLoading ? 'opacity-30 blur-md grayscale-[0.5] pointer-events-none' : 'opacity-100 blur-0'}`}>
          {/* Modern Header Section */}
          <div className="bg-gradient-to-r from-primary-800 to-primary-600 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
            <div className="absolute right-0 top-0 h-full w-1/3 bg-white/5 transform skew-x-12 shrink-0"></div>
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-2xl font-bold font-display">Data Perkembangan SK PS</h3>
                <p className="mt-1 text-primary-100 opacity-90 max-w-xl text-sm">
                  Kelola dan pantau data SK Perhutanan Sosial di wilayah CDK Trenggalek.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => window.location.href = route('skps.export')}
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
                {canCreate && (
                  <Link href={route('skps.create')} className="shrink-0">
                    <button className="flex items-center gap-2 px-5 py-2.5 bg-white text-primary-700 rounded-xl font-bold text-sm shadow-sm hover:bg-primary-50 transition-colors">
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
              <div className="relative w-full group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-20">
                  <svg className="h-5 w-5 text-primary-100 group-focus-within:text-white transition-colors" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  className="w-full pl-11 pr-10 py-3 bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-primary-100/70 focus:ring-2 focus:ring-white/30 focus:border-white/30 rounded-xl shadow-sm transition-all hover:bg-white/20 outline-none"
                  placeholder="Cari Lokasi/Skema..."
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

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {stats.map((stat, index) => {
              // Helper to get styling based on scheme name
              const getSchemeStyle = (name) => {
                const lower = name.toLowerCase();
                if (lower.includes('desa') || lower.includes('hd')) return { bg: 'bg-emerald-50', text: 'text-emerald-700', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', border: 'border-emerald-100' };
                if (lower.includes('kemasyarakatan') || lower.includes('hkm')) return { bg: 'bg-blue-50', text: 'text-blue-700', iconBg: 'bg-blue-100', iconColor: 'text-blue-600', border: 'border-blue-100' };
                if (lower.includes('tanaman') || lower.includes('htr')) return { bg: 'bg-amber-50', text: 'text-amber-700', iconBg: 'bg-amber-100', iconColor: 'text-amber-600', border: 'border-amber-100' };
                if (lower.includes('kemitraan') || lower.includes('kulin')) return { bg: 'bg-indigo-50', text: 'text-indigo-700', iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600', border: 'border-indigo-100' };
                if (lower.includes('iphps')) return { bg: 'bg-purple-50', text: 'text-purple-700', iconBg: 'bg-purple-100', iconColor: 'text-purple-600', border: 'border-purple-100' };
                return { bg: 'bg-gray-50', text: 'text-gray-700', iconBg: 'bg-gray-100', iconColor: 'text-gray-600', border: 'border-gray-100' };
              };

              const style = getSchemeStyle(stat.name);

              return (
                <div key={index} className={`relative overflow-hidden rounded-xl p-4 border transition-all duration-300 hover:shadow-md group ${style.bg} ${style.border}`}>
                  <div className="absolute top-0 right-0 -mr-3 -mt-3 w-16 h-16 rounded-full bg-white opacity-20 group-hover:scale-110 transition-transform duration-500"></div>

                  <div className="relative z-10 flex flex-col h-full justify-between gap-3">
                    <div className="flex items-center justify-between">
                      <div className={`p-2 rounded-lg ${style.iconBg} ${style.iconColor} shadow-sm`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="flex items-center gap-1 bg-white/60 backdrop-blur-sm px-1.5 py-0.5 rounded-md">
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${style.text}`}>Total</span>
                      </div>
                    </div>

                    <div>
                      <p className={`text-2xl font-black ${style.text} tracking-tight leading-none mb-1`}>
                        {formatNumber(stat.total)}
                      </p>
                      <p className={`text-[10px] font-bold ${style.iconColor} opacity-90 uppercase tracking-wide leading-tight`} title={stat.name}>
                        {stat.name}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Table Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between gap-4">
              <h3 className="font-bold text-gray-800">Daftar Data SKPS</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-400 uppercase">Baris:</span>
                <select
                  className="text-sm font-bold border-gray-200 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 py-1"
                  value={filters.per_page || 10}
                  onChange={(e) => handlePerPageChange(e.target.value)}
                >
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
              </div>
            </div>
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-sm text-gray-500 min-w-[1000px]">
                <thead className="bg-gray-50/50 text-gray-700 uppercase tracking-wider text-[11px] font-bold">
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
                      className="px-6 py-4 w-[200px] cursor-pointer hover:bg-gray-100 transition-colors group"
                      onClick={() => handleSort('location')}
                    >
                      <div className="flex items-center gap-1">
                        Lokasi
                        <SortIcon field="location" />
                      </div>
                    </th>
                    <th
                      className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors group"
                      onClick={() => handleSort('group_name')}
                    >
                      <div className="flex items-center gap-1">
                        Nama Kelompok
                        <SortIcon field="group_name" />
                      </div>
                    </th>
                    <th
                      className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors group"
                      onClick={() => handleSort('skema')}
                    >
                      <div className="flex items-center gap-1">
                        Skema & Luas
                        <SortIcon field="skema" />
                      </div>
                    </th>
                    <th
                      className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors group"
                      onClick={() => handleSort('potential')}
                    >
                      <div className="flex items-center gap-1">
                        Potensi & KK
                        <SortIcon field="potential" />
                      </div>
                    </th>
                    <th className="px-6 py-4">Input Oleh</th>
                    <th
                      className="px-6 py-4 text-center cursor-pointer hover:bg-gray-100 transition-colors group"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        Status
                        <SortIcon field="status" />
                      </div>
                    </th>
                    <th className="px-6 py-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {datas.data.length > 0 ? (
                    datas.data.map((item) => (
                      <tr key={item.id} className={`hover:bg-primary-50/30 transition-colors group ${selectedIds.includes(item.id) ? 'bg-primary-50/50' : ''}`}>
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 text-emerald-600 shadow-sm focus:ring-emerald-500"
                            onChange={() => handleSelect(item.id)}
                            checked={selectedIds.includes(item.id)}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-800">{item.district?.name || 'Kecamatan N/A'}</div>
                          <div className="text-xs text-primary-600 font-bold uppercase tracking-tighter">
                            {item.regency?.name || 'Kabupaten N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-900">{item.nama_kelompok || '-'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-900">{item.skema?.name}</div>
                          <div className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-1">
                            Luas: {item.ps_area} Ha
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-700">{item.potential}</div>
                          <div className="text-xs text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-full inline-block mt-1">
                            {item.number_of_kk} KK
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500 border border-slate-200 shrink-0">
                              {item.creator?.name?.substring(0, 2).toUpperCase() || '??'}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-bold text-gray-900 truncate leading-none" title={item.creator?.name || ''}>
                                {item.creator?.name ? (item.creator.name.length > 20 ? item.creator.name.substring(0, 20) + '...' : item.creator.name) : 'Unknown'}
                              </span>
                              <span className="text-[10px] text-gray-400 font-medium mt-1 uppercase tracking-tight">{new Date(item.created_at).toLocaleDateString('id-ID')}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <StatusBadge status={item.status} />
                          {item.status === 'rejected' && item.rejection_note && (
                            <div className="text-xs text-red-500 mt-1 italic max-w-[150px] truncate mx-auto" title={item.rejection_note}>
                              "{item.rejection_note}"
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center gap-2">
                            {/* Submit Button for Operators */}
                            {/* Submit Button */}
                            {(canSubmit && (item.status === 'draft' || item.status === 'rejected')) && (
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
                                  href={route('skps.edit', item.id)}
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
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="text-center py-12">
                        <div className="flex flex-col items-center">
                          <div className="p-4 bg-gray-50 rounded-full mb-3 text-gray-300">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                          </div>
                          <p className="text-gray-400 font-medium tracking-tight whitespace-nowrap">Belum ada data SKPS tersedia</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* Pagination & Info */}
            <div className="px-6 py-4 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
              <Pagination links={datas.links} />
              {datas.total > 0 && (
                <div className="text-sm text-gray-500 text-center md:text-right">
                  Menampilkan <span className="font-bold text-gray-900">{datas.from}</span> sampai <span className="font-bold text-gray-900">{datas.to}</span> dari <span className="font-bold text-gray-900">{datas.total}</span> data
                </div>
              )}
            </div>
          </div>
        </div>
      </AuthenticatedLayout>

      <BulkActionToolbar
        selectedIds={selectedIds}
        setSelectedIds={setSelectedIds}
        handleBulkAction={handleBulkAction}
        canEdit={canEdit}
        canApprove={canApprove}
        canDelete={canDelete}
        isAdmin={isAdmin}
      />

      {/* Import Modal */}
      <Modal show={showImportModal} onClose={() => setShowImportModal(false)}>
        <form onSubmit={handleImportSubmit} className="p-0 overflow-hidden">
          <div className="p-6 bg-slate-50 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Import Data Perkembangan SK PS</h2>
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
                <button type="button" onClick={() => window.location.href = route('skps.template')} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
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
