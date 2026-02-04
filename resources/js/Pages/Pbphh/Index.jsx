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
import StatusBadge from '@/Components/StatusBadge';
import LoadingOverlay from '@/Components/LoadingOverlay';
import BulkActionToolbar from '@/Components/BulkActionToolbar';
import TextInput from '@/Components/TextInput';

const SortIcon = ({ field }) => {
  const currentSort = new URLSearchParams(window.location.search).get('sort');
  const currentDirection = new URLSearchParams(window.location.search).get('direction');
  return (
    <span className="flex flex-col ml-1">
      <svg className={`w-2 h-2 ${currentSort === field && currentDirection === 'asc' ? 'text-gray-800' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
      <svg className={`w-2 h-2 ${currentSort === field && currentDirection === 'desc' ? 'text-gray-800' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
    </span>
  );
};

export default function Index({ auth, datas, stats, filters = {} }) {
  // Use filters prop safely with default empty object
  const currentFilters = filters || {};
  const { flash, errors } = usePage().props;

  const isAdmin = auth.user.roles.includes('admin');
  const isKasi = auth.user.roles.includes('kasi');
  const isKaCdk = auth.user.roles.includes('kacdk');
  const userPermissions = auth.user.permissions || [];

  const canCreate = userPermissions.includes('bina-usaha.create') || isAdmin;
  const canEdit = userPermissions.includes('bina-usaha.edit') || isAdmin;
  const canDelete = userPermissions.includes('bina-usaha.delete') || isAdmin;
  const canApprove = userPermissions.includes('bina-usaha.approve') || isAdmin;

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

    if (Object.keys(errors).length > 0) {
      let errorHtml = '<div class="text-left text-sm space-y-1">';
      Object.keys(errors).forEach(key => {
        errorHtml += `<div class="text-red-600 font-medium">• ${errors[key]}</div>`;
      });
      errorHtml += '</div>';
      MySwal.fire({ title: 'Terjadi Kesalahan', html: errorHtml, icon: 'error', confirmButtonText: 'Tutup', confirmButtonColor: '#d33' });
    }
  }, [flash, errors]);

  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Memproses...');

  /* Selection State */
  const [selectedIds, setSelectedIds] = useState([]);

  /* Handlers */
  const debouncedSearch = useCallback(
    debounce((query) => {
      router.get(
        route('pbphh.index'),
        {
          search: query,
          sort: currentFilters.sort,
          direction: currentFilters.direction
        },
        {
          preserveState: true,
          preserveScroll: true,
          replace: true,
          onFinish: () => setIsSearching(false)
        }
      );
    }, 500),
    [currentFilters]
  );

  const onSearchChange = (e) => {
    const query = e.target.value;
    setSearchTerm(query);
    setIsSearching(true);
    debouncedSearch(query);
  };
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
    const currentSort = currentFilters.sort;
    const currentDirection = currentFilters.direction;

    let newDirection = 'asc';
    if (currentSort === field && currentDirection === 'asc') {
      newDirection = 'desc';
    }

    router.get(
      route('pbphh.index'),
      {
        search: searchTerm,
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
    const routeName = 'pbphh.bulk-workflow-action';
    let confirmText = '';
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
      cancelButtonColor: '#6B7280',
      confirmButtonText: confirmText,
      cancelButtonText: 'Batal',
      customClass: {
        confirmButton: 'rounded-xl font-bold px-6 py-2.5',
        cancelButton: 'rounded-xl font-bold px-6 py-2.5'
      },
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

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoadingText('Mengimport Data...');
    setIsLoading(true);

    const formData = new FormData();
    formData.append('file', file);

    router.post(route('pbphh.import'), formData, {
      forceFormData: true,
      preserveScroll: true,
      onSuccess: () => {
        MySwal.fire({
          title: 'Berhasil!',
          text: 'Data berhasil diimport.',
          icon: 'success',
          confirmButtonColor: '#15803d',
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false,
        });
        setShowImportModal(false);
        setImportFile(null);
      },
      onError: (errors) => {
        MySwal.fire({
          title: 'Gagal!',
          text: errors.file || 'Terjadi kesalahan saat import.',
          icon: 'error',
          confirmButtonColor: '#15803d',
        });
      },
      onFinish: () => {
        setIsLoading(false);
      }
    });
  };

  const handleSingleAction = (id, action) => {
    let title = '';
    let text = '';
    let icon = 'warning';
    let confirmText = '';
    let confirmColor = '#15803d';
    let showInput = false;
    let loadingMsg = '';

    switch (action) {
      case 'delete':
        title = 'Apakah Anda yakin?';
        text = "Data yang dihapus akan tidak bisa dikembalikan!";
        icon = 'warning';
        confirmText = 'Ya, hapus!';
        confirmColor = '#d33';
        loadingMsg = 'Menghapus Data...';
        break;
      case 'submit':
        title = 'Ajukan Laporan?';
        text = "Laporan akan dikirim ke Kasi untuk diverifikasi.";
        icon = 'question';
        confirmText = 'Ya, Ajukan!';
        loadingMsg = 'Mengajukan Laporan...';
        break;
      case 'approve':
        title = 'Setujui Laporan?';
        text = "Apakah Anda yakin ingin menyetujui laporan ini?";
        icon = 'check-circle';
        confirmText = 'Ya, Setujui';
        loadingMsg = 'Memverifikasi...';
        break;
      case 'reject':
        title = 'Tolak Laporan?';
        text = "Berikan alasan penolakan:";
        icon = 'warning';
        confirmText = 'Ya, Tolak';
        confirmColor = '#d33';
        showInput = true;
        loadingMsg = 'Memproses Penolakan...';
        break;
      default:
        return;
    }

    MySwal.fire({
      title: title,
      text: showInput ? text : text,
      icon: icon,
      showCancelButton: true,
      confirmButtonColor: confirmColor,
      confirmButtonText: confirmText,
      cancelButtonText: 'Batal',
      cancelButtonColor: '#6B7280',
      input: showInput ? 'textarea' : undefined,
      inputPlaceholder: showInput ? 'Tuliskan catatan penolakan di sini...' : undefined,
      inputValidator: showInput ? (value) => {
        if (!value) {
          return 'Alasan penolakan harus diisi!'
        }
      } : undefined,
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
        setLoadingText(loadingMsg);
        setIsLoading(true);

        const data = {
          action: action
        };
        if (showInput) {
          data.rejection_note = result.value;
        }

        router.post(route('pbphh.single-workflow-action', id), data, {
          preserveScroll: true,
          onSuccess: () => {
            if (action === 'delete') {
              MySwal.fire({
                title: 'Terhapus!',
                text: 'Data laporan telah berhasil dihapus.',
                icon: 'success',
                confirmButtonColor: '#15803d',
                timer: 2000,
                timerProgressBar: true,
                showConfirmButton: false,
              });
            }
            setIsLoading(false);
          },
          onError: () => setIsLoading(false),
          onFinish: () => setIsLoading(false)
        });
      }
    });
  };

  const handleImportSubmit = (e) => {
    e.preventDefault();
    if (!importFile) return;

    setLoadingText('Mengimport Data...');
    setIsLoading(true);

    const formData = new FormData();
    formData.append('file', importFile);

    router.post(route('pbphh.import'), formData, {
      forceFormData: true,
      preserveScroll: true,
      onSuccess: () => {
        MySwal.fire({
          title: 'Berhasil!',
          text: 'Data berhasil diimport.',
          icon: 'success',
          confirmButtonColor: '#15803d',
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false,
        });
        setShowImportModal(false);
        setImportFile(null);
      },
      onError: (errors) => {
        MySwal.fire({
          title: 'Gagal!',
          text: errors.file || 'Terjadi kesalahan saat import.',
          icon: 'error',
          confirmButtonColor: '#15803d',
        });
      },
      onFinish: () => {
        setIsLoading(false);
      }
    });
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

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <>
      <AuthenticatedLayout
        user={auth.user}
        header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">PBPHH</h2>}
      >
        <Head title="PBPHH" />

        {/* Fixed Loading Overlay */}
        <LoadingOverlay isLoading={isLoading} text={loadingText} />

        <div className={`space-y-6 transition-all duration-700 ease-in-out ${isLoading ? 'opacity-30 blur-md grayscale-[0.5] pointer-events-none' : 'opacity-100 blur-0'}`}>

          {/* Header Section */}
          <div className="bg-gradient-to-r from-emerald-800 to-emerald-600 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
            <div className="absolute right-0 top-0 h-full w-1/3 bg-white/5 transform skew-x-12 shrink-0"></div>
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-2xl font-bold font-display">Data PBPHH</h3>
                <p className="mt-1 text-emerald-100 opacity-90 max-w-xl text-sm">
                  Kelola data Penatausahaan Hasil Hutan dan Industri Berizin.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => window.location.href = route('pbphh.export')}
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
                  <Link href={route('pbphh.create')} className="shrink-0">
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
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Industri</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total_count} <span className="text-xs font-normal text-gray-400">Data</span></p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600 shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Terverifikasi</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">{stats.verified_count} <span className="text-xs font-normal text-gray-400">Final</span></p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg text-blue-600 shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Data Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
              <div className="flex items-center gap-4 flex-1">
                <h3 className="font-bold text-gray-800">Daftar Industri</h3>
                <div className="h-6 w-px bg-gray-200"></div>
                <div className="max-w-xs w-full relative">
                  <TextInput
                    type="text"
                    className="w-full text-sm pr-10"
                    placeholder="Cari Nama Industri, Nomor Izin..."
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
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-400 uppercase">Baris:</span>
                <select
                  className="text-sm font-bold border-gray-200 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 py-1"
                  value={currentFilters.per_page || 10}
                  onChange={(e) => {
                    setLoadingText('Memuat Ulang...');
                    setIsLoading(true);
                    router.get(
                      route('pbphh.index'),
                      {
                        search: searchTerm,
                        sort: currentFilters.sort,
                        direction: currentFilters.direction,
                        per_page: e.target.value
                      },
                      {
                        preserveState: true,
                        preserveScroll: true,
                        replace: true,
                        onFinish: () => setIsLoading(false)
                      }
                    );
                  }}
                >
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
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
                      className="px-6 py-4 font-bold tracking-wider cursor-pointer hover:bg-gray-100 transition-colors group"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center gap-1">
                        Identitas Perusahaan
                        <SortIcon field="name" />
                      </div>
                    </th>
                    <th
                      className="px-6 py-4 font-bold tracking-wider cursor-pointer hover:bg-gray-100 transition-colors group text-center"
                      onClick={() => handleSort('investment')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        Kinerja (Investasi / TK)
                        <SortIcon field="investment" />
                      </div>
                    </th>
                    <th
                      className="px-6 py-4 font-bold tracking-wider cursor-pointer hover:bg-gray-100 transition-colors group text-center"
                      onClick={() => handleSort('condition')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        Kondisi
                        <SortIcon field="condition" />
                      </div>
                    </th>
                    <th className="px-6 py-4 font-bold tracking-wider">Jenis Produksi</th>
                    <th
                      className="px-6 py-4 font-bold tracking-wider cursor-pointer hover:bg-gray-100 transition-colors group text-center"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        Status
                        <SortIcon field="status" />
                      </div>
                    </th>
                    <th className="px-6 py-4 font-bold tracking-wider text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {datas.data.length > 0 ? (
                    datas.data.map((item, index) => (
                      <tr key={index} className={`hover:bg-gray-50/50 transition-colors group ${selectedIds.includes(item.id) ? 'bg-emerald-50/50' : ''}`}>
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 text-emerald-600 shadow-sm focus:ring-emerald-500"
                            onChange={() => handleSelect(item.id)}
                            checked={selectedIds.includes(item.id)}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-900">{item.name}</div>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 mt-1 mb-1">
                            {item.number}
                          </span>
                          <div className="flex flex-col text-xs text-gray-500">
                            <span>{item.district?.name || '-'}, {item.regency?.name || '-'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-1.5" title="Nilai Investasi">
                              <div className="p-1 rounded bg-emerald-50 text-emerald-600">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <span className="font-bold text-gray-700 text-xs">{formatCurrency(item.investment_value)}</span>
                            </div>
                            <div className="flex items-center gap-1.5" title="Tenaga Kerja">
                              <div className="p-1 rounded bg-blue-50 text-blue-600">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                              </div>
                              <span className="font-bold text-gray-700 text-xs">{item.number_of_workers} Orang</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {item.present_condition ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                              Beroperasi
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-red-50 text-red-700 border border-red-100">
                              Tidak Beroperasi
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-2">
                            {item.jenis_produksi && item.jenis_produksi.length > 0 ? (
                              item.jenis_produksi.map((jp, idx) => (
                                <div key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-orange-50/50 border border-orange-100/50 hover:bg-orange-50 hover:border-orange-200 transition-colors group/item">
                                  <div className="mt-0.5 p-1 rounded-md bg-orange-100 text-orange-600 group-hover/item:bg-orange-200 transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-xs font-bold text-gray-800 leading-tight">{jp.name}</span>
                                    <div className="flex items-center gap-1 mt-0.5">
                                      <span className="text-[10px] uppercase font-semibold text-orange-600/80 tracking-wide">Kapasitas:</span>
                                      <span className="text-[10px] font-medium text-gray-600 bg-white px-1.5 py-0.5 rounded border border-orange-100">
                                        {jp.pivot?.kapasitas_ijin || '-'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <span className="text-xs text-gray-400 italic">-</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <StatusBadge status={item.status} />
                            {item.status === 'rejected' && item.rejection_note && (
                              <div className="text-[10px] text-rose-600 font-medium italic mt-1 max-w-[150px] leading-tight" title={item.rejection_note}>
                                "{item.rejection_note.length > 50 ? item.rejection_note.substring(0, 50) + '...' : item.rejection_note}"
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {userCanSubmit(item) && (
                              <button
                                onClick={() => handleSingleAction(item.id, 'submit')}
                                className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                                title="Ajukan Laporan"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 9l3 3m0 0l-3 3m3-3H9" />
                                </svg>
                              </button>
                            )}

                            {userCanApprove(item) && (
                              <>
                                <button
                                  onClick={() => handleSingleAction(item.id, 'approve')}
                                  className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors"
                                  title="Setujui"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleSingleAction(item.id, 'reject')}
                                  className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                                  title="Tolak"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </>
                            )}

                            {userCanEdit(item) && (
                              <Link
                                href={route('pbphh.edit', item.id)}
                                className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                                title="Edit"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                              </Link>
                            )}

                            {userCanDelete(item) && (
                              <button
                                onClick={() => handleSingleAction(item.id, 'delete')}
                                className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                                title="Hapus"
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
                      <td colSpan="7" className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                            </svg>
                          </div>
                          <p className="text-gray-900 font-bold mb-1">Tidak ada data ditemukan</p>
                          <p className="text-gray-500 text-sm">Coba sesuaikan filter pencarian atau tambah data baru.</p>
                        </div>
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
            <h2 className="text-lg font-bold text-gray-900">Import Data PBPHH</h2>
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
                <button type="button" onClick={() => window.location.href = route('pbphh.template')} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors">
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
