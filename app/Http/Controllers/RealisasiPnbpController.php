<?php

namespace App\Http\Controllers;

use App\Models\RealisasiPnbp;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class RealisasiPnbpController extends Controller
{
  public function __construct()
  {
    $this->middleware('permission:bina-usaha.view')->only(['index', 'show']);
    $this->middleware('permission:bina-usaha.create')->only(['create', 'store']);
    $this->middleware('permission:bina-usaha.edit')->only(['edit', 'update', 'submit']);
    $this->middleware('permission:bina-usaha.delete')->only(['destroy']);
  }

  public function index(Request $request)
  {
    $selectedYear = $request->query('year', date('Y'));

    $datas = RealisasiPnbp::query()
      ->leftJoin('m_regencies', 'realisasi_pnbp.regency_id', '=', 'm_regencies.id')
      ->leftJoin('m_districts', 'realisasi_pnbp.district_id', '=', 'm_districts.id')
      ->select(
        'realisasi_pnbp.*',
        'm_regencies.name as regency_name',
        'm_districts.name as district_name'
      )
      ->when($selectedYear, function ($query, $year) {
        return $query->where('realisasi_pnbp.year', $year);
      })
      ->with(['creator', 'regency', 'district'])
      ->latest('realisasi_pnbp.created_at')
      ->paginate(10)
      ->withQueryString();

    // Stats
    $stats = [
      'total_count' => RealisasiPnbp::when($selectedYear, fn($q) => $q->where('year', $selectedYear))->count(),
      'verified_count' => RealisasiPnbp::where('status', 'final')
        ->when($selectedYear, fn($q) => $q->where('year', $selectedYear))
        ->count(),
    ];

    // Available Years
    $availableYears = RealisasiPnbp::distinct()
      ->orderBy('year', 'desc')
      ->pluck('year');

    if ($availableYears->isEmpty()) {
      $availableYears = [date('Y')];
    }

    return Inertia::render('RealisasiPnbp/Index', [
      'datas' => $datas,
      'stats' => $stats,
      'available_years' => $availableYears,
      'filters' => [
        'year' => $selectedYear,
      ],
    ]);
  }

  public function create()
  {
    return Inertia::render('RealisasiPnbp/Create', [
      'provinces' => DB::table('m_provinces')->where('id', '35')->get(),
      'regencies' => DB::table('m_regencies')->where('province_id', '35')->get()
    ]);
  }

  public function store(Request $request)
  {
    $validated = $request->validate([
      'year' => 'required|integer|digits:4',
      'month' => 'required|integer|min:1|max:12',
      'province_id' => 'required|exists:m_provinces,id',
      'regency_id' => 'required|exists:m_regencies,id',
      'district_id' => 'required|exists:m_districts,id',
      'types_of_forest_products' => 'required|string',
      'pnbp_target' => 'required|string',
      'number_of_psdh' => 'required|string',
      'number_of_dbhdr' => 'required|string',
    ]);

    RealisasiPnbp::create($validated);

    return redirect()->route('realisasi-pnbp.index')
      ->with('success', 'Data berhasil ditambahkan');
  }

  public function edit(RealisasiPnbp $realisasiPnbp)
  {
    return Inertia::render('RealisasiPnbp/Edit', [
      'data' => $realisasiPnbp->load(['regency', 'district']),
      'provinces' => DB::table('m_provinces')->where('id', '35')->get(),
      'regencies' => DB::table('m_regencies')->where('province_id', '35')->get(),
      'districts' => DB::table('m_districts')->where('regency_id', $realisasiPnbp->regency_id)->get(),
    ]);
  }

  public function update(Request $request, RealisasiPnbp $realisasiPnbp)
  {
    $validated = $request->validate([
      'year' => 'required|integer|digits:4',
      'month' => 'required|integer|min:1|max:12',
      'province_id' => 'required|exists:m_provinces,id',
      'regency_id' => 'required|exists:m_regencies,id',
      'district_id' => 'required|exists:m_districts,id',
      'types_of_forest_products' => 'required|string',
      'pnbp_target' => 'required|string',
      'number_of_psdh' => 'required|string',
      'number_of_dbhdr' => 'required|string',
    ]);

    $realisasiPnbp->update($validated);

    return redirect()->route('realisasi-pnbp.index')
      ->with('success', 'Data berhasil diperbarui');
  }

  public function destroy(RealisasiPnbp $realisasiPnbp)
  {
    $realisasiPnbp->delete();

    return redirect()->route('realisasi-pnbp.index')
      ->with('success', 'Data berhasil dihapus');
  }

  public function submit(RealisasiPnbp $realisasiPnbp)
  {
    $realisasiPnbp->update(['status' => 'waiting_kasi']);
    return redirect()->back()->with('success', 'Laporan berhasil diajukan untuk verifikasi Kasi.');
  }

  public function approve(RealisasiPnbp $realisasiPnbp)
  {
    $user = auth()->user();

    if (($user->hasRole('kasi') || $user->hasRole('admin')) && $realisasiPnbp->status === 'waiting_kasi') {
      $realisasiPnbp->update([
        'status' => 'waiting_cdk',
        'approved_by_kasi_at' => now(),
      ]);
      return redirect()->back()->with('success', 'Laporan disetujui dan diteruskan ke KaCDK.');
    }

    if (($user->hasRole('kacdk') || $user->hasRole('admin')) && $realisasiPnbp->status === 'waiting_cdk') {
      $realisasiPnbp->update([
        'status' => 'final',
        'approved_by_cdk_at' => now(),
      ]);
      return redirect()->back()->with('success', 'Laporan telah disetujui secara final.');
    }

    return redirect()->back()->with('error', 'Aksi tidak diijinkan.');
  }

  public function reject(Request $request, RealisasiPnbp $realisasiPnbp)
  {
    $request->validate([
      'rejection_note' => 'required|string|max:255',
    ]);

    $realisasiPnbp->update([
      'status' => 'rejected',
      'rejection_note' => $request->rejection_note,
    ]);

    return redirect()->back()->with('success', 'Laporan telah ditolak dengan catatan.');
  }
}
