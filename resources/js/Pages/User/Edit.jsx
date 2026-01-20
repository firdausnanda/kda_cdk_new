import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import { useState } from 'react';
import Select from 'react-select';

export default function Edit({ auth, user, roles, permissions, userPermissions, currentRole }) {
  const { data, setData, put, processing, errors } = useForm({
    name: user.name,
    username: user.username,
    email: user.email,
    password: '',
    password_confirmation: '',
    role: currentRole,
    permissions: userPermissions || []
  });

  const submit = (e) => {
    e.preventDefault();
    put(route('users.update', user.id));
  };

  const handlePermissionChange = (permissionName) => {
    if (data.permissions.includes(permissionName)) {
      setData('permissions', data.permissions.filter(p => p !== permissionName));
    } else {
      setData('permissions', [...data.permissions, permissionName]);
    }
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
    label: role.description || role.name
  }));

  return (
    <AuthenticatedLayout
      user={auth.user}
      header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Edit Data User</h2>}
    >
      <Head title="Edit User" />

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
            <h3 className="text-xl font-bold text-gray-900">Formulir Edit User</h3>
            <p className="mt-1 text-sm text-gray-500">
              Perbarui informasi user. Kosongkan password jika tidak ingin mengubahnya.
            </p>
          </div>

          <div className="p-8">
            <form onSubmit={submit} className="space-y-8">
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
                    value={roleOptions.find(opt => opt.value === data.role)}
                    onChange={(opt) => setData('role', opt?.value || '')}
                    placeholder="Pilih Role..."
                    styles={selectStyles}
                    isClearable
                  />
                  <InputError message={errors.role} className="mt-2" />
                </div>

                <div>
                  <InputLabel htmlFor="password" value="Password (Opsional)" className="text-gray-700 font-bold mb-2" />
                  <TextInput
                    id="password"
                    type="password"
                    className="w-full"
                    value={data.password}
                    onChange={(e) => setData('password', e.target.value)}
                    placeholder="Kosongkan jika tidak diubah"
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
                    placeholder="Ulangi password"
                  />
                  <InputError message={errors.password_confirmation} className="mt-2" />
                </div>
              </div>

              {/* Specific Permissions Section */}
              <div className="pt-6 border-t border-gray-100">
                <h4 className="text-lg font-bold text-gray-900 mb-4">Hak Akses Spesifik</h4>
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Object.keys(permissions).map((group) => (
                      <div key={group} className="space-y-3">
                        <h5 className="font-bold text-primary-700 uppercase text-xs tracking-wider border-b border-gray-200 pb-1">
                          {group.replace('-', ' ')}
                        </h5>
                        <div className="space-y-2">
                          {permissions[group].map((permission) => (
                            <label key={permission.id} className="flex items-center space-x-3 cursor-pointer group">
                              <div className="relative flex items-center">
                                <input
                                  type="checkbox"
                                  className="peer h-5 w-5 rounded-md border-gray-300 text-primary-600 focus:ring-primary-500 transition-all checked:bg-primary-600 checked:border-primary-600"
                                  checked={data.permissions.includes(permission.name)}
                                  onChange={() => handlePermissionChange(permission.name)}
                                />
                                <div className="absolute inset-0 bg-primary-600 rounded-md opacity-0 peer-checked:opacity-20 pointer-events-none transition-opacity"></div>
                              </div>
                              <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors select-none">
                                {permission.description}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="mt-3 text-xs text-gray-500 italic">
                  * Centang untuk memberikan akses tambahan spesifik kepada user di luar akses role utamanya.
                </p>
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
                  {processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                </PrimaryButton>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
