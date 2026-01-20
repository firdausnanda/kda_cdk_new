import { useState, useCallback } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { debounce } from 'lodash';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import Modal from '@/Components/Modal';

const MySwal = withReactContent(Swal);

export default function Index({ auth, kups, stats, filters }) {
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Memproses...');
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [rejectionNote, setRejectionNote] = useState('');

  const formatNumber = (num) => new Intl.NumberFormat('id-ID').format(num);

  const debouncedSearch = useCallback(
    debounce((query) => {
      setIsLoading(true);
      setLoadingText('Mencari...');
      router.get(
        route('kups.index'),
        { search: query },
        {
          preserveState: true,
          preserveScroll: true,
          onFinish: () => setIsLoading(false)
        }
      );
    }, 500),
    []
  );

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchTerm(query);
    debouncedSearch(query);
  };

  const handleDelete = (id) => {
    MySwal.fire({
      title: 'Apakah Anda yakin?',
      text: "Data yang dihapus tidak dapat dikembalikan!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
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
        router.delete(route('kups.destroy', id), {
          onSuccess: () => {
            setIsLoading(false);
            MySwal.fire({
              title: 'Terhapus!',
              text: 'Data berhasil dihapus.',
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
      title: 'Submit Laporan?',
      text: "Laporan akan dikirim ke Kasi untuk diperiksa.",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#15803d',
      confirmButtonText: 'Ya, Submit',
      cancelButtonText: 'Batal',
      borderRadius: '1.25rem',
    }).then((result) => {
      if (result.isConfirmed) {
        setLoadingText('Mengirim Laporan...');
        setIsLoading(true);
        router.post(route('kups.submit', id), {}, {
          onFinish: () => setIsLoading(false)
        });
      }
    });
  };

  const handleApprove = (id) => {
    MySwal.fire({
      title: 'Setujui Laporan?',
      text: "Laporan akan disetujui dan diteruskan.",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#15803d',
      confirmButtonText: 'Ya, Setujui',
      cancelButtonText: 'Batal',
      borderRadius: '1.25rem',
    }).then((result) => {
      if (result.isConfirmed) {
        setLoadingText('Memverifikasi...');
        setIsLoading(true);
        router.post(route('kups.approve', id), {}, {
          onFinish: () => setIsLoading(false)
        });
      }
    });
  };

  const openRejectModal = (id) => {
    setSelectedId(id);
    setRejectionNote('');
    setRejectModalOpen(true);
  };

  const handleReject = () => {
    if (!rejectionNote) {
      MySwal.fire('Error', 'Alasan penolakan harus diisi', 'error');
      return;
    }
    setLoadingText('Menolak Laporan...');
    setIsLoading(true);
    router.post(route('kups.reject', selectedId), { rejection_note: rejectionNote }, {
      onSuccess: () => {
        setRejectModalOpen(false);
        setIsLoading(false);
        MySwal.fire('Ditolak', 'Laporan telah ditolak.', 'success');
      },
      onFinish: () => setIsLoading(false)
    });
  };

  const getStatusBadge = (status) => {
    const classes = "px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm border";
    switch (status) {
      case 'draft': return <span className={`${classes} bg-gray-100 text-gray-600 border-gray-200`}>Draft</span>;
      case 'waiting_kasi': return <span className={`${classes} bg-yellow-50 text-yellow-700 border-yellow-200`}>Menunggu Verifikasi</span>;
      case 'waiting_cdk': return <span className={`${classes} bg-blue-50 text-blue-700 border-blue-200`}>Menunggu Persetujuan</span>;
      case 'finalized': return <span className={`${classes} bg-green-50 text-green-700 border-green-200`}>Disetujui</span>;
      case 'rejected': return <span className={`${classes} bg-red-50 text-red-700 border-red-200`}>Ditolak</span>;
      default: return null;
    }
  };

  // Helper roles
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
    if (isAdmin) return true;
    if (canSubmit && (item.status === 'draft' || item.status === 'rejected')) return true;
    return false;
  };

  const userCanApprove = (item) => {
    if (isAdmin) return true;
    if (canApprove) {
      if (item.status === 'waiting_kasi' && isKasi) return true;
      if (item.status === 'waiting_cdk' && isKaCdk) return true;
      return false;
    }
    return false;
  };

  const userCanReject = (item) => {
    if (isAdmin) return true;
    if (canReject) {
      if (item.status === 'waiting_kasi' && isKasi) return true;
      if (item.status === 'waiting_cdk' && isKaCdk) return true;
      return false;
    }
    return false;
  };

  return (
    <AuthenticatedLayout
      user={user}
      header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Perkembangan KUPS</h2>}
    >
      <Head title="Perkembangan KUPS" />

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
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">

          {/* Modern Header Section */}
          <div className="bg-gradient-to-r from-emerald-800 to-emerald-600 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
            <div className="absolute right-0 top-0 h-full w-1/3 bg-white/5 transform skew-x-12 shrink-0"></div>
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-2xl font-bold font-display">Data Perkembangan KUPS</h3>
                <p className="mt-1 text-emerald-100 opacity-90 max-w-xl text-sm">
                  Kelola dan pantau data Kelompok Usaha Perhutanan Sosial di wilayah CDK Trenggalek.
                </p>
              </div>
              {canCreate && (
                <Link href={route('kups.create')} className="shrink-0">
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

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 md:gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total KUPS</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{formatNumber(stats.total_kups)} <span className="text-xs font-normal text-gray-400">Unit</span></p>
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
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Kategori</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">{stats.total_categories} <span className="text-xs font-normal text-gray-400">Jenis</span></p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg text-blue-600 shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Komoditas</p>
                  <p className="text-2xl font-bold text-amber-600 mt-1">{stats.total_commodities} <span className="text-xs font-normal text-gray-400">Jenis</span></p>
                </div>
                <div className="p-3 bg-amber-50 rounded-lg text-amber-600 shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Data Laporan</p>
                  <p className="text-2xl font-bold text-purple-600 mt-1">{stats.total_count} <span className="text-xs font-normal text-gray-400">Data</span></p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg text-purple-600 shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
              <div className="flex items-center gap-4">
                <h3 className="font-bold text-gray-800">Daftar Data KUPS</h3>
                <div className="h-6 w-px bg-gray-200"></div>
                <div className="relative w-full md:w-64">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    className="block w-full p-2 pl-10 text-sm text-gray-900 border border-gray-200 rounded-lg bg-gray-50 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                    placeholder="Cari Komoditas / Kategori..."
                    value={searchTerm}
                    onChange={handleSearch}
                  />
                </div>
              </div>
              <div className="text-sm text-gray-400 font-bold bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                {kups.total} Data Ditampilkan
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-500 min-w-[800px]">
                <thead className="bg-gray-50/50 text-gray-700 uppercase tracking-wider text-[11px] font-bold">
                  <tr>
                    <th scope="col" className="px-6 py-4">Lokasi</th>
                    <th scope="col" className="px-6 py-4">Kategori</th>
                    <th scope="col" className="px-6 py-4 text-center">Jumlah KUPS</th>
                    <th scope="col" className="px-6 py-4">Komoditas</th>
                    <th scope="col" className="px-6 py-4 text-center">Status</th>
                    <th scope="col" className="px-6 py-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {kups.data.length > 0 ? (
                    kups.data.map((item) => (
                      <tr key={item.id} className="hover:bg-emerald-50/30 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-900">{item.regency?.name}</div>
                          <div className="text-xs text-secondary-600 font-bold uppercase tracking-tight text-emerald-600">{item.district?.name}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg border ${item.category === 'Platinum' ? 'bg-slate-100 text-slate-700 border-slate-200' :
                            item.category === 'Gold' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                              item.category === 'Silver' ? 'bg-gray-50 text-gray-600 border-gray-200' :
                                'bg-blue-50 text-blue-600 border-blue-200'
                            }`}>
                            {item.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex flex-col">
                            <span className="text-gray-900 font-bold text-base leading-tight">
                              {item.number_of_kups}
                            </span>
                            <span className="text-[10px] text-gray-400 font-bold uppercase">Unit</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-100 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                            {item.commodity}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {getStatusBadge(item.status)}
                          {item.status === 'rejected' && item.rejection_note && (
                            <div className="text-[10px] text-red-500 mt-1 font-medium italic max-w-[150px] mx-auto truncate" title={item.rejection_note}>
                              "{item.rejection_note}"
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex item-center justify-center gap-2">
                            {userCanApprove(item) && (
                              <button
                                onClick={() => handleApprove(item.id)}
                                className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors shadow-sm bg-emerald-50"
                                title="Setujui"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </button>
                            )}
                            {userCanReject(item) && (
                              <button
                                onClick={() => openRejectModal(item.id)}
                                className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors shadow-sm bg-red-50"
                                title="Tolak"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            )}
                            {userCanSubmit(item) && (
                              <button
                                onClick={() => handleSubmit(item.id)}
                                className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors shadow-sm bg-blue-50"
                                title="Submit"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </button>
                            )}
                            {userCanEdit(item) && (
                              <Link
                                href={route('kups.edit', item.id)}
                                className="p-2 text-primary-600 hover:bg-primary-100 rounded-lg transition-colors shadow-sm bg-primary-50"
                                title="Edit"
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
                      <td colSpan="6" className="text-center py-12">
                        <div className="flex flex-col items-center">
                          <div className="p-4 bg-gray-50 rounded-full mb-3 text-gray-300">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                          </div>
                          <p className="text-gray-400 font-medium tracking-tight whitespace-nowrap">Belum ada data tersedia.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50">
              {kups.links && kups.links.length > 3 && (
                <div className="flex flex-wrap gap-1 justify-center">
                  {kups.links.map((link, key) => (
                    <Link
                      key={key}
                      href={link.url}
                      className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all ${link.active
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                        } ${!link.url ? 'opacity-50 cursor-not-allowed' : ''}`}
                      dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Modal show={rejectModalOpen} onClose={() => setRejectModalOpen(false)}>
        <div className="p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-2">Tolak Laporan</h2>
          <p className="text-sm text-gray-500 mb-6">
            Silakan berikan alasan mengapa laporan ini ditolak. Catatan ini akan terlihat oleh pembuat laporan.
          </p>

          <textarea
            className="w-full border-gray-200 rounded-xl shadow-sm focus:border-red-500 focus:ring-red-500 text-sm"
            rows="4"
            placeholder="Tuliskan alasan penolakan di sini..."
            value={rejectionNote}
            onChange={(e) => setRejectionNote(e.target.value)}
          ></textarea>

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={() => setRejectModalOpen(false)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200 transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleReject}
              className="px-4 py-2 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-colors shadow-sm shadow-red-200"
            >
              Tolak Laporan
            </button>
          </div>
        </div>
      </Modal>

    </AuthenticatedLayout>
  );
}
