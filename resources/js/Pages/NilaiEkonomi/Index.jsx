import { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { debounce } from 'lodash';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import Pagination from '@/Components/Pagination';
import TextInput from '@/Components/TextInput';
import StatusBadge from '@/Components/StatusBadge';

const MySwal = withReactContent(Swal);

export default function Index({ auth, data, filters, stats, availableYears }) {
  const { flash } = usePage().props;
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Memproses...');
  const [selectedIds, setSelectedIds] = useState([]);
  const [params, setParams] = useState(filters || {});

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

  const handleSort = (field) => {
    let direction = 'asc';
    if (params.sort === field && params.direction === 'asc') {
      direction = 'desc';
    }
    setParams({ ...params, sort: field, direction });

    router.get(route('nilai-ekonomi.index'), { ...params, sort: field, direction }, {
      preserveState: true,
      preserveScroll: true
    });
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(data.data.map((item) => item.id));
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
      routeName = 'nilai-ekonomi.bulk-delete';
    } else if (action === 'submit') {
      title = 'Submit data terpilih?';
      text = 'Data akan dikirim ke Kasi.';
      routeName = 'nilai-ekonomi.bulk-submit';
    } else if (action === 'approve') {
      title = 'Setujui data terpilih?';
      text = 'Data akan disetujui.';
      routeName = 'nilai-ekonomi.bulk-approve';
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

  useEffect(() => {
    if (flash?.success) {
      MySwal.fire({ title: 'Berhasil', text: flash.success, icon: 'success', timer: 2000, showConfirmButton: false });
    }
    if (flash?.error) {
      MySwal.fire({ title: 'Gagal', text: flash.error, icon: 'error' });
    }
  }, [flash]);

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
  };

  const formatNumber = (num) => new Intl.NumberFormat('id-ID').format(num);

  const debouncedSearch = useCallback(
    debounce((query) => {
      setIsSearching(true);
      router.get(
        route('nilai-ekonomi.index'),
        { ...params, search: query },
        {
          preserveState: true,
          preserveScroll: true,
          onFinish: () => setIsSearching(false)
        }
      );
    }, 500),
    [params]
  );

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchTerm(query);
    setParams({ ...params, search: query });
    debouncedSearch(query);
  };

  const handleDelete = (id) => {
    MySwal.fire({
      title: 'Apakah Anda yakin?',
      text: "Data yang dihapus tidak dapat dikembalikan!",
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
        router.delete(route('nilai-ekonomi.destroy', id), {
          onSuccess: () => {
            setIsLoading(false);
            MySwal.fire({
              title: 'Terhapus!',
              text: 'Data berhasil dihapus.',
              icon: 'success',
              confirmButtonColor: '#15803d',
              timer: 2000,
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
    }).then((result) => {
      if (result.isConfirmed) {
        setLoadingText('Mengajukan Laporan...');
        setIsLoading(true);
        router.post(route('nilai-ekonomi.submit', id), {}, {
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
        router.post(route('nilai-ekonomi.approve', id), {}, {
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
        router.post(route('nilai-ekonomi.reject', id), {
          rejection_note: result.value
        }, {
          preserveScroll: true,
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
    <AuthenticatedLayout
      user={user}
      header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Nilai Ekonomi (NEKON)</h2>}
    >
      <Head title="Nilai Ekonomi" />

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
              <h3 className="text-2xl font-bold font-display">Data Nilai Ekonomi</h3>
              <p className="mt-1 text-primary-100 opacity-90 max-w-xl text-sm">
                Rekapitulasi data produksi dan nilai transaksi ekonomi perhutanan sosial.
              </p>
            </div>
            {canCreate && (
              <div className="flex gap-2">
                <Link href={route('nilai-ekonomi.create')}>
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Transaksi</p>
                <p className="text-lg font-bold text-gray-900 mt-1">{formatRupiah(stats?.total_transaction || 0)}</p>
              </div>
              <div className="p-3 bg-primary-50 rounded-lg text-primary-600 shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Volume</p>
                <p className="text-2xl font-bold text-primary-600 mt-1">{formatNumber(stats?.total_volume || 0)}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg text-blue-600 shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Data</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{stats?.count || 0}</p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600 shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 9l3 3m0 0l-3 3m3-3H9" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div className="flex items-center gap-4 flex-1">
              <h3 className="font-bold text-gray-800">Daftar Nilai Ekonomi</h3>
              <div className="h-6 w-px bg-gray-200"></div>

              <div className="max-w-xs w-full relative">
                <TextInput
                  type="text"
                  className="w-full text-sm pr-10"
                  placeholder="Cari Kelompok / Komoditas..."
                  value={searchTerm}
                  onChange={handleSearch}
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
              {data.total} Data Teritem
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-500">
              <thead className="bg-gray-50/50 text-gray-700 uppercase tracking-wider text-[11px] font-bold">
                <tr>
                  <th scope="col" className="px-6 py-4 w-12 text-center">
                    <div className="flex items-center justify-center">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 transition duration-150 ease-in-out cursor-pointer"
                        checked={selectedIds.length === data.data.length && data.data.length > 0}
                        onChange={handleSelectAll}
                      />
                    </div>
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors group" onClick={() => handleSort('nama_kelompok')}>
                    <div className="flex items-center gap-1">
                      Nama Kelompok
                      <SortIcon field="nama_kelompok" />
                    </div>
                  </th>
                  <th className="px-6 py-4">Komoditas</th>
                  <th className="px-6 py-4 text-center">Volume</th>
                  <th className="px-6 py-4 text-right cursor-pointer hover:bg-gray-100 transition-colors group" onClick={() => handleSort('total_transaction_value')}>
                    <div className="flex items-center justify-end gap-1">
                      Nilai Transaksi
                      <SortIcon field="total_transaction_value" />
                    </div>
                  </th>
                  <th className="px-6 py-4 text-center">Periode</th>
                  <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors group" onClick={() => handleSort('location')}>
                    <div className="flex items-center gap-1">
                      Lokasi
                      <SortIcon field="location" />
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
                {data.data.length > 0 ? (
                  data.data.map((item) => (
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
                      <td className="px-6 py-4 font-bold text-gray-900">{item.nama_kelompok}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {item.details && item.details.map((d, idx) => (
                            <span key={idx} className="px-2.5 py-1 bg-gray-100 text-gray-600 border border-gray-200 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                              {d.commodity?.name || '-'}
                            </span>
                          ))}
                          {(!item.details || item.details.length === 0) && '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-gray-700">
                        {item.details ? formatNumber(item.details.reduce((acc, curr) => acc + parseFloat(curr.production_volume), 0)) : 0}
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-primary-700 font-bold text-base">
                        {formatRupiah(item.total_transaction_value)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="font-bold text-gray-900">{new Date(0, item.month - 1).toLocaleString('id-ID', { month: 'long' })}</div>
                        <div className="text-xs text-gray-400 font-semibold">{item.year}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-800">{item.regency?.name}</div>
                        <div className="text-xs text-primary-600 font-bold uppercase tracking-tighter">{item.district?.name}</div>
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
                                href={route('nilai-ekonomi.edit', item.id)}
                                className="p-2 text-primary-600 hover:bg-primary-100 rounded-lg transition-colors shadow-sm bg-primary-50"
                                title="Edit"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                              </Link>
                              {(canDelete || isAdmin) && (
                                <button
                                  onClick={() => handleDelete(item.id)}
                                  className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors shadow-sm bg-red-50"
                                  title="Hapus"
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
                        <p className="text-gray-400 font-medium tracking-tight whitespace-nowrap">Belum ada data tersedia</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 border-t border-gray-100">
            <Pagination links={data.links} />
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
  );
}
