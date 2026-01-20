<?php

namespace App\Http\Controllers;

use App\Models\KebakaranHutan;
use App\Models\PengelolaWisata;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class KebakaranHutanController extends Controller
{
  public function __construct()
  {
    $this->middleware('permission:perlindungan.view')->only(['index', 'show']);
    $this->middleware('permission:perlindungan.create')->only(['create', 'store']);
    $this->middleware('permission:perlindungan.edit')->only(['edit', 'update', 'submit']);
    $this->middleware('permission:perlindungan.delete')->only(['destroy']);
    $this->middleware('permission:perlindungan.approve')->only(['verify', 'approve', 'reject']);
  }

  public function index(Request $request)
  {
    $selectedYear = $request->query('year', date('Y'));

    $datas = KebakaranHutan::query()
      ->leftJoin('m_regencies', 'kebakaran_hutan.regency_id', '=', 'm_regencies.id')
      ->leftJoin('m_districts', 'kebakaran_hutan.district_id', '=', 'm_districts.id')
      ->leftJoin('m_villages', 'kebakaran_hutan.village_id', '=', 'm_villages.id')
      ->leftJoin('m_pengelola_wisata', 'kebakaran_hutan.id_pengelola_wisata', '=', 'm_pengelola_wisata.id')
      ->select(
        'kebakaran_hutan.*',
        'm_regencies.name as regency_name',
        'm_districts.name as district_name',
        'm_villages.name as village_name',
        'm_pengelola_wisata.name as pengelola_name'
      )
      ->when($selectedYear, function ($query, $year) {
        return $query->where('kebakaran_hutan.year', $year);
      })
      ->when($request->search, function ($query, $search) {
        $query->where(function ($q) use ($search) {
          $q->where('m_villages.name', 'like', "%{$search}%")
            ->orWhere('m_districts.name', 'like', "%{$search}%")
            ->orWhere('m_regencies.name', 'like', "%{$search}%")
            ->orWhere('m_pengelola_wisata.name', 'like', "%{$search}%")
            ->orWhere('kebakaran_hutan.area_function', 'like', "%{$search}%");
        });
      })
      ->with(['creator', 'regency', 'district', 'village', 'pengelolaWisata'])
      ->latest('kebakaran_hutan.created_at')
      ->paginate(10)
      ->withQueryString();

    $stats = [
      'total_fires' => KebakaranHutan::where('year', $selectedYear)->where('status', 'final')->sum('number_of_fires'),
      'total_area' => KebakaranHutan::where('year', $selectedYear)->where('status', 'final')->sum('fire_area'), // Assuming string field might need handling if it has units, but model casts might be needed
      'total_count' => KebakaranHutan::where('year', $selectedYear)->where('status', 'final')->count(),
    ];

    // Ensure total_area can be summed if it's a string in DB but represents number
    // If it's alphanumeric (e.g. "10 Ha"), sum() might fail or return 0. 
    // For now adhering to numeric assumption or basic sum.

    $availableYears = KebakaranHutan::distinct()->orderBy('year', 'desc')->pluck('year');
    if ($availableYears->isEmpty()) {
      $availableYears = [date('Y')];
    }

    return Inertia::render('KebakaranHutan/Index', [
      'datas' => $datas,
      'stats' => $stats,
      'filters' => [
        'year' => (int) $selectedYear
      ],
      'availableYears' => $availableYears,
    ]);
  }

  public function create()
  {
    return Inertia::render('KebakaranHutan/Create', [
      'pengelolaWisata' => PengelolaWisata::all(),
      'provinces' => DB::table('m_provinces')->where('id', '35')->get(), // Default Jawa Timur
      'regencies' => DB::table('m_regencies')->where('province_id', '35')->get()
    ]);
  }

  public function store(Request $request)
  {
    $validated = $request->validate([
      'year' => 'required|integer',
      'month' => 'required|integer|min:1|max:12',
      'province_id' => 'required|exists:m_provinces,id',
      'regency_id' => 'required|exists:m_regencies,id',
      'district_id' => 'required|exists:m_districts,id',
      'village_id' => 'required|exists:m_villages,id',
      'coordinates' => 'nullable|string',
      'id_pengelola_wisata' => 'required|exists:m_pengelola_wisata,id',
      'area_function' => 'required|string',
      'number_of_fires' => 'required|integer',
      'fire_area' => 'required|string', // Keeping as string as per migration
    ]);

    KebakaranHutan::create($validated);

    return redirect()->route('kebakaran-hutan.index')->with('success', 'Data Created Successfully');
  }

  public function edit(KebakaranHutan $kebakaranHutan)
  {
    return Inertia::render('KebakaranHutan/Edit', [
      'data' => $kebakaranHutan->load(['pengelolaWisata', 'regency', 'district', 'village']),
      'pengelolaWisata' => PengelolaWisata::all(),
      'provinces' => DB::table('m_provinces')->where('id', '35')->get(),
      'regencies' => DB::table('m_regencies')->where('province_id', '35')->get(),
      'districts' => DB::table('m_districts')->where('regency_id', $kebakaranHutan->regency_id)->get(),
      'villages' => DB::table('m_villages')->where('district_id', $kebakaranHutan->district_id)->get(),
    ]);
  }

  public function update(Request $request, KebakaranHutan $kebakaranHutan)
  {
    $validated = $request->validate([
      'year' => 'required|integer',
      'month' => 'required|integer|min:1|max:12',
      'province_id' => 'required|exists:m_provinces,id',
      'regency_id' => 'required|exists:m_regencies,id',
      'district_id' => 'required|exists:m_districts,id',
      'village_id' => 'required|exists:m_villages,id',
      'coordinates' => 'nullable|string',
      'id_pengelola_wisata' => 'required|exists:m_pengelola_wisata,id',
      'area_function' => 'required|string',
      'number_of_fires' => 'required|integer',
      'fire_area' => 'required|string',
    ]);

    $kebakaranHutan->update($validated);

    return redirect()->route('kebakaran-hutan.index')->with('success', 'Data Updated Successfully');
  }

  public function destroy(KebakaranHutan $kebakaranHutan)
  {
    $kebakaranHutan->delete();

    return redirect()->route('kebakaran-hutan.index')->with('success', 'Data Deleted Successfully');
  }

  public function submit(KebakaranHutan $kebakaranHutan)
  {
    $kebakaranHutan->update(['status' => 'waiting_kasi']);
    return redirect()->back()->with('success', 'Laporan berhasil diajukan untuk verifikasi Kasi.');
  }

  public function approve(KebakaranHutan $kebakaranHutan)
  {
    $user = auth()->user();

    if (($user->hasRole('kasi') || $user->hasRole('admin')) && $kebakaranHutan->status === 'waiting_kasi') {
      $kebakaranHutan->update([
        'status' => 'waiting_cdk',
        'approved_by_kasi_at' => now(),
      ]);
      return redirect()->back()->with('success', 'Laporan disetujui dan diteruskan ke KaCDK.');
    }

    if (($user->hasRole('kacdk') || $user->hasRole('admin')) && $kebakaranHutan->status === 'waiting_cdk') {
      $kebakaranHutan->update([
        'status' => 'final',
        'approved_by_cdk_at' => now(),
      ]);
      return redirect()->back()->with('success', 'Laporan telah disetujui secara final.');
    }

    return redirect()->back()->with('error', 'Aksi tidak diijinkan.');
  }

  public function reject(Request $request, KebakaranHutan $kebakaranHutan)
  {
    $request->validate([
      'rejection_note' => 'required|string|max:255',
    ]);

    $kebakaranHutan->update([
      'status' => 'rejected',
      'rejection_note' => $request->rejection_note,
    ]);

    return redirect()->back()->with('success', 'Laporan telah ditolak dengan catatan.');
  }
}
