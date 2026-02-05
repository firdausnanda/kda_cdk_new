import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Select from 'react-select';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { debounce } from 'lodash';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import Pagination from '@/Components/Pagination';
import TextInput from '@/Components/TextInput';
import StatusBadge from '@/Components/StatusBadge';
import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';
import LoadingOverlay from '@/Components/LoadingOverlay';
import BulkActionToolbar from '@/Components/BulkActionToolbar';

const MySwal = withReactContent(Swal);

export default function Index({ auth, datas, stats, filters, availableYears }) {
  const { flash } = usePage().props;
  const [selectedIds, setSelectedIds] = useState([]);
  const [params, setParams] = useState({
    year: filters.year || new Date().getFullYear(),
    search: filters.search || '',
    sort: filters.sort || '',
    direction: filters.direction || 'asc',
    per_page: filters.per_page || 10
  });
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Memproses...');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);

  useEffect(() => {
    if (flash?.success) {
      MySwal.fire({ title: 'Berhasil', text: flash.success, icon: 'success', timer: 2000, showConfirmButton: false });
    }
    if (flash?.error) {
      MySwal.fire({ title: 'Gagal', text: flash.error, icon: 'error', confirmButtonText: 'Tutup', confirmButtonColor: '#d33' });
    }
    if (flash?.import_errors) {
      let errorHtml = '<div class="text-left max-h-60 overflow-y-auto text-sm space-y-2">';
      flash.import_errors.forEach(fail => {
        errorHtml += `<div class="p-2 bg-red-50 rounded border border-red-100"><span class="font-bold text-red-700">Baris ${fail.row}:</span> <span class="text-gray-600">${fail.errors.join(', ')}</span></div>`;
      });
      errorHtml += '</div>';
      MySwal.fire({ title: 'Import Gagal Sebagian', html: errorHtml, icon: 'error', confirmButtonText: 'Tutup', confirmButtonColor: '#d33', width: '600px' });
    }
  }, [flash]);

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
  };

  const formatNumber = (num) => new Intl.NumberFormat('id-ID').format(num);

  const handleSearch = useCallback(
    debounce((value) => {
      const newParams = { ...params, search: value };
      setParams(newParams);
      setIsSearching(true);
      router.get(route('nilai-transaksi-ekonomi.index'), newParams, {
        preserveState: true,
        preserveScroll: true,
        onFinish: () => setIsSearching(false)
      });
    }, 500),
    [params]
  );

  const onSearchChange = (e) => {
    const value = e.target.value;
    handleSearch(value);
  };

  const handleYearChange = (option) => {
    const year = option.value;
    const newParams = { ...params, year };
    setParams(newParams);
    router.get(route('nilai-transaksi-ekonomi.index'), newParams, { preserveState: true, preserveScroll: true });
  };

  const yearOptions = availableYears.map(year => ({ value: year, label: `Tahun ${year}` }));

  const handleSort = (field) => {
    let direction = 'asc';
    if (params.sort === field && params.direction === 'asc') {
      direction = 'desc';
    }
    const newParams = { ...params, sort: field, direction };
    setParams(newParams);

    router.get(route('nilai-transaksi-ekonomi.index'), newParams, {
      preserveState: true,
      preserveScroll: true
    });
  };

  const handlePerPageChange = (perPage) => {
    const newParams = { ...params, per_page: perPage };
    setParams(newParams);
    setLoadingText('Memuat Ulang...');
    setIsLoading(true);
    router.get(
      route('nilai-transaksi-ekonomi.index'),
      newParams,
      {
        preserveState: true,
        preserveScroll: true,
        onFinish: () => setIsLoading(false)
      }
    );
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

    let title = '';
    let confirmText = '';
    const routeName = 'nilai-transaksi-ekonomi.bulk-workflow-action';
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

  const handleImportSubmit = (e) => {
    // ... import logic unchanged ...
    e.preventDefault();
    if (!importFile) return;

    setLoadingText('Mengimport Data...');
    setIsLoading(true);
    setShowImportModal(false);

    const formData = new FormData();
    formData.append('file', importFile);

    router.post(route('nilai-transaksi-ekonomi.import'), formData, {
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
        setImportFile(null);
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
        text = "Data yang dihapus tidak dapat dikembalikan!";
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
        icon = 'question';
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

        router.post(route('nilai-transaksi-ekonomi.single-workflow-action', id), data, {
          preserveScroll: true,
          onSuccess: () => {
            if (action === 'delete') {
              MySwal.fire({
                title: 'Terhapus!',
                text: 'Data berhasil dihapus.',
                icon: 'success',
                confirmButtonColor: '#15803d',
                timer: 2000,
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

  const user = auth.user;
  const isAdmin = user.roles.includes('admin') || (Array.isArray(user.roles) && user.roles.some(r => r.name === 'admin'));
  const isKasi = user.roles.includes('kasi') || (Array.isArray(user.roles) && user.roles.some(r => r.name === 'kasi'));
  const isKaCdk = user.roles.includes('kacdk') || (Array.isArray(user.roles) && user.roles.some(r => r.name === 'kacdk'));
  const canCreate = user.permissions?.includes('pemberdayaan.create') || isAdmin;
  const canEdit = user.permissions?.includes('pemberdayaan.edit') || canCreate || isAdmin;
  const canDelete = user.permissions?.includes('pemberdayaan.delete') || isAdmin;
  const canApprove = user.permissions?.includes('pemberdayaan.approve') || isAdmin;

  return (
    <AuthenticatedLayout user={user} header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Nilai Transaksi Ekonomi</h2>}>
      <Head title="Nilai Transaksi Ekonomi" />
      <div className="space-y-6">
        {/* Loading Overlay */}
        <LoadingOverlay isLoading={isLoading} text={loadingText} />

        <div className={`space-y-6 transition-all duration-700 ease-in-out ${isLoading ? 'opacity-30 blur-md grayscale-[0.5] pointer-events-none' : 'opacity-100 blur-0'}`}>
          {/* Header Section */}
          <div className="bg-gradient-to-r from-emerald-800 to-green-700 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-2xl font-bold">Data Nilai Transaksi Ekonomi</h3>
                <p className="mt-1 text-emerald-100 opacity-90 max-w-xl text-sm">Rekapitulasi nilai transaksi ekonomi Kelompok Tani Hutan (KTH).</p>
              </div>
              {canCreate && (
                <div className="flex gap-2">
                  <button
                    onClick={() => window.location.href = route('nilai-transaksi-ekonomi.export', { year: selectedYear })}
                    className="flex items-center gap-2 px-4 py-3 bg-emerald-700 text-emerald-100 rounded-xl font-bold text-sm shadow-sm hover:bg-emerald-800 transition-colors border border-emerald-600/50"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Export
                  </button>
                  <button
                    onClick={() => setShowImportModal(true)}
                    className="flex items-center gap-2 px-4 py-3 bg-emerald-700 text-emerald-100 rounded-xl font-bold text-sm shadow-sm hover:bg-emerald-800 transition-colors border border-emerald-600/50"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Import
                  </button>
                  <Link href={route('nilai-transaksi-ekonomi.create')} className="flex items-center gap-2 px-6 py-3 bg-white text-emerald-700 rounded-xl font-bold text-sm shadow-sm hover:bg-emerald-50 transition-all transform active:scale-95">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    Input Data Baru
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"><p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Laporan (Final)</p><p className="text-2xl font-black text-gray-900 mt-1">{stats.total_transaksi}</p></div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"><p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Nilai Ekonomi</p><p className="text-2xl font-black text-emerald-600 mt-1">{formatRupiah(stats.total_nilai)}</p></div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"><p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Volume</p><p className="text-2xl font-black text-blue-600 mt-1">{formatNumber(stats.total_volume)}</p></div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"><p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Jumlah KTH</p><p className="text-2xl font-black text-orange-600 mt-1">{stats.total_kth}</p></div>
          </div>

          {/* Filters & Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
              <div className="flex flex-wrap items-center gap-4 flex-1">
                <h3 className="font-bold text-gray-800 hidden md:block">Daftar Data Nilai Transaksi</h3>
                <div className="h-6 w-px bg-gray-200 hidden md:block"></div>
                <div className="w-40">
                  <Select
                    options={yearOptions}
                    value={yearOptions.find(opt => opt.value == params.year)}
                    onChange={handleYearChange}
                    className="text-sm font-bold"
                    placeholder="Pilih Tahun"
                    styles={{
                      control: (base) => ({
                        ...base,
                        borderRadius: '0.75rem',
                        borderColor: '#e5e7eb',
                        backgroundColor: '#f9fafb',
                        minHeight: '42px',
                        boxShadow: 'none',
                        '&:hover': {
                          borderColor: '#10b981'
                        }
                      }),
                      singleValue: (base) => ({
                        ...base,
                        color: '#374151',
                        fontWeight: 'bold'
                      }),
                      menu: (base) => ({
                        ...base,
                        borderRadius: '0.75rem',
                        zIndex: 50
                      })
                    }}
                  />
                </div>
                <div className="w-full md:w-64 relative">
                  <TextInput className="w-full text-sm pl-10 bg-gray-50 border-gray-200 focus:bg-white transition-colors rounded-xl" placeholder="Cari KTH, Komoditas..." value={params.search} onChange={onSearchChange} />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z" />
                    </svg>
                  </div>
                  {isSearching && <div className="absolute right-3 top-1/2 -translate-y-1/2"><svg className="animate-spin h-4 w-4 text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg></div>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-400 uppercase">Baris:</span>
                <select
                  className="text-sm font-bold border-gray-200 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 py-1"
                  value={params.per_page || 10}
                  onChange={(e) => handlePerPageChange(e.target.value)}
                >
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
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
                    <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors group" onClick={() => handleSort('month')}>
                      <div className="flex items-center gap-1">
                        Bulan / Tahun
                        <SortIcon field="month" />
                      </div>
                    </th>
                    <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors group" onClick={() => handleSort('nama_kth')}>
                      <div className="flex items-center gap-1">
                        KTH / Lokasi
                        <SortIcon field="nama_kth" />
                      </div>
                    </th>
                    <th className="px-6 py-4">Detail Transaksi</th>
                    <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors group" onClick={() => handleSort('user')}>
                      <div className="flex items-center gap-1">
                        Input Oleh
                        <SortIcon field="user" />
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
                        <div className="font-bold text-gray-900">{item.nama_kth}</div>
                        <div className="text-xs text-emerald-600 font-bold uppercase tracking-tighter">
                          {item.village_name || item.village_rel?.name}, {item.district_name || item.district_rel?.name}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-2">
                          <div className="flex flex-col gap-1">
                            {item.details && item.details.map((d, idx) => (
                              <div key={idx} className="flex items-center justify-between text-xs border-b border-gray-50 pb-1 last:border-0 last:pb-0">
                                <span className="font-bold text-gray-600">{d.commodity?.name}</span>
                                <span className="text-gray-400 font-mono">{formatNumber(d.volume_produksi)} <span className="text-[10px]">{d.satuan}</span></span>
                              </div>
                            ))}
                          </div>
                          <div className="pt-2 border-t border-gray-100 flex justify-between items-center">
                            <span className="text-[10px] font-bold text-gray-400 uppercase">Total:</span>
                            <span className="text-emerald-700 font-bold text-sm leading-tight">
                              {formatRupiah(item.total_nilai_transaksi)}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500 border border-slate-200 shrink-0">
                            {item.creator?.name?.substring(0, 2).toUpperCase() || '??'}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold text-gray-900 truncate leading-none" title={item.creator?.name}>
                              {item.creator?.name ? (item.creator.name.length > 15 ? item.creator.name.substring(0, 15) + '...' : item.creator.name) : 'Unknown'}
                            </span>
                            <span className="text-[10px] text-gray-400 font-medium mt-1 uppercase tracking-tight">{new Date(item.created_at).toLocaleDateString('id-ID')}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <StatusBadge status={item.status} />
                          {item.status === 'rejected' && item.rejection_note && (
                            <div className="text-[10px] text-rose-600 font-medium italic mt-1 max-w-[150px] leading-tight" title={item.rejection_note}>
                              "{item.rejection_note.length > 50 ? item.rejection_note.substring(0, 50) + '...' : item.rejection_note}"
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
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

                          {((canEdit && (item.status === 'draft' || item.status === 'rejected')) || isAdmin) && (
                            <>
                              <Link
                                href={route('nilai-transaksi-ekonomi.edit', item.id)}
                                className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors shadow-sm bg-emerald-50"
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
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="p-6 space-y-8">
            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">1</div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-gray-900 mb-1">Unduh Template</h3>
                <p className="text-xs text-gray-500 mb-3 leading-relaxed">Gunakan template yang telah disediakan untuk memastikan format data sesuai.</p>
                <button type="button" onClick={() => window.location.href = route('nilai-transaksi-ekonomi.template')} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
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
    </AuthenticatedLayout>
  );
}
