import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import { useState, useEffect } from 'react';
import Select from 'react-select';
import axios from 'axios';

export default function Edit({ auth, data: item, jenis_produksi_list }) {
  const { data, setData, patch, processing, errors } = useForm({
    name: item.name || '',
    number: item.number || '',
    province_id: item.province_id || 35,
    regency_id: item.regency_id || '',
    district_id: item.district_id || '',
    investment_value: item.investment_value || '',
    number_of_workers: item.number_of_workers || '',
    present_condition: item.present_condition ?? true,
    id_jenis_produksi: item.id_jenis_produksi || '',
  });

  const [regencies, setRegencies] = useState([]);
  const [districts, setDistricts] = useState([]);

  const [loadingRegencies, setLoadingRegencies] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);

  const formatLabel = (name) => {
    if (!name) return '';
    return name.toLowerCase()
      .replace('kabupaten', 'Kab.')
      .replace('kota', 'Kota')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Initial load: Regencies
  useEffect(() => {
    setLoadingRegencies(true);
    axios.get(route('locations.regencies', 35))
      .then(res => {
        setRegencies(res.data
          .filter(i => /(TRENGGALEK|KEDIRI|TULUNGAGUNG)/i.test(i.name))
          .map(i => ({
            value: i.id,
            label: formatLabel(i.name)
          })));
        setLoadingRegencies(false);
      })
      .catch(() => setLoadingRegencies(false));
  }, []);

  // Load Districts when Regency changes
  useEffect(() => {
    if (data.regency_id) {
      setLoadingDistricts(true);
      if (typeof route !== 'undefined') {
        axios.get(route('locations.districts', data.regency_id))
          .then(res => {
            setDistricts(res.data.map(i => ({
              value: i.id,
              label: formatLabel(i.name)
            })));
            setLoadingDistricts(false);
          })
          .catch(() => setLoadingDistricts(false));
      }
    } else {
      setDistricts([]);
    }
  }, [data.regency_id]);

  const submit = (e) => {
    e.preventDefault();
    patch(route('pbphh.update', item.id));
  };

  const selectStyles = {
    control: (base, state) => ({
      ...base,
      borderRadius: '0.75rem',
      padding: '2px',
      backgroundColor: state.isDisabled ? '#f3f4f6' : '#f9fafb',
      borderColor: state.isDisabled ? '#f3f4f6' : '#e5e7eb',
      boxShadow: state.isFocused ? '0 0 0 1px #10b981' : 'none',
      '&:hover': {
        borderColor: state.isDisabled ? '#f3f4f6' : '#10b981',
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
    placeholder: (base) => ({
      ...base,
      color: '#9ca3af',
      fontSize: '0.875rem',
    }),
    dropdownIndicator: (base, state) => ({
      ...base,
      color: state.isDisabled ? '#d1d5db' : '#9ca3af',
      '&:hover': {
        color: state.isDisabled ? '#d1d5db' : '#10b981',
      }
    }),
    indicatorSeparator: () => ({ display: 'none' }),
    menu: (base) => ({
      ...base,
      borderRadius: '1rem',
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
      padding: '4px',
      border: '1px solid #e5e7eb',
      zIndex: 9999,
    }),
    menuList: (base) => ({
      ...base,
      padding: '4px',
      maxHeight: '250px',
      '&::-webkit-scrollbar': {
        width: '6px',
      },
      '&::-webkit-scrollbar-track': {
        background: 'transparent',
      },
      '&::-webkit-scrollbar-thumb': {
        background: '#e5e7eb',
        borderRadius: '10px',
      },
      '&::-webkit-scrollbar-thumb:hover': {
        background: '#d1d5db',
      },
    }),
    option: (base, state) => ({
      ...base,
      borderRadius: '0.5rem',
      padding: '8px 12px',
      fontSize: '0.875rem',
      fontWeight: '500',
      backgroundColor: state.isSelected
        ? '#10b981'
        : state.isFocused
          ? '#ecfdf5'
          : 'transparent',
      color: state.isSelected
        ? 'white'
        : state.isFocused
          ? '#10b981'
          : '#374151',
      '&:active': {
        backgroundColor: '#10b981',
        color: 'white',
      },
      cursor: 'pointer',
    }),
  };

  return (
    <AuthenticatedLayout
      user={auth.user}
      header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Edit Data PBPHH</h2>}
    >
      <Head title="Edit PBPHH" />

      <div className="max-w-4xl mx-auto">
        <Link
          href={route('pbphh.index')}
          className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 hover:text-emerald-800 transition-colors mb-6 group"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Kembali ke Daftar Data
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-8 border-b border-gray-100 bg-gray-50/50">
            <h3 className="text-xl font-bold text-gray-900">Formulir Edit Data</h3>
            <p className="mt-1 text-sm text-gray-500">
              Perbarui informasi PBPHH di bawah ini.
            </p>
          </div>

          <div className="p-8">
            <form onSubmit={submit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="md:col-span-2">
                  <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-4 border-b border-emerald-100 pb-2">Informasi Industri</h4>
                </div>

                <div className="md:col-span-2">
                  <InputLabel htmlFor="name" value="Nama Industri" className="text-gray-700 font-bold mb-2" />
                  <TextInput
                    id="name"
                    type="text"
                    className="w-full"
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    required
                    placeholder="Masukkan nama industri"
                  />
                  <InputError message={errors.name} className="mt-2" />
                </div>

                <div>
                  <InputLabel htmlFor="number" value="Nomor Izin" className="text-gray-700 font-bold mb-2" />
                  <TextInput
                    id="number"
                    type="text"
                    className="w-full"
                    value={data.number}
                    onChange={(e) => setData('number', e.target.value)}
                    required
                    placeholder="Masukkan nomor izin"
                  />
                  <InputError message={errors.number} className="mt-2" />
                </div>

                <div>
                  <InputLabel htmlFor="id_jenis_produksi" value="Jenis Produksi" className="text-gray-700 font-bold mb-2" />
                  <Select
                    options={jenis_produksi_list.map(k => ({ value: k.id, label: k.name }))}
                    onChange={(opt) => setData('id_jenis_produksi', opt?.value || '')}
                    value={jenis_produksi_list.find(k => k.id === data.id_jenis_produksi) ? { value: data.id_jenis_produksi, label: jenis_produksi_list.find(k => k.id === data.id_jenis_produksi).name } : null}
                    placeholder="Pilih Jenis Produksi..."
                    styles={selectStyles}
                    isClearable
                  />
                  <InputError message={errors.id_jenis_produksi} className="mt-2" />
                </div>

                <div className="md:col-span-2 mt-4">
                  <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-4 border-b border-emerald-100 pb-2">Lokasi</h4>
                </div>

                {/* Location Selects */}
                <div>
                  <InputLabel value="Provinsi" className="text-gray-700 font-bold mb-2" />
                  <Select
                    isDisabled
                    value={{ value: 35, label: 'JAWA TIMUR' }}
                    styles={selectStyles}
                  />
                </div>

                <div>
                  <InputLabel value="Kabupaten" className="text-gray-700 font-bold mb-2" />
                  <Select
                    options={regencies}
                    isLoading={loadingRegencies}
                    value={regencies.find(r => r.value == data.regency_id) || (item.regency ? { value: item.regency_id, label: formatLabel(item.regency.name) } : null)}
                    onChange={(opt) => {
                      setData((prev) => ({
                        ...prev,
                        regency_id: opt?.value || '',
                        district_id: '',
                      }));
                    }}
                    placeholder="Pilih Kabupaten..."
                    styles={selectStyles}
                    isClearable
                  />
                  <InputError message={errors.regency_id} className="mt-2" />
                </div>

                <div>
                  <InputLabel value="Kecamatan" className="text-gray-700 font-bold mb-2" />
                  <Select
                    options={districts}
                    isLoading={loadingDistricts}
                    isDisabled={!data.regency_id}
                    value={districts.find(d => d.value == data.district_id) || (item.district ? { value: item.district_id, label: formatLabel(item.district.name) } : null)}
                    onChange={(opt) => {
                      setData((prev) => ({
                        ...prev,
                        district_id: opt?.value || '',
                      }));
                    }}
                    placeholder="Pilih Kecamatan..."
                    styles={selectStyles}
                    isClearable
                  />
                  <InputError message={errors.district_id} className="mt-2" />
                </div>

                <div className="md:col-span-2 mt-4">
                  <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-4 border-b border-emerald-100 pb-2">Detail Investasi & Tenaga Kerja</h4>
                </div>

                <div>
                  <InputLabel htmlFor="investment_value" value="Nilai Investasi (Rp)" className="text-gray-700 font-bold mb-2" />
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 font-bold">Rp</span>
                    </div>
                    <TextInput
                      id="investment_value"
                      type="text"
                      className="w-full pl-10"
                      value={new Intl.NumberFormat('id-ID').format(data.investment_value)}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        setData('investment_value', val);
                      }}
                      required
                      placeholder="0"
                    />
                  </div>
                  <InputError message={errors.investment_value} className="mt-2" />
                </div>

                <div>
                  <InputLabel htmlFor="number_of_workers" value="Jumlah Tenaga Kerja" className="text-gray-700 font-bold mb-2" />
                  <TextInput
                    id="number_of_workers"
                    type="number"
                    className="w-full"
                    value={data.number_of_workers}
                    onChange={(e) => setData('number_of_workers', e.target.value)}
                    required
                    placeholder="Masukkan jumlah tenaga kerja"
                    min="0"
                  />
                  <InputError message={errors.number_of_workers} className="mt-2" />
                </div>

                <div>
                  <InputLabel htmlFor="present_condition" value="Kondisi Saat Ini" className="text-gray-700 font-bold mb-2" />
                  <div className="flex gap-4 mt-2">
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="present_condition"
                        checked={data.present_condition === true}
                        onChange={() => setData('present_condition', true)}
                        className="w-4 h-4 text-emerald-600 border-gray-300 focus:ring-emerald-500"
                      />
                      <span className="ml-2 text-sm font-medium text-gray-700">Beroperasi</span>
                    </label>
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="present_condition"
                        checked={data.present_condition === false}
                        onChange={() => setData('present_condition', false)}
                        className="w-4 h-4 text-emerald-600 border-gray-300 focus:ring-emerald-500"
                      />
                      <span className="ml-2 text-sm font-medium text-gray-700">Tidak Beroperasi</span>
                    </label>
                  </div>
                  <InputError message={errors.present_condition} className="mt-2" />
                </div>

              </div>

              <div className="pt-6 border-t border-gray-100 flex items-center justify-end gap-4">
                <Link
                  href={route('pbphh.index')}
                  className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Batal
                </Link>
                <PrimaryButton
                  className="px-8 py-3 bg-gradient-to-r from-emerald-700 to-teal-800 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-900/20 transition-all transform active:scale-95"
                  loading={processing}
                >
                  {processing ? 'Menyimpan...' : 'Perbarui Data'}
                </PrimaryButton>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
