import { Link, Head } from '@inertiajs/react';

export default function Welcome({ auth, laravelVersion, phpVersion }) {
    return (
        <>
            <Head title="Monitoring Analysis Real Time – Kehutanan" />
            <div className="min-h-screen bg-white text-gray-800 font-sans selection:bg-primary-500 selection:text-white overflow-hidden">
                {/* Navbar */}
                <nav className="absolute top-0 w-full z-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center h-20">
                            <div className="flex-shrink-0 flex items-center gap-4">

                                {/* Logo Mark - Enhanced */}
                                <div className="group cursor-pointer flex-shrink-0">
                                    <div className="w-12 h-12 flex items-center justify-center p-0.5">
                                        <img src="/img/logo.webp" alt="Logo CDK" className="w-full h-full object-contain" />
                                    </div>
                                </div>

                                <div className="hidden sm:flex flex-col">
                                    <span className="font-display font-bold text-lg text-gray-900 tracking-tight leading-tight">
                                        Dinas Kehutanan Prov. Jatim
                                    </span>
                                    <span className="text-[10px] uppercase tracking-wider text-primary-700/80 font-bold">
                                        CDK Wilayah Trenggalek
                                    </span>
                                </div>
                            </div>

                            {/* Logo Mark - Gerbang Nusantara (Right Side) */}
                            <div className="group cursor-pointer flex-shrink-0">
                                <div className="w-32 h-12 flex items-center justify-center p-0.5">
                                    <img src="/img/logo_gerbang_nusantara.png" alt="Logo Gerbang Nusantara" className="w-full h-full object-contain" />
                                </div>
                            </div>
                        </div>
                    </div>
                </nav>

                {/* Hero Section */}
                <div className="relative min-h-screen flex items-center">
                    {/* Background Subtle Wash */}
                    <div className="absolute inset-0 z-0 bg-gradient-to-br from-primary-50/50 to-white/80"></div>

                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10 pt-16">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

                            {/* Left Column: Content */}
                            <div className="text-left space-y-6">
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-bold tracking-wide shadow-sm mb-2">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                    </span>
                                    Official Platform CDK Wilayah Trenggalek
                                </div>

                                <div className="mb-10 relative">
                                    <div className="absolute -left-10 -top-10 w-40 h-40 bg-emerald-100/50 rounded-full blur-3xl -z-10"></div>

                                    <h1 className="text-5xl font-display font-black sm:text-7xl lg:text-8xl leading-none tracking-tighter mb-6">
                                        <span className="text-yellow-500 drop-shadow-sm font-semibold">
                                            SMART
                                        </span>
                                        <span className='text-primary-900 drop-shadow-sm font-bold mx-1'>-</span>
                                        <span className="text-primary-900 drop-shadow-sm font-medium">
                                            HUT
                                        </span>
                                    </h1>

                                    <div className="relative pl-6 border-l-4 border-emerald-500/30 py-1">
                                        <h2 className="font-sans font-bold text-xl sm:text-2xl text-gray-700 leading-snug tracking-tight">
                                            System for <span className="text-emerald-700">Monitoring Analysis</span> <br />
                                            Real Time – Kehutanan
                                        </h2>
                                    </div>
                                </div>

                                <p className="font-sans text-base sm:text-lg text-gray-500 leading-relaxed max-w-md">
                                    Platform terintegrasi untuk monitoring, pengelolaan, dan pelaporan data statistik kehutanan secara akurat dan realtime.
                                </p>

                                <div className="flex flex-col sm:flex-row gap-4 pt-2">
                                    <Link
                                        href={auth.user ? route('dashboard') : route('login')}
                                        className="px-6 py-3 rounded-full bg-primary-700 text-white font-semibold text-sm hover:bg-primary-800 shadow-lg shadow-primary-700/20 transition-all duration-300 transform hover:-translate-y-0.5 text-center"
                                    >
                                        {auth.user ? 'Masuk Admin Panel' : 'Masuk sekarang'}
                                    </Link>
                                    <Link
                                        href={route('public.dashboard')}
                                        className="px-6 py-3 rounded-full bg-white text-primary-700 border border-primary-200 font-semibold text-sm hover:bg-primary-50 transition-all duration-300 transform hover:-translate-y-0.5 text-center"
                                    >
                                        Dashboard Kehutanan
                                    </Link>
                                </div>

                                <div className="pt-6 flex items-center gap-6 text-gray-400 text-sm font-medium">
                                    <div className="flex items-center gap-1.5">
                                        <svg className="w-4 h-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Realtime
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <svg className="w-4 h-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Terintegrasi
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <svg className="w-4 h-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Akurat
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Visual Composition */}
                            <div className="relative hidden lg:block h-full">
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] -z-10">
                                    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-emerald-50/60 fill-current opacity-70 animate-[pulse_4s_ease-in-out_infinite]">
                                        <path transform="translate(100 100)" d="M42.7,-72.8C54.6,-67.2,63.1,-54.6,70.9,-42.2C78.7,-29.8,85.8,-17.6,83.9,-6.3C82,5,71.1,15.4,61.8,24.8C52.5,34.2,44.9,42.5,36,50.4C27.1,58.3,16.9,65.8,5.1,68.8C-6.7,71.8,-20.1,70.3,-32.1,64.3C-44.1,58.3,-54.7,47.8,-62.8,35.6C-70.9,23.4,-76.5,9.5,-75.4,-3.9C-74.3,-17.3,-66.5,-30.2,-56.3,-40.4C-46.1,-50.6,-33.5,-58.1,-20.7,-62.9C-7.9,-67.7,6.3,-69.8,20.4,-71.8C34.5,-73.8,48.6,-75.7,42.7,-72.8Z" />
                                    </svg>
                                </div>

                                <div className="relative w-full max-w-md mx-auto aspect-[4/5] mt-8">
                                    {/* Decorative Pattern Grid */}
                                    <div className="absolute -top-8 -right-8 w-32 h-32 opacity-20">
                                        <svg className="w-full h-full text-emerald-800" fill="currentColor" viewBox="0 0 100 100">
                                            <pattern id="grid" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                                                <circle cx="2" cy="2" r="2" />
                                            </pattern>
                                            <rect width="100" height="100" fill="url(#grid)" />
                                        </svg>
                                    </div>

                                    {/* Main Image */}
                                    <div className="absolute inset-0 rounded-2xl overflow-hidden shadow-2xl shadow-emerald-900/10 z-10 group">
                                        <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/80 via-transparent to-transparent z-10 opacity-90 transition-opacity duration-300 group-hover:opacity-100"></div>
                                        <img
                                            src="/img/hutan_indonesia.jpeg"
                                            alt="Hutan Indonesia"
                                            className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-110"
                                        />

                                        {/* Bottom Caption on Image */}
                                        <div className="absolute bottom-8 left-8 right-8 z-20 translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-8 h-1 bg-yellow-500 rounded-full"></div>
                                                <span className="text-emerald-100 text-xs font-bold tracking-widest uppercase">Wilayah Kerja</span>
                                            </div>
                                            <h3 className="text-white font-display font-bold text-2xl leading-tight">
                                                CDK Wilayah <br /> Trenggalek
                                            </h3>
                                        </div>
                                    </div>

                                    {/* Stats Glass Card */}
                                    <div className="absolute top-12 -left-6 z-30 perspective-1000 hover:z-40">
                                        <div className="flex items-center gap-4 bg-white/90 backdrop-blur-xl p-4 pr-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/50 transform transition-all duration-300 hover:scale-105 hover:shadow-emerald-900/20">
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Data Validasi</p>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-2xl font-black text-gray-800">100%</span>
                                                    <span className="flex h-2 w-2 relative">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
