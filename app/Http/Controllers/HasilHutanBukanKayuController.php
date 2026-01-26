<?php

namespace App\Http\Controllers;

use App\Models\HasilHutanBukanKayu;
use App\Models\BukanKayu;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class HasilHutanBukanKayuController extends Controller
{
  use \App\Traits\HandlesImportFailures;
  public function __construct()
  {
    $this->middleware('permission:bina-usaha.view')->only(['index', 'show']);
    $this->middleware('permission:bina-usaha.create')->only(['create', 'store']);
    $this->middleware('permission:bina-usaha.edit')->only(['edit', 'update', 'submit']);
    $this->middleware('permission:bina-usaha.delete')->only(['destroy']);
    $this->middleware('permission:bina-usaha.approve')->only(['verify', 'approve', 'reject']);
  }

  public function index(Request $request)
  {
    $forestType = $request->query('forest_type', 'Hutan Negara');
    $selectedYear = $request->query('year');
    if (!$selectedYear) {
      $selectedYear = HasilHutanBukanKayu::where('forest_type', $forestType)->max('year') ?? date('Y');
    }

    $datas = HasilHutanBukanKayu::query()
      ->leftJoin('m_regencies', 'hasil_hutan_bukan_kayu.regency_id', '=', 'm_regencies.id')
      ->leftJoin('m_districts', 'hasil_hutan_bukan_kayu.district_id', '=', 'm_districts.id')
      ->leftJoin('m_bukan_kayu', 'hasil_hutan_bukan_kayu.id_bukan_kayu', '=', 'm_bukan_kayu.id')
      ->select(
        'hasil_hutan_bukan_kayu.*',
        'm_regencies.name as regency_name',
        'm_districts.name as district_name',
        'm_bukan_kayu.name as kayu_name' // Using alias 'kayu_name' to reuse frontend logic possibly, or better 'bukan_kayu_name'
      )
      ->where('forest_type', $forestType)
      ->when($selectedYear, function ($query, $year) {
        return $query->where('hasil_hutan_bukan_kayu.year', $year);
      })
      ->when($request->search, function ($query, $search) {
        $query->where(function ($q) use ($search) {
          $q->where('m_bukan_kayu.name', 'like', "%{$search}%")
            ->orWhere('m_regencies.name', 'like', "%{$search}%")
            ->orWhere('m_districts.name', 'like', "%{$search}%");
        });
      })
      ->with(['creator', 'regency', 'district', 'kayu']) // Model relation is 'kayu' (belongsTo BukanKayu)
      ->latest('hasil_hutan_bukan_kayu.created_at')
      ->paginate(10)
      ->withQueryString();

    // Stats
    $stats = [
      'total_count' => HasilHutanBukanKayu::where('forest_type', $forestType)
        ->when($selectedYear, fn($q) => $q->where('year', $selectedYear))
        ->count(),
      'total_volume' => HasilHutanBukanKayu::where('forest_type', $forestType)
        ->when($selectedYear, fn($q) => $q->where('year', $selectedYear))
        ->where('status', 'final')
        ->get()
        ->sum(function ($row) {
          return (float) $row->annual_volume_target;
        }),
      'verified_count' => HasilHutanBukanKayu::where('forest_type', $forestType)
        ->when($selectedYear, fn($q) => $q->where('year', $selectedYear))
        ->where('status', 'final')
        ->count(),
    ];

    // Available Years
    $dbYears = HasilHutanBukanKayu::where('forest_type', $forestType)
      ->distinct()
      ->orderBy('year', 'desc')
      ->pluck('year')
      ->toArray();
    $fixedYears = range(2025, 2021);
    $availableYears = array_values(array_unique(array_merge($dbYears, $fixedYears)));
    rsort($availableYears);

    return Inertia::render('HasilHutanBukanKayu/Index', [
      'datas' => $datas,
      'forest_type' => $forestType,
      'stats' => $stats,
      'available_years' => $availableYears,
      'filters' => [
        'year' => $selectedYear,
      ],
    ]);
  }

  public function create(Request $request)
  {
    $forestType = $request->query('forest_type', 'Hutan Negara');

    return Inertia::render('HasilHutanBukanKayu/Create', [
      'forest_type' => $forestType,
      'kayu_list' => BukanKayu::all(),
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
      'forest_type' => 'required|in:Hutan Negara,Hutan Rakyat,Perhutanan Sosial',
      'annual_volume_target' => 'required|string',
      'id_bukan_kayu' => 'required|exists:m_bukan_kayu,id',
    ]);

    HasilHutanBukanKayu::create($validated);

    return redirect()->route('hasil-hutan-bukan-kayu.index', ['forest_type' => $validated['forest_type']])
      ->with('success', 'Data berhasil ditambahkan');
  }

  public function edit(HasilHutanBukanKayu $hasilHutanBukanKayu)
  {
    return Inertia::render('HasilHutanBukanKayu/Edit', [
      'data' => $hasilHutanBukanKayu->load(['kayu', 'regency', 'district']),
      'kayu_list' => BukanKayu::all(),
      'provinces' => DB::table('m_provinces')->where('id', '35')->get(),
      'regencies' => DB::table('m_regencies')->where('province_id', '35')->get(),
      'districts' => DB::table('m_districts')->where('regency_id', $hasilHutanBukanKayu->regency_id)->get(),
    ]);
  }

  public function update(Request $request, HasilHutanBukanKayu $hasilHutanBukanKayu)
  {
    $validated = $request->validate([
      'year' => 'required|integer|digits:4',
      'month' => 'required|integer|min:1|max:12',
      'province_id' => 'required|exists:m_provinces,id',
      'regency_id' => 'required|exists:m_regencies,id',
      'district_id' => 'required|exists:m_districts,id',
      'forest_type' => 'required|in:Hutan Negara,Hutan Rakyat,Perhutanan Sosial',
      'annual_volume_target' => 'required|string',
      'id_bukan_kayu' => 'required|exists:m_bukan_kayu,id',
    ]);

    $hasilHutanBukanKayu->update($validated);

    return redirect()->route('hasil-hutan-bukan-kayu.index', ['forest_type' => $hasilHutanBukanKayu->forest_type])
      ->with('success', 'Data berhasil diperbarui');
  }

  public function destroy(HasilHutanBukanKayu $hasilHutanBukanKayu)
  {
    $forestType = $hasilHutanBukanKayu->forest_type;
    $hasilHutanBukanKayu->delete();

    return redirect()->route('hasil-hutan-bukan-kayu.index', ['forest_type' => $forestType])
      ->with('success', 'Data berhasil dihapus');
  }

  public function submit(HasilHutanBukanKayu $hasilHutanBukanKayu)
  {
    $hasilHutanBukanKayu->update(['status' => 'waiting_kasi']);
    return redirect()->back()->with('success', 'Laporan berhasil diajukan untuk verifikasi Kasi.');
  }

  public function approve(HasilHutanBukanKayu $hasilHutanBukanKayu)
  {
    $user = auth()->user();

    if (($user->hasRole('kasi') || $user->hasRole('admin')) && $hasilHutanBukanKayu->status === 'waiting_kasi') {
      $hasilHutanBukanKayu->update([
        'status' => 'waiting_cdk',
        'approved_by_kasi_at' => now(),
      ]);
      return redirect()->back()->with('success', 'Laporan disetujui dan diteruskan ke KaCDK.');
    }

    if (($user->hasRole('kacdk') || $user->hasRole('admin')) && $hasilHutanBukanKayu->status === 'waiting_cdk') {
      $hasilHutanBukanKayu->update([
        'status' => 'final',
        'approved_by_cdk_at' => now(),
      ]);
      return redirect()->back()->with('success', 'Laporan telah disetujui secara final.');
    }

    return redirect()->back()->with('error', 'Aksi tidak diijinkan.');
  }

  public function reject(Request $request, HasilHutanBukanKayu $hasilHutanBukanKayu)
  {
    $request->validate([
      'rejection_note' => 'required|string|max:255',
    ]);

    $hasilHutanBukanKayu->update([
      'status' => 'rejected',
      'rejection_note' => $request->rejection_note,
    ]);

    return redirect()->back()->with('success', 'Laporan telah ditolak dengan catatan.');
  }

  public function export(Request $request)
  {
    $forestType = $request->query('forest_type', 'Hutan Negara');
    $year = $request->query('year');
    return \Maatwebsite\Excel\Facades\Excel::download(new \App\Exports\HasilHutanBukanKayuExport($forestType, $year), 'hasil-hutan-bukan-kayu-' . date('Y-m-d') . '.xlsx');
  }

  public function template()
  {
    return \Maatwebsite\Excel\Facades\Excel::download(new \App\Exports\HasilHutanBukanKayuTemplateExport, 'template_import_hasil_hutan_bukan_kayu.xlsx');
  }

  public function import(Request $request)
  {
    $request->validate([
      'file' => 'required|mimes:xlsx,csv,xls',
      'forest_type' => 'required',
    ]);

    $import = new \App\Imports\HasilHutanBukanKayuImport($request->forest_type);

    try {
      \Maatwebsite\Excel\Facades\Excel::import($import, $request->file('file'));
    } catch (\Maatwebsite\Excel\Validators\ValidationException $e) {
      return redirect()->back()->with('import_errors', $this->mapImportFailures($e->failures()));
    }

    if ($import->failures()->isNotEmpty()) {
      return redirect()->back()->with('import_errors', $this->mapImportFailures($import->failures()));
    }

    return redirect()->back()->with('success', 'Data berhasil diimport.');
  }
}
