import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import { useState, useEffect } from 'react';
import Select from 'react-select';
import axios from 'axios';

export default function Create({ auth, provinces, regencies, pengelola_wisata }) {
  const { data, setData, post, processing, errors } = useForm({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    province_id: 35,
    regency_id: '',
    id_pengelola_wisata: '',
    types_of_forest_products: '',
    pnbp_target: '',
    pnbp_realization: '',
  });

  const [regencyOptions, setRegencyOptions] = useState([]);
  const [districtOptions, setDistrictOptions] = useState([]);

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

  const formatCurrency = (value) => {
    if (!value) return '';
    return new Intl.NumberFormat('id-ID').format(value);
  };

  const parseCurrency = (value) => {
    return value.replace(/\./g, '').replace(/[^0-9]/g, '');
  };

  // Populate Regencies on Data Load (since Province is 35)
  useEffect(() => {
    if (regencies && regencies.length > 0) {
      setRegencyOptions(regencies
        .filter(r => /(TRENGGALEK|KEDIRI|TULUNGAGUNG)/i.test(r.name))
        .map(r => ({
          value: r.id,
          label: formatLabel(r.name)
        }))
      );
    } else {
      // Fallback fetch if not passed
      setLoadingRegencies(true);
      if (typeof route !== 'undefined') {
        axios.get(route('locations.regencies', 35))
          .then(res => {
            setRegencyOptions(res.data
              .filter(i => /(TRENGGALEK|KEDIRI|TULUNGAGUNG)/i.test(i.name))
              .map(i => ({
                value: i.id,
                label: formatLabel(i.name)
              }))
            );
            setLoadingRegencies(false);
          })
          .catch(() => setLoadingRegencies(false));
      }
    }
  }, [regencies]);

  // Load Districts when Regency changes
  useEffect(() => {
    if (data.regency_id) {
      setLoadingDistricts(true);
      setDistrictOptions([]);
      if (typeof route !== 'undefined') {
        axios.get(route('locations.districts', data.regency_id))
          .then(res => {
            setDistrictOptions(res.data.map(i => ({
              value: i.id,
              label: formatLabel(i.name)
            })));
            setLoadingDistricts(false);
          })
          .catch(() => setLoadingDistricts(false));
      }
    } else {
      setDistrictOptions([]);
    }
  }, [data.regency_id]);

  const submit = (e) => {
    e.preventDefault();
    post(route('realisasi-pnbp.store'));
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
      header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Tambah Data PNBP</h2>}
    >
      <Head title="Tambah Data - PNBP" />

      <div className="max-w-4xl mx-auto">
        <Link
          href={route('realisasi-pnbp.index')}
          className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 hover:text-emerald-800 transition-colors mb-6 group"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Kembali ke Daftar Data
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-8 border-b border-gray-100 bg-gray-50/50">
            <h3 className="text-xl font-bold text-gray-900">Formulir Data Baru</h3>
            <p className="mt-1 text-sm text-gray-500">
              Lengkapi informasi PNBP di bawah ini.
            </p>
          </div>

          <div className="p-8">
            <form onSubmit={submit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="md:col-span-2">
                  <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-4 border-b border-emerald-100 pb-2">Informasi Waktu & Lokasi</h4>
                </div>

                <div>
                  <InputLabel htmlFor="year" value="Tahun Laporan" className="text-gray-700 font-bold mb-2" />
                  <TextInput
                    id="year"
                    type="number"
                    className="w-full"
                    value={data.year}
                    onChange={(e) => setData('year', e.target.value)}
                    required
                  />
                  <InputError message={errors.year} className="mt-2" />
                </div>

                <div>
                  <InputLabel htmlFor="month" value="Bulan Laporan" className="text-gray-700 font-bold mb-2" />
                  <select
                    id="month"
                    className="w-full bg-gray-50 border-gray-200 focus:bg-white focus:border-emerald-500 focus:ring-emerald-500 rounded-xl shadow-sm transition-all duration-200 py-[11px] text-sm disabled:bg-gray-100/50 disabled:text-gray-400 disabled:border-gray-100 disabled:cursor-not-allowed"
                    value={data.month}
                    onChange={(e) => setData('month', e.target.value)}
                  >
                    {[...Array(12)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('id-ID', { month: 'long' })}</option>
                    ))}
                  </select>
                  <InputError message={errors.month} className="mt-2" />
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
                    options={regencyOptions}
                    isLoading={loadingRegencies}
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
                  <InputLabel value="Kecamatan" className="text-gray-700 font-bold mb-2 hidden" />
                </div>

                <div className="md:col-span-2 mt-4">
                  <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-4 border-b border-emerald-100 pb-2">Detail PNBP</h4>
                </div>

                <div className="md:col-span-2">
                  <InputLabel htmlFor="id_pengelola_wisata" value="Pengelola" className="text-gray-700 font-bold mb-2" />
                  <Select
                    options={pengelola_wisata.map(p => ({ value: p.id, label: p.name }))}
                    onChange={(opt) => setData('id_pengelola_wisata', opt?.value || '')}
                    placeholder="Pilih Pengelola..."
                    styles={selectStyles}
                    isClearable
                  />
                  <InputError message={errors.id_pengelola_wisata} className="mt-2" />
                </div>

                <div className="md:col-span-2">
                  <InputLabel htmlFor="types_of_forest_products" value="Jenis Hasil Hutan" className="text-gray-700 font-bold mb-2" />
                  <Select
                    options={[
                      { value: 'Kayu', label: 'Kayu' },
                      { value: 'Non Kayu', label: 'Non Kayu' },
                      { value: 'Jasa Lingkungan', label: 'Jasa Lingkungan' }
                    ]}
                    onChange={(opt) => setData('types_of_forest_products', opt?.value || '')}
                    placeholder="Pilih Jenis Hasil Hutan..."
                    styles={selectStyles}
                    menuPlacement="top"
                    isClearable
                  />
                  <InputError message={errors.types_of_forest_products} className="mt-2" />
                </div>

                <div>
                  <InputLabel htmlFor="pnbp_target" value="Target PNBP" className="text-gray-700 font-bold mb-2" />
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 font-bold sm:text-sm">Rp</span>
                    </div>
                    <TextInput
                      id="pnbp_target"
                      type="text"
                      className="w-full pl-10"
                      value={formatCurrency(data.pnbp_target)}
                      onChange={(e) => setData('pnbp_target', parseCurrency(e.target.value))}
                      required
                      placeholder="0"
                    />
                  </div>
                  <InputError message={errors.pnbp_target} className="mt-2" />
                </div>

                <div>
                  <InputLabel htmlFor="pnbp_realization" value="Realisasi PNBP" className="text-gray-700 font-bold mb-2" />
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 font-bold sm:text-sm">Rp</span>
                    </div>
                    <TextInput
                      id="pnbp_realization"
                      type="text"
                      className="w-full pl-10"
                      value={formatCurrency(data.pnbp_realization)}
                      onChange={(e) => setData('pnbp_realization', parseCurrency(e.target.value))}
                      required
                      placeholder="0"
                    />
                  </div>
                  <InputError message={errors.pnbp_realization} className="mt-2" />
                </div>

              </div>

              <div className="pt-6 border-t border-gray-100 flex items-center justify-end gap-4">
                <Link
                  href={route('realisasi-pnbp.index')}
                  className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Batal
                </Link>
                <PrimaryButton
                  className="px-8 py-3 bg-gradient-to-r from-emerald-700 to-teal-800 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-900/20 transition-all transform active:scale-95"
                  loading={processing}
                >
                  {processing ? 'Menyimpan...' : 'Simpan Data'}
                </PrimaryButton>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
