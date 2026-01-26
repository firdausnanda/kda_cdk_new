import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import CurrencyInput from '@/Components/CurrencyInput';
import Modal from '@/Components/Modal';
import { useState, useEffect } from 'react';
import Select from 'react-select';
import axios from 'axios';

export default function Create({ auth, commodities }) {
  const { data, setData, post, processing, errors } = useForm({
    nama_kelompok: '',
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    province_id: 35, // Jatim
    regency_id: '',
    district_id: '',
    details: [
      { commodity_id: '', production_volume: '', satuan: 'Kg', transaction_value: '' }
    ]
  });

  const [regencies, setRegencies] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [loadingRegencies, setLoadingRegencies] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);

  // Commodity Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCommodityName, setNewCommodityName] = useState('');
  const [isSavingCommodity, setIsSavingCommodity] = useState(false);
  const [localCommodities, setLocalCommodities] = useState(commodities);


  useEffect(() => {
    setLoadingRegencies(true);
    axios.get(route('locations.regencies', 35))
      .then(res => {
        setRegencies(res.data.map(item => ({
          value: item.id,
          label: item.name
        })));
        setLoadingRegencies(false);
      })
      .catch(() => setLoadingRegencies(false));
  }, []);

  useEffect(() => {
    if (data.regency_id) {
      setLoadingDistricts(true);
      axios.get(route('locations.districts', data.regency_id))
        .then(res => {
          setDistricts(res.data.map(item => ({
            value: item.id,
            label: item.name
          })));
          setLoadingDistricts(false);
        })
        .catch(() => setLoadingDistricts(false));
    } else {
      setDistricts([]);
    }
  }, [data.regency_id]);

  const commodityOptions = localCommodities.map(c => ({ value: c.id, label: c.name }));
  const monthOptions = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: new Date(0, i).toLocaleString('id-ID', { month: 'long' }) }));
  const yearOptions = Array.from({ length: 5 }, (_, i) => ({ value: new Date().getFullYear() - i, label: (new Date().getFullYear() - i).toString() }));
  const satuanOptions = [
    { value: 'Kg', label: 'Kilogram (Kg)' },
    { value: 'Ton', label: 'Ton' },
    { value: 'M3', label: 'Meter Kubik (M³)' },
    { value: 'Liter', label: 'Liter' },
    { value: 'Batang', label: 'Batang' },
    { value: 'Pengunjung', label: 'Pengunjung' },
    { value: 'Kendaraan', label: 'Kendaraan' },
    { value: 'Butir', label: 'Butir' },
  ];

  const submit = (e) => {
    e.preventDefault();
    post(route('nilai-ekonomi.store'));
  };

  const addDetail = () => {
    setData('details', [...data.details, { commodity_id: '', production_volume: '', satuan: 'Kg', transaction_value: '' }]);
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
    axios.post(route('commodities.store'), { name: newCommodityName })
      .then(res => {
        setLocalCommodities([...localCommodities, res.data.commodity]);
        setIsModalOpen(false);
        setNewCommodityName('');
      })
      .catch(err => {
        console.error(err);
        // Could add toast here
      })
      .finally(() => setIsSavingCommodity(false));
  };


  const selectStyles = {
    control: (base, state) => ({
      ...base,
      borderRadius: '0.75rem',
      padding: '2px',
      backgroundColor: state.isDisabled ? '#f3f4f6' : '#f9fafb',
      borderColor: state.isDisabled ? '#f3f4f6' : '#e5e7eb',
      boxShadow: state.isFocused ? '0 0 0 1px #16a34a' : 'none',
      '&:hover': {
        borderColor: state.isDisabled ? '#f3f4f6' : '#16a34a',
      },
      cursor: state.isDisabled ? 'not-allowed' : 'default',
      transition: 'all 0.2s',
    }),
    singleValue: (base, state) => ({
      ...base,
      color: state.isDisabled ? '#9ca3af' : '#111827',
      fontWeight: '500',
      fontSize: '0.875rem',
    }),
    menu: (base) => ({
      ...base,
      borderRadius: '1rem',
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
      padding: '4px',
      border: '1px solid #e5e7eb',
      zIndex: 99999,
    }),
    menuPortal: (base) => ({
      ...base,
      zIndex: 99999
    })
  };

  return (
    <AuthenticatedLayout
      user={auth.user}
      header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Input Data Nilai Ekonomi</h2>}
    >
      <Head title="Input Nilai Ekonomi" />

      <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <Link
          href={route('nilai-ekonomi.index')}
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600 hover:text-primary-800 transition-colors mb-6 group"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Kembali ke Daftar
        </Link>

        <form onSubmit={submit} className="space-y-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="p-8 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-xl font-bold text-gray-900">Informasi Umum</h3>
              <p className="mt-1 text-sm text-gray-500">
                Lengkapi informasi kelompok dan lokasi kegiatan perhutanan sosial.
              </p>
            </div>

            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <div className="md:col-span-2">
                <InputLabel htmlFor="nama_kelompok" value="Nama Kelompok" className="font-bold mb-2 text-gray-700" />
                <TextInput
                  id="nama_kelompok"
                  className="w-full"
                  value={data.nama_kelompok}
                  onChange={(e) => setData('nama_kelompok', e.target.value)}
                  required
                  placeholder="Contoh: KTH Wana Makmur"
                />
                <InputError message={errors.nama_kelompok} className="mt-2" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <InputLabel value="Bulan" className="font-bold mb-2 text-gray-700" />
                  <Select
                    options={monthOptions}
                    defaultValue={monthOptions.find(opt => opt.value === data.month)}
                    onChange={(opt) => setData('month', opt?.value)}
                    styles={selectStyles}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                  />
                  <InputError message={errors.month} className="mt-2" />
                </div>
                <div>
                  <InputLabel value="Tahun" className="font-bold mb-2 text-gray-700" />
                  <Select
                    options={yearOptions}
                    defaultValue={yearOptions.find(opt => opt.value === data.year)}
                    onChange={(opt) => setData('year', opt?.value)}
                    styles={selectStyles}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                  />
                  <InputError message={errors.year} className="mt-2" />
                </div>
              </div>
              <div className="md:col-span-2"></div>

              {/* Location */}
              <div className="md:col-span-2">
                <h4 className="text-xs font-bold text-primary-600 uppercase tracking-widest mb-4 border-b border-primary-100 pb-2">Lokasi</h4>
              </div>

              <div>
                <InputLabel value="Kabupaten" className="font-bold mb-2 text-gray-700" />
                <Select
                  options={regencies}
                  isLoading={loadingRegencies}
                  onChange={(opt) => setData(prev => ({ ...prev, regency_id: opt?.value, district_id: '' }))}
                  styles={selectStyles}
                  placeholder="Pilih Kabupaten..."
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                />
                <InputError message={errors.regency_id} className="mt-2" />
              </div>

              <div>
                <InputLabel value="Kecamatan" className="font-bold mb-2 text-gray-700" />
                <Select
                  options={districts}
                  isLoading={loadingDistricts}
                  isDisabled={!data.regency_id}
                  onChange={(opt) => setData('district_id', opt?.value)}
                  styles={selectStyles}
                  placeholder="Pilih Kecamatan..."
                  value={districts.find(d => d.value === data.district_id) || null}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                />
                <InputError message={errors.district_id} className="mt-2" />
              </div>
            </div>
          </div>

          {/* Detail Komoditas */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-8 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Detail Komoditas</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Masukkan rincian komoditas hasil hutan.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Baru
                </button>
                <button
                  type="button"
                  onClick={addDetail}
                  className="px-5 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-bold hover:bg-primary-700 transition-colors shadow-lg shadow-primary-700/20 flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Tambah Baris
                </button>
              </div>
            </div>

            <div className="p-6 md:p-8">
              {/* Header Row (Desktop) */}
              {data.details.length > 0 && (
                <div className="hidden md:grid grid-cols-12 gap-4 mb-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <div className="col-span-4">Komoditas</div>
                  <div className="col-span-2 text-center">Volume</div>
                  <div className="col-span-2">Satuan</div>
                  <div className="col-span-3">Nilai Transaksi</div>
                  <div className="col-span-1 text-center">Aksi</div>
                </div>
              )}

              <div className="space-y-4">
                {data.details.map((detail, index) => (
                  <div key={index} className="relative md:grid md:grid-cols-12 md:gap-4 md:items-start p-4 md:p-0 bg-gray-50 md:bg-transparent rounded-xl md:rounded-none border md:border-none border-gray-200 animate-in fade-in slide-in-from-top-2 duration-300">
                    {/* Mobile Label */}
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
                      <TextInput
                        type="number"
                        className="w-full"
                        value={detail.production_volume}
                        onChange={(e) => updateDetail(index, 'production_volume', e.target.value)}
                        placeholder="0"
                      />
                      <InputError message={errors[`details.${index}.production_volume`]} className="mt-1" />
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
                        value={detail.transaction_value}
                        onChange={(val) => updateDetail(index, 'transaction_value', val)}
                        placeholder="0"
                      />
                      <InputError message={errors[`details.${index}.transaction_value`]} className="mt-1" />
                    </div>

                    <div className="md:col-span-1 flex justify-center items-start pt-2">
                      <button
                        type="button"
                        onClick={() => removeDetail(index)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="Hapus Baris"
                        disabled={data.details.length === 1}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {data.details.length === 0 && (
                <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                  Belum ada komoditas ditambahkan.
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-4">
            <Link
              href={route('nilai-ekonomi.index')}
              className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors"
            >
              Batal
            </Link>
            <PrimaryButton className="px-8 py-3 bg-gradient-to-r from-emerald-700 to-green-800 hover:from-emerald-600 hover:to-green-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-900/20 transition-all transform active:scale-95" loading={processing}>
              Simpan Data
            </PrimaryButton>
          </div>
        </form>
      </div>

      {/* Modal for Adding Commodity */}
      <Modal show={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-900">Tambah Komoditas Baru</h2>
            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={saveCommodity}>
            <div className="mb-6">
              <InputLabel value="Nama Komoditas" className="mb-2 font-bold" />
              <TextInput
                value={newCommodityName}
                onChange={e => setNewCommodityName(e.target.value)}
                className="w-full"
                placeholder="Contoh: Gaharu, Rotan, Madu Hutan..."
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-2">Komoditas yang ditambahkan akan langsung tersedia di pilihan.</p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 px-5 py-3 text-gray-700 font-bold text-sm bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSavingCommodity}
                className={`flex-[2] justify-center rounded-xl px-5 py-3 bg-gradient-to-r from-emerald-600 to-emerald-800 hover:from-emerald-700 hover:to-emerald-900 shadow-lg shadow-emerald-900/20 text-white font-bold text-base transition-all transform active:scale-95 flex items-center gap-2 ${isSavingCommodity ? 'opacity-75 cursor-wait' : ''}`}
              >
                {isSavingCommodity ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <span>Simpan Komoditas</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </AuthenticatedLayout>
  );
}
