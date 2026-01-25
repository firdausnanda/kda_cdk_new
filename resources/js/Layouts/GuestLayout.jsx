import { Link } from '@inertiajs/react';

export default function Guest({ children }) {
    return (
        <div className="min-h-screen flex text-gray-900 bg-white font-sans selection:bg-primary-500 selection:text-white">
            {/* Left Side - Visual */}
            <div className="hidden lg:flex w-1/2 bg-primary-950 relative overflow-hidden text-white items-center justify-center">
                {/* Background Image & Overlay */}
                <div className="absolute inset-0 z-0">
                    <img
                        src="/img/login/bg.avif"
                        alt="Forestry Background"
                        className="w-full h-full object-cover opacity-50 mix-blend-overlay"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-primary-950 via-primary-900/80 to-primary-900/40"></div>

                    {/* Abstract Shapes */}
                    <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl"></div>
                </div>

                <div className="relative z-10 max-w-lg px-12 text-center">
                    {/* Logo Area */}
                    <div className="mb-10 flex justify-center">
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400 to-yellow-400 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                            <div className="relative w-20 h-20 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/10 shadow-2xl">
                                <img src="/img/logo.webp" alt="Logo" className="w-12 h-12 object-contain drop-shadow-lg" />
                            </div>
                        </div>
                    </div>

                    {/* Main Title & Subtitle */}
                    <div className="mb-0">
                        <h1 className="font-display font-black text-6xl tracking-tight leading-none mb-6">
                            <span className="text-white drop-shadow-lg">SMART</span>
                            <span className="text-emerald-400 mx-1">-</span>
                            <span className="text-yellow-400 drop-shadow-lg">HUT</span>
                        </h1>
                        <p className="font-sans text-xl text-primary-100 font-medium tracking-wide max-w-lg mx-auto leading-relaxed">
                            Sistem Monitoring Analisis Real Time Data Kehutanan
                        </p>
                    </div>

                    <div className="mt-16 text-xs text-primary-400/60 font-medium tracking-wider">
                        &copy; {new Date().getFullYear()} CDK Wilayah Trenggalek
                    </div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-16 bg-white">
                <div className="w-full max-w-md space-y-8">
                    <div className="text-center lg:text-left">
                        <Link href="/" className="lg:hidden inline-block mb-8">
                            <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center border border-primary-100 mx-auto">
                                <img src="/img/logo.webp" alt="Logo" className="w-8 h-8 object-contain" />
                            </div>
                        </Link>

                        <h2 className="font-display font-bold text-3xl text-gray-900 tracking-tight">Selamat Datang Kembali</h2>
                        <p className="mt-2 text-gray-500 font-sans">Silakan masuk untuk mengakses dashboard pengelolaan.</p>
                    </div>

                    <div className="mt-8">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
