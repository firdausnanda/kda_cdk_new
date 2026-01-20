import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import { useState } from 'react';
import Select from 'react-select';

export default function Create({ auth, roles }) {
  const { data, setData, post, processing, errors } = useForm({
    name: '',
    username: '',
    email: '',
    password: '',
    password_confirmation: '',
    role: ''
  });

  const submit = (e) => {
    e.preventDefault();
    post(route('users.store'));
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

  const roleOptions = roles.map(role => ({
    value: role.name,
    label: role.description || role.name // Fallback to name if description is missing
  }));

  return (
    <AuthenticatedLayout
      user={auth.user}
      header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Tambah User Baru</h2>}
    >
      <Head title="Tambah User" />

      <div className="max-w-4xl mx-auto">
        <Link
          href={route('users.index')}
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600 hover:text-primary-800 transition-colors mb-6 group"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Kembali ke Daftar User
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-8 border-b border-gray-100 bg-gray-50/50">
            <h3 className="text-xl font-bold text-gray-900">Formulir Tambah User</h3>
            <p className="mt-1 text-sm text-gray-500">
              Lengkapi informasi di bawah ini untuk menambahkan user baru.
            </p>
          </div>

          <div className="p-8">
            <form onSubmit={submit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <InputLabel htmlFor="name" value="Nama Lengkap" className="text-gray-700 font-bold mb-2" />
                  <TextInput
                    id="name"
                    type="text"
                    className="w-full"
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    required
                    placeholder="Masukkan nama lengkap"
                  />
                  <InputError message={errors.name} className="mt-2" />
                </div>

                <div>
                  <InputLabel htmlFor="username" value="Username" className="text-gray-700 font-bold mb-2" />
                  <TextInput
                    id="username"
                    type="text"
                    className="w-full"
                    value={data.username}
                    onChange={(e) => setData('username', e.target.value)}
                    required
                    placeholder="Masukkan username"
                  />
                  <InputError message={errors.username} className="mt-2" />
                </div>

                <div>
                  <InputLabel htmlFor="email" value="Email" className="text-gray-700 font-bold mb-2" />
                  <TextInput
                    id="email"
                    type="email"
                    className="w-full"
                    value={data.email}
                    onChange={(e) => setData('email', e.target.value)}
                    required
                    placeholder="Masukkan email"
                  />
                  <InputError message={errors.email} className="mt-2" />
                </div>

                <div>
                  <InputLabel htmlFor="role" value="Role" className="text-gray-700 font-bold mb-2" />
                  <Select
                    options={roleOptions}
                    onChange={(opt) => setData('role', opt?.value || '')}
                    placeholder="Pilih Role..."
                    styles={selectStyles}
                    isClearable
                  />
                  <InputError message={errors.role} className="mt-2" />
                </div>

                <div>
                  <InputLabel htmlFor="password" value="Password" className="text-gray-700 font-bold mb-2" />
                  <TextInput
                    id="password"
                    type="password"
                    className="w-full"
                    value={data.password}
                    onChange={(e) => setData('password', e.target.value)}
                    required
                    placeholder="Masukkan password"
                  />
                  <InputError message={errors.password} className="mt-2" />
                </div>

                <div>
                  <InputLabel htmlFor="password_confirmation" value="Konfirmasi Password" className="text-gray-700 font-bold mb-2" />
                  <TextInput
                    id="password_confirmation"
                    type="password"
                    className="w-full"
                    value={data.password_confirmation}
                    onChange={(e) => setData('password_confirmation', e.target.value)}
                    required
                    placeholder="Ulangi password"
                  />
                  <InputError message={errors.password_confirmation} className="mt-2" />
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100 flex items-center justify-end gap-4">
                <Link
                  href={route('users.index')}
                  className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Batal
                </Link>
                <PrimaryButton
                  className="px-8 py-3 bg-gradient-to-r from-emerald-700 to-green-800 hover:from-emerald-600 hover:to-green-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-900/20 transition-all transform active:scale-95"
                  loading={processing}
                >
                  {processing ? 'Menyimpan...' : 'Simpan User'}
                </PrimaryButton>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
