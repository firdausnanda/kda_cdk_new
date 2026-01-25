import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState, useCallback, useEffect } from 'react';
import { debounce } from 'lodash';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import Pagination from '@/Components/Pagination';
import TextInput from '@/Components/TextInput';
import StatusBadge from '@/Components/StatusBadge';

const MySwal = withReactContent(Swal);

export default function Index({ auth, datas, stats, filters, availableYears }) {
  const { flash } = usePage().props;
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [selectedYear, setSelectedYear] = useState(filters.year || new Date().getFullYear());
  const [isSearching, setIsSearching] = useState(false);

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
    debounce((query, year) => {
      setIsSearching(true);
      router.get(route('nilai-transaksi-ekonomi.index'), { search: query, year: year }, { preserveState: true, preserveScroll: true, onFinish: () => setIsSearching(false) });
    }, 500),
    []
  );

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchTerm(query);
    debouncedSearch(query, selectedYear);
  };

  const handleYearChange = (e) => {
    const year = e.target.value;
    setSelectedYear(year);
    router.get(route('nilai-transaksi-ekonomi.index'), { search: searchTerm, year: year }, { preserveState: true, preserveScroll: true });
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
      cancelButtonText: 'Batal'
    }).then((result) => {
      if (result.isConfirmed) {
        router.delete(route('nilai-transaksi-ekonomi.destroy', id), {
          onSuccess: () => MySwal.fire({ title: 'Terhapus!', text: 'Data berhasil dihapus.', icon: 'success', timer: 2000, showConfirmButton: false })
        });
      }
    });
  };

  const handleSubmit = (id) => {
    MySwal.fire({ title: 'Ajukan Laporan?', text: "Laporan akan dikirim ke Kasi untuk diverifikasi.", icon: 'question', showCancelButton: true, confirmButtonColor: '#15803d', confirmButtonText: 'Ya, Ajukan!', cancelButtonText: 'Batal' }).then((result) => {
      if (result.isConfirmed) router.post(route('nilai-transaksi-ekonomi.submit', id), {}, { preserveScroll: true });
    });
  };

  const handleVerify = (id) => {
    MySwal.fire({ title: 'Setujui Laporan?', text: "Apakah Anda yakin ingin menyetujui laporan ini?", icon: 'question', showCancelButton: true, confirmButtonColor: '#15803d', confirmButtonText: 'Ya, Setujui', cancelButtonText: 'Batal' }).then((result) => {
      if (result.isConfirmed) router.post(route('nilai-transaksi-ekonomi.approve', id), {}, { preserveScroll: true });
    });
  };

  const handleReject = (id) => {
    MySwal.fire({ title: 'Tolak Laporan?', text: "Berikan alasan penolakan:", input: 'textarea', inputPlaceholder: 'Tuliskan catatan penolakan di sini...', icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Ya, Tolak', cancelButtonText: 'Batal', inputValidator: (value) => { if (!value) return 'Alasan penolakan harus diisi!' } }).then((result) => {
      if (result.isConfirmed) router.post(route('nilai-transaksi-ekonomi.reject', id), { rejection_note: result.value }, { preserveScroll: true });
    });
  };

  const user = auth.user;
  const isAdmin = user.roles.includes('admin') || (Array.isArray(user.roles) && user.roles.some(r => r.name === 'admin'));
  const isKasi = user.roles.includes('kasi') || (Array.isArray(user.roles) && user.roles.some(r => r.name === 'kasi'));
  const isKaCdk = user.roles.includes('kacdk') || (Array.isArray(user.roles) && user.roles.some(r => r.name === 'kacdk'));
  const canCreate = user.permissions?.includes('pemberdayaan.create') || isAdmin;
  const canEdit = user.permissions?.includes('pemberdayaan.edit') || isAdmin;
  const canDelete = user.permissions?.includes('pemberdayaan.delete') || isAdmin;
  const canApprove = user.permissions?.includes('pemberdayaan.approve') || isAdmin;

  return (
    <AuthenticatedLayout user={user} header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Nilai Transaksi Ekonomi</h2>}>
      <Head title="Nilai Transaksi Ekonomi" />
      <div className="space-y-6">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-emerald-800 to-green-700 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-2xl font-bold">Data Nilai Transaksi Ekonomi</h3>
              <p className="mt-1 text-emerald-100 opacity-90 max-w-xl text-sm">Rekapitulasi nilai transaksi ekonomi Kelompok Tani Hutan (KTH).</p>
            </div>
            {canCreate && (
              <Link href={route('nilai-transaksi-ekonomi.create')} className="flex items-center gap-2 px-6 py-3 bg-white text-emerald-700 rounded-xl font-bold text-sm shadow-sm hover:bg-emerald-50 transition-all transform active:scale-95">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Input Data Baru
              </Link>
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
              <select className="bg-gray-50 border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-emerald-500 focus:border-emerald-500 p-2.5 font-bold" value={selectedYear} onChange={handleYearChange}>
                {availableYears.map(year => <option key={year} value={year}>Tahun {year}</option>)}
              </select>
              <div className="w-full md:w-64 relative">
                <TextInput className="w-full text-sm" placeholder="Cari KTH, Komoditas, Lokasi..." value={searchTerm} onChange={handleSearch} />
                {isSearching && <div className="absolute right-3 top-1/2 -translate-y-1/2"><svg className="animate-spin h-4 w-4 text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg></div>}
              </div>
            </div>
            <div className="flex gap-2">
              <a href={route('nilai-transaksi-ekonomi.export', { year: selectedYear })} className="px-4 py-2.5 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-bold hover:bg-emerald-100 transition-colors flex items-center gap-2">Excel</a>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-500">
              <thead className="bg-gray-50/50 text-gray-700 uppercase tracking-wider text-[11px] font-bold">
                <tr>
                  <th className="px-6 py-4">KTH / Lokasi</th>
                  <th className="px-6 py-4">Komoditas</th>
                  <th className="px-6 py-4 text-center">Volume Total</th>
                  <th className="px-6 py-4 text-right">Nilai Transaksi (Total)</th>
                  <th className="px-6 py-4 text-center">Periode</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {datas.data.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">{item.nama_kth}</div>
                      <div className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{item.regency_name} • {item.district_name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {item.details && item.details.map((d, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-600 border border-gray-200 rounded text-[10px] font-bold">
                            {d.commodity?.name || '-'}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-gray-700">
                      {formatNumber(item.details ? item.details.reduce((acc, curr) => acc + parseFloat(curr.volume_produksi), 0) : 0)}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-emerald-700 text-base">{formatRupiah(item.total_nilai_transaksi)}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="font-bold text-gray-900">{new Date(0, item.month - 1).toLocaleString('id-ID', { month: 'long' })}</div>
                      <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{item.year}</div>
                    </td>
                    <td className="px-6 py-4 text-center"><StatusBadge status={item.status} /></td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        {(canEdit && (item.status === 'draft' || item.status === 'rejected')) && (
                          <button onClick={() => handleSubmit(item.id)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors" title="Ajukan">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" /></svg>
                          </button>
                        )}
                        {((canEdit && (item.status === 'draft' || item.status === 'rejected')) || isAdmin) && (
                          <Link href={route('nilai-transaksi-ekonomi.edit', item.id)} className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors" title="Edit">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                          </Link>
                        )}
                        {(canApprove && (isKasi || isAdmin) && item.status === 'waiting_kasi') && (
                          <div className="flex gap-1">
                            <button onClick={() => handleVerify(item.id)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg" title="Setujui"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg></button>
                            <button onClick={() => handleReject(item.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Tolak"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                          </div>
                        )}
                        {(canApprove && (isKaCdk || isAdmin) && item.status === 'waiting_cdk') && (
                          <div className="flex gap-1">
                            <button onClick={() => handleVerify(item.id)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg" title="Setujui"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></button>
                            <button onClick={() => handleReject(item.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Tolak"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></button>
                          </div>
                        )}
                        {(canDelete || isAdmin) && (
                          <button onClick={() => handleDelete(item.id)} className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors" title="Hapus">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 border-t border-gray-100"><Pagination links={datas.links} /></div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
