import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import { useState, useEffect } from 'react';
import Select from 'react-select';
import axios from 'axios';
import Modal from '@/Components/Modal';
import CurrencyInput from '@/Components/CurrencyInput';

export default function Create({ auth, commodities }) {
  const { data, setData, post, processing, errors } = useForm({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    province_id: 35,
    regency_id: '',
    district_id: '',
    village_id: '',
    nama_kth: '',
    details: [
      { commodity_id: '', volume_produksi: '', satuan: 'Kg', nilai_transaksi: '' }
    ],
  });

  const [regencies, setRegencies] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [villages, setVillages] = useState([]);
  const [loadingRegencies, setLoadingRegencies] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingVillages, setLoadingVillages] = useState(false);

  // Commodity Modal State (Same as Nilai Ekonomi)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCommodityName, setNewCommodityName] = useState('');
  const [isSavingCommodity, setIsSavingCommodity] = useState(false);
  const [localCommodities, setLocalCommodities] = useState(commodities || []);

  const formatLabel = (name) => {
    if (!name) return '';
    return name.toLowerCase().replace('kota', 'Kota').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  useEffect(() => {
    setLoadingRegencies(true);
    axios.get(route('locations.regencies', 35)).then(res => {
      setRegencies(res.data.map(item => ({ value: item.id, label: formatLabel(item.name) })));
      setLoadingRegencies(false);
    }).catch(() => setLoadingRegencies(false));
  }, []);

  useEffect(() => {
    if (data.regency_id) {
      setLoadingDistricts(true);
      axios.get(route('locations.districts', data.regency_id)).then(res => {
        setDistricts(res.data.map(item => ({ value: item.id, label: formatLabel(item.name) })));
        setLoadingDistricts(false);
      }).catch(() => setLoadingDistricts(false));
    } else { setDistricts([]); }
  }, [data.regency_id]);

  useEffect(() => {
    if (data.district_id) {
      setLoadingVillages(true);
      axios.get(route('locations.villages', data.district_id)).then(res => {
        setVillages(res.data.map(item => ({ value: item.id, label: formatLabel(item.name) })));
        setLoadingVillages(false);
      }).catch(() => setLoadingVillages(false));
    } else { setVillages([]); }
  }, [data.district_id]);

  const submit = (e) => {
    e.preventDefault();
    post(route('nilai-transaksi-ekonomi.store'));
  };

  const addDetail = () => {
    setData('details', [...data.details, { commodity_id: '', volume_produksi: '', satuan: 'Kg', nilai_transaksi: '' }]);
  };

  const removeDetail = (index) => {
    const newDetails = [...data.details];
    newDetails.splice(index, 1);
    setData('details', newDetails);
  };

  const updateDetail = (index, field, value) => {
    const newDetails = [...data.details];
    newDetails[index][field] = value;
    setData('details', newDetails);
  };

  const saveCommodity = (e) => {
    e.preventDefault();
    if (!newCommodityName.trim()) return;

    setIsSavingCommodity(true);
    axios.post(route('commodities.store'), { name: newCommodityName, is_nilai_transaksi_ekonomi: true })
      .then(res => {
        if (res.data.commodity) {
          setLocalCommodities(prev => [...prev, res.data.commodity]);
          setIsModalOpen(false);
          setNewCommodityName('');
        }
      })
      .catch(err => {
        console.error('Error saving commodity:', err);
        alert('Gagal menyimpan komoditas. Silakan coba lagi.');
      })
      .finally(() => setIsSavingCommodity(false));
  };

  const commodityOptions = localCommodities.map(c => ({ value: c.id, label: c.name }));

  const satuanOptions = [
    { value: 'Kg', label: 'Kilogram (Kg)' },
    { value: 'Ton', label: 'Ton' },
    { value: 'M3', label: 'Meter Kubik (M³)' },
    { value: 'Liter', label: 'Liter' },
    { value: 'Batang', label: 'Batang' },
  ];

  const selectStyles = {
    control: (base, state) => ({ ...base, borderRadius: '0.75rem', padding: '2px', backgroundColor: state.isDisabled ? '#f3f4f6' : '#f9fafb', borderColor: state.isDisabled ? '#f3f4f6' : '#e5e7eb', boxShadow: state.isFocused ? '0 0 0 1px #16a34a' : 'none', '&:hover': { borderColor: state.isDisabled ? '#f3f4f6' : '#16a34a' }, cursor: state.isDisabled ? 'not-allowed' : 'default' }),
    singleValue: (base, state) => ({ ...base, color: state.isDisabled ? '#9ca3af' : '#111827', fontWeight: '500', fontSize: '0.875rem' }),
    placeholder: (base) => ({ ...base, color: '#9ca3af', fontSize: '0.875rem' }),
    indicatorSeparator: () => ({ display: 'none' }),
    menu: (base) => ({ ...base, borderRadius: '1rem', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', padding: '4px', border: '1px solid #e5e7eb', zIndex: 9999 }),
    option: (base, state) => ({ ...base, borderRadius: '0.5rem', padding: '8px 12px', fontSize: '0.875rem', fontWeight: '500', backgroundColor: state.isSelected ? '#16a34a' : state.isFocused ? '#f0fdf4' : 'transparent', color: state.isSelected ? 'white' : state.isFocused ? '#16a34a' : '#374151', cursor: 'pointer' }),
  };

  return (
    <AuthenticatedLayout user={auth.user} header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Input Nilai Transaksi Ekonomi</h2>}>
      <Head title="Input Nilai Transaksi Ekonomi" />
      <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <Link href={route('nilai-transaksi-ekonomi.index')} className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600 hover:text-primary-800 transition-colors mb-6 group">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Kembali ke Daftar Data
        </Link>

        <form onSubmit={submit} className="space-y-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-8 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-xl font-bold text-gray-900">Informasi Umum</h3>
              <p className="mt-1 text-sm text-gray-500">Lengkapi informasi KTH dan lokasi transaksi ekonomi.</p>
            </div>
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <div className="md:col-span-2">
                <InputLabel htmlFor="nama_kth" value="Nama KTH" className="text-gray-700 font-bold mb-2" />
                <TextInput id="nama_kth" className="w-full" value={data.nama_kth} onChange={(e) => setData('nama_kth', e.target.value)} required placeholder="Contoh: KTH Makmur Sejahtera" />
                <InputError message={errors.nama_kth} className="mt-2" />
              </div>
              <div>
                <InputLabel htmlFor="year" value="Tahun" className="text-gray-700 font-bold mb-2" />
                <TextInput id="year" type="number" className="w-full" value={data.year} onChange={(e) => setData('year', e.target.value)} required />
                <InputError message={errors.year} className="mt-2" />
              </div>
              <div>
                <InputLabel htmlFor="month" value="Bulan" className="text-gray-700 font-bold mb-2" />
                <select id="month" className="w-full bg-gray-50 border-gray-200 focus:bg-white focus:border-primary-500 focus:ring-primary-500 rounded-xl shadow-sm py-[11px] text-sm" value={data.month} onChange={(e) => setData('month', e.target.value)}>
                  {[...Array(12)].map((_, i) => (<option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('id-ID', { month: 'long' })}</option>))}
                </select>
                <InputError message={errors.month} className="mt-2" />
              </div>

              <div className="md:col-span-2 mt-4"><h4 className="text-xs font-bold text-primary-600 uppercase tracking-widest mb-4 border-b border-primary-100 pb-2">Lokasi</h4></div>
              <div>
                <InputLabel value="Provinsi" className="text-gray-700 font-bold mb-2" /><Select isDisabled value={{ value: 35, label: 'JAWA TIMUR' }} styles={selectStyles} />
              </div>
              <div>
                <InputLabel value="Kabupaten/Kota" className="text-gray-700 font-bold mb-2" />
                <Select
                  options={regencies}
                  isLoading={loadingRegencies}
                  onChange={(opt) => setData(prev => ({ ...prev, regency_id: opt?.value || '', district_id: '', village_id: '' }))}
                  placeholder="Pilih Kabupaten..."
                  styles={selectStyles}
                  isClearable
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                />
                <InputError message={errors.regency_id} className="mt-2" />
              </div>
              <div>
                <InputLabel value="Kecamatan" className="text-gray-700 font-bold mb-2" />
                <Select
                  options={districts}
                  isLoading={loadingDistricts}
                  isDisabled={!data.regency_id}
                  onChange={(opt) => setData(prev => ({ ...prev, district_id: opt?.value || '', village_id: '' }))}
                  placeholder="Pilih Kecamatan..."
                  styles={selectStyles}
                  isClearable
                  value={districts.find(d => d.value === data.district_id) || null}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                />
                <InputError message={errors.district_id} className="mt-2" />
              </div>
              <div>
                <InputLabel value="Desa" className="text-gray-700 font-bold mb-2" />
                <Select
                  options={villages}
                  isLoading={loadingVillages}
                  isDisabled={!data.district_id}
                  onChange={(opt) => setData('village_id', opt?.value || '')}
                  placeholder="Pilih Desa..."
                  styles={selectStyles}
                  isClearable
                  value={villages.find(v => v.value === data.village_id) || null}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                />
                <InputError message={errors.village_id} className="mt-2" />
              </div>
            </div>
          </div>

          {/* Detail Komoditas */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-8 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Rincian Komoditas</h3>
                <p className="mt-1 text-sm text-gray-500">Masukkan daftar komoditas dan nilai transaksinya.</p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setIsModalOpen(true)} className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                  Baru
                </button>
                <button type="button" onClick={addDetail} className="px-5 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-bold hover:bg-primary-700 transition-colors shadow-lg shadow-primary-700/20 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  Tambah Baris
                </button>
              </div>
            </div>
            <div className="p-8">
              {data.details.length > 0 && (
                <div className="hidden md:grid grid-cols-12 gap-4 mb-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <div className="col-span-4">Komoditas</div>
                  <div className="col-span-2 text-center">Volume</div>
                  <div className="col-span-2">Satuan</div>
                  <div className="col-span-3">Nilai Transaksi (Rp)</div>
                  <div className="col-span-1 text-center">Hapus</div>
                </div>
              )}

              <div className="space-y-4">
                {data.details.map((detail, index) => (
                  <div key={index} className="relative md:grid md:grid-cols-12 md:gap-4 md:items-start p-4 md:p-0 bg-gray-50 md:bg-transparent rounded-xl md:rounded-none border md:border-none border-gray-200">
                    <div className="md:col-span-4 mb-4 md:mb-0">
                      <label className="block md:hidden text-xs font-bold text-gray-500 uppercase mb-1">Komoditas</label>
                      <Select
                        options={commodityOptions}
                        value={commodityOptions.find(c => c.value === detail.commodity_id) || null}
                        onChange={(opt) => updateDetail(index, 'commodity_id', opt?.value)}
                        styles={selectStyles}
                        placeholder="Pilih Komoditas..."
                        menuPortalTarget={document.body}
                        menuPosition="fixed"
                        menuPlacement="top"
                      />
                      <InputError message={errors[`details.${index}.commodity_id`]} className="mt-1" />
                    </div>
                    <div className="md:col-span-2 mb-4 md:mb-0">
                      <label className="block md:hidden text-xs font-bold text-gray-500 uppercase mb-1">Volume</label>
                      <TextInput type="number" step="0.01" className="w-full" value={detail.volume_produksi} onChange={(e) => updateDetail(index, 'volume_produksi', e.target.value)} placeholder="0" />
                      <InputError message={errors[`details.${index}.volume_produksi`]} className="mt-1" />
                    </div>
                    <div className="md:col-span-2 mb-4 md:mb-0">
                      <label className="block md:hidden text-xs font-bold text-gray-500 uppercase mb-1">Satuan</label>
                      <Select
                        options={satuanOptions}
                        value={satuanOptions.find(s => s.value === detail.satuan)}
                        onChange={(opt) => updateDetail(index, 'satuan', opt?.value)}
                        styles={selectStyles}
                        menuPortalTarget={document.body}
                        menuPosition="fixed"
                      />
                      <InputError message={errors[`details.${index}.satuan`]} className="mt-1" />
                    </div>
                    <div className="md:col-span-3 mb-4 md:mb-0">
                      <label className="block md:hidden text-xs font-bold text-gray-500 uppercase mb-1">Nilai Transaksi</label>
                      <CurrencyInput
                        className="w-full"
                        value={detail.nilai_transaksi}
                        onChange={(val) => updateDetail(index, 'nilai_transaksi', val)}
                        placeholder="0"
                      />
                      <InputError message={errors[`details.${index}.nilai_transaksi`]} className="mt-1" />
                    </div>
                    <div className="md:col-span-1 flex justify-center items-start pt-2">
                      <button type="button" onClick={() => removeDetail(index)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" disabled={data.details.length === 1}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {data.details.length === 0 && <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-300">Belum ada komoditas ditambahkan.</div>}
            </div>
          </div>

          <div className="flex items-center justify-end gap-4">
            <Link href={route('nilai-transaksi-ekonomi.index')} className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors">Batal</Link>
            <PrimaryButton className="px-8 py-3 bg-gradient-to-r from-emerald-700 to-green-800 hover:from-emerald-600 hover:to-green-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-900/20 transition-all transform active:scale-95" loading={processing}>
              {processing ? 'Menyimpan...' : 'Simpan Data Transaksi'}
            </PrimaryButton>
          </div>
        </form>
      </div>

      {/* Modal for Adding Commodity */}
      <Modal show={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Tambah Komoditas Baru</h2>
          <form onSubmit={saveCommodity}>
            <div className="mb-6">
              <InputLabel value="Nama Komoditas" className="mb-2 font-bold" />
              <TextInput value={newCommodityName} onChange={e => setNewCommodityName(e.target.value)} className="w-full" placeholder="Contoh: Gaharu, Rotan, Madu Hutan..." autoFocus />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-5 py-3 text-gray-700 font-bold text-sm bg-gray-100 rounded-xl">Batal</button>
              <button type="submit" disabled={isSavingCommodity} className="flex-[2] justify-center rounded-xl px-5 py-3 bg-primary-600 text-white font-bold">{isSavingCommodity ? 'Menyimpan...' : 'Simpan Komoditas'}</button>
            </div>
          </form>
        </div>
      </Modal>
    </AuthenticatedLayout>
  );
}
