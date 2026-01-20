import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);
import Pagination from '@/Components/Pagination';

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
  }, [flash]);

  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Memproses...');

  const handleYearChange = (e) => {
    const newYear = e.target.value;
    setYear(newYear);
    setLoadingText('Sinkronisasi Tahun...');
    setIsLoading(true);
    router.get(route('realisasi-pnbp.index'), { year: newYear }, {
      preserveState: true,
      preserveScroll: true,
      onFinish: () => setIsLoading(false)
    });
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
    <AuthenticatedLayout
      user={auth.user}
      header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Realisasi PNBP</h2>}
    >
      <Head title="Realisasi PNBP" />

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
              <h3 className="text-2xl font-bold font-display">Data Realisasi PNBP</h3>
              <p className="mt-1 text-emerald-100 opacity-90 max-w-xl text-sm">
                Kelola data realisasi PNBP, jenis hasil hutan, target, dan realisasi.
              </p>
            </div>
            <div className="flex gap-2">
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

          <div className="mt-8 flex flex-wrap gap-4 relative z-10">
            {/* Year Filter */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-emerald-100 group-hover:text-white transition-colors" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <select
                value={year}
                onChange={handleYearChange}
                className="pl-10 pr-10 py-2.5 bg-emerald-900/30 text-white text-sm rounded-xl border border-emerald-500/30 focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 font-medium shadow-sm transition-all hover:bg-emerald-800/50 cursor-pointer appearance-none outline-none"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y} className="text-gray-900">{y}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-emerald-100" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
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
                  <th className="px-6 py-4 font-bold tracking-wider w-[200px]">Waktu & Lokasi</th>
                  <th className="px-6 py-4 font-bold tracking-wider whitespace-nowrap">Jenis Hasil Hutan</th>
                  <th className="px-6 py-4 font-bold tracking-wider whitespace-nowrap text-right">Target PNBP</th>
                  <th className="px-6 py-4 font-bold tracking-wider whitespace-nowrap text-right">Jumlah PSDH</th>
                  <th className="px-6 py-4 font-bold tracking-wider whitespace-nowrap text-right">Jumlah DBHDR</th>

                  <th className="px-6 py-4 font-bold tracking-wider whitespace-nowrap">Status</th>
                  <th className="px-6 py-4 font-bold tracking-wider text-center whitespace-nowrap">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {datas.data.length > 0 ? (
                  datas.data.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900">
                            {new Date(0, item.month - 1).toLocaleString('id-ID', { month: 'long' })} {item.year}
                          </span>
                          <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500">
                            {item.district?.name && <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 font-medium">{item.district.name}</span>}
                            {item.regency?.name && <>
                              <span className="text-gray-300">•</span>
                              <span>{item.regency.name}</span>
                            </>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{item.types_of_forest_products}</td>
                      <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap text-right">
                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(item.pnbp_target)}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap text-right">
                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(item.number_of_psdh)}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap text-right">
                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(item.number_of_dbhdr)}
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
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500 bg-gray-50/20 italic">
                      Belum ada data realisasi PNBP yang ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination links={datas.links} />
        </div>
      </div>
    </AuthenticatedLayout>
  );

}
