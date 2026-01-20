import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { useState, useCallback, useEffect } from 'react';
import { debounce } from 'lodash';

const MySwal = withReactContent(Swal);

export default function Index({ auth, users, filters }) {
    const [isLoading, setIsLoading] = useState(false);
    const [loadingText, setLoadingText] = useState('Memproses...');
    const [searchQuery, setSearchQuery] = useState(filters.search || '');

    // Debounced search handler
    const handleSearch = useCallback(
        debounce((query) => {
            router.get(
                route('users.index'),
                { search: query },
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                }
            );
        }, 500),
        []
    );

    const onSearchChange = (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        handleSearch(query);
    };

    const handleDelete = (id) => {
        MySwal.fire({
            title: 'Apakah Anda yakin?',
            text: "User yang dihapus akan tidak bisa dikembalikan!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#15803d',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Ya, hapus!',
            cancelButtonText: 'Batal',
            background: '#ffffff',
            borderRadius: '1.25rem',
            customClass: {
                title: 'font-bold text-gray-900',
                popup: 'rounded-3xl shadow-2xl border-none',
                confirmButton: 'rounded-xl font-bold px-6 py-2.5',
                cancelButton: 'rounded-xl font-bold px-6 py-2.5'
            }
        }).then((result) => {
            if (result.isConfirmed) {
                setLoadingText('Menghapus User...');
                setIsLoading(true);
                router.delete(route('users.destroy', id), {
                    preserveScroll: true,
                    onSuccess: () => {
                        setIsLoading(false);
                        MySwal.fire({
                            title: 'Terhapus!',
                            text: 'User telah berhasil dihapus.',
                            icon: 'success',
                            confirmButtonColor: '#15803d',
                            timer: 2000,
                            timerProgressBar: true,
                            showConfirmButton: false,
                        });
                    },
                    onError: () => setIsLoading(false),
                    onFinish: () => setIsLoading(false)
                });
            }
        });
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Manajemen User</h2>}
        >
            <Head title="Manajemen User" />

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
                {/* Header Section */}
                <div className="bg-gradient-to-r from-primary-800 to-primary-600 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
                    <div className="absolute right-0 top-0 h-full w-1/3 bg-white/5 transform skew-x-12 shrink-0"></div>
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h3 className="text-2xl font-bold font-display">Data Pengguna</h3>
                            <p className="mt-1 text-primary-100 opacity-90 max-w-xl text-sm">
                                Kelola data pengguna aplikasi, termasuk peran dan hak akses.
                            </p>
                        </div>
                        <Link href={route('users.create')} className="shrink-0">
                            <button className="flex items-center gap-2 px-5 py-2.5 bg-white text-primary-700 rounded-xl font-bold text-sm shadow-sm hover:bg-primary-50 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Tambah User
                            </button>
                        </Link>
                    </div>
                </div>

                {/* Table Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                        <div className="flex items-center gap-4">
                            <h3 className="font-bold text-gray-800">Daftar User</h3>
                            <div className="h-6 w-px bg-gray-200"></div>
                            <div className="text-sm text-gray-400 font-bold bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                                {users.total} User Terdaftar
                            </div>
                        </div>

                        {/* Search Input */}
                        <div className="relative w-full md:w-64">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-all"
                                placeholder="Cari nama, email..."
                                value={searchQuery}
                                onChange={onSearchChange}
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50/50">
                                    <th className="px-6 py-5 text-xs font-bold text-gray-500 uppercase tracking-wider">User Info</th>
                                    <th className="px-6 py-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Username</th>
                                    <th className="px-6 py-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Role & Hak Akses</th>
                                    <th className="px-6 py-5 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {users.data.map((user) => (
                                    <tr key={user.id} className="group hover:bg-gray-50/80 transition-all duration-200">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="relative">
                                                    <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-primary-900/10 ring-2 ring-white group-hover:scale-105 transition-transform duration-300">
                                                        {user.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-gray-900 text-sm group-hover:text-primary-700 transition-colors">{user.name}</span>
                                                    <span className="text-xs text-gray-500 font-medium">{user.username}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="inline-flex items-center px-3 py-1 rounded-lg bg-gray-50 border border-gray-100 text-gray-600 font-mono text-xs font-medium">
                                                {user.username}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            {user.roles.map((role, index) => {
                                                let badgeClass = "bg-gray-100 text-gray-600 border-gray-200";
                                                if (role.name === 'admin' || role.name === 'super-admin') {
                                                    badgeClass = "bg-rose-50 text-rose-600 border-rose-100";
                                                } else if (role.name === 'viewer' || role.name === 'guest') {
                                                    badgeClass = "bg-blue-50 text-blue-600 border-blue-100";
                                                } else {
                                                    badgeClass = "bg-emerald-50 text-emerald-600 border-emerald-100";
                                                }

                                                return (
                                                    <span key={index} className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide border ${badgeClass}`}>
                                                        {role.description}
                                                    </span>
                                                );
                                            })}
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center justify-center gap-2">
                                                <Link
                                                    href={route('users.edit', user.id)}
                                                    className="p-2 bg-white text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200 border border-transparent hover:border-primary-100 shadow-sm hover:shadow-md"
                                                    title="Edit User"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                    </svg>
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(user.id)}
                                                    className="p-2 bg-white text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 border border-transparent hover:border-red-100 shadow-sm hover:shadow-md"
                                                    title="Hapus User"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {users.data.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="text-center py-20">
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="h-24 w-24 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                    </svg>
                                                </div>
                                                <h3 className="text-lg font-bold text-gray-900">Belum ada user</h3>
                                                <p className="text-gray-500 text-sm mt-1">Silakan tambahkan user baru untuk memulai.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="text-sm text-gray-500">
                                Menampilkan <span className="font-bold text-gray-700">{users.from || 0}</span> sampai <span className="font-bold text-gray-700">{users.to || 0}</span> dari <span className="font-bold text-gray-700">{users.total}</span> data
                            </div>
                            <div className="flex items-center gap-1">
                                {users.links.map((link, key) => (
                                    <Link
                                        key={key}
                                        href={link.url || '#'}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${link.active
                                            ? 'bg-primary-600 text-white shadow-sm shadow-primary-500/30'
                                            : link.url
                                                ? 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                                                : 'text-gray-400 cursor-not-allowed'
                                            }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                        preserveScroll
                                        preserveState
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
