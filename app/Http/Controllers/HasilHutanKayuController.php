<?php

namespace App\Http\Controllers;

use App\Models\HasilHutanKayu;
use App\Models\Kayu;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class HasilHutanKayuController extends Controller
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
      $selectedYear = HasilHutanKayu::where('forest_type', $forestType)->max('year') ?? date('Y');
    }

    $sortField = $request->query('sort', 'created_at');
    $sortDirection = $request->query('direction', 'desc');

    $datas = HasilHutanKayu::query()
      ->leftJoin('m_regencies', 'hasil_hutan_kayu.regency_id', '=', 'm_regencies.id')
      ->leftJoin('m_districts', 'hasil_hutan_kayu.district_id', '=', 'm_districts.id')
      ->leftJoin('m_kayu', 'hasil_hutan_kayu.id_kayu', '=', 'm_kayu.id')
      ->select(
        'hasil_hutan_kayu.*',
        'm_regencies.name as regency_name',
        'm_districts.name as district_name',
        'm_kayu.name as kayu_name'
      )
      ->where('forest_type', $forestType)
      ->when($selectedYear, function ($query, $year) {
        return $query->where('hasil_hutan_kayu.year', $year);
      })
      ->when($request->search, function ($query, $search) {
        $query->where(function ($q) use ($search) {
          $q->where('m_kayu.name', 'like', "%{$search}%")
            ->orWhere('m_regencies.name', 'like', "%{$search}%")
            ->orWhere('m_districts.name', 'like', "%{$search}%");
        });
      })

      ->with(['creator', 'regency', 'district', 'kayu'])
      ->when($sortField, function ($query) use ($sortField, $sortDirection) {
        $sortMap = [
          'month' => 'hasil_hutan_kayu.month', // Or combined with year if needed
          'location' => 'm_districts.name', // Approximate, allows sorting by district name
          'kayu' => 'm_kayu.name',
          'target' => 'hasil_hutan_kayu.annual_volume_target',
          'realization' => 'hasil_hutan_kayu.annual_volume_realization',
          'status' => 'hasil_hutan_kayu.status',
          'created_at' => 'hasil_hutan_kayu.created_at',
        ];

        $dbColumn = $sortMap[$sortField] ?? 'hasil_hutan_kayu.created_at';
        return $query->orderBy($dbColumn, $sortDirection);
      })
      ->paginate(10)

      ->withQueryString();

    // Calculate Stats
    $stats = [
      'total_count' => HasilHutanKayu::where('forest_type', $forestType)
        ->when($selectedYear, fn($q) => $q->where('year', $selectedYear))
        ->count(),
      'total_volume' => HasilHutanKayu::where('forest_type', $forestType)
        ->when($selectedYear, fn($q) => $q->where('year', $selectedYear))
        ->where('status', 'final')
        ->get()
        ->sum(function ($row) {
          return (float) $row->annual_volume_target;
        }),
      'verified_count' => HasilHutanKayu::where('forest_type', $forestType)
        ->when($selectedYear, fn($q) => $q->where('year', $selectedYear))
        ->where('status', 'final')
        ->count(),
    ];

    // Get available years for filter
    $dbYears = HasilHutanKayu::where('forest_type', $forestType)
      ->distinct()
      ->orderBy('year', 'desc')
      ->pluck('year')
      ->toArray();
    $fixedYears = range(2025, 2021);
    $availableYears = array_values(array_unique(array_merge($dbYears, $fixedYears)));
    rsort($availableYears);

    return Inertia::render('HasilHutanKayu/Index', [
      'datas' => $datas,
      'forest_type' => $forestType,
      'stats' => $stats,
      'available_years' => $availableYears,
      'filters' => [
        'year' => $selectedYear,
        'search' => $request->search,
        'sort' => $sortField,
        'direction' => $sortDirection
      ],
    ]);
  }

  public function create(Request $request)
  {
    $forestType = $request->query('forest_type', 'Hutan Negara');

    return Inertia::render('HasilHutanKayu/Create', [
      'forest_type' => $forestType,
      'kayu_list' => Kayu::all(),
      'provinces' => DB::table('m_provinces')->where('id', '35')->get(), // Default Jawa Timur
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
      'annual_volume_target' => 'required|string', // Using string as per migration/model
      'id_kayu' => 'required|exists:m_kayu,id',
    ]);

    HasilHutanKayu::create($validated);

    return redirect()->route('hasil-hutan-kayu.index', ['forest_type' => $validated['forest_type']])
      ->with('success', 'Data berhasil ditambahkan');
  }

  public function edit(HasilHutanKayu $hasilHutanKayu)
  {
    return Inertia::render('HasilHutanKayu/Edit', [
      'data' => $hasilHutanKayu->load(['kayu', 'regency', 'district']),
      'kayu_list' => Kayu::all(),
      'provinces' => DB::table('m_provinces')->where('id', '35')->get(),
      'regencies' => DB::table('m_regencies')->where('province_id', '35')->get(),
      'districts' => DB::table('m_districts')->where('regency_id', $hasilHutanKayu->regency_id)->get(),
    ]);
  }

  public function update(Request $request, HasilHutanKayu $hasilHutanKayu)
  {
    $validated = $request->validate([
      'year' => 'required|integer|digits:4',
      'month' => 'required|integer|min:1|max:12',
      'province_id' => 'required|exists:m_provinces,id',
      'regency_id' => 'required|exists:m_regencies,id',
      'district_id' => 'required|exists:m_districts,id',
      'forest_type' => 'required|in:Hutan Negara,Hutan Rakyat,Perhutanan Sosial',
      'annual_volume_target' => 'required|string',
      'id_kayu' => 'required|exists:m_kayu,id',
    ]);

    $hasilHutanKayu->update($validated);

    return redirect()->route('hasil-hutan-kayu.index', ['forest_type' => $hasilHutanKayu->forest_type])
      ->with('success', 'Data berhasil diperbarui');
  }

  public function destroy(HasilHutanKayu $hasilHutanKayu)
  {
    $forestType = $hasilHutanKayu->forest_type;
    $hasilHutanKayu->delete();

    return redirect()->route('hasil-hutan-kayu.index', ['forest_type' => $forestType])
      ->with('success', 'Data berhasil dihapus');
  }

  public function submit(HasilHutanKayu $hasilHutanKayu)
  {
    $hasilHutanKayu->update(['status' => 'waiting_kasi']);
    return redirect()->back()->with('success', 'Laporan berhasil diajukan untuk verifikasi Kasi.');
  }

  public function approve(HasilHutanKayu $hasilHutanKayu)
  {
    $user = auth()->user();

    if (($user->hasRole('kasi') || $user->hasRole('admin')) && $hasilHutanKayu->status === 'waiting_kasi') {
      $hasilHutanKayu->update([
        'status' => 'waiting_cdk',
        'approved_by_kasi_at' => now(),
      ]);
      return redirect()->back()->with('success', 'Laporan disetujui dan diteruskan ke KaCDK.');
    }

    if (($user->hasRole('kacdk') || $user->hasRole('admin')) && $hasilHutanKayu->status === 'waiting_cdk') {
      $hasilHutanKayu->update([
        'status' => 'final',
        'approved_by_cdk_at' => now(),
      ]);
      return redirect()->back()->with('success', 'Laporan telah disetujui secara final.');
    }

    return redirect()->back()->with('error', 'Aksi tidak diijinkan.');
  }

  public function reject(Request $request, HasilHutanKayu $hasilHutanKayu)
  {
    $request->validate([
      'rejection_note' => 'required|string|max:255',
    ]);

    $hasilHutanKayu->update([
      'status' => 'rejected',
      'rejection_note' => $request->rejection_note,
    ]);

    return redirect()->back()->with('success', 'Laporan telah ditolak dengan catatan.');
  }

  public function export(Request $request)
  {
    $forestType = $request->query('forest_type', 'Hutan Negara');
    $year = $request->query('year');
    return \Maatwebsite\Excel\Facades\Excel::download(new \App\Exports\HasilHutanKayuExport($forestType, $year), 'hasil-hutan-kayu-' . date('Y-m-d') . '.xlsx');
  }

  public function template()
  {
    return \Maatwebsite\Excel\Facades\Excel::download(new \App\Exports\HasilHutanKayuTemplateExport, 'template_import_hasil_hutan_kayu.xlsx');
  }

  public function import(Request $request)
  {
    $request->validate([
      'file' => 'required|mimes:xlsx,csv,xls',
      'forest_type' => 'required',
    ]);

    $import = new \App\Imports\HasilHutanKayuImport($request->forest_type);

    try {
      \Maatwebsite\Excel\Facades\Excel::import($import, $request->file('file'));
    } catch (\Maatwebsite\Excel\Validators\ValidationException $e) {
      return redirect()->back()->with('import_errors', $this->mapImportFailures($e->failures()));
    }

    // Check for failures if SkipsOnFailure is used (which doesn't throw exception usually, but accumulates)
    if ($import->failures()->isNotEmpty()) {
      return redirect()->back()->with('import_errors', $this->mapImportFailures($import->failures()));
    }

    return redirect()->back()->with('success', 'Data berhasil diimport.');
  }

  /**
   * Bulk delete records.
   */
  public function bulkDestroy(Request $request)
  {
    $request->validate([
      'ids' => 'required|array',
      'ids.*' => 'exists:hasil_hutan_kayu,id',
    ]);

    HasilHutanKayu::whereIn('id', $request->ids)->delete();

    return redirect()->back()->with('success', count($request->ids) . ' data berhasil dihapus.');
  }

  /**
   * Bulk submit records.
   */
  public function bulkSubmit(Request $request)
  {
    $request->validate([
      'ids' => 'required|array',
      'ids.*' => 'exists:hasil_hutan_kayu,id',
    ]);

    $count = HasilHutanKayu::whereIn('id', $request->ids)
      ->whereIn('status', ['draft', 'rejected'])
      ->update(['status' => 'waiting_kasi']);

    return redirect()->back()->with('success', $count . ' laporan berhasil diajukan.');
  }

  /**
   * Bulk approve records.
   */
  public function bulkApprove(Request $request)
  {
    $request->validate([
      'ids' => 'required|array',
      'ids.*' => 'exists:hasil_hutan_kayu,id',
    ]);

    $user = auth()->user();
    $count = 0;

    if ($user->hasRole('kasi') || $user->hasRole('admin')) {
      $count = HasilHutanKayu::whereIn('id', $request->ids)
        ->where('status', 'waiting_kasi')
        ->update([
          'status' => 'waiting_cdk',
          'approved_by_kasi_at' => now(),
        ]);
    } elseif ($user->hasRole('kacdk') || $user->hasRole('admin')) {
      $count = HasilHutanKayu::whereIn('id', $request->ids)
        ->where('status', 'waiting_cdk')
        ->update([
          'status' => 'final',
          'approved_by_cdk_at' => now(),
        ]);
    }

    return redirect()->back()->with('success', $count . ' laporan berhasil disetujui.');
  }
}
