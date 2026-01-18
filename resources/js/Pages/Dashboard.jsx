import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Filler,
    Legend,
    ArcElement,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Filler,
    Legend,
    ArcElement
);

export default function Dashboard({ auth, rehabStats, filters, availableYears }) {
    const [isLoading, setIsLoading] = useState(false);

    const handleYearChange = (year) => {
        setIsLoading(true);
        router.get(route('dashboard'), { year }, {
            preserveState: true,
            replace: true,
            onFinish: () => setIsLoading(false)
        });
    };

    // Chart Data using real monthly data
    const areaChartData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
        datasets: [
            {
                fill: true,
                label: 'Rehabilitasi Lahan (Ha)',
                data: rehabStats.monthlyData || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                borderColor: 'rgb(22, 101, 52)', // primary-800
                backgroundColor: 'rgba(22, 101, 52, 0.2)',
                tension: 0.4,
            },
        ],
    };

    const doughnutData = {
        labels: ['Jati', 'Sengon', 'Mahoni', 'Lainnya'],
        datasets: [
            {
                label: '# of Votes',
                data: [122, 191, 33, 55],
                backgroundColor: [
                    'rgba(22, 101, 52, 0.8)',  // primary-800
                    'rgba(21, 128, 61, 0.7)',  // primary-700
                    'rgba(34, 197, 94, 0.6)',  // primary-500
                    'rgba(134, 239, 172, 0.5)', // primary-300
                ],
                borderColor: [
                    'rgba(22, 101, 52, 1)',
                    'rgba(21, 128, 61, 1)',
                    'rgba(34, 197, 94, 1)',
                    'rgba(134, 239, 172, 1)',
                ],
                borderWidth: 1,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: false,
            },
        },
        scales: {
            y: {
                grid: {
                    display: false
                }
            },
            x: {
                grid: {
                    display: false
                }
            }
        }
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Dashboard Overview</h2>}
        >
            <Head title="Dashboard" />

            <div className="space-y-4 md:space-y-6">
                {/* Welcome Section */}
                <div className="bg-gradient-to-r from-primary-800 to-primary-600 rounded-2xl p-6 md:p-10 text-white shadow-lg relative overflow-hidden">
                    <div className="absolute right-0 top-0 h-full w-1/2 bg-white/5 transform skew-x-12 shrink-0"></div>
                    <div className="relative z-10">
                        <h3 className="text-3xl font-bold font-display">Selamat Datang, {auth.user.name}!</h3>
                        <p className="mt-2 text-primary-100 max-w-xl">
                            Sistem Informasi Kehutanan Dalam Angka (CDK Wilayah Trenggalek). <br />
                            Pantau data statistik kehutanan secara realtime dan akurat.
                        </p>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    {/* Stat Card 1 */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Produksi Kayu</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">0 <span className="text-sm font-normal text-gray-400">m3</span></p>
                            </div>
                            <div className="p-3 bg-primary-50 rounded-lg text-primary-600 shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-sm text-green-600">
                            <svg className="h-4 w-4 mr-1 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                            <span>Tetap</span>
                        </div>
                    </div>

                    {/* Stat Card 2 */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Rehabilitasi Lahan</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{rehabStats.total} <span className="text-sm font-normal text-gray-400">Ha</span></p>
                            </div>
                            <div className="p-3 bg-primary-50 rounded-lg text-primary-600 shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                            </div>
                        </div>
                        <div className={`mt-4 flex items-center text-sm ${rehabStats.growth > 0 ? 'text-green-600' : rehabStats.growth < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                            {rehabStats.growth > 0 ? (
                                <svg className="h-4 w-4 mr-1 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                            ) : rehabStats.growth < 0 ? (
                                <svg className="h-4 w-4 mr-1 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" />
                                </svg>
                            ) : (
                                <svg className="h-4 w-4 mr-1 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
                                </svg>
                            )}
                            <span className="font-bold">
                                {rehabStats.growth > 0 ? `+${rehabStats.growth}%` : `${rehabStats.growth}%`}
                            </span>
                            <span className="ml-1 opacity-70">dari tahun lalu</span>
                        </div>
                    </div>

                    {/* Stat Card 3 */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Transaksi Ekonomi</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">0 <span className="text-sm font-normal text-gray-400">Rp</span></p>
                            </div>
                            <div className="p-3 bg-primary-50 rounded-lg text-primary-600 shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-sm text-green-600">
                            <svg className="h-4 w-4 mr-1 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                            <span>Meningkat</span>
                        </div>
                    </div>

                    {/* Stat Card 4 */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Kelompok Tani Hutan</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">0 <span className="text-sm font-normal text-gray-400">Kelompok</span></p>
                            </div>
                            <div className="p-3 bg-primary-50 rounded-lg text-primary-600 shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-sm text-green-600">
                            <span>Aktif & Terverifikasi</span>
                        </div>
                    </div>
                </div>

                {/* Charts and Tables */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Chart */}
                    <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                            <h3 className="font-bold text-gray-800">Capaian Rehabilitasi Lahan {filters.year}</h3>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-gray-500">Tahun:</span>
                                    <select
                                        className="text-sm font-bold border-gray-200 rounded-lg focus:ring-primary-500 focus:border-primary-500 py-1"
                                        value={filters.year}
                                        onChange={(e) => handleYearChange(e.target.value)}
                                        disabled={isLoading}
                                    >
                                        {availableYears.map(year => (
                                            <option key={year} value={year}>{year}</option>
                                        ))}
                                    </select>
                                </div>
                                <button className="text-sm text-primary-600 hover:text-primary-800 font-medium whitespace-nowrap">Download Laporan</button>
                            </div>
                        </div>
                        <div className="h-64 sm:h-80">
                            <Line options={{ ...chartOptions, maintainAspectRatio: false }} data={areaChartData} />
                        </div>
                    </div>

                    {/* Secondary Chart */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-800 mb-4">Komposisi Jenis Tanaman</h3>
                        <div className="h-64 flex items-center justify-center">
                            <Doughnut data={doughnutData} options={{ maintainAspectRatio: false }} />
                        </div>
                        <div className="mt-4 space-y-2">
                            {doughnutData.labels.map((label, index) => (
                                <div key={label} className="flex justify-between items-center text-sm">
                                    <div className="flex items-center">
                                        <span className="w-3 h-3 rounded-full mr-2 shrink-0" style={{ backgroundColor: doughnutData.datasets[0].backgroundColor[index] }}></span>
                                        <span className="text-gray-600">{label}</span>
                                    </div>
                                    <span className="font-medium text-gray-900">{doughnutData.datasets[0].data[index]}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Recent Activity Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="font-bold text-gray-800">Aktivitas Terbaru</h3>
                        <button className="text-sm text-primary-600 hover:text-primary-800 font-medium whitespace-nowrap ml-4">Lihat Semua</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-500 min-w-[600px] sm:min-w-0">
                            <thead className="bg-gray-50 text-gray-700 uppercase">
                                <tr>
                                    <th className="px-6 py-3 font-semibold">User</th>
                                    <th className="px-6 py-3 font-semibold">Aktivitas</th>
                                    <th className="px-6 py-3 font-semibold hidden sm:table-cell">Waktu</th>
                                    <th className="px-6 py-3 font-semibold">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                <tr className="hover:bg-gray-50">
                                    <td colSpan="4" className="text-center py-12">
                                        <div className="flex flex-col items-center">
                                            <div className="p-4 bg-gray-50 rounded-full mb-3 text-gray-300">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                                </svg>
                                            </div>
                                            <p className="text-gray-400 font-medium tracking-tight whitespace-nowrap">Belum ada data aktivitas tersedia</p>
                                        </div>
                                    </td>

                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </AuthenticatedLayout>
    );
}
