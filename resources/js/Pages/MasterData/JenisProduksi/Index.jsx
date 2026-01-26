import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import Modal from '@/Components/Modal';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton';
import Pagination from '@/Components/Pagination';

export default function JenisProduksiIndex({ auth, jenisProduksi, filters }) {
  const [search, setSearch] = useState(filters.search || '');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [currentData, setCurrentData] = useState(null);

  const { data, setData, post, put, delete: destroy, processing, errors, reset, clearErrors } = useForm({
    name: '',
  });

  const handleSearch = (e) => {
    setSearch(e.target.value);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      router.get(
        route('jenis-produksi.index'),
        { search },
        { preserveState: true, preserveScroll: true, replace: true }
      );
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const openCreateModal = () => {
    setModalMode('create');
    reset();
    clearErrors();
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setModalMode('edit');
    setCurrentData(item);
    setData({
      name: item.name,
    });
    clearErrors();
    setIsModalOpen(true);
  };

  const openDeleteModal = (item) => {
    setCurrentData(item);
    setIsDeleteModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    reset();
    setCurrentData(null);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setCurrentData(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (modalMode === 'create') {
      post(route('jenis-produksi.store'), {
        onSuccess: () => closeModal(),
      });
    } else {
      put(route('jenis-produksi.update', currentData.id), {
        onSuccess: () => closeModal(),
      });
    }
  };

  const handleDelete = () => {
    destroy(route('jenis-produksi.destroy', currentData.id), {
      onSuccess: () => closeDeleteModal(),
    });
  };

  return (
    <AuthenticatedLayout
      user={auth.user}
      header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Master Data Jenis Produksi</h2>}
    >
      <Head title="Master Data Jenis Produksi" />

      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="bg-white overflow-hidden shadow-xl sm:rounded-2xl ring-1 ring-gray-900/5">
            {/* Header Section */}
            <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-900 mb-4 sm:mb-0">
                Daftar Jenis Produksi
                <p className="text-sm font-normal text-gray-500 mt-1">Kelola data jenis produksi dalam sistem.</p>
              </h3>

              <div className="flex w-full sm:w-auto gap-3">
                <div className="relative w-full sm:w-64">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition duration-150 ease-in-out"
                    placeholder="Cari Jenis Produksi..."
                    value={search}
                    onChange={handleSearch}
                  />
                </div>
                <PrimaryButton
                  onClick={openCreateModal}
                  className="justify-center whitespace-nowrap bg-primary-600 hover:bg-primary-700 text-white shadow-primary-200"
                >
                  <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Tambah
                </PrimaryButton>
              </div>
            </div>

            {/* Table Section */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Nama Jenis Produksi
                    </th>
                    <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {jenisProduksi.data.length > 0 ? (
                    jenisProduksi.data.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {item.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => openEditModal(item)}
                              className="p-2 text-primary-600 hover:bg-primary-100 rounded-lg transition-colors shadow-sm bg-primary-50"
                              title="Edit"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => openDeleteModal(item)}
                              className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors shadow-sm bg-red-50"
                              title="Hapus"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="px-6 py-12 text-center text-sm text-gray-500">
                        <div className="flex flex-col items-center justify-center">
                          <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          <p className="text-gray-500 text-lg font-medium">Tidak ada data Jenis Produksi</p>
                          <p className="text-gray-400">Silakan tambahkan data baru.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Section */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 rounded-b-2xl">
              <Pagination links={jenisProduksi.links} />
            </div>
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Modal show={isModalOpen} onClose={closeModal}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              {modalMode === 'create' ? 'Tambah Jenis Produksi' : 'Edit Jenis Produksi'}
            </h2>
            <button onClick={closeModal} className="text-gray-400 hover:text-gray-500 transition-colors">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <InputLabel htmlFor="name" value="Nama Jenis Produksi" />
              <TextInput
                id="name"
                type="text"
                className="mt-1 block w-full"
                value={data.name}
                onChange={(e) => setData('name', e.target.value)}
                placeholder="Contoh: Log"
              />
              <InputError message={errors.name} className="mt-2" />
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <SecondaryButton onClick={closeModal} className="rounded-xl px-6 py-3 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 h-[48px] transition-all duration-200 shadow-sm font-medium">
                Batal
              </SecondaryButton>
              <PrimaryButton disabled={processing} className="bg-primary-600 hover:bg-primary-700 text-white shadow-primary-200 h-[48px]">
                {modalMode === 'create' ? 'Simpan Data' : 'Perbarui Data'}
              </PrimaryButton>
            </div>
          </form>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={isDeleteModalOpen} onClose={closeDeleteModal}>
        <div className="p-6 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Hapus Data Jenis Produksi?
          </h2>
          <p className="text-gray-500 mb-6">
            Apakah Anda yakin ingin menghapus data <span className="font-semibold text-gray-800">"{currentData?.name}"</span>?
          </p>
          <div className="flex justify-center gap-3">
            <SecondaryButton onClick={closeDeleteModal} className="rounded-xl px-6 py-3 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 h-[48px] transition-all duration-200 shadow-sm font-medium">
              Batal
            </SecondaryButton>
            <DangerButton onClick={handleDelete} disabled={processing}>
              Ya, Hapus
            </DangerButton>
          </div>
        </div>
      </Modal>
    </AuthenticatedLayout>
  );
}
