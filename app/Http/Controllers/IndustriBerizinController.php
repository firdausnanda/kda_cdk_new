<?php

namespace App\Http\Controllers;

use App\Models\IndustriBerizin;
use App\Models\JenisProduksi;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class IndustriBerizinController extends Controller
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

    $datas = IndustriBerizin::query()
      ->leftJoin('m_regencies', 'industri_berizin.regency_id', '=', 'm_regencies.id')
      ->leftJoin('m_districts', 'industri_berizin.district_id', '=', 'm_districts.id')
      ->leftJoin('m_jenis_produksi', 'industri_berizin.id_jenis_produksi', '=', 'm_jenis_produksi.id')
      ->select(
        'industri_berizin.*',
        'm_regencies.name as regency_name',
        'm_districts.name as district_name',
        'm_jenis_produksi.name as jenis_produksi_name'
      )
      ->when($selectedYear, function ($query, $year) {
        return $query->where('industri_berizin.year', $year);
      })
      ->when($request->search, function ($query, $search) {
        $query->where(function ($q) use ($search) {
          $q->where('m_jenis_produksi.name', 'like', "%{$search}%")
            ->orWhere('industri_berizin.phhk_pbhh', 'like', "%{$search}%")
            ->orWhere('industri_berizin.phhbk_pbphh', 'like', "%{$search}%")
            ->orWhere('m_regencies.name', 'like', "%{$search}%")
            ->orWhere('m_districts.name', 'like', "%{$search}%");
        });
      })
      ->with(['creator', 'regency', 'district', 'jenis_produksi'])
      ->latest('industri_berizin.created_at')
      ->paginate(10)
      ->withQueryString();

    // Stats
    $stats = [
      'total_count' => IndustriBerizin::when($selectedYear, fn($q) => $q->where('year', $selectedYear))->count(),
      'verified_count' => IndustriBerizin::where('status', 'final')
        ->when($selectedYear, fn($q) => $q->where('year', $selectedYear))
        ->count(),
    ];

    // Available Years
    $availableYears = IndustriBerizin::distinct()
      ->orderBy('year', 'desc')
      ->pluck('year');

    if ($availableYears->isEmpty()) {
      $availableYears = [date('Y')];
    }

    return Inertia::render('IndustriBerizin/Index', [
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
    return Inertia::render('IndustriBerizin/Create', [
      'jenis_produksi_list' => JenisProduksi::all(),
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
      'phhk_pbhh' => 'required|string',
      'phhbk_pbphh' => 'required|string',
      'id_jenis_produksi' => 'required|exists:m_jenis_produksi,id',
    ]);

    IndustriBerizin::create($validated);

    return redirect()->route('industri-berizin.index')
      ->with('success', 'Data berhasil ditambahkan');
  }

  public function edit(IndustriBerizin $industriBerizin)
  {
    return Inertia::render('IndustriBerizin/Edit', [
      'data' => $industriBerizin->load(['jenis_produksi', 'regency', 'district']),
      'jenis_produksi_list' => JenisProduksi::all(),
      'provinces' => DB::table('m_provinces')->where('id', '35')->get(),
      'regencies' => DB::table('m_regencies')->where('province_id', '35')->get(),
      'districts' => DB::table('m_districts')->where('regency_id', $industriBerizin->regency_id)->get(),
    ]);
  }

  public function update(Request $request, IndustriBerizin $industriBerizin)
  {
    $validated = $request->validate([
      'year' => 'required|integer|digits:4',
      'month' => 'required|integer|min:1|max:12',
      'province_id' => 'required|exists:m_provinces,id',
      'regency_id' => 'required|exists:m_regencies,id',
      'district_id' => 'required|exists:m_districts,id',
      'phhk_pbhh' => 'required|string',
      'phhbk_pbphh' => 'required|string',
      'id_jenis_produksi' => 'required|exists:m_jenis_produksi,id',
    ]);

    $industriBerizin->update($validated);

    return redirect()->route('industri-berizin.index')
      ->with('success', 'Data berhasil diperbarui');
  }

  public function destroy(IndustriBerizin $industriBerizin)
  {
    $industriBerizin->delete();

    return redirect()->route('industri-berizin.index')
      ->with('success', 'Data berhasil dihapus');
  }

  public function submit(IndustriBerizin $industriBerizin)
  {
    $industriBerizin->update(['status' => 'waiting_kasi']);
    return redirect()->back()->with('success', 'Laporan berhasil diajukan untuk verifikasi Kasi.');
  }

  public function approve(IndustriBerizin $industriBerizin)
  {
    $user = auth()->user();

    if (($user->hasRole('kasi') || $user->hasRole('admin')) && $industriBerizin->status === 'waiting_kasi') {
      $industriBerizin->update([
        'status' => 'waiting_cdk',
        'approved_by_kasi_at' => now(),
      ]);
      return redirect()->back()->with('success', 'Laporan disetujui dan diteruskan ke KaCDK.');
    }

    if (($user->hasRole('kacdk') || $user->hasRole('admin')) && $industriBerizin->status === 'waiting_cdk') {
      $industriBerizin->update([
        'status' => 'final',
        'approved_by_cdk_at' => now(),
      ]);
      return redirect()->back()->with('success', 'Laporan telah disetujui secara final.');
    }

    return redirect()->back()->with('error', 'Aksi tidak diijinkan.');
  }

  public function reject(Request $request, IndustriBerizin $industriBerizin)
  {
    $request->validate([
      'rejection_note' => 'required|string|max:255',
    ]);

    $industriBerizin->update([
      'status' => 'rejected',
      'rejection_note' => $request->rejection_note,
    ]);

    return redirect()->back()->with('success', 'Laporan telah ditolak dengan catatan.');
  }
}
