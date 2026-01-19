import { Link, Head } from '@inertiajs/react';

export default function Welcome({ auth, laravelVersion, phpVersion }) {
    return (
        <>
            <Head title="Kehutanan Dalam Angka" />
            <div className="min-h-screen bg-white text-gray-800 font-sans selection:bg-primary-500 selection:text-white overflow-hidden">
                {/* Navbar */}
                <nav className="absolute top-0 w-full z-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center h-20">
                            <div className="flex-shrink-0 flex items-center gap-4">
                                {/* Logo Mark - Enhanced */}
                                <div className="relative group cursor-pointer flex-shrink-0">
                                    <div className="absolute -inset-0.5 bg-gradient-to-tr from-primary-600 to-primary-400 rounded-full blur opacity-20 group-hover:opacity-40 transition duration-300"></div>
                                    <div className="relative w-12 h-12 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/50 shadow-sm overflow-hidden p-0.5 ring-1 ring-gray-100">
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
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-100 text-primary-800 text-xs font-semibold tracking-wide">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary-600"></span>
                                    Rehabilitasi Hutan & Lahan
                                </div>

                                <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-5xl leading-[1.15] text-gray-900 tracking-tight">
                                    Sistem Informasi <br />
                                    <span className="text-primary-700">Kehutanan</span> <br />
                                    Dalam Angka
                                </h1>

                                <p className="font-sans text-base sm:text-lg text-gray-500 leading-relaxed max-w-md">
                                    Platform terintegrasi untuk monitoring, pengelolaan, dan pelaporan data statistik kehutanan secara akurat dan realtime.
                                </p>

                                <div className="flex flex-col sm:flex-row gap-4 pt-2">
                                    <Link
                                        href={auth.user ? route('dashboard') : route('login')}
                                        className="px-6 py-3 rounded-full bg-primary-700 text-white font-semibold text-sm hover:bg-primary-800 shadow-lg shadow-primary-700/20 transition-all duration-300 transform hover:-translate-y-0.5 text-center"
                                    >
                                        {auth.user ? 'Dashboard' : 'Masuk sekarang'}
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

                            {/* Right Column: Visual/Abstract Forestry Styling */}
                            <div className="relative hidden lg:block">
                                <div className="relative w-full aspect-[4/5] max-w-md mx-auto">
                                    {/* Main Image Container */}
                                    <div className="absolute inset-0 rounded-2xl overflow-hidden shadow-2xl shadow-primary-900/10">
                                        {/* Abstract Forestry Pattern/Image Placeholder from Unsplash */}
                                        <div className="absolute inset-0 bg-gray-200">
                                            <img
                                                src="https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?q=80&w=2674&auto=format&fit=crop"
                                                alt="Forestry"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
                                    </div>

                                    {/* Floating stats card */}
                                    <div className="absolute -left-6 bottom-10 bg-white/95 backdrop-blur-sm p-5 rounded-xl shadow-xl border border-white/50 max-w-[240px] transform transition-transform duration-300">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Rehabilitasi</p>
                                                <p className="text-base font-bold text-gray-900">50.000++ Ha</p>
                                            </div>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-1">
                                            <div className="bg-primary-600 h-1 rounded-full" style={{ width: '75%' }}></div>
                                        </div>
                                    </div>

                                    {/* Decorative Elements */}
                                    <div className="absolute -right-12 -top-12 w-64 h-64 bg-primary-200/30 rounded-full blur-3xl -z-10"></div>
                                    <div className="absolute -left-12 -bottom-12 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl -z-10"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
