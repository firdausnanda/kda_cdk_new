import { Link } from '@inertiajs/react';

export default function Guest({ children }) {
    return (
        <div className="min-h-screen flex text-gray-900 bg-white font-sans selection:bg-primary-500 selection:text-white">
            {/* Left Side - Visual */}
            <div className="hidden lg:flex w-1/2 bg-primary-900 relative overflow-hidden text-white items-center justify-center">
                <div className="absolute inset-0 z-0">
                    <img
                        src="/img/login/bg.avif"
                        alt="Forestry Background"
                        className="w-full h-full object-cover opacity-60 mix-blend-overlay"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-primary-900/90 via-primary-900/50 to-transparent"></div>
                </div>

                <div className="relative z-10 max-w-lg px-12 text-center">
                    <div className="mb-8 flex justify-center">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-xl">
                            <img src="/img/logo.webp" alt="Logo" className="w-10 h-10 object-contain drop-shadow-md" />
                        </div>
                    </div>
                    <h2 className="font-display font-bold text-4xl mb-6 leading-tight">Sistem Informasi Kehutanan Dalam Angka</h2>
                    <p className="font-sans text-primary-100 text-lg leading-relaxed">
                        Mengelola masa depan hutan lestari melalui integritas data dan teknologi terbaru.
                    </p>

                    <div className="mt-12 flex items-center justify-center gap-2 text-sm text-primary-200/60 font-medium">
                        <span>&copy; {new Date().getFullYear()} CDK Wilayah Trenggalek</span>
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
