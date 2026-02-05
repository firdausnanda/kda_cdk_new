import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link, usePage } from '@inertiajs/react';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import { useState, useEffect } from 'react';
import Select from 'react-select';
import axios from 'axios';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

export default function Create({ auth, sumberDana }) {
    const { flash } = usePage().props;
    const { data, setData, post, processing, errors } = useForm({
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        province_id: 35, // JAWA TIMUR
        regency_id: '',
        district_id: '',
        village_id: '',
        target_annual: '',
        realization: '',
        fund_source: '',
        coordinates: '',
    });

    const [regencies, setRegencies] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [villages, setVillages] = useState([]);

    const [loadingRegencies, setLoadingRegencies] = useState(false);
    const [loadingDistricts, setLoadingDistricts] = useState(false);
    const [loadingVillages, setLoadingVillages] = useState(false);

    const formatLabel = (name) => {
        if (!name) return '';
        return name.toLowerCase()
            .replace('kota', 'Kota')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    // Initial load: Regencies for Jatim (35)
    useEffect(() => {
        if (flash?.error) {
            MySwal.fire({ title: 'Gagal', text: flash.error, icon: 'error', confirmButtonText: 'Tutup', confirmButtonColor: '#d33' });
        }
        if (flash?.success) {
            MySwal.fire({ title: 'Berhasil', text: flash.success, icon: 'success', timer: 2000, showConfirmButton: false });
        }
    }, [flash]);

    useEffect(() => {
        setLoadingRegencies(true);
        axios.get(route('locations.regencies', 35))
            .then(res => {
                setRegencies(res.data.map(item => ({
                    value: item.id,
                    label: formatLabel(item.name)
                })));
                setLoadingRegencies(false);
            })
            .catch(() => setLoadingRegencies(false));
    }, []);

    // Load Districts when Regency changes
    useEffect(() => {
        if (data.regency_id) {
            setLoadingDistricts(true);
            axios.get(route('locations.districts', data.regency_id))
                .then(res => {
                    setDistricts(res.data.map(item => ({
                        value: item.id,
                        label: formatLabel(item.name)
                    })));
                    setLoadingDistricts(false);
                })
                .catch(() => setLoadingDistricts(false));
        } else {
            setDistricts([]);
        }
    }, [data.regency_id]);

    // Load Villages when District changes
    useEffect(() => {
        if (data.district_id) {
            setLoadingVillages(true);
            axios.get(route('locations.villages', data.district_id))
                .then(res => {
                    setVillages(res.data.map(item => ({
                        value: item.id,
                        label: formatLabel(item.name)
                    })));
                    setLoadingVillages(false);
                })
                .catch(() => setLoadingVillages(false));
        } else {
            setVillages([]);
        }
    }, [data.district_id]);

    const submit = (e) => {
        e.preventDefault();
        post(route('rehab-lahan.store'));
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
        placeholder: (base) => ({
            ...base,
            color: '#9ca3af',
            fontSize: '0.875rem',
        }),
        dropdownIndicator: (base, state) => ({
            ...base,
            color: state.isDisabled ? '#d1d5db' : '#9ca3af',
            '&:hover': {
                color: state.isDisabled ? '#d1d5db' : '#16a34a',
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
                ? '#16a34a'
                : state.isFocused
                    ? '#f0fdf4'
                    : 'transparent',
            color: state.isSelected
                ? 'white'
                : state.isFocused
                    ? '#16a34a'
                    : '#374151',
            '&:active': {
                backgroundColor: '#16a34a',
                color: 'white',
            },
            cursor: 'pointer',
        }),
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Input Data Baru</h2>}
        >
            <Head title="Input Rehabilitasi Lahan" />

            <div className="max-w-4xl mx-auto">
                <Link
                    href={route('rehab-lahan.index')}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600 hover:text-primary-800 transition-colors mb-6 group"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Kembali ke Daftar Data
                </Link>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-8 border-b border-gray-100 bg-gray-50/50">
                        <h3 className="text-xl font-bold text-gray-900">Formulir Input Data</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Lengkapi informasi di bawah ini untuk menambahkan data rehabilitasi lahan baru.
                        </p>
                    </div>

                    <div className="p-8">
                        <form onSubmit={submit} className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                <div className="md:col-span-2">
                                    <h4 className="text-xs font-bold text-primary-600 uppercase tracking-widest mb-4 border-b border-primary-100 pb-2">Informasi Waktu & Lokasi</h4>
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
                                        className="w-full bg-gray-50 border-gray-200 focus:bg-white focus:border-primary-500 focus:ring-primary-500 rounded-xl shadow-sm transition-all duration-200 py-[11px] text-sm disabled:bg-gray-100/50 disabled:text-gray-400 disabled:border-gray-100 disabled:cursor-not-allowed"
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
                                        options={regencies}
                                        isLoading={loadingRegencies}
                                        onChange={(opt) => {
                                            setData((prev) => ({
                                                ...prev,
                                                regency_id: opt?.value || '',
                                                district_id: '',
                                                village_id: ''
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
                                        onChange={(opt) => {
                                            setData((prev) => ({
                                                ...prev,
                                                district_id: opt?.value || '',
                                                village_id: ''
                                            }));
                                        }}
                                        placeholder="Pilih Kecamatan..."
                                        styles={selectStyles}
                                        isClearable
                                        value={districts.find(d => d.value === data.district_id) || null}
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
                                    />
                                    <InputError message={errors.village_id} className="mt-2" />
                                </div>

                                <div className="md:col-span-2 mt-4">
                                    <h4 className="text-xs font-bold text-primary-600 uppercase tracking-widest mb-4 border-b border-primary-100 pb-2">Target & Capaian (Ha)</h4>
                                </div>

                                <div>
                                    <InputLabel htmlFor="target_annual" value="Target Tahunan" className="text-gray-700 font-bold mb-2" />
                                    <div className="relative">
                                        <TextInput
                                            id="target_annual"
                                            type="number"
                                            step="0.01"
                                            className="w-full pr-12"
                                            value={data.target_annual}
                                            onChange={(e) => setData('target_annual', e.target.value)}
                                            required
                                        />
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-gray-400 text-xs font-bold">Ha</div>
                                    </div>
                                    <InputError message={errors.target_annual} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="realization" value="Realisasi Bulan Ini" className="text-gray-700 font-bold mb-2" />
                                    <div className="relative">
                                        <TextInput
                                            id="realization"
                                            type="number"
                                            step="0.01"
                                            className="w-full pr-12"
                                            value={data.realization}
                                            onChange={(e) => setData('realization', e.target.value)}
                                            required
                                        />
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-gray-400 text-xs font-bold">Ha</div>
                                    </div>
                                    <InputError message={errors.realization} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="fund_source" value="Sumber Dana" className="text-gray-700 font-bold mb-2" />
                                    <Select
                                        options={sumberDana.map(sd => ({ value: sd.name, label: sd.name }))}
                                        onChange={(opt) => setData('fund_source', opt?.value || '')}
                                        placeholder="Pilih Sumber Dana..."
                                        styles={selectStyles}
                                        isClearable
                                        menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                                        menuPosition={'fixed'}
                                        menuPlacement="top"
                                        value={data.fund_source ? { value: data.fund_source, label: data.fund_source } : null}
                                    />
                                    <InputError message={errors.fund_source} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="coordinates" value="Koordinat Lokasi (Opsional)" className="text-gray-700 font-bold mb-2" />
                                    <TextInput
                                        id="coordinates"
                                        className="w-full"
                                        value={data.coordinates}
                                        onChange={(e) => setData('coordinates', e.target.value)}
                                        placeholder=""
                                    />
                                    <InputError message={errors.coordinates} className="mt-2" />
                                </div>
                            </div>

                            <div className="pt-6 border-t border-gray-100 flex items-center justify-end gap-4">
                                <Link
                                    href={route('rehab-lahan.index')}
                                    className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors"
                                >
                                    Batal
                                </Link>
                                <PrimaryButton
                                    className="px-8 py-3 bg-gradient-to-r from-emerald-700 to-green-800 hover:from-emerald-600 hover:to-green-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-900/20 transition-all transform active:scale-95"
                                    loading={processing}
                                >
                                    {processing ? 'Menyimpan...' : 'Simpan Laporan'}
                                </PrimaryButton>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
