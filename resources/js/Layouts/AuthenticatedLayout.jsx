import { useState } from 'react';
import ApplicationLogo from '@/Components/ApplicationLogo';
import Dropdown from '@/Components/Dropdown';
import NavLink from '@/Components/NavLink';
import ResponsiveNavLink from '@/Components/ResponsiveNavLink';
import { Link, usePage } from '@inertiajs/react';
import { useEffect } from 'react';

export default function Authenticated({ user, header, children }) {

    const [showingNavigationDropdown, setShowingNavigationDropdown] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [openMenus, setOpenMenus] = useState({
        pembinaan: route().current('rehab-lahan.*') || route().current('penghijauan-lingkungan.*') || route().current('rehab-manggrove.*') || route().current('rhl-teknis.*') || route().current('reboisasi-ps.*'),
        pembinaan_mobile: route().current('rehab-lahan.*') || route().current('penghijauan-lingkungan.*') || route().current('rehab-manggrove.*') || route().current('rhl-teknis.*') || route().current('reboisasi-ps.*'),
        perlindungan: route().current('pengunjung-wisata.*') || route().current('kebakaran-hutan.*'),
        perlindungan_mobile: route().current('pengunjung-wisata.*') || route().current('kebakaran-hutan.*'),
        bina_usaha: route().current('hasil-hutan-kayu.*') || route().current('hasil-hutan-bukan-kayu.*') || route().current('pbphh.*') || route().current('bina-usaha.*') || route().current('realisasi-pnbp.*'),
        bina_usaha_mobile: route().current('hasil-hutan-kayu.*') || route().current('hasil-hutan-bukan-kayu.*') || route().current('pbphh.*') || route().current('bina-usaha.*') || route().current('realisasi-pnbp.*'),
        hutan_negara: route().current('hasil-hutan-kayu.*', { forest_type: 'Hutan Negara' }) || route().current('hasil-hutan-bukan-kayu.*', { forest_type: 'Hutan Negara' }) || window.location.search.includes('Hutan%20Negara'),
        hutan_negara_mobile: route().current('hasil-hutan-kayu.*', { forest_type: 'Hutan Negara' }) || route().current('hasil-hutan-bukan-kayu.*', { forest_type: 'Hutan Negara' }) || window.location.search.includes('Hutan%20Negara'),
        hutan_rakyat: route().current('hasil-hutan-kayu.*', { forest_type: 'Hutan Rakyat' }) || route().current('hasil-hutan-bukan-kayu.*', { forest_type: 'Hutan Rakyat' }) || window.location.search.includes('Hutan%20Rakyat') || window.location.search.includes('Hutan+Rakyat'),
        hutan_rakyat_mobile: route().current('hasil-hutan-kayu.*', { forest_type: 'Hutan Rakyat' }) || route().current('hasil-hutan-bukan-kayu.*', { forest_type: 'Hutan Rakyat' }) || window.location.search.includes('Hutan%20Rakyat') || window.location.search.includes('Hutan+Rakyat'),
        perhutanan_sosial: route().current('hasil-hutan-kayu.*', { forest_type: 'Perhutanan Sosial' }) || route().current('hasil-hutan-bukan-kayu.*', { forest_type: 'Perhutanan Sosial' }) || window.location.search.includes('Perhutanan%20Sosial') || window.location.search.includes('Perhutanan+Sosial'),
        perhutanan_sosial_mobile: route().current('hasil-hutan-kayu.*', { forest_type: 'Perhutanan Sosial' }) || route().current('hasil-hutan-bukan-kayu.*', { forest_type: 'Perhutanan Sosial' }) || window.location.search.includes('Perhutanan%20Sosial') || window.location.search.includes('Perhutanan+Sosial'),
        pemberdayaan: route().current('skps.*') || route().current('kups.*') || route().current('nilai-ekonomi.*') || route().current('perkembangan-kth.*') || route().current('nilai-transaksi-ekonomi.*'),
        pemberdayaan_mobile: route().current('skps.*') || route().current('kups.*') || route().current('nilai-ekonomi.*') || route().current('perkembangan-kth.*') || route().current('nilai-transaksi-ekonomi.*'),
        kelembagaan_perhutanan_sosial: route().current('skps.*') || route().current('kups.*') || route().current('nilai-ekonomi.*'),
        kelembagaan_perhutanan_sosial: route().current('skps.*') || route().current('kups.*') || route().current('nilai-ekonomi.*'),
        kelembagaan_hutan_rakyat: route().current('perkembangan-kth.*') || route().current('nilai-transaksi-ekonomi.*'),
        data_master: route().current('provinces.*') || route().current('regencies.*') || route().current('districts.*') || route().current('villages.*'),
        data_master_mobile: route().current('provinces.*') || route().current('regencies.*') || route().current('districts.*') || route().current('villages.*')
    });

    const { flash, auth } = usePage().props;
    const [showFlash, setShowFlash] = useState(false);

    useEffect(() => {
        if (flash.success || flash.error) {
            setShowFlash(true);
            const timer = setTimeout(() => {
                setShowFlash(false);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [flash]);

    const isImpersonating = auth?.is_impersonating;

    const toggleMenu = (menu) => {
        if (isSidebarCollapsed) {
            setIsSidebarCollapsed(false);
            setOpenMenus(prev => ({ ...prev, [menu]: true }));
        } else {
            setOpenMenus(prev => ({ ...prev, [menu]: !prev[menu] }));
        }
    };

    const hasPermission = (permission) => {
        if (!user || !user.permissions) return false;
        return user.roles.includes('admin') || user.permissions.includes(permission);
    };

    const hasAnyPermission = (permissions) => {
        if (!user || !user.permissions) return false;
        return user.roles.includes('admin') || permissions.some(p => user.permissions.includes(p));
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {isImpersonating && (
                <div className="bg-red-600 text-white px-4 py-2 text-center text-sm font-bold flex items-center justify-center gap-4 fixed w-full z-[60] shadow-md">
                    <span>⚠️ Anda sedang login sebagai user lain ({user.name}).</span>
                    <a
                        href={route('impersonate.leave')}
                        className="bg-white text-red-600 px-3 py-1 rounded-full text-xs hover:bg-red-50 transition-colors uppercase tracking-wider"
                    >
                        Kembali ke Akun Asli
                    </a>
                </div>
            )}
            <div className={`flex flex-1 ${isImpersonating ? 'mt-10' : ''}`}>
                {/* Sidebar Desktop */}
                <aside className={`fixed inset-y-0 left-0 z-50 bg-gradient-to-b from-primary-800 to-primary-900 shadow-xl hidden lg:flex flex-col transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}>
                    {/* Logo Area */}
                    <div className={`flex items-center h-20 border-b border-white/10 bg-primary-800/50 backdrop-blur-sm transition-all duration-300 ${isSidebarCollapsed ? 'px-4 justify-center' : 'px-6'}`}>
                        <Link href="/">
                            <ApplicationLogo
                                collapsed={isSidebarCollapsed}
                                className={`block h-10 w-auto transition-all duration-300 ${isSidebarCollapsed ? 'scale-90' : ''}`}
                            />
                        </Link>
                    </div>

                    {/* Navigation Links */}
                    <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1.5 custom-scrollbar">
                        {/* Dashboard */}
                        <Link
                            href={route('dashboard')}
                            className={`group relative flex items-center py-3 rounded-xl transition-all duration-200 border ${isSidebarCollapsed ? 'justify-center px-0' : 'px-4'
                                } ${route().current('dashboard')
                                    ? 'bg-white/10 border-white/20 text-white shadow-lg'
                                    : 'border-transparent text-primary-100 hover:bg-white/5 hover:border-white/10 hover:text-white'
                                }`}
                            title={isSidebarCollapsed ? 'Dashboard' : ''}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className={`flex-shrink-0 h-5 w-5 transition-colors ${isSidebarCollapsed ? 'mx-auto' : 'mr-3'} ${route().current('dashboard') ? 'text-white' : 'text-primary-300 group-hover:text-white'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                            </svg>
                            {!isSidebarCollapsed && <span className="text-sm font-semibold">Dashboard</span>}
                        </Link>

                        <div className="pt-4 pb-2 px-4 uppercase text-[10px] font-bold text-primary-400 tracking-widest">
                            {!isSidebarCollapsed ? 'Menu Utama' : '•••'}
                        </div>

                        {/* Pembinaan Hutan dan Lahan (Dropdown) */}
                        {hasAnyPermission(['rehab.view', 'penghijauan.view']) && (
                            <div className="space-y-1">
                                <button
                                    onClick={() => toggleMenu('pembinaan')}
                                    className={`w-full group relative flex items-center py-3 rounded-xl transition-all duration-200 border ${isSidebarCollapsed ? 'justify-center px-0' : 'px-4'
                                        } ${openMenus['pembinaan'] || route().current('rehab-lahan.*') || route().current('penghijauan-lingkungan.*') || route().current('rehab-manggrove.*') || route().current('rhl-teknis.*')
                                            ? 'bg-white/10 border-white/20 text-white shadow-sm'
                                            : 'border-transparent text-primary-100 hover:bg-white/5 hover:border-white/10 hover:text-white'
                                        }`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className={`flex-shrink-0 h-5 w-5 transition-colors ${isSidebarCollapsed ? 'mx-auto' : 'mr-3'} ${openMenus['pembinaan'] ? 'text-white' : 'text-primary-300 group-hover:text-white'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    {!isSidebarCollapsed && (
                                        <>
                                            <span className="text-sm font-semibold flex-1 text-left">Pembinaan Hutan</span>
                                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform duration-200 ${openMenus['pembinaan'] ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </>
                                    )}
                                </button>

                                {!isSidebarCollapsed && openMenus['pembinaan'] && (
                                    <div className="ml-9 space-y-1 border-l border-white/10 pl-3 py-1">
                                        {[
                                            { name: 'Rehabilitasi Lahan', route: 'rehab-lahan.index', pattern: 'rehab-lahan.*', permission: 'rehab.view' },
                                            { name: 'Penghijauan Lingkungan', route: 'penghijauan-lingkungan.index', pattern: 'penghijauan-lingkungan.*', permission: 'penghijauan.view' },
                                            { name: 'Rehabilitasi Manggrove', route: 'rehab-manggrove.index', pattern: 'rehab-manggrove.*', permission: 'rehab.view' },
                                            { name: 'Bangunan Konservasi Tanah & Air', route: 'rhl-teknis.index', pattern: 'rhl-teknis.*', permission: 'rehab.view' },
                                            { name: 'Reboisasi Area Perhutanan Sosial', route: 'reboisasi-ps.index', pattern: 'reboisasi-ps.*', permission: 'rehab.view' }
                                        ]
                                            .filter(item => hasPermission(item.permission))
                                            .map((item) => (
                                                <Link
                                                    key={item.name}
                                                    href={item.route !== '#' ? route(item.route) : '#'}
                                                    className={`block py-2 text-xs font-medium transition-colors ${route().current(item.pattern)
                                                        ? 'text-white font-bold'
                                                        : 'text-primary-200 hover:text-white'
                                                        }`}
                                                >
                                                    {item.name}
                                                </Link>
                                            ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Perlindungan dan Pelestarian Hutan */}
                        {/* Perlindungan Hutan (Dropdown) */}
                        {hasPermission('perlindungan.view') && (
                            <div className="space-y-1">
                                <button
                                    onClick={() => toggleMenu('perlindungan')}
                                    className={`w-full group relative flex items-center py-3 rounded-xl transition-all duration-200 border ${isSidebarCollapsed ? 'justify-center px-0' : 'px-4'
                                        } ${openMenus['perlindungan'] || route().current('pengunjung-wisata.*') || route().current('kebakaran-hutan.*')
                                            ? 'bg-white/10 border-white/20 text-white shadow-sm'
                                            : 'border-transparent text-primary-100 hover:bg-white/5 hover:border-white/10 hover:text-white'
                                        }`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className={`flex-shrink-0 h-5 w-5 transition-colors ${isSidebarCollapsed ? 'mx-auto' : 'mr-3'} ${openMenus['perlindungan'] ? 'text-white' : 'text-primary-300 group-hover:text-white'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                    {!isSidebarCollapsed && (
                                        <>
                                            <span className="text-sm font-semibold flex-1 text-left">Perlindungan Hutan & Jasa Lingkungan</span>
                                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform duration-200 ${openMenus['perlindungan'] ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </>
                                    )}
                                </button>

                                {!isSidebarCollapsed && openMenus['perlindungan'] && (
                                    <div className="ml-9 space-y-1 border-l border-white/10 pl-3 py-1">
                                        {[
                                            { name: 'Kebakaran Hutan', route: route('kebakaran-hutan.index'), pattern: 'kebakaran-hutan.*' },
                                            { name: 'Pengunjung Objek Wisata', route: route('pengunjung-wisata.index'), pattern: 'pengunjung-wisata.*' }
                                        ].map((item) => (
                                            <Link
                                                key={item.name}
                                                href={item.route}
                                                className={`block py-2 text-xs font-medium transition-colors ${route().current(item.pattern)
                                                    ? 'text-white font-bold'
                                                    : 'text-primary-200 hover:text-white'
                                                    }`}
                                            >
                                                {item.name}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Bina Usaha Kehutanan */}
                        {/* Bina Usaha Kehutanan (Dropdown) */}
                        {hasPermission('bina-usaha.view') && (
                            <div className="space-y-1">
                                <button
                                    onClick={() => toggleMenu('bina_usaha')}
                                    className={`w-full group relative flex items-center py-3 rounded-xl transition-all duration-200 border ${isSidebarCollapsed ? 'justify-center px-0' : 'px-4'
                                        } ${openMenus['bina_usaha']
                                            ? 'bg-white/10 border-white/20 text-white shadow-sm'
                                            : 'border-transparent text-primary-100 hover:bg-white/5 hover:border-white/10 hover:text-white'
                                        }`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className={`flex-shrink-0 h-5 w-5 transition-colors ${isSidebarCollapsed ? 'mx-auto' : 'mr-3'} ${openMenus['bina_usaha'] ? 'text-white' : 'text-primary-300 group-hover:text-white'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    {!isSidebarCollapsed && (
                                        <>
                                            <span className="text-sm font-semibold flex-1 text-left">Bina Usaha</span>
                                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform duration-200 ${openMenus['bina_usaha'] ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </>
                                    )}
                                </button>

                                {!isSidebarCollapsed && openMenus['bina_usaha'] && (
                                    <div className="ml-9 space-y-1 border-l border-white/10 pl-3 py-1">
                                        {[
                                            {
                                                name: 'Produksi dari Hutan Negara',
                                                key: 'hutan_negara',
                                                children: [
                                                    { name: 'Hasil Hutan Kayu', route: route('hasil-hutan-kayu.index', { forest_type: 'Hutan Negara' }), pattern: 'hasil-hutan-kayu.*' },
                                                    { name: 'Hasil Hutan Bukan Kayu', route: route('hasil-hutan-bukan-kayu.index', { forest_type: 'Hutan Negara' }), pattern: 'hasil-hutan-bukan-kayu.*' }
                                                ]
                                            },
                                            {
                                                name: 'Produksi dari Perhutanan Sosial',
                                                key: 'perhutanan_sosial',
                                                children: [
                                                    { name: 'Hasil Hutan Kayu', route: route('hasil-hutan-kayu.index', { forest_type: 'Perhutanan Sosial' }), pattern: 'hasil-hutan-kayu.*' },
                                                    { name: 'Hasil Hutan Bukan Kayu', route: route('hasil-hutan-bukan-kayu.index', { forest_type: 'Perhutanan Sosial' }), pattern: 'hasil-hutan-bukan-kayu.*' }
                                                ]
                                            },
                                            {
                                                name: 'Produksi dari Hutan Rakyat',
                                                key: 'hutan_rakyat',
                                                children: [
                                                    { name: 'Hasil Hutan Kayu', route: route('hasil-hutan-kayu.index', { forest_type: 'Hutan Rakyat' }), pattern: 'hasil-hutan-kayu.*' },
                                                    { name: 'Hasil Hutan Bukan Kayu', route: route('hasil-hutan-bukan-kayu.index', { forest_type: 'Hutan Rakyat' }), pattern: 'hasil-hutan-bukan-kayu.*' }
                                                ]
                                            },
                                            { name: 'PBPHH', route: route('pbphh.index'), pattern: 'pbphh.*' },
                                            { name: 'PNBP', route: route('realisasi-pnbp.index'), pattern: 'realisasi-pnbp.*' }
                                        ].map((item) => (
                                            <div key={item.name}>
                                                {item.children ? (
                                                    <div>
                                                        <button
                                                            onClick={() => toggleMenu(item.key)}
                                                            className="flex w-full items-center py-2 text-xs font-medium text-primary-200 hover:text-white transition-colors"
                                                        >
                                                            <span className="flex-1 text-left">{item.name}</span>
                                                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 ml-2 transition-transform duration-200 ${openMenus[item.key] ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                            </svg>
                                                        </button>
                                                        {openMenus[item.key] && (
                                                            <div className="ml-3 space-y-1 border-l border-white/10 pl-3">
                                                                {item.children.map((child) => {
                                                                    const isActive = child.pattern ? route().current(child.pattern) : (child.route !== '#' && window.location.href === child.route);
                                                                    return (
                                                                        <Link
                                                                            key={child.name}
                                                                            href={child.route}
                                                                            className={`block py-1.5 text-xs transition-colors ${isActive
                                                                                ? 'text-white font-bold'
                                                                                : 'text-primary-300 hover:text-white'
                                                                                }`}
                                                                        >
                                                                            {child.name}
                                                                        </Link>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <Link
                                                        href={item.route}
                                                        className={`block py-2 text-xs transition-colors ${item.pattern && route().current(item.pattern)
                                                            ? 'text-white font-bold'
                                                            : 'text-primary-200 hover:text-white font-medium'
                                                            }`}
                                                    >
                                                        {item.name}
                                                    </Link>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Pemberdayaan Masyarakat */}
                        {/* Pemberdayaan Masyarakat (Dropdown) */}
                        {hasPermission('pemberdayaan.view') && (
                            <div className="space-y-1">
                                <button
                                    onClick={() => toggleMenu('pemberdayaan')}
                                    className={`w-full group relative flex items-center py-3 rounded-xl transition-all duration-200 border ${isSidebarCollapsed ? 'justify-center px-0' : 'px-4'
                                        } ${openMenus['pemberdayaan']
                                            ? 'bg-white/10 border-white/20 text-white shadow-sm'
                                            : 'border-transparent text-primary-100 hover:bg-white/5 hover:border-white/10 hover:text-white'
                                        }`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className={`flex-shrink-0 h-5 w-5 transition-colors ${isSidebarCollapsed ? 'mx-auto' : 'mr-3'} ${openMenus['pemberdayaan'] ? 'text-white' : 'text-primary-300 group-hover:text-white'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                    {!isSidebarCollapsed && (
                                        <>
                                            <span className="text-sm font-semibold flex-1 text-left">Pemberdayaan Masyarakat</span>
                                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform duration-200 ${openMenus['pemberdayaan'] ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </>
                                    )}
                                </button>

                                {!isSidebarCollapsed && openMenus['pemberdayaan'] && (
                                    <div className="ml-9 space-y-1 border-l border-white/10 pl-3 py-1">
                                        {[
                                            {
                                                name: 'Kelembagaan Perhutanan Sosial',
                                                key: 'kelembagaan_perhutanan_sosial',
                                                children: [
                                                    { name: 'Perkembangan SK PS', route: route('skps.index'), pattern: 'skps.*' },
                                                    { name: 'Perkembangan KUPS', route: route('kups.index'), pattern: 'kups.*' },
                                                    { name: 'Nilai Ekonomi (NEKON)', route: route('nilai-ekonomi.index'), pattern: 'nilai-ekonomi.*' }
                                                ]
                                            },
                                            {
                                                name: 'Kelembagaan Hutan Rakyat',
                                                key: 'kelembagaan_hutan_rakyat',
                                                children: [
                                                    { name: 'Perkembangan KTH', route: route('perkembangan-kth.index'), pattern: 'perkembangan-kth.*' },
                                                    { name: 'Nilai Transaksi Ekonomi', route: route('nilai-transaksi-ekonomi.index'), pattern: 'nilai-transaksi-ekonomi.*' }
                                                ]
                                            }
                                        ].map((item) => (
                                            <div key={item.name}>
                                                {item.children ? (
                                                    <div>
                                                        <button
                                                            onClick={() => toggleMenu(item.key)}
                                                            className="flex w-full items-center py-2 text-xs font-medium text-primary-200 hover:text-white transition-colors"
                                                        >
                                                            <span className="flex-1 text-left">{item.name}</span>
                                                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 ml-2 transition-transform duration-200 ${openMenus[item.key] ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                            </svg>
                                                        </button>
                                                        {openMenus[item.key] && (
                                                            <div className="ml-3 space-y-1 border-l border-white/10 pl-3">
                                                                {item.children.map((child) => {
                                                                    const isActive = child.pattern ? route().current(child.pattern) : (child.route !== '#' && window.location.href === child.route);
                                                                    return (
                                                                        <Link
                                                                            key={child.name}
                                                                            href={child.route}
                                                                            className={`block py-1.5 text-xs transition-colors ${isActive
                                                                                ? 'text-white font-bold'
                                                                                : 'text-primary-300 hover:text-white'
                                                                                }`}
                                                                        >
                                                                            {child.name}
                                                                        </Link>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <Link
                                                        href={item.route}
                                                        className={`block py-2 text-xs transition-colors ${item.pattern && route().current(item.pattern)
                                                            ? 'text-white font-bold'
                                                            : 'text-primary-200 hover:text-white font-medium'
                                                            }`}
                                                    >
                                                        {item.name}
                                                    </Link>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Data Master */}
                        {user.roles.includes('admin') && (
                            <div className="space-y-1">
                                <button
                                    onClick={() => toggleMenu('data_master')}
                                    className={`w-full group relative flex items-center py-3 rounded-xl transition-all duration-200 border ${isSidebarCollapsed ? 'justify-center px-0' : 'px-4'
                                        } ${openMenus['data_master']
                                            ? 'bg-white/10 border-white/20 text-white shadow-sm'
                                            : 'border-transparent text-primary-100 hover:bg-white/5 hover:border-white/10 hover:text-white'
                                        }`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className={`flex-shrink-0 h-5 w-5 transition-colors ${isSidebarCollapsed ? 'mx-auto' : 'mr-3'} ${openMenus['data_master'] ? 'text-white' : 'text-primary-300 group-hover:text-white'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                    </svg>
                                    {!isSidebarCollapsed && (
                                        <>
                                            <span className="text-sm font-semibold flex-1 text-left">Data Master</span>
                                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform duration-200 ${openMenus['data_master'] ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </>
                                    )}
                                </button>

                                {!isSidebarCollapsed && openMenus['data_master'] && (
                                    <div className="ml-9 space-y-1 border-l border-white/10 pl-3 py-1">
                                        {[
                                            { name: 'Data Provinsi', route: route('provinces.index'), pattern: 'provinces.*' },
                                            { name: 'Data Kabupaten/Kota', route: route('regencies.index'), pattern: 'regencies.*' },
                                            { name: 'Data Kecamatan', route: route('districts.index'), pattern: 'districts.*' },
                                            { name: 'Data Desa/Kelurahan', route: route('villages.index'), pattern: 'villages.*' }
                                        ].map((item) => (
                                            <Link
                                                key={item.name}
                                                href={item.route}
                                                className={`block py-2 text-xs font-medium transition-colors ${route().current(item.pattern)
                                                    ? 'text-white font-bold'
                                                    : 'text-primary-200 hover:text-white'
                                                    }`}
                                            >
                                                {item.name}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {hasPermission('users.view') && (
                            <>
                                <div className="pt-4 pb-2 px-4 uppercase text-[10px] font-bold text-primary-400 tracking-widest">
                                    {!isSidebarCollapsed ? 'Pengaturan' : '•••'}
                                </div>

                                <Link
                                    href={route('users.index')}
                                    className={`group relative flex items-center py-3 rounded-xl transition-all duration-200 border ${isSidebarCollapsed ? 'justify-center px-0' : 'px-4'
                                        } ${route().current('users.*')
                                            ? 'bg-white/10 border-white/20 text-white shadow-lg'
                                            : 'border-transparent text-primary-100 hover:bg-white/5 hover:border-white/10 hover:text-white'
                                        }`}
                                    title={isSidebarCollapsed ? 'Manajemen User' : ''}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className={`flex-shrink-0 h-5 w-5 transition-colors ${isSidebarCollapsed ? 'mx-auto' : 'mr-3'} ${route().current('users.*') ? 'text-white' : 'text-primary-300 group-hover:text-white'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                    {!isSidebarCollapsed && <span className="text-sm font-semibold">Manajemen User</span>}
                                </Link>

                                {user.roles.includes('admin') && (
                                    <Link
                                        href={route('activity-log.index')}
                                        className={`group relative flex items-center py-3 rounded-xl transition-all duration-200 border ${isSidebarCollapsed ? 'justify-center px-0' : 'px-4'
                                            } ${route().current('activity-log.*')
                                                ? 'bg-white/10 border-white/20 text-white shadow-lg'
                                                : 'border-transparent text-primary-100 hover:bg-white/5 hover:border-white/10 hover:text-white'
                                            }`}
                                        title={isSidebarCollapsed ? 'Log Aktivitas' : ''}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className={`flex-shrink-0 h-5 w-5 transition-colors ${isSidebarCollapsed ? 'mx-auto' : 'mr-3'} ${route().current('activity-log.*') ? 'text-white' : 'text-primary-300 group-hover:text-white'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        {!isSidebarCollapsed && <span className="text-sm font-semibold">Log Aktivitas</span>}
                                    </Link>
                                )}
                            </>
                        )}
                    </nav>

                    {/* Sidebar Footer / Profile */}
                    <div className={`p-4 border-t border-white/10 bg-primary-800/30 transition-all duration-300 ${isSidebarCollapsed ? 'flex flex-col items-center' : ''}`}>
                        {!isSidebarCollapsed ? (
                            <>
                                <div className="flex items-center gap-3 mb-4 min-w-0">
                                    <div className="flex-shrink-0">
                                        <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-primary-600 to-primary-400 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                                            {user.name.charAt(0).toUpperCase()}
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-white truncate">
                                            {user.name}
                                        </p>
                                        <p className="text-[10px] text-primary-300 uppercase tracking-widest font-bold">
                                            {user.roles_description || 'User'}
                                        </p>
                                    </div>
                                </div>
                                <Link
                                    href={route('logout')}
                                    method="post"
                                    as="button"
                                    className="w-full flex items-center justify-center px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-primary-100 hover:bg-primary-600 hover:text-white hover:border-transparent transition-all duration-300 cursor-pointer group shadow-sm"
                                >
                                    <svg className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                    Keluar Sesi
                                </Link>
                            </>
                        ) : (
                            <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-primary-600 to-primary-400 flex items-center justify-center text-white font-bold text-sm shadow-lg cursor-pointer hover:ring-2 hover:ring-white/20 transition-all" title={user.name}>
                                {user.name.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                </aside>

                {/* Mobile Sidebar Overlay */}
                <div className={`fixed inset-0 z-40 lg:hidden ${showingNavigationDropdown ? 'block' : 'hidden'}`} onClick={() => setShowingNavigationDropdown(false)}>
                    <div className="absolute inset-0 bg-gray-600 bg-opacity-75"></div>
                </div>

                {/* Mobile Sidebar */}
                <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-primary-900 shadow-xl lg:hidden transform transition-transform duration-300 ease-in-out ${showingNavigationDropdown ? 'translate-x-0' : '-translate-x-full'}`}>
                    <div className="flex items-center justify-between h-16 px-4 border-b border-primary-700">
                        <span className="text-white font-bold text-lg">CDK Wilayah Trenggalek</span>
                        <button onClick={() => setShowingNavigationDropdown(false)} className="text-primary-300 hover:text-white">
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <nav className="px-4 py-6 space-y-2 overflow-y-auto max-h-[calc(100vh-80px)] custom-scrollbar">
                        <Link
                            href={route('dashboard')}
                            onClick={() => setShowingNavigationDropdown(false)}
                            className={`flex items-center px-4 py-3 rounded-xl text-sm font-semibold border transition-all ${route().current('dashboard')
                                ? 'bg-white/10 border-white/20 text-white'
                                : 'border-transparent text-primary-100 hover:bg-white/5 hover:border-white/10'
                                }`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-primary-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                            </svg>
                            Dashboard
                        </Link>

                        <div className="pt-4 pb-2 px-4 uppercase text-[10px] font-bold text-primary-400 tracking-widest">
                            Menu Utama
                        </div>

                        {/* Pembinaan Dropdown Mobile */}
                        {hasAnyPermission(['rehab.view', 'penghijauan.view']) && (
                            <div className="space-y-1">
                                <button
                                    onClick={() => toggleMenu('pembinaan_mobile')}
                                    className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-semibold border transition-all ${openMenus['pembinaan_mobile'] || route().current('rehab-lahan.*') || route().current('penghijauan-lingkungan.*') || route().current('rehab-manggrove.*') || route().current('rhl-teknis.*')
                                        ? 'bg-white/10 border-white/20 text-white'
                                        : 'border-transparent text-primary-100 hover:bg-white/5 hover:border-white/10'
                                        }`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-primary-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <span className="flex-1 text-left">Pembinaan Hutan</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${openMenus['pembinaan_mobile'] ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                {openMenus['pembinaan_mobile'] && (
                                    <div className="ml-9 space-y-1 border-l border-white/10 pl-3 py-1">
                                        {[
                                            { name: 'Rehabilitasi Lahan', route: 'rehab-lahan.index', pattern: 'rehab-lahan.*', permission: 'rehab.view' },
                                            { name: 'Penghijauan Lingkungan', route: 'penghijauan-lingkungan.index', pattern: 'penghijauan-lingkungan.*', permission: 'penghijauan.view' },
                                            { name: 'Rehabilitasi Manggrove', route: 'rehab-manggrove.index', pattern: 'rehab-manggrove.*', permission: 'rehab.view' },
                                            { name: 'Bangunan Konservasi Tanah & Air', route: 'rhl-teknis.index', pattern: 'rhl-teknis.*', permission: 'rehab.view' },
                                            { name: 'Reboisasi Area Perhutanan Sosial', route: 'reboisasi-ps.index', pattern: 'reboisasi-ps.*', permission: 'rehab.view' }
                                        ]
                                            .filter(item => hasPermission(item.permission))
                                            .map((item) => (
                                                <Link
                                                    key={item.name}
                                                    href={item.route !== '#' ? route(item.route) : '#'}
                                                    onClick={() => setShowingNavigationDropdown(false)}
                                                    className={`block py-2 text-[13px] font-medium transition-colors ${route().current(item.pattern)
                                                        ? 'text-white font-bold'
                                                        : 'text-primary-300 hover:text-white'
                                                        }`}
                                                >
                                                    {item.name}
                                                </Link>
                                            ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Perlindungan Hutan Dropdown Mobile */}
                        {hasPermission('perlindungan.view') && (
                            <div className="space-y-1">
                                <button
                                    onClick={() => toggleMenu('perlindungan_mobile')}
                                    className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-semibold border transition-all ${openMenus['perlindungan_mobile'] || route().current('pengunjung-wisata.*') || route().current('kebakaran-hutan.*')
                                        ? 'bg-white/10 border-white/20 text-white'
                                        : 'border-transparent text-primary-100 hover:bg-white/5 hover:border-white/10'
                                        }`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-primary-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                    <span className="flex-1 text-left">Perlindungan Hutan & Jasa Lingkungan</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${openMenus['perlindungan_mobile'] ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                {openMenus['perlindungan_mobile'] && (
                                    <div className="ml-9 space-y-1 border-l border-white/10 pl-3 py-1">
                                        {[
                                            { name: 'Pengunjung Objek Wisata', route: route('pengunjung-wisata.index'), pattern: 'pengunjung-wisata.*' },
                                            { name: 'Kebakaran Hutan', route: route('kebakaran-hutan.index'), pattern: 'kebakaran-hutan.*' }
                                        ].map((item) => (
                                            <Link
                                                key={item.name}
                                                href={item.route}
                                                onClick={() => setShowingNavigationDropdown(false)}
                                                className={`block py-2 text-[13px] font-medium transition-colors ${route().current(item.pattern)
                                                    ? 'text-white font-bold'
                                                    : 'text-primary-300 hover:text-white'
                                                    }`}
                                            >
                                                {item.name}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Bina Usaha Dropdown Mobile */}
                        {hasPermission('bina-usaha.view') && (
                            <div className="space-y-1">
                                <button
                                    onClick={() => toggleMenu('bina_usaha_mobile')}
                                    className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-semibold border transition-all ${openMenus['bina_usaha_mobile']
                                        ? 'bg-white/10 border-white/20 text-white'
                                        : 'border-transparent text-primary-100 hover:bg-white/5 hover:border-white/10'
                                        }`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-primary-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    <span className="flex-1 text-left">Bina Usaha</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${openMenus['bina_usaha_mobile'] ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                {openMenus['bina_usaha_mobile'] && (
                                    <div className="ml-9 space-y-1 border-l border-white/10 pl-3 py-1">
                                        {[
                                            {
                                                name: 'Produksi dari Hutan Negara',
                                                key: 'hutan_negara_mobile',
                                                children: [
                                                    { name: 'Hasil Hutan Kayu', route: route('hasil-hutan-kayu.index', { forest_type: 'Hutan Negara' }), pattern: 'hasil-hutan-kayu.*' },
                                                    { name: 'Hasil Hutan Bukan Kayu', route: route('hasil-hutan-bukan-kayu.index', { forest_type: 'Hutan Negara' }), pattern: 'hasil-hutan-bukan-kayu.*' }
                                                ]
                                            },
                                            {
                                                name: 'Produksi dari Perhutanan Sosial',
                                                key: 'perhutanan_sosial_mobile',
                                                children: [
                                                    { name: 'Hasil Hutan Kayu', route: route('hasil-hutan-kayu.index', { forest_type: 'Perhutanan Sosial' }), pattern: 'hasil-hutan-kayu.*' },
                                                    { name: 'Hasil Hutan Bukan Kayu', route: route('hasil-hutan-bukan-kayu.index', { forest_type: 'Perhutanan Sosial' }), pattern: 'hasil-hutan-bukan-kayu.*' }
                                                ]
                                            },
                                            {
                                                name: 'Produksi dari Hutan Rakyat',
                                                key: 'hutan_rakyat_mobile',
                                                children: [
                                                    { name: 'Hasil Hutan Kayu', route: route('hasil-hutan-kayu.index', { forest_type: 'Hutan Rakyat' }), pattern: 'hasil-hutan-kayu.*' },
                                                    { name: 'Hasil Hutan Bukan Kayu', route: route('hasil-hutan-bukan-kayu.index', { forest_type: 'Hutan Rakyat' }), pattern: 'hasil-hutan-bukan-kayu.*' }
                                                ]
                                            },
                                            { name: 'PBPHH', route: route('pbphh.index'), pattern: 'pbphh.*' },
                                            { name: 'PNBP', route: route('realisasi-pnbp.index'), pattern: 'realisasi-pnbp.*' }
                                        ].map((item) => (
                                            <div key={item.name}>
                                                {item.children ? (
                                                    <div>
                                                        <button
                                                            onClick={() => toggleMenu(item.key)}
                                                            className="flex w-full items-center py-2 text-[13px] font-medium text-primary-300 hover:text-white transition-colors"
                                                        >
                                                            <span className="flex-1 text-left">{item.name}</span>
                                                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 ml-2 transition-transform duration-200 ${openMenus[item.key] ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                            </svg>
                                                        </button>
                                                        {openMenus[item.key] && (
                                                            <div className="ml-3 space-y-1 border-l border-white/10 pl-3">
                                                                {item.children.map((child) => {
                                                                    const isActive = child.pattern ? route().current(child.pattern) : (child.route !== '#' && window.location.href === child.route);
                                                                    return (
                                                                        <Link
                                                                            key={child.name}
                                                                            href={child.route}
                                                                            onClick={() => setShowingNavigationDropdown(false)}
                                                                            className={`block py-1.5 text-xs transition-colors ${isActive
                                                                                ? 'text-white font-bold'
                                                                                : 'text-primary-400 hover:text-white'
                                                                                }`}
                                                                        >
                                                                            {child.name}
                                                                        </Link>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <Link
                                                        href={item.route}
                                                        onClick={() => setShowingNavigationDropdown(false)}
                                                        className={`block py-2 text-[13px] font-medium transition-colors ${route().current(item.pattern)
                                                            ? 'text-white font-bold'
                                                            : 'text-primary-300 hover:text-white'
                                                            }`}
                                                    >
                                                        {item.name}
                                                    </Link>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Pemberdayaan Dropdown Mobile */}
                        {hasPermission('pemberdayaan.view') && (
                            <div className="space-y-1">
                                <button
                                    onClick={() => toggleMenu('pemberdayaan_mobile')}
                                    className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-semibold border transition-all ${openMenus['pemberdayaan_mobile']
                                        ? 'bg-white/10 border-white/20 text-white'
                                        : 'border-transparent text-primary-100 hover:bg-white/5 hover:border-white/10'
                                        }`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-primary-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                    <span className="flex-1 text-left">Pemberdayaan</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${openMenus['pemberdayaan_mobile'] ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                {openMenus['pemberdayaan_mobile'] && (
                                    <div className="ml-9 space-y-1 border-l border-white/10 pl-3 py-1">
                                        {[
                                            { name: 'Perkembangan SK PS', route: route('skps.index'), pattern: 'skps.*' },
                                            { name: 'Perkembangan KUPS', route: route('kups.index'), pattern: 'kups.*' },
                                            { name: 'Nilai Ekonomi (NEKON)', route: route('nilai-ekonomi.index'), pattern: 'nilai-ekonomi.*' }
                                        ].map((item) => (
                                            <Link
                                                key={item.name}
                                                href={item.route}
                                                onClick={() => setShowingNavigationDropdown(false)}
                                                className={`block py-2 text-[13px] font-medium transition-colors ${route().current(item.pattern)
                                                    ? 'text-white font-bold'
                                                    : 'text-primary-300 hover:text-white'
                                                    }`}
                                            >
                                                {item.name}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Data Master Mobile */}
                        {user.roles.includes('admin') && (
                            <div className="space-y-1">
                                <button
                                    onClick={() => toggleMenu('data_master_mobile')}
                                    className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-semibold border transition-all ${openMenus['data_master_mobile']
                                        ? 'bg-white/10 border-white/20 text-white'
                                        : 'border-transparent text-primary-100 hover:bg-white/5 hover:border-white/10'
                                        }`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-primary-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                    </svg>
                                    <span className="flex-1 text-left">Data Master</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${openMenus['data_master_mobile'] ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                {openMenus['data_master_mobile'] && (
                                    <div className="ml-9 space-y-1 border-l border-white/10 pl-3 py-1">
                                        {[
                                            { name: 'Data Provinsi', route: route('provinces.index'), pattern: 'provinces.*' },
                                            { name: 'Data Kabupaten/Kota', route: route('regencies.index'), pattern: 'regencies.*' },
                                            { name: 'Data Kecamatan', route: route('districts.index'), pattern: 'districts.*' },
                                            { name: 'Data Desa/Kelurahan', route: route('villages.index'), pattern: 'villages.*' }
                                        ].map((item) => (
                                            <Link
                                                key={item.name}
                                                href={item.route}
                                                onClick={() => setShowingNavigationDropdown(false)}
                                                className={`block py-2 text-[13px] font-medium transition-colors ${route().current(item.pattern)
                                                    ? 'text-white font-bold'
                                                    : 'text-primary-300 hover:text-white'
                                                    }`}
                                            >
                                                {item.name}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {hasPermission('users.view') && (
                            <>
                                <div className="pt-4 pb-2 px-4 uppercase text-[10px] font-bold text-primary-400 tracking-widest">
                                    Pengaturan
                                </div>

                                <Link
                                    href={route('users.index')}
                                    onClick={() => setShowingNavigationDropdown(false)}
                                    className={`flex items-center px-4 py-3 rounded-xl text-sm font-semibold border transition-all ${route().current('users.*')
                                        ? 'bg-white/10 border-white/20 text-white'
                                        : 'border-transparent text-primary-100 hover:bg-white/5 hover:border-white/10'
                                        }`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-primary-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                    Manajemen User
                                </Link>

                                {user.roles.includes('admin') && (
                                    <Link
                                        href={route('activity-log.index')}
                                        onClick={() => setShowingNavigationDropdown(false)}
                                        className={`flex items-center px-4 py-3 rounded-xl text-sm font-semibold border transition-all ${route().current('activity-log.*')
                                            ? 'bg-white/10 border-white/20 text-white'
                                            : 'border-transparent text-primary-100 hover:bg-white/5 hover:border-white/10'
                                            }`}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-primary-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Log Aktivitas
                                    </Link>
                                )}
                            </>
                        )}



                        <Link
                            href={route('profile.edit')}
                            onClick={() => setShowingNavigationDropdown(false)}
                            className={`flex items-center px-4 py-3 rounded-xl text-sm font-semibold border transition-all ${route().current('profile.edit')
                                ? 'bg-white/10 border-white/20 text-white'
                                : 'border-transparent text-primary-100 hover:bg-white/5 hover:border-white/10'
                                }`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-primary-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Profil Akun
                        </Link>

                        <Link
                            method="post"
                            href={route('logout')}
                            as="button"
                            className="w-full flex items-center px-4 py-3 rounded-xl text-sm font-semibold border border-white/10 text-primary-100 bg-white/5 hover:bg-white/10 hover:text-white transition-all"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-primary-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Keluar Sesi
                        </Link>
                    </nav>
                </div>


                {/* Main Content Wrapper */}
                <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>

                    {/* Top Header */}
                    <div className="sticky top-0 z-50 flex-shrink-0 flex h-16 bg-white shadow-sm border-b border-gray-100">
                        <button
                            type="button"
                            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 lg:hidden"
                            onClick={() => setShowingNavigationDropdown(true)}
                        >
                            <span className="sr-only">Open sidebar</span>
                            <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>

                        {/* Sidebar Collapse Toggle (Desktop) */}
                        <div className="hidden lg:flex items-center px-4">
                            <button
                                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                                className="group relative w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-gray-100 shadow-sm transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-110 active:scale-90 overflow-hidden"
                            >
                                {/* Liquid Background Fill */}
                                <div className="absolute inset-0 bg-gradient-to-tr from-primary-700 to-primary-500 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]"></div>

                                {/* Morphing Icons */}
                                <div className="relative w-5 h-5 flex items-center justify-center text-gray-400 group-hover:text-white transition-colors duration-300">
                                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 absolute transition-all duration-500 transform ${isSidebarCollapsed ? 'scale-0 opacity-0 rotate-180' : 'scale-100 opacity-100 rotate-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h16" />
                                    </svg>
                                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 absolute transition-all duration-500 transform ${isSidebarCollapsed ? 'scale-100 opacity-100 rotate-0' : 'scale-0 opacity-0 -rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M12 12h8m-8 6h8" />
                                    </svg>
                                </div>
                            </button>
                        </div>

                        <div className="flex-1 px-4 flex justify-between items-center">
                            <div className="flex-1 flex text-lg font-bold text-primary-900 items-center lg:hidden uppercase tracking-tight">
                                SMART-HUT
                            </div>

                            {/* Profile Dropdown */}
                            <div className="ml-auto flex items-center">
                                <Dropdown>
                                    <Dropdown.Trigger>
                                        <button className="flex items-center gap-3 px-3 py-2 rounded-xl border border-transparent hover:border-gray-100 hover:bg-gray-50/50 transition-all duration-300 group">
                                            <div className="hidden sm:flex flex-col text-right">
                                                <span className="text-sm font-bold text-gray-800 group-hover:text-primary-700 transition-colors tracking-tight leading-none">{user.name}</span>
                                                <span className="text-[10px] font-semibold text-gray-400 mt-1 uppercase tracking-wider uppercase">{user.roles_description || 'User'}</span>
                                            </div>
                                            <div className="relative">
                                                <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-primary-700 to-primary-500 flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-white group-hover:ring-primary-100 transition-all transform group-hover:scale-105 duration-300">
                                                    {user.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full shadow-sm"></div>
                                            </div>
                                            <svg className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    </Dropdown.Trigger>

                                    <Dropdown.Content align="right" width="56" contentClasses="py-0 bg-white">
                                        <div className="px-5 py-5 bg-gradient-to-br from-primary-50/50 to-white border-b border-gray-100">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 shrink-0 rounded-xl bg-primary-600 flex items-center justify-center text-white font-bold text-base shadow-sm">
                                                    {user.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-sm font-bold text-gray-900 truncate">{user.name}</span>
                                                    <span className="text-[10px] font-bold text-primary-600 uppercase tracking-widest mt-0.5">{user.roles_description || 'User'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-2">
                                            <Dropdown.Link href={route('profile.edit')} className="rounded-xl !hover:bg-primary-50 hover:text-primary-700 transition-all duration-200 group/item py-2.5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center group-hover/item:bg-white transition-colors border border-transparent group-hover/item:border-primary-100">
                                                        <svg className="w-5 h-5 text-gray-500 group-hover/item:text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                        </svg>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-gray-700 group-hover/item:text-primary-700">Profil Saya</span>
                                                        <span className="text-[10px] text-gray-400">Atur detail akun</span>
                                                    </div>
                                                </div>
                                            </Dropdown.Link>

                                            <div className="my-1 border-t border-gray-50"></div>

                                            <Dropdown.Link href={route('logout')} method="post" as="button" className="w-full rounded-xl !hover:bg-red-50 hover:text-red-700 transition-all duration-200 group/logout py-2.5">
                                                <div className="flex items-center gap-3 text-red-600">
                                                    <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center group-hover/logout:bg-white transition-colors border border-transparent group-hover/logout:border-red-100">
                                                        <svg className="w-5 h-5 transition-transform group-hover/logout:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                                        </svg>
                                                    </div>
                                                    <div className="flex flex-col text-left">
                                                        <span className="text-sm font-bold group-hover/logout:text-red-700">Keluar Sesi</span>
                                                        <span className="text-[10px] text-red-400/80">Akhiri sesi anda</span>
                                                    </div>
                                                </div>
                                            </Dropdown.Link>
                                        </div>
                                    </Dropdown.Content>
                                </Dropdown>
                            </div>
                        </div>
                    </div>

                    {/* Page Header */}
                    {header && (
                        <header className="bg-white shadow-sm border-b border-gray-100 py-6 px-4 sm:px-6 lg:px-8">
                            {header}
                        </header>
                    )}

                    {/* Main Content */}
                    <main className="flex-1 relative overflow-auto focus:outline-none p-4 sm:p-6 lg:p-8">
                        {/* Flash Messages */}
                        {flash.success && showFlash && (
                            <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl relative shadow-sm flex items-start" role="alert">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="block sm:inline text-sm font-medium">{flash.success}</span>
                                <button onClick={() => setShowFlash(false)} className="absolute top-0 bottom-0 right-0 px-4 py-3">
                                    <svg className="fill-current h-6 w-6 text-green-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z" /></svg>
                                </button>
                            </div>
                        )}
                        {flash.error && showFlash && (
                            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl relative shadow-sm flex items-start" role="alert">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="block sm:inline text-sm font-medium">{flash.error}</span>
                                <button onClick={() => setShowFlash(false)} className="absolute top-0 bottom-0 right-0 px-4 py-3">
                                    <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z" /></svg>
                                </button>
                            </div>
                        )}

                        {children}
                    </main>
                </div>
            </div>
        </div>
    );
}
