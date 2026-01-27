<?php

namespace App\Http\Controllers;

use App\Models\ReboisasiPS;
use App\Models\SumberDana;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ReboisasiPsController extends Controller
{
  use \App\Traits\HandlesImportFailures;
  public function __construct()
  {
    $this->middleware('permission:rehab.view')->only(['index', 'show']);
    $this->middleware('permission:rehab.create')->only(['create', 'store']);
    $this->middleware('permission:rehab.edit')->only(['edit', 'update', 'submit']);
    $this->middleware('permission:rehab.delete')->only(['destroy']);
    $this->middleware('permission:rehab.approve')->only(['verify', 'approve', 'reject']);
  }

  public function index(Request $request)
  {
    $selectedYear = $request->query('year');
    if (!$selectedYear) {
      $selectedYear = ReboisasiPS::max('year') ?? date('Y');
    }

    $sortField = $request->query('sort', 'created_at');
    $sortDirection = $request->query('direction', 'desc');

    $datas = ReboisasiPS::query()
      ->leftJoin('m_regencies', 'reboisasi_ps.regency_id', '=', 'm_regencies.id')
      ->leftJoin('m_districts', 'reboisasi_ps.district_id', '=', 'm_districts.id')
      ->leftJoin('m_villages', 'reboisasi_ps.village_id', '=', 'm_villages.id')
      ->select(
        'reboisasi_ps.*',
        'm_regencies.name as regency_name',
        'm_districts.name as district_name',
        'm_villages.name as village_name'
      )
      ->when($selectedYear, function ($query, $year) {
        return $query->where('reboisasi_ps.year', $year);
      })
      ->when($request->search, function ($query, $search) {
        $query->where(function ($q) use ($search) {
          $q->where('m_villages.name', 'like', "%{$search}%")
            ->orWhere('m_districts.name', 'like', "%{$search}%")
            ->orWhere('m_regencies.name', 'like', "%{$search}%")
            ->orWhere('reboisasi_ps.fund_source', 'like', "%{$search}%");
        });
      })
      ->with(['creator', 'regency_rel', 'district_rel', 'village_rel'])
      ->when($sortField, function ($query) use ($sortField, $sortDirection) {
        $sortMap = [
          'month' => 'reboisasi_ps.month',
          'location' => 'm_villages.name',
          'realization' => 'reboisasi_ps.realization',
          'target' => 'reboisasi_ps.target_annual',
          'fund_source' => 'reboisasi_ps.fund_source',
          'status' => 'reboisasi_ps.status',
          'created_at' => 'reboisasi_ps.created_at',
        ];

        $dbColumn = $sortMap[$sortField] ?? 'reboisasi_ps.created_at';
        return $query->orderBy($dbColumn, $sortDirection);
      })
      ->paginate(10)
      ->withQueryString();

    $stats = [
      'total_target' => ReboisasiPS::where('year', $selectedYear)->where('status', 'final')->sum('target_annual'),
      'total_realization' => ReboisasiPS::where('year', $selectedYear)->where('status', 'final')->sum('realization'),
      'total_count' => ReboisasiPS::where('year', $selectedYear)->where('status', 'final')->count(),
    ];

    $dbYears = ReboisasiPS::distinct()->orderBy('year', 'desc')->pluck('year')->toArray();
    $fixedYears = range(2025, 2021);
    $availableYears = array_values(array_unique(array_merge($dbYears, $fixedYears)));
    rsort($availableYears);

    return Inertia::render('ReboisasiPs/Index', [
      'datas' => $datas,
      'stats' => $stats,
      'filters' => [
        'year' => (int) $selectedYear,
        'search' => $request->search,
        'sort' => $sortField,
        'direction' => $sortDirection
      ],
      'availableYears' => $availableYears,
      'sumberDana' => SumberDana::all()
    ]);
  }

  /**
   * Show the form for creating a new resource.
   */
  public function create()
  {
    return Inertia::render('ReboisasiPs/Create', [
      'sumberDana' => SumberDana::all()
    ]);
  }

  /**
   * Store a newly created resource in storage.
   */
  public function store(Request $request)
  {
    $validated = $request->validate([
      'year' => 'required|integer',
      'month' => 'required|integer|min:1|max:12',
      'province_id' => 'nullable|exists:m_provinces,id',
      'regency_id' => 'nullable|exists:m_regencies,id',
      'district_id' => 'nullable|exists:m_districts,id',
      'village_id' => 'nullable|exists:m_villages,id',
      'target_annual' => 'required|numeric',
      'realization' => 'required|numeric',
      'fund_source' => 'required|string',
      'village' => 'nullable|string',
      'district' => 'nullable|string',
      'coordinates' => 'nullable|string',
    ]);

    ReboisasiPS::create($validated);

    return redirect()->route('reboisasi-ps.index')->with('success', 'Data Created Successfully');
  }

  /**
   * Display the specified resource.
   */
  public function show(ReboisasiPS $reboisasiPs)
  {
    //
  }

  /**
   * Show the form for editing the specified resource.
   */
  public function edit(ReboisasiPS $reboisasiPs)
  {
    return Inertia::render('ReboisasiPs/Edit', [
      'data' => $reboisasiPs->load(['regency_rel', 'district_rel', 'village_rel']),
      'sumberDana' => SumberDana::all()
    ]);
  }

  /**
   * Update the specified resource in storage.
   */
  public function update(Request $request, ReboisasiPS $reboisasiPs)
  {
    $validated = $request->validate([
      'year' => 'required|integer',
      'month' => 'required|integer|min:1|max:12',
      'province_id' => 'nullable|exists:m_provinces,id',
      'regency_id' => 'nullable|exists:m_regencies,id',
      'district_id' => 'nullable|exists:m_districts,id',
      'village_id' => 'nullable|exists:m_villages,id',
      'target_annual' => 'required|numeric',
      'realization' => 'required|numeric',
      'fund_source' => 'required|string',
      'village' => 'nullable|string',
      'district' => 'nullable|string',
      'coordinates' => 'nullable|string',
    ]);

    $reboisasiPs->update($validated);

    return redirect()->route('reboisasi-ps.index')->with('success', 'Data Updated Successfully');
  }

  /**
   * Remove the specified resource from storage.
   */
  public function destroy(ReboisasiPS $reboisasiPs)
  {
    $reboisasiPs->delete();

    return redirect()->route('reboisasi-ps.index')->with('success', 'Data Deleted Successfully');
  }

  /**
   * Submit the report for verification.
   */
  public function submit(ReboisasiPS $reboisasiPs)
  {
    $reboisasiPs->update(['status' => 'waiting_kasi']);
    return redirect()->back()->with('success', 'Laporan berhasil diajukan untuk verifikasi Kasi.');
  }

  /**
   * Approve the report.
   */
  public function approve(ReboisasiPS $reboisasiPs)
  {
    $user = auth()->user();

    if (($user->hasRole('kasi') || $user->hasRole('admin')) && $reboisasiPs->status === 'waiting_kasi') {
      $reboisasiPs->update([
        'status' => 'waiting_cdk',
        'approved_by_kasi_at' => now(),
      ]);
      return redirect()->back()->with('success', 'Laporan disetujui dan diteruskan ke KaCDK.');
    }

    if (($user->hasRole('kacdk') || $user->hasRole('admin')) && $reboisasiPs->status === 'waiting_cdk') {
      $reboisasiPs->update([
        'status' => 'final',
        'approved_by_cdk_at' => now(),
      ]);
      return redirect()->back()->with('success', 'Laporan telah disetujui secara final.');
    }

    return redirect()->back()->with('error', 'Aksi tidak diijinkan.');
  }

  /**
   * Reject the report.
   */
  public function reject(Request $request, ReboisasiPS $reboisasiPs)
  {
    $request->validate([
      'rejection_note' => 'required|string|max:255',
    ]);

    $reboisasiPs->update([
      'status' => 'rejected',
      'rejection_note' => $request->rejection_note,
    ]);

    return redirect()->back()->with('success', 'Laporan telah ditolak dengan catatan.');
  }

  public function export(Request $request)
  {
    $year = $request->query('year');
    return \Maatwebsite\Excel\Facades\Excel::download(new \App\Exports\ReboisasiPsExport($year), 'reboisasi-ps-' . date('Y-m-d') . '.xlsx');
  }

  public function template()
  {
    return \Maatwebsite\Excel\Facades\Excel::download(new \App\Exports\ReboisasiPsTemplateExport, 'template_import_reboisasi_ps.xlsx');
  }

  public function import(Request $request)
  {
    $request->validate(['file' => 'required|mimes:xlsx,csv,xls']);
    $import = new \App\Imports\ReboisasiPsImport();
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

  /**
   * Bulk delete records.
   */
  public function bulkDestroy(Request $request)
  {
    $request->validate([
      'ids' => 'required|array',
      'ids.*' => 'exists:reboisasi_ps,id',
    ]);

    ReboisasiPS::whereIn('id', $request->ids)->delete();

    return redirect()->back()->with('success', count($request->ids) . ' data berhasil dihapus.');
  }

  /**
   * Bulk submit records.
   */
  public function bulkSubmit(Request $request)
  {
    $request->validate([
      'ids' => 'required|array',
      'ids.*' => 'exists:reboisasi_ps,id',
    ]);

    $count = ReboisasiPS::whereIn('id', $request->ids)
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
      'ids.*' => 'exists:reboisasi_ps,id',
    ]);

    $user = auth()->user();
    $count = 0;

    if ($user->hasRole('kasi') || $user->hasRole('admin')) {
      $count = ReboisasiPS::whereIn('id', $request->ids)
        ->where('status', 'waiting_kasi')
        ->update([
          'status' => 'waiting_cdk',
          'approved_by_kasi_at' => now(),
        ]);
    } elseif ($user->hasRole('kacdk') || $user->hasRole('admin')) {
      $count = ReboisasiPS::whereIn('id', $request->ids)
        ->where('status', 'waiting_cdk')
        ->update([
          'status' => 'final',
          'approved_by_cdk_at' => now(),
        ]);
    }

    return redirect()->back()->with('success', $count . ' laporan berhasil disetujui.');
  }
}
