<?php

namespace App\Http\Controllers;

use App\Models\HasilHutanKayu;
use App\Models\Kups;
use App\Models\RealisasiPnbp;
use App\Models\RehabLahan;
use App\Models\Skps;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Spatie\Activitylog\Models\Activity;
use App\Exports\RehabLahanExport;
use Maatwebsite\Excel\Facades\Excel;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $currentYear = date('Y');
        $prevYear = $currentYear - 1;
        $chartYear = $request->input('year', $currentYear);

        // --- Rehab Lahan Stats (Existing) ---
        $totalRehabCurrent = RehabLahan::where('year', $currentYear)->where('status', 'final')->sum('realization');
        $totalRehabPrev = RehabLahan::where('year', $prevYear)->where('status', 'final')->sum('realization');

        $rehabGrowth = 0;
        if ($totalRehabPrev > 0) {
            $rehabGrowth = (($totalRehabCurrent - $totalRehabPrev) / $totalRehabPrev) * 100;
        } elseif ($totalRehabCurrent > 0) {
            $rehabGrowth = 100;
        }

        // --- Produksi Kayu Stats (New) ---
        // Sum annual_volume_target for final records. The column is string, so we cast to float.
        $kayuCurrent = HasilHutanKayu::where('year', $currentYear)
            ->where('status', 'final')
            ->get()
            ->sum(function ($row) {
                return (float) $row->annual_volume_target;
            });

        // --- Transaksi Ekonomi (PNBP) Stats (New) ---
        // Sum PSDH + DBHDR
        $pnbpCurrent = RealisasiPnbp::where('year', $currentYear)
            ->where('status', 'final')
            ->get()
            ->sum(function ($row) {
                return (float) str_replace(['Rp', '.', ' '], '', $row->number_of_psdh) +
                    (float) str_replace(['Rp', '.', ' '], '', $row->number_of_dbhdr);
                // Note: Assuming the data might have formatting characters based on 'string' type in validation. 
                // If it's pure number string, these replaces are harmless.
            });

        // --- KUPS Stats (New) ---
        // Total accumulated KUPS
        $kupsTotal = Kups::count();
        $kupsActive = Kups::where('status', 'active')->count(); // Assuming there's a status 'active', otherwise just use total.
        // Actually Kups model has 'status' but values might be 'final', 'verified' etc. Let's just use total count for now or based on implementation plan.
        // Plan said: "Count of Kups records".

        // --- Charts Data (Rehab Lahan) ---
        $monthlyData = RehabLahan::selectRaw('month, SUM(realization) as total')
            ->where('year', $chartYear)
            ->where('status', 'final')
            ->groupBy('month')
            ->orderBy('month')
            ->get()
            ->pluck('total', 'month');

        $chartData = [];
        for ($i = 1; $i <= 12; $i++) {
            $chartData[] = $monthlyData->get($i, 0);
        }

        // --- Available Years ---
        $availableYears = RehabLahan::selectRaw('DISTINCT year')
            ->orderBy('year', 'desc')
            ->pluck('year')
            ->toArray();

        // Merge with other models' years if needed, but for now RehabLahan is the main driver for the chart.
        if (!in_array(date('Y'), $availableYears)) {
            $availableYears[] = (int) date('Y');
            rsort($availableYears);
        }

        // --- Recent Activity ---
        $activities = Activity::latest()
            ->take(5)
            ->with(['causer', 'causer.roles'])
            ->get()
            ->map(function ($activity) {
                $description = $activity->description;

                switch ($activity->event) {
                    case 'created':
                        $description = 'Menambahkan data';
                        break;
                    case 'updated':
                        $description = 'Merubah data';
                        break;
                    case 'deleted':
                        $description = 'Menghapus Data';
                        break;
                }

                if ($activity->description === 'logged in') {
                    $description = 'Masuk Aplikasi';
                } elseif ($activity->description === 'logged out') {
                    $description = 'Keluar Aplikasi';
                }

                return [
                    'id' => $activity->id,
                    'description' => $description,
                    'causer' => $activity->causer ? $activity->causer->name : 'System',
                    // Fetch the first role name (if any), capitalize it.
                    'role' => $activity->causer && $activity->causer->roles->isNotEmpty()
                        ? $activity->causer->roles->first()->description
                        : '-',
                    'created_at' => $activity->created_at->diffForHumans(),
                    'subject_type' => class_basename($activity->subject_type),
                    'event' => $activity->event,
                ];
            });

        // --- KUPS Chart Data ---
        $kupsByClass = Kups::select('category', DB::raw('count(*) as total'))
            ->groupBy('category')
            ->get();

        $kupsChart = [
            'labels' => $kupsByClass->pluck('category'),
            'data' => $kupsByClass->pluck('total'),
        ];

        return Inertia::render('Dashboard', [
            'stats' => [
                'rehabilitation' => [
                    'total' => $totalRehabCurrent,
                    'growth' => round($rehabGrowth, 1),
                ],
                'wood_production' => [
                    'total' => $kayuCurrent,
                ],
                'economy' => [
                    'total' => $pnbpCurrent,
                ],
                'kups' => [
                    'total' => $kupsTotal,
                ]
            ],
            'chartData' => $chartData,
            'kupsChart' => $kupsChart,
            'filters' => [
                'year' => (int) $chartYear
            ],
            'availableYears' => $availableYears,
            'recentActivities' => $activities
        ]);
    }

    public function publicDashboard(Request $request)
    {
        $currentYear = $request->input('year', date('Y'));

        // Generate last 5 years
        $thisYear = date('Y');
        $availableYears = range($thisYear, $thisYear - 4);

        // --- 1. Pembinaan Hutan (Rehab Lahan) ---
        $rehabTotal = RehabLahan::where('year', $currentYear)
            ->sum('realization');

        $rehabChart = RehabLahan::where('year', $currentYear)
            ->selectRaw('month, sum(realization) as total')
            ->groupBy('month')
            ->orderBy('month')
            ->pluck('total', 'month');

        // --- 2. Perlindungan Hutan ---
        // Kebakaran
        $kebakaranStats = \App\Models\KebakaranHutan::where('year', $currentYear)
            ->where('status', 'final')
            ->selectRaw('SUM(number_of_fires) as total_kejadian, SUM(fire_area) as total_area')
            ->first();

        $kebakaranMonthlyStats = \App\Models\KebakaranHutan::where('year', $currentYear)
            ->where('status', 'final')
            ->selectRaw('month, SUM(number_of_fires) as total')
            ->groupBy('month')
            ->orderBy('month')
            ->pluck('total', 'month');

        // Wisata
        $wisataStats = \App\Models\PengunjungWisata::where('year', $currentYear)
            ->where('status', 'final')
            ->selectRaw('SUM(number_of_visitors) as total_visitors, SUM(gross_income) as total_income')
            ->first();

        $wisataMonthlyStats = \App\Models\PengunjungWisata::where('year', $currentYear)
            ->where('status', 'final')
            ->selectRaw('month, SUM(number_of_visitors) as total')
            ->groupBy('month')
            ->orderBy('month')
            ->pluck('total', 'month');

        // --- 3. Bina Usaha (Expanded) ---
        // Kayu Stats
        $kayuStats = HasilHutanKayu::where('year', $currentYear)
            ->where('status', 'final')
            ->selectRaw('forest_type, SUM(annual_volume_target) as total_volume')
            ->groupBy('forest_type')
            ->pluck('total_volume', 'forest_type');

        $kayuMonthlyStats = HasilHutanKayu::where('year', $currentYear)
            ->where('status', 'final')
            ->selectRaw('month, SUM(annual_volume_target) as total')
            ->groupBy('month')
            ->orderBy('month')
            ->pluck('total', 'month');

        $kayuCommodityStats = HasilHutanKayu::join('m_kayu', 'hasil_hutan_kayu.id_kayu', '=', 'm_kayu.id')
            ->where('hasil_hutan_kayu.year', $currentYear)
            ->where('hasil_hutan_kayu.status', 'final')
            ->selectRaw('m_kayu.name as commodity, SUM(hasil_hutan_kayu.annual_volume_target) as total')
            ->groupBy('m_kayu.name')
            ->orderByDesc('total')
            ->limit(5)
            ->pluck('total', 'commodity');

        // Bukan Kayu Stats
        $bukanKayuStats = \App\Models\HasilHutanBukanKayu::where('year', $currentYear)
            ->where('status', 'final')
            ->selectRaw('forest_type, SUM(annual_volume_target) as total_production')
            ->groupBy('forest_type')
            ->pluck('total_production', 'forest_type');

        $bukanKayuMonthlyStats = \App\Models\HasilHutanBukanKayu::where('year', $currentYear)
            ->where('status', 'final')
            ->selectRaw('month, SUM(annual_volume_target) as total')
            ->groupBy('month')
            ->orderBy('month')
            ->pluck('total', 'month');

        $bukanKayuCommodityStats = \App\Models\HasilHutanBukanKayu::join('m_bukan_kayu', 'hasil_hutan_bukan_kayu.id_bukan_kayu', '=', 'm_bukan_kayu.id')
            ->where('hasil_hutan_bukan_kayu.year', $currentYear)
            ->where('hasil_hutan_bukan_kayu.status', 'final')
            ->selectRaw('m_bukan_kayu.name as commodity, SUM(hasil_hutan_bukan_kayu.annual_volume_target) as total')
            ->groupBy('m_bukan_kayu.name')
            ->orderByDesc('total')
            ->limit(5)
            ->pluck('total', 'commodity');

        $industriCount = \App\Models\IndustriBerizin::count();

        $pnbpTotal = RealisasiPnbp::where('year', $currentYear)
            ->where('status', 'final')
            ->get()
            ->sum(function ($row) {
                return (float) str_replace(['Rp', '.', ' '], '', $row->number_of_psdh) +
                    (float) str_replace(['Rp', '.', ' '], '', $row->number_of_dbhdr);
            });

        // --- 4. Pemberdayaan Masyarakat (KUPS & SKPS) ---
        $kupsStats = [
            'total' => Kups::count(),
            'active' => Kups::where('status', '!=', 'inactive')->count(),
            'bg_colors' => [
                'Blue' => 'rgba(54, 162, 235, 0.7)',
                'Silver' => 'rgba(201, 203, 207, 0.7)',
                'Gold' => 'rgba(255, 205, 86, 0.7)',
                'Platinum' => 'rgba(75, 192, 192, 0.7)',
            ], // Defining colors for frontend usage/consistency if needed, or just send data
            'classes' => Kups::select('category', DB::raw('count(*) as total'))
                ->groupBy('category')
                ->get()
                ->pluck('total', 'category')
        ];

        $skpsStats = Skps::count();

        return Inertia::render('Public/PublicDashboard', [
            'currentYear' => $currentYear,
            'availableYears' => $availableYears,
            'stats' => [
                'pembinaan' => [
                    'rehab_total' => (float) $rehabTotal,
                    'rehab_chart' => $rehabChart,
                ],
                'perlindungan' => [
                    'kebakaran_kejadian' => (int) ($kebakaranStats->total_kejadian ?? 0),
                    'kebakaran_area' => (float) ($kebakaranStats->total_area ?? 0),
                    'kebakaranMonthly' => $kebakaranMonthlyStats,
                    'wisata_visitors' => (int) ($wisataStats->total_visitors ?? 0),
                    'wisata_income' => (float) ($wisataStats->total_income ?? 0),
                    'wisataMonthly' => $wisataMonthlyStats,
                ],
                'bina_usaha' => [
                    'kayu' => $kayuStats,
                    'kayuMonthly' => $kayuMonthlyStats,
                    'kayuCommodity' => $kayuCommodityStats,
                    'bukanKayu' => $bukanKayuStats,
                    'bukanKayuMonthly' => $bukanKayuMonthlyStats,
                    'bukanKayuCommodity' => $bukanKayuCommodityStats,
                    'industri' => $industriCount,
                    'pnbp' => $pnbpTotal,
                ],
                'pemberdayaan' => [
                    'kups' => $kupsStats,
                    'skps' => $skpsStats,
                ]
            ]
        ]);
    }

    /**
     * Export Rehabilitasi Lahan data to Excel
     */
    public function exportRehabLahan(Request $request)
    {
        $year = $request->input('year', date('Y'));
        $filename = 'laporan-rehabilitasi-lahan-' . $year . '-' . date('Y-m-d') . '.xlsx';

        return Excel::download(new RehabLahanExport($year), $filename);
    }
}
