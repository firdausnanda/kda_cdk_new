<?php

namespace App\Http\Controllers;

use App\Models\HasilHutanKayu;
use App\Models\Kups;
use App\Models\NilaiEkonomi;
use App\Models\RealisasiPnbp;
use App\Models\RehabLahan;
use App\Models\PenghijauanLingkungan;
use App\Models\RehabManggrove;
use App\Models\ReboisasiPS;
use App\Models\RhlTeknis;
use App\Models\SkemaPerhutananSosial;
use App\Models\Skps;
use App\Models\SumberDana;
use App\Models\KebakaranHutan;
use App\Models\PengunjungWisata;
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
        $kayuCurrent = HasilHutanKayu::join('hasil_hutan_kayu_details', 'hasil_hutan_kayu.id', '=', 'hasil_hutan_kayu_details.hasil_hutan_kayu_id')
            ->where('hasil_hutan_kayu.year', $currentYear)
            ->where('hasil_hutan_kayu.status', 'final')
            ->sum('hasil_hutan_kayu_details.volume_target');

        // --- Transaksi Ekonomi (PNBP) Stats (New) ---
        // Sum PSDH + DBHDR
        $pnbpCurrent = RealisasiPnbp::where('year', $currentYear)
            ->where('status', 'final')
            ->get()
            ->sum(function ($row) {
                return (float) str_replace(['Rp', '.', ' '], '', $row->pnbp_realization);
            });

        // --- KUPS Stats (New) ---
        // Total accumulated KUPS
        $kupsTotal = Kups::where('status', 'final')->count();
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
            ->where('status', 'final')
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
        $currentYear = $request->input('year', 2026);

        // Generate last 5 years starting from 2025
        $thisYear = 2026;
        $availableYears = range($thisYear, $thisYear - 4);

        return Inertia::render('Public/PublicDashboard', [
            'currentYear' => $currentYear,
            'availableYears' => $availableYears,
            'stats' => [
                'pembinaan' => $this->getPembinaanStats($currentYear),
                'perlindungan' => $this->getPerlindunganStats($currentYear),
                'bina_usaha' => $this->getBinaUsahaStats($currentYear),
                'kelembagaan_ps' => $this->getKelembagaanPsStats($currentYear),
                'kelembagaan_hr' => $this->getKelembagaanHrStats($currentYear),
            ]
        ]);
    }

    private function getPembinaanStats($currentYear)
    {
        // --- 1. Pembinaan Hutan (Rehab Lahan) ---
        $rehabTotal = RehabLahan::where('year', $currentYear)
            ->where('status', 'final')
            ->sum('realization');

        $rehabTargetTotal = RehabLahan::where('year', $currentYear)
            ->where('status', 'final')
            ->sum('target_annual');

        $rehabChart = RehabLahan::where('year', $currentYear)
            ->where('status', 'final')
            ->selectRaw('month, sum(realization) as total')
            ->groupBy('month')
            ->orderBy('month')
            ->pluck('total', 'month');

        $rehabTargetChart = RehabLahan::where('year', $currentYear)
            ->where('status', 'final')
            ->selectRaw('month, sum(target_annual) as total')
            ->groupBy('month')
            ->orderBy('month')
            ->pluck('total', 'month');

        $rehabFund = SumberDana::leftJoin('rehab_lahan', function ($join) use ($currentYear) {
            $join->on('m_sumber_dana.name', '=', 'rehab_lahan.fund_source')
                ->where('rehab_lahan.year', '=', $currentYear)
                ->where('rehab_lahan.status', '=', 'final')
                ->whereNull('rehab_lahan.deleted_at');
        })
            ->selectRaw('m_sumber_dana.name as fund, count(rehab_lahan.id) as total')
            ->groupBy('m_sumber_dana.name')
            ->pluck('total', 'fund');

        $rehabRegency = RehabLahan::where('year', $currentYear)
            ->where('status', 'final')
            ->join('m_regencies', 'rehab_lahan.regency_id', '=', 'm_regencies.id')
            ->selectRaw('m_regencies.name as regency, count(*) as total')
            ->groupBy('m_regencies.name')
            ->pluck('total', 'regency');

        // --- 1.1 Penghijauan Lingkungan ---
        $penghijauanTotal = PenghijauanLingkungan::where('year', $currentYear)
            ->where('status', 'final')
            ->sum('realization');

        $penghijauanTargetTotal = PenghijauanLingkungan::where('year', $currentYear)
            ->where('status', 'final')
            ->sum('target_annual');

        $penghijauanChart = PenghijauanLingkungan::where('year', $currentYear)
            ->where('status', 'final')
            ->selectRaw('month, sum(realization) as total')
            ->groupBy('month')
            ->orderBy('month')
            ->pluck('total', 'month');

        $penghijauanTargetChart = PenghijauanLingkungan::where('year', $currentYear)
            ->where('status', 'final')
            ->selectRaw('month, sum(target_annual) as total')
            ->groupBy('month')
            ->orderBy('month')
            ->pluck('total', 'month');

        $penghijauanFund = SumberDana::leftJoin('penghijauan_lingkungan', function ($join) use ($currentYear) {
            $join->on('m_sumber_dana.name', '=', 'penghijauan_lingkungan.fund_source')
                ->where('penghijauan_lingkungan.year', '=', $currentYear)
                ->where('penghijauan_lingkungan.status', '=', 'final')
                ->whereNull('penghijauan_lingkungan.deleted_at');
        })
            ->selectRaw('m_sumber_dana.name as fund, count(penghijauan_lingkungan.id) as total')
            ->groupBy('m_sumber_dana.name')
            ->pluck('total', 'fund');

        $penghijauanRegency = PenghijauanLingkungan::where('year', $currentYear)
            ->where('status', 'final')
            ->join('m_regencies', 'penghijauan_lingkungan.regency_id', '=', 'm_regencies.id')
            ->selectRaw('m_regencies.name as regency, count(*) as total')
            ->groupBy('m_regencies.name')
            ->pluck('total', 'regency');

        // --- 1.2 Rehabilitasi Mangrove ---
        $manggroveTotal = RehabManggrove::where('year', $currentYear)
            ->where('status', 'final')
            ->sum('realization');

        $manggroveTargetTotal = RehabManggrove::where('year', $currentYear)
            ->where('status', 'final')
            ->sum('target_annual');

        $manggroveChart = RehabManggrove::where('year', $currentYear)
            ->where('status', 'final')
            ->selectRaw('month, sum(realization) as total')
            ->groupBy('month')
            ->orderBy('month')
            ->pluck('total', 'month');

        $manggroveTargetChart = RehabManggrove::where('year', $currentYear)
            ->where('status', 'final')
            ->selectRaw('month, sum(target_annual) as total')
            ->groupBy('month')
            ->orderBy('month')
            ->pluck('total', 'month');

        $manggroveFund = SumberDana::leftJoin('rehab_manggrove', function ($join) use ($currentYear) {
            $join->on('m_sumber_dana.name', '=', 'rehab_manggrove.fund_source')
                ->where('rehab_manggrove.year', '=', $currentYear)
                ->where('rehab_manggrove.status', '=', 'final')
                ->whereNull('rehab_manggrove.deleted_at');
        })
            ->selectRaw('m_sumber_dana.name as fund, count(rehab_manggrove.id) as total')
            ->groupBy('m_sumber_dana.name')
            ->pluck('total', 'fund');

        $manggroveRegency = RehabManggrove::where('year', $currentYear)
            ->where('status', 'final')
            ->join('m_regencies', 'rehab_manggrove.regency_id', '=', 'm_regencies.id')
            ->selectRaw('m_regencies.name as regency, count(*) as total')
            ->groupBy('m_regencies.name')
            ->pluck('total', 'regency');

        // --- 1.3 Reboisasi PS ---
        $reboisasiTotal = ReboisasiPS::where('year', $currentYear)
            ->where('status', 'final')
            ->sum('realization');

        $reboisasiTargetTotal = ReboisasiPS::where('year', $currentYear)
            ->where('status', 'final')
            ->sum('target_annual');

        $reboisasiChart = ReboisasiPS::where('year', $currentYear)
            ->where('status', 'final')
            ->selectRaw('month, sum(realization) as total')
            ->groupBy('month')
            ->orderBy('month')
            ->pluck('total', 'month');

        $reboisasiTargetChart = ReboisasiPS::where('year', $currentYear)
            ->where('status', 'final')
            ->selectRaw('month, sum(target_annual) as total')
            ->groupBy('month')
            ->orderBy('month')
            ->pluck('total', 'month');

        $reboisasiFund = SumberDana::leftJoin('reboisasi_ps', function ($join) use ($currentYear) {
            $join->on('m_sumber_dana.name', '=', 'reboisasi_ps.fund_source')
                ->where('reboisasi_ps.year', '=', $currentYear)
                ->where('reboisasi_ps.status', '=', 'final')
                ->whereNull('reboisasi_ps.deleted_at');
        })
            ->selectRaw('m_sumber_dana.name as fund, count(reboisasi_ps.id) as total')
            ->groupBy('m_sumber_dana.name')
            ->pluck('total', 'fund');

        $reboisasiRegency = ReboisasiPS::where('year', $currentYear)
            ->where('status', 'final')
            ->join('m_regencies', 'reboisasi_ps.regency_id', '=', 'm_regencies.id')
            ->selectRaw('m_regencies.name as regency, count(*) as total')
            ->groupBy('m_regencies.name')
            ->pluck('total', 'regency');

        // --- 1.4 RHL Teknis (Sum of unit_amount from details) ---
        $rhlTeknisData = RhlTeknis::where('year', $currentYear)
            ->where('status', 'final')
            ->with(['details'])
            ->get();

        $rhlTeknisTotal = $rhlTeknisData->sum(function ($item) {
            return $item->details->sum('unit_amount');
        });

        $rhlTeknisTargetTotal = $rhlTeknisData->sum('target_annual');

        $rhlTeknisChart = $rhlTeknisData->groupBy('month')->map(function ($items) {
            return $items->sum(function ($item) {
                return $item->details->sum('unit_amount');
            });
        });

        $rhlTeknisTargetChart = $rhlTeknisData->groupBy('month')->map(function ($items) {
            return $items->sum('target_annual');
        });

        $rhlTeknisFund = SumberDana::leftJoin('rhl_teknis', function ($join) use ($currentYear) {
            $join->on('m_sumber_dana.name', '=', 'rhl_teknis.fund_source')
                ->where('rhl_teknis.year', '=', $currentYear)
                ->where('rhl_teknis.status', '=', 'final')
                ->whereNull('rhl_teknis.deleted_at');
        })
            ->selectRaw('m_sumber_dana.name as fund, count(rhl_teknis.id) as total')
            ->groupBy('m_sumber_dana.name')
            ->pluck('total', 'fund');

        $rhlTeknisType = \App\Models\RhlTeknisDetail::join('rhl_teknis', 'rhl_teknis_details.rhl_teknis_id', '=', 'rhl_teknis.id')
            ->join('m_bangunan_kta', 'rhl_teknis_details.bangunan_kta_id', '=', 'm_bangunan_kta.id')
            ->where('rhl_teknis.year', $currentYear)
            ->where('rhl_teknis.status', 'final')
            ->whereNull('rhl_teknis.deleted_at')
            ->selectRaw('m_bangunan_kta.name as type, sum(rhl_teknis_details.unit_amount) as total')
            ->groupBy('m_bangunan_kta.name')
            ->orderByDesc('total')
            ->limit(5)
            ->pluck('total', 'type');

        return [
            'rehab_total' => (float) $rehabTotal,
            'rehab_target_total' => (float) $rehabTargetTotal,
            'rehab_chart' => $rehabChart,
            'rehab_target_chart' => $rehabTargetChart,
            'rehab_fund' => $rehabFund,
            'rehab_regency' => $rehabRegency,
            'penghijauan_total' => (float) $penghijauanTotal,
            'penghijauan_target_total' => (float) $penghijauanTargetTotal,
            'penghijauan_chart' => $penghijauanChart,
            'penghijauan_target_chart' => $penghijauanTargetChart,
            'penghijauan_fund' => $penghijauanFund,
            'penghijauan_regency' => $penghijauanRegency,
            'manggrove_total' => (float) $manggroveTotal,
            'manggrove_target_total' => (float) $manggroveTargetTotal,
            'manggrove_chart' => $manggroveChart,
            'manggrove_target_chart' => $manggroveTargetChart,
            'manggrove_fund' => $manggroveFund,
            'manggrove_regency' => $manggroveRegency,
            'reboisasi_total' => (float) $reboisasiTotal,
            'reboisasi_target_total' => (float) $reboisasiTargetTotal,
            'reboisasi_chart' => $reboisasiChart,
            'reboisasi_target_chart' => $reboisasiTargetChart,
            'reboisasi_fund' => $reboisasiFund,
            'reboisasi_regency' => $reboisasiRegency,
            'rhl_teknis_total' => (float) $rhlTeknisTotal,
            'rhl_teknis_target_total' => (float) $rhlTeknisTargetTotal,
            'rhl_teknis_chart' => $rhlTeknisChart,
            'rhl_teknis_target_chart' => $rhlTeknisTargetChart,
            'rhl_teknis_fund' => $rhlTeknisFund,
            'rhl_teknis_type' => $rhlTeknisType,
        ];
    }

    private function getPerlindunganStats($currentYear)
    {
        // --- 2. Perlindungan Hutan ---
        // Kebakaran
        $kebakaranStats = KebakaranHutan::where('year', $currentYear)
            ->where('status', 'final')
            ->selectRaw('SUM(number_of_fires) as total_kejadian, SUM(fire_area) as total_area')
            ->first();

        $kebakaranChart = KebakaranHutan::where('year', $currentYear)
            ->where('status', 'final')
            ->selectRaw('month, sum(number_of_fires) as incidents, sum(fire_area) as area')
            ->groupBy('month')
            ->get()
            ->pluck('incidents', 'month')
            ->all();

        $kebakaranMonthlyData = KebakaranHutan::where('year', $currentYear)
            ->where('status', 'final')
            ->selectRaw('month, sum(number_of_fires) as incidents, sum(fire_area) as area')
            ->groupBy('month')
            ->get()
            ->keyBy('month');

        $kebakaranByPengelola = KebakaranHutan::where('kebakaran_hutan.year', $currentYear)
            ->where('kebakaran_hutan.status', 'final')
            ->join('m_pengelola_wisata', 'kebakaran_hutan.id_pengelola_wisata', '=', 'm_pengelola_wisata.id')
            ->selectRaw('m_pengelola_wisata.name as pengelola, sum(number_of_fires) as incidents, sum(fire_area) as area')
            ->groupBy('m_pengelola_wisata.name')
            ->get()
            ->keyBy('pengelola');

        // Wisata
        $wisataStats = PengunjungWisata::where('year', $currentYear)
            ->where('status', 'final')
            ->selectRaw('SUM(number_of_visitors) as total_visitors, SUM(gross_income) as total_income')
            ->first();

        $wisataMonthlyStats = PengunjungWisata::where('year', $currentYear)
            ->where('status', 'final')
            ->selectRaw('month, sum(number_of_visitors) as visitors, sum(gross_income) as income')
            ->groupBy('month')
            ->get()
            ->keyBy('month');

        $wisataByPengelola = PengunjungWisata::where('pengunjung_wisata.year', $currentYear)
            ->where('pengunjung_wisata.status', 'final')
            ->join('m_pengelola_wisata', 'pengunjung_wisata.id_pengelola_wisata', '=', 'm_pengelola_wisata.id')
            ->selectRaw('m_pengelola_wisata.name as pengelola, sum(number_of_visitors) as visitors, sum(gross_income) as income')
            ->groupBy('m_pengelola_wisata.name')
            ->get()
            ->keyBy('pengelola');

        return [
            'kebakaran_kejadian' => (int) ($kebakaranStats->total_kejadian ?? 0),
            'kebakaran_area' => (float) ($kebakaranStats->total_area ?? 0),
            'kebakaranChart' => $kebakaranChart,
            'kebakaranMonthly' => $kebakaranMonthlyData,
            'kebakaranByPengelola' => $kebakaranByPengelola,
            'wisata_visitors' => (int) ($wisataStats->total_visitors ?? 0),
            'wisata_income' => (float) ($wisataStats->total_income ?? 0),
            'wisataMonthly' => $wisataMonthlyStats,
            'wisataByPengelola' => $wisataByPengelola,
        ];
    }

    private function getBinaUsahaStats($currentYear)
    {
        // --- 3. Bina Usaha (Split into 5 categories) ---
        $forestTypes = ['Hutan Negara', 'Perhutanan Sosial', 'Hutan Rakyat'];
        $binaUsahaData = [];

        foreach ($forestTypes as $type) {
            $key = strtolower(str_replace(' ', '_', $type));

            // Kayu for this type
            $binaUsahaData[$key]['kayu_total'] = (float) HasilHutanKayu::join('hasil_hutan_kayu_details', 'hasil_hutan_kayu.id', '=', 'hasil_hutan_kayu_details.hasil_hutan_kayu_id')
                ->where('hasil_hutan_kayu.year', $currentYear)
                ->where('hasil_hutan_kayu.status', 'final')
                ->where('hasil_hutan_kayu.forest_type', $type)
                ->sum('hasil_hutan_kayu_details.volume_target');

            $binaUsahaData[$key]['kayu_monthly'] = HasilHutanKayu::join('hasil_hutan_kayu_details', 'hasil_hutan_kayu.id', '=', 'hasil_hutan_kayu_details.hasil_hutan_kayu_id')
                ->where('hasil_hutan_kayu.year', $currentYear)
                ->where('hasil_hutan_kayu.status', 'final')
                ->where('hasil_hutan_kayu.forest_type', $type)
                ->selectRaw('hasil_hutan_kayu.month, sum(hasil_hutan_kayu_details.volume_target) as total')
                ->groupBy('hasil_hutan_kayu.month')
                ->pluck('total', 'month');

            $binaUsahaData[$key]['kayu_commodity'] = HasilHutanKayu::join('hasil_hutan_kayu_details', 'hasil_hutan_kayu.id', '=', 'hasil_hutan_kayu_details.hasil_hutan_kayu_id')
                ->join('m_kayu', 'hasil_hutan_kayu_details.kayu_id', '=', 'm_kayu.id')
                ->where('hasil_hutan_kayu.year', $currentYear)
                ->where('hasil_hutan_kayu.status', 'final')
                ->where('hasil_hutan_kayu.forest_type', $type)
                ->selectRaw('m_kayu.name as commodity, sum(hasil_hutan_kayu_details.volume_target) as total')
                ->groupBy('m_kayu.name')
                ->orderByDesc('total')
                ->limit(5)
                ->pluck('total', 'commodity');

            // Bukan Kayu for this type
            $binaUsahaData[$key]['bukan_kayu_total'] = (float) \App\Models\HasilHutanBukanKayu::where('year', $currentYear)
                ->where('status', 'final')
                ->where('forest_type', $type)
                ->sum('annual_volume_target');

            $binaUsahaData[$key]['bukan_kayu_monthly'] = \App\Models\HasilHutanBukanKayu::where('year', $currentYear)
                ->where('status', 'final')
                ->where('forest_type', $type)
                ->selectRaw('month, sum(annual_volume_target) as total')
                ->groupBy('month')
                ->pluck('total', 'month');

            $binaUsahaData[$key]['bukan_kayu_commodity'] = \App\Models\HasilHutanBukanKayu::join('m_bukan_kayu', 'hasil_hutan_bukan_kayu.id_bukan_kayu', '=', 'm_bukan_kayu.id')
                ->where('hasil_hutan_bukan_kayu.year', $currentYear)
                ->where('hasil_hutan_bukan_kayu.status', 'final')
                ->where('forest_type', $type)
                ->selectRaw('m_bukan_kayu.name as commodity, sum(hasil_hutan_bukan_kayu.annual_volume_target) as total')
                ->groupBy('m_bukan_kayu.name')
                ->orderByDesc('total')
                ->limit(5)
                ->pluck('total', 'commodity');
        }

        // PBPHH
        $pbphhStats = [
            'total_units' => \App\Models\Pbphh::count(),
            'total_workers' => \App\Models\Pbphh::sum('number_of_workers'),
            'total_investment' => \App\Models\Pbphh::sum('investment_value'),
            'by_regency' => \App\Models\Pbphh::join('m_regencies', 'pbphh.regency_id', '=', 'm_regencies.id')
                ->selectRaw('m_regencies.name as regency, count(*) as count')
                ->groupBy('m_regencies.name')
                ->pluck('count', 'regency'),
            'by_production_type' => \App\Models\Pbphh::join('pbphh_jenis_produksi', 'pbphh.id', '=', 'pbphh_jenis_produksi.pbphh_id')
                ->join('m_jenis_produksi', 'pbphh_jenis_produksi.jenis_produksi_id', '=', 'm_jenis_produksi.id')
                ->selectRaw('m_jenis_produksi.name as type, count(distinct pbphh.id) as count')
                ->groupBy('m_jenis_produksi.name')
                ->get()
                ->toArray(),
            'by_condition' => \App\Models\Pbphh::selectRaw('present_condition as condition_name, count(*) as count')
                ->groupBy('present_condition')
                ->get()
                ->toArray()
        ];

        // PNBP
        $pnbpStats = [
            'total_realization' => (float) RealisasiPnbp::where('year', $currentYear)->where('status', 'final')->sum('pnbp_realization'),
            'total_target' => (float) RealisasiPnbp::where('year', $currentYear)->where('status', 'final')->sum('pnbp_target'),
            'monthly' => RealisasiPnbp::where('year', $currentYear)
                ->where('status', 'final')
                ->selectRaw('month, sum(pnbp_realization) as realization, sum(pnbp_target) as target')
                ->groupBy('month')
                ->get()
                ->keyBy('month'),
            'by_regency' => RealisasiPnbp::join('m_regencies', 'realisasi_pnbp.regency_id', '=', 'm_regencies.id')
                ->where('realisasi_pnbp.year', $currentYear)
                ->where('realisasi_pnbp.status', 'final')
                ->selectRaw('m_regencies.name as regency, sum(pnbp_realization) as total')
                ->groupBy('m_regencies.name')
                ->pluck('total', 'regency')
        ];

        return [
            'hutan_negara' => $binaUsahaData['hutan_negara'],
            'perhutanan_sosial' => $binaUsahaData['perhutanan_sosial'],
            'hutan_rakyat' => $binaUsahaData['hutan_rakyat'],
            'pbphh' => $pbphhStats,
            'pnbp' => $pnbpStats,
        ];
    }

    private function getKelembagaanPsStats($currentYear)
    {
        // --- 4. Kelembagaan Perhutanan Sosial ---
        return [
            'kelompok_count' => Skps::where('status', 'final')->count(),
            'area_total' => (float) Skps::where('status', 'final')->sum('ps_area'),
            'kk_total' => (int) Skps::where('status', 'final')->sum('number_of_kk'),
            'nekon_total' => (float) NilaiEkonomi::where('year', $currentYear)->where('status', 'final')->sum('total_transaction_value'),
            'scheme_distribution' => SkemaPerhutananSosial::leftJoin('skps', function ($join) {
                $join->on('m_skema_perhutanan_sosial.id', '=', 'skps.id_skema_perhutanan_sosial')
                    ->where('skps.status', 'final');
            })
                ->selectRaw('m_skema_perhutanan_sosial.name as scheme, count(skps.id) as count')
                ->groupBy('m_skema_perhutanan_sosial.id', 'm_skema_perhutanan_sosial.name')
                ->get(),
            'economic_by_regency' => NilaiEkonomi::join('m_regencies', 'nilai_ekonomi.regency_id', '=', 'm_regencies.id')
                ->where('nilai_ekonomi.year', $currentYear)
                ->where('nilai_ekonomi.status', 'final')
                ->selectRaw('m_regencies.name as regency, sum(total_transaction_value) as total')
                ->groupBy('m_regencies.name')
                ->pluck('total', 'regency')
        ];
    }

    private function getKelembagaanHrStats($currentYear)
    {
        // --- 5. Kelembagaan Hutan Rakyat ---
        return [
            'kelompok_count' => \App\Models\PerkembanganKth::where('year', $currentYear)->where('status', 'final')->count(),
            'area_total' => (float) \App\Models\PerkembanganKth::where('year', $currentYear)->where('status', 'final')->sum('luas_kelola'),
            'anggota_total' => (int) \App\Models\PerkembanganKth::where('year', $currentYear)->where('status', 'final')->sum('jumlah_anggota'),
            'nte_total' => (float) \App\Models\NilaiTransaksiEkonomi::where('year', $currentYear)->where('status', 'final')->sum('total_nilai_transaksi'),
            'class_distribution' => \App\Models\PerkembanganKth::where('year', $currentYear)
                ->where('status', 'final')
                ->selectRaw('kelas_kelembagaan as class_name, count(*) as count')
                ->groupBy('kelas_kelembagaan')
                ->get(),
            'economic_by_regency' => \App\Models\NilaiTransaksiEkonomi::join('m_regencies', 'nilai_transaksi_ekonomi.regency_id', '=', 'm_regencies.id')
                ->where('nilai_transaksi_ekonomi.year', $currentYear)
                ->where('nilai_transaksi_ekonomi.status', 'final')
                ->selectRaw('m_regencies.name as regency, sum(total_nilai_transaksi) as total')
                ->groupBy('m_regencies.name')
                ->pluck('total', 'regency'),
            'top_commodities' => \App\Models\NilaiTransaksiEkonomiDetail::join('m_commodities', 'nilai_transaksi_ekonomi_details.commodity_id', '=', 'm_commodities.id')
                ->join('nilai_transaksi_ekonomi', 'nilai_transaksi_ekonomi_details.nilai_transaksi_ekonomi_id', '=', 'nilai_transaksi_ekonomi.id')
                ->where('nilai_transaksi_ekonomi.year', $currentYear)
                ->where('nilai_transaksi_ekonomi.status', 'final')
                ->selectRaw('m_commodities.name as commodity, sum(nilai_transaksi_ekonomi_details.nilai_transaksi) as total')
                ->groupBy('m_commodities.name')
                ->orderByDesc('total')
                ->limit(5)
                ->pluck('total', 'commodity')
        ];
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
