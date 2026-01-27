<?php

namespace App\Http\Controllers;

use App\Models\BangunanKta;
use App\Models\RhlTeknis;
use App\Models\RhlTeknisDetail;
use App\Models\SumberDana;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class RhlTeknisController extends Controller
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
      $selectedYear = RhlTeknis::max('year') ?? date('Y');
    }

    $sortField = $request->query('sort', 'created_at');
    $sortDirection = $request->query('direction', 'desc');

    $datas = RhlTeknis::query()
      ->leftJoin('m_regencies', 'rhl_teknis.regency_id', '=', 'm_regencies.id')
      ->leftJoin('m_districts', 'rhl_teknis.district_id', '=', 'm_districts.id')
      ->leftJoin('m_villages', 'rhl_teknis.village_id', '=', 'm_villages.id')
      ->select(
        'rhl_teknis.*',
        'm_regencies.name as regency_name',
        'm_districts.name as district_name',
        'm_villages.name as village_name'
      )
      ->when($selectedYear, function ($query, $year) {
        return $query->where('year', $year);
      })
      ->when($request->search, function ($query, $search) {
        $query->where(function ($q) use ($search) {
          $q->where('fund_source', 'like', "%{$search}%")
            ->orWhereHas('details.bangunan_kta', function ($q2) use ($search) {
              $q2->where('name', 'like', "%{$search}%");
            })
            ->orWhere('m_villages.name', 'like', "%{$search}%")
            ->orWhere('m_districts.name', 'like', "%{$search}%")
            ->orWhere('m_regencies.name', 'like', "%{$search}%");
        });
      })
      ->with(['creator', 'details.bangunan_kta'])
      ->when($sortField, function ($query) use ($sortField, $sortDirection) {
        $sortMap = [
          'period' => 'rhl_teknis.month',
          'location' => 'm_villages.name',
          'target' => 'rhl_teknis.target_annual',
          'fund_source' => 'rhl_teknis.fund_source',
          'status' => 'rhl_teknis.status',
          'created_at' => 'rhl_teknis.created_at',
        ];

        $dbColumn = $sortMap[$sortField] ?? 'rhl_teknis.created_at';
        return $query->orderBy($dbColumn, $sortDirection);
      })
      ->paginate(10)
      ->withQueryString();

    $stats = [
      'total_target' => RhlTeknis::where('year', $selectedYear)->where('status', 'final')->sum('target_annual'),
      'total_units' => RhlTeknis::where('year', $selectedYear)
        ->where('status', 'final')
        ->whereHas('details')
        ->withSum('details', 'unit_amount')
        ->get()
        ->sum('details_sum_unit_amount'),
      'total_count' => RhlTeknis::where('year', $selectedYear)->where('status', 'final')->count(),
    ];

    $dbYears = RhlTeknis::distinct()->orderBy('year', 'desc')->pluck('year')->toArray();
    $fixedYears = range(2025, 2021);
    $availableYears = array_values(array_unique(array_merge($dbYears, $fixedYears)));
    rsort($availableYears);

    return Inertia::render('RhlTeknis/Index', [
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

  public function create()
  {
    return Inertia::render('RhlTeknis/Create', [
      'sumberDana' => SumberDana::all(),
      'bangunanKta' => BangunanKta::all()
    ]);
  }

  public function store(Request $request)
  {
    $validated = $request->validate([
      'year' => 'required|integer',
      'month' => 'required|integer|min:1|max:12',
      'province_id' => 'nullable|exists:m_provinces,id',
      'regency_id' => 'nullable|exists:m_regencies,id',
      'district_id' => 'nullable|exists:m_districts,id',
      'village_id' => 'nullable|exists:m_villages,id',
      'coordinates' => 'nullable|string',
      'target_annual' => 'required|numeric',
      'fund_source' => 'required|string',
      'details' => 'required|array|min:1',
      'details.*.bangunan_kta_id' => 'required|exists:m_bangunan_kta,id',
      'details.*.unit_amount' => 'required|integer|min:0',
    ]);

    DB::transaction(function () use ($validated) {
      $report = RhlTeknis::create([
        'year' => $validated['year'],
        'month' => $validated['month'],
        'province_id' => $validated['province_id'] ?? null,
        'regency_id' => $validated['regency_id'] ?? null,
        'district_id' => $validated['district_id'] ?? null,
        'village_id' => $validated['village_id'] ?? null,
        'coordinates' => $validated['coordinates'] ?? null,
        'target_annual' => $validated['target_annual'],
        'fund_source' => $validated['fund_source'],
      ]);

      foreach ($validated['details'] as $detail) {
        $report->details()->create($detail);
      }
    });

    return redirect()->route('rhl-teknis.index')->with('success', 'Data Berhasil Dibuat');
  }

  public function edit(RhlTeknis $rhl_teknis)
  {
    return Inertia::render('RhlTeknis/Edit', [
      'data' => $rhl_teknis->load('details.bangunan_kta'),
      'sumberDana' => SumberDana::all(),
      'bangunanKta' => BangunanKta::all()
    ]);
  }

  public function update(Request $request, RhlTeknis $rhl_teknis)
  {
    $validated = $request->validate([
      'year' => 'required|integer',
      'month' => 'required|integer|min:1|max:12',
      'province_id' => 'nullable|exists:m_provinces,id',
      'regency_id' => 'nullable|exists:m_regencies,id',
      'district_id' => 'nullable|exists:m_districts,id',
      'village_id' => 'nullable|exists:m_villages,id',
      'coordinates' => 'nullable|string',
      'target_annual' => 'required|numeric',
      'fund_source' => 'required|string',
      'details' => 'required|array|min:1',
      'details.*.bangunan_kta_id' => 'required|exists:m_bangunan_kta,id',
      'details.*.unit_amount' => 'required|integer|min:0',
    ]);

    DB::transaction(function () use ($validated, $rhl_teknis) {
      $rhl_teknis->update([
        'year' => $validated['year'],
        'month' => $validated['month'],
        'province_id' => $validated['province_id'] ?? null,
        'regency_id' => $validated['regency_id'] ?? null,
        'district_id' => $validated['district_id'] ?? null,
        'village_id' => $validated['village_id'] ?? null,
        'coordinates' => $validated['coordinates'] ?? null,
        'target_annual' => $validated['target_annual'],
        'fund_source' => $validated['fund_source'],
      ]);

      $rhl_teknis->details()->delete();
      foreach ($validated['details'] as $detail) {
        $rhl_teknis->details()->create($detail);
      }
    });

    return redirect()->route('rhl-teknis.index')->with('success', 'Data Berhasil Diperbarui');
  }

  public function destroy(RhlTeknis $rhl_teknis)
  {
    $rhl_teknis->delete();

    return redirect()->route('rhl-teknis.index')->with('success', 'Data Berhasil Dihapus');
  }

  public function submit(RhlTeknis $rhl_teknis)
  {
    $rhl_teknis->update(['status' => 'waiting_kasi']);
    return redirect()->back()->with('success', 'Laporan berhasil diajukan untuk verifikasi Kasi.');
  }

  public function approve(RhlTeknis $rhl_teknis)
  {
    $user = auth()->user();

    if (($user->hasRole('kasi') || $user->hasRole('admin')) && $rhl_teknis->status === 'waiting_kasi') {
      $rhl_teknis->update([
        'status' => 'waiting_cdk',
        'approved_by_kasi_at' => now(),
      ]);
      return redirect()->back()->with('success', 'Laporan disetujui and diteruskan ke KaCDK.');
    }

    if (($user->hasRole('kacdk') || $user->hasRole('admin')) && $rhl_teknis->status === 'waiting_cdk') {
      $rhl_teknis->update([
        'status' => 'final',
        'approved_by_cdk_at' => now(),
      ]);
      return redirect()->back()->with('success', 'Laporan telah disetujui secara final.');
    }

    return redirect()->back()->with('error', 'Aksi tidak diijinkan.');
  }

  public function reject(Request $request, RhlTeknis $rhl_teknis)
  {
    $request->validate([
      'rejection_note' => 'required|string|max:255',
    ]);

    $rhl_teknis->update([
      'status' => 'rejected',
      'rejection_note' => $request->rejection_note,
    ]);

    return redirect()->back()->with('success', 'Laporan telah ditolak dengan catatan.');
  }

  public function export(Request $request)
  {
    $year = $request->query('year');
    return \Maatwebsite\Excel\Facades\Excel::download(new \App\Exports\RhlTeknisExport($year), 'rhl-teknis-' . date('Y-m-d') . '.xlsx');
  }

  public function template()
  {
    return \Maatwebsite\Excel\Facades\Excel::download(new \App\Exports\RhlTeknisTemplateExport, 'template_import_rhl_teknis.xlsx');
  }

  public function import(Request $request)
  {
    $request->validate(['file' => 'required|mimes:xlsx,csv,xls']);
    $import = new \App\Imports\RhlTeknisImport();
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
      'ids.*' => 'exists:rhl_teknis,id',
    ]);

    RhlTeknis::whereIn('id', $request->ids)->delete();

    return redirect()->back()->with('success', count($request->ids) . ' data berhasil dihapus.');
  }

  /**
   * Bulk submit records.
   */
  public function bulkSubmit(Request $request)
  {
    $request->validate([
      'ids' => 'required|array',
      'ids.*' => 'exists:rhl_teknis,id',
    ]);

    $count = RhlTeknis::whereIn('id', $request->ids)
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
      'ids.*' => 'exists:rhl_teknis,id',
    ]);

    $user = auth()->user();
    $count = 0;

    if ($user->hasRole('kasi') || $user->hasRole('admin')) {
      $count = RhlTeknis::whereIn('id', $request->ids)
        ->where('status', 'waiting_kasi')
        ->update([
          'status' => 'waiting_cdk',
          'approved_by_kasi_at' => now(),
        ]);
    } elseif ($user->hasRole('kacdk') || $user->hasRole('admin')) {
      $count = RhlTeknis::whereIn('id', $request->ids)
        ->where('status', 'waiting_cdk')
        ->update([
          'status' => 'final',
          'approved_by_cdk_at' => now(),
        ]);
    }

    return redirect()->back()->with('success', $count . ' laporan berhasil disetujui.');
  }
}
