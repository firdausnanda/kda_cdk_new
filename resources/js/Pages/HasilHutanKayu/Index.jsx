import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { debounce } from 'lodash';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import StatusBadge from '@/Components/StatusBadge';
import { router } from '@inertiajs/react';
import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import Pagination from '@/Components/Pagination';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import LoadingOverlay from '@/Components/LoadingOverlay';
import BulkActionToolbar from '@/Components/BulkActionToolbar';

const MySwal = withReactContent(Swal);

export default function Index({ auth, datas, forest_type, filters, stats, available_years }) {
  const { flash, errors } = usePage().props;
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Memproses...');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
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
      route('hasil-hutan-kayu.index'),
      {
        forest_type,
        year: filters.year, // Use filters.year to maintain consistency
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
      route('hasil-hutan-kayu.index'),
      {
        forest_type,
        search: searchTerm,
        year: filters.year,
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
    const routeName = 'hasil-hutan-kayu.bulk-workflow-action';
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
      <div className="w-4 h-4 ml-1 text-primary-600">
        {filters.direction === 'asc' ? (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
        )}
      </div>
    );
  };

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
        errorHtml += `
           <div class="p-2 bg-red-50 rounded border border-red-100">
             <span class="font-bold text-red-700">Baris ${fail.row}:</span> 
             <span class="text-gray-600">${fail.errors.join(', ')}</span>
           </div>`;
      });
      errorHtml += '</div>';

      MySwal.fire({
        title: 'Import Gagal Sebagian',
        html: errorHtml,
        icon: 'error',
        confirmButtonText: 'Tutup',
        confirmButtonColor: '#d33',
        width: '600px'
      });
    }

    if (flash?.success) {
      MySwal.fire({
        title: 'Berhasil',
        text: flash.success,
        icon: 'success',
        container: 'my-swal',
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
  }, [flash, errors]); // Listen for flash changes

  // Year filter logic
  const [year, setYear] = useState(filters.year || new Date().getFullYear());
  // Use available_years from prop, fallback to current year if undefined
  const yearOptions = available_years?.length > 0 ? available_years : [new Date().getFullYear()];

  const handleYearChange = (e) => {
    const selectedYear = e.target.value;
    setYear(selectedYear);
    router.get(route('hasil-hutan-kayu.index'), {
      forest_type,
      year: selectedYear,
      search: searchTerm,
      sort: filters.sort,
      direction: filters.direction,
      per_page: filters.per_page
    }, {
      preserveState: true,
      preserveScroll: true,
    });
  };

  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = useCallback(
    debounce((value) => {
      router.get(
        route('hasil-hutan-kayu.index'),
        {
          forest_type,
          year: filters.year,
          search: value,
          sort: filters.sort,
          direction: filters.direction,
          per_page: filters.per_page
        },
        {
          preserveState: true,
          onStart: () => setIsSearching(true),
          onFinish: () => setIsSearching(false),
          replace: true,
          preserveScroll: true
        }
      );
    }, 500),
    [forest_type, filters.year, filters.per_page]
  );

  const onSearchChange = (e) => {
    setSearchTerm(e.target.value);
    handleSearch(e.target.value);
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

        router.post(route('hasil-hutan-kayu.single-workflow-action', id), data, {
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

  const handleExport = () => {
    window.location.href = route('hasil-hutan-kayu.export', { forest_type, year });
  };

  const handleImportSubmit = (e) => {
    e.preventDefault();
    if (!importFile) return;

    const formData = new FormData();
    formData.append('file', importFile);
    formData.append('forest_type', forest_type);

    setLoadingText('Mengimport Data...');
    setIsLoading(true);
    setShowImportModal(false);

    router.post(route('hasil-hutan-kayu.import'), formData, {
      onFinish: () => {
        setIsLoading(false);
        setImportFile(null);
      },
      onError: () => setIsLoading(false),
      forceFormData: true,
      preserveScroll: true,
    });
  };

  // Determine header color based on forest type or default
  const getHeaderColor = () => {
    // You can customize this map
    return 'from-emerald-800 to-emerald-600';
  };

  return (
    <AuthenticatedLayout
      user={auth.user}
      header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Produksi dari {forest_type} - Hasil Hutan Kayu</h2>}
    >
      <Head title={`Produksi dari ${forest_type} - Hasil Hutan Kayu`} />

      {/* Fixed Loading Overlay */}
      <LoadingOverlay isLoading={isLoading} text={loadingText} />

      <div className={`space-y-6 transition-all duration-700 ease-in-out ${isLoading ? 'opacity-30 blur-md grayscale-[0.5] pointer-events-none' : 'opacity-100 blur-0'}`}>
        {/* Modern Header Section */}
        <div className={`bg-gradient-to-r ${getHeaderColor()} rounded-2xl p-8 text-white shadow-lg relative overflow-hidden`}>
          <div className="absolute right-0 top-0 h-full w-1/3 bg-white/5 transform skew-x-12 shrink-0"></div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-2xl font-bold font-display">Produksi dari {forest_type}</h3>
              <p className="mt-1 text-emerald-100 opacity-90 max-w-xl text-sm">
                Kelola data hasil hutan kayu dari kategori {forest_type}.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleExport}
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
                <Link href={route('hasil-hutan-kayu.create', { forest_type })} className="shrink-0">
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

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Laporan {filters.year}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{formatNumber(stats.total_count)} <span className="text-xs font-normal text-gray-400">Unit</span></p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg text-blue-600 shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Volume Target</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{formatNumber(stats.total_volume)} <span className="text-xs font-normal text-gray-400">m³</span></p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg text-gray-600 shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Volume Realisasi</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{formatNumber(stats.total_volume_realization)} <span className="text-xs font-normal text-gray-400">m³</span></p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600 shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Terverifikasi</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">
                  {formatNumber(stats.verified_count)} <span className="text-xs font-normal text-gray-400">Laporan</span>
                </p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg text-purple-600 shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div className="flex items-center gap-4 flex-1">
              <h3 className="font-bold text-gray-800">Daftar Laporan</h3>
              <div className="h-6 w-px bg-gray-200"></div>
              <div className="h-6 w-px bg-gray-200"></div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-500">Tahun:</span>
                <select
                  value={year}
                  onChange={handleYearChange}
                  className="text-sm border-gray-200 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 py-1.5 pl-3 pr-8 font-semibold text-gray-700 bg-gray-50 hover:bg-white transition-colors cursor-pointer"
                >
                  {yearOptions.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <div className="max-w-xs w-full ml-auto md:ml-4 relative">
                <TextInput
                  type="text"
                  className="w-full text-sm pr-10"
                  placeholder="Cari Kayu/Pengelola..."
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
          <div className="overflow-x-auto">
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
                    className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors group"
                    onClick={() => handleSort('month')}
                  >
                    <div className="flex items-center gap-1">
                      Periode
                      <SortIcon field="month" />
                    </div>
                  </th>
                  <th className="px-6 py-4">Identitas</th>
                  <th
                    className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors group"
                    onClick={() => handleSort('kayu')}
                  >
                    <div className="flex items-center gap-1">
                      Jenis Kayu
                      <SortIcon field="kayu" />
                    </div>
                  </th>
                  <th className="px-6 py-4 text-center">Volume (Target / Realisasi)</th>
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
                {datas.data.map((item) => (
                  <tr key={item.id} className={`hover:bg-emerald-50/30 transition-colors group ${selectedIds.includes(item.id) ? 'bg-emerald-50/50' : ''}`}>
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-emerald-600 shadow-sm focus:ring-emerald-500"
                        onChange={() => handleSelect(item.id)}
                        checked={selectedIds.includes(item.id)}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">{new Date(0, item.month - 1).toLocaleString('id-ID', { month: 'long' })} {item.year}</div>
                      <div className="text-xs text-gray-400 font-semibold">Tgl. Input: {new Date(item.created_at).toLocaleDateString('id-ID')}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        {forest_type === 'Hutan Negara' && (
                          <div className="font-bold text-gray-900 leading-tight mb-0.5">{item.pengelola_hutan?.name || '-'}</div>
                        )}
                        {forest_type === 'Hutan Rakyat' && (
                          <div className="font-bold text-gray-900 leading-tight mb-0.5">{item.district?.name || 'Kecamatan N/A'}</div>
                        )}
                        {forest_type === 'Perhutanan Sosial' && (
                          <div className="font-bold text-gray-900 leading-tight mb-0.5">{item.pengelola_wisata?.name || '-'}</div>
                        )}
                        <div className="text-[10px] text-emerald-600 font-black uppercase tracking-widest flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {item.regency?.name || 'Kabupaten N/A'}
                        </div>

                        <div className="flex items-center gap-1.5 mt-2 bg-slate-50 px-2 py-1 rounded-lg w-fit border border-slate-100/50 group-hover:bg-white group-hover:border-emerald-100 transition-colors">
                          <div className="h-4 w-4 rounded-full bg-emerald-100 flex items-center justify-center text-[7px] font-black text-emerald-700 border border-emerald-200 shrink-0">
                            {item.creator?.name ? item.creator.name.substring(0, 2).toUpperCase() : '??'}
                          </div>
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tight truncate max-w-[100px]" title={item.creator?.name || ''}>
                            {item.creator?.name || 'Unknown'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-800">
                        {item.details && item.details.filter(d => parseFloat(d.volume_realization || 0) > 0).length > 0 ? (
                          <div className="flex flex-col gap-1">
                            {item.details.filter(d => parseFloat(d.volume_realization || 0) > 0).map((detail, idx) => (
                              <span key={idx} className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-100 w-fit">
                                {detail.kayu?.name}
                              </span>
                            ))}
                          </div>
                        ) : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-center text-xs border-b border-gray-100 pb-1">
                          <span className="text-gray-400">Target:</span>
                          <span className="font-bold text-gray-900">
                            {parseFloat(item.volume_target || 0).toLocaleString('id-ID', { maximumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-400">Realisasi:</span>
                          <span className="font-bold text-emerald-700">
                            {item.details?.reduce((acc, curr) => acc + parseFloat(curr.volume_realization || 0), 0).toLocaleString('id-ID', { maximumFractionDigits: 2 })}
                          </span>
                        </div>
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
                      <div className="flex justify-center gap-2">
                        {/* Submit Button */}
                        {(canEdit && (item.status === 'draft' || item.status === 'rejected')) && (
                          <button
                            onClick={() => handleSingleAction(item.id, 'submit')}
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
                              onClick={() => handleSingleAction(item.id, 'approve')}
                              className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors shadow-sm bg-emerald-50"
                              title="Setujui Laporan"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleSingleAction(item.id, 'reject')}
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
                              onClick={() => handleSingleAction(item.id, 'approve')}
                              className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors shadow-sm bg-emerald-50"
                              title="Setujui Laporan"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleSingleAction(item.id, 'reject')}
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
                              href={route('hasil-hutan-kayu.edit', item.id)}
                              className="p-2 text-primary-600 hover:bg-primary-100 rounded-lg transition-colors shadow-sm bg-primary-50"
                              title="Edit Data"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </Link>
                            {(canDelete || isAdmin) && (
                              <button
                                onClick={() => handleSingleAction(item.id, 'delete')}
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
                    <td colSpan="6" className="text-center py-12">
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

      <BulkActionToolbar
        selectedIds={selectedIds}
        setSelectedIds={setSelectedIds}
        handleBulkAction={handleBulkAction}
        canEdit={canEdit}
        canApprove={canApprove}
        canDelete={canDelete}
        isAdmin={isAdmin}
      />

      <Modal show={showImportModal} onClose={() => setShowImportModal(false)}>
        <form onSubmit={handleImportSubmit} className="p-0 overflow-hidden">
          <div className="p-6 bg-slate-50 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Import Data</h2>
            <button type="button" onClick={() => setShowImportModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-6 space-y-8">
            {/* Step 1: Download Template */}
            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                1
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-gray-900 mb-1">Unduh Template</h3>
                <p className="text-xs text-gray-500 mb-3 leading-relaxed">
                  Gunakan template yang telah disediakan untuk memastikan format data sesuai.
                </p>
                <button
                  type="button"
                  onClick={() => window.location.href = route('hasil-hutan-kayu.template', { forest_type })}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors"
                >
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
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-sm">
                2
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-gray-900 mb-1">Upload Data</h3>
                <p className="text-xs text-gray-500 mb-3 leading-relaxed">
                  Pilih file yang telah diisi sesuai template (.xlsx, .xls, .csv).
                </p>

                <div className={`relative border-2 border-dashed rounded-xl p-6 transition-all duration-200 text-center cursor-pointer ${importFile ? 'border-emerald-500 bg-emerald-50/50' : 'border-gray-200 hover:border-emerald-300 hover:bg-gray-50'}`}>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={(e) => setImportFile(e.target.files[0])}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    id="file-upload"
                  />

                  <div className="space-y-2 pointer-events-none">
                    <div className={`mx-auto h-12 w-12 rounded-full flex items-center justify-center transition-colors ${importFile ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
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
                        <p className="text-sm font-bold text-emerald-800">{importFile.name}</p>
                        <p className="text-xs text-emerald-600 mt-1">{(importFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                    ) : (
                      <p className="text-sm font-medium text-gray-500">
                        Klik untuk pilih file atau drag & drop
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
            <SecondaryButton onClick={() => setShowImportModal(false)}>
              Batal
            </SecondaryButton>
            <button
              type="submit"
              className="px-6 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-md shadow-emerald-200 disabled:opacity-50 disabled:shadow-none"
              disabled={!importFile}
            >
              Proses Import
            </button>
          </div>
        </form>
      </Modal>
    </AuthenticatedLayout>
  );
}
