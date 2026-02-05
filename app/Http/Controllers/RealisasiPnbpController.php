<?php

namespace App\Http\Controllers;

use App\Models\RealisasiPnbp;
use App\Models\PengelolaWisata;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use App\Actions\BulkWorkflowAction;
use App\Actions\SingleWorkflowAction;
use App\Enums\WorkflowAction;
use Illuminate\Validation\Rule;

class RealisasiPnbpController extends Controller
{
  use \App\Traits\HandlesImportFailures;
  public function __construct()
  {
    $this->middleware('permission:bina-usaha.view')->only(['index', 'show']);
    $this->middleware('permission:bina-usaha.create')->only(['create', 'store']);
    $this->middleware('permission:bina-usaha.edit')->only(['edit', 'update']);
    $this->middleware('permission:bina-usaha.delete')->only(['destroy']);
  }

  public function index(Request $request)
  {
    $selectedYear = $request->integer('year');
    if (!$selectedYear) {
      $selectedYear = RealisasiPnbp::max('year') ?? now()->year;
    }

    $sortField = $request->query('sort', 'created_at');
    $sortDirection = $request->query('direction', 'desc');

    $datas = RealisasiPnbp::query()
      ->select([
        'realisasi_pnbp.id',
        'realisasi_pnbp.year',
        'realisasi_pnbp.month',
        'realisasi_pnbp.province_id',
        'realisasi_pnbp.regency_id',
        'realisasi_pnbp.id_pengelola_wisata',
        'realisasi_pnbp.types_of_forest_products',
        'realisasi_pnbp.pnbp_target',
        'realisasi_pnbp.pnbp_realization',
        'realisasi_pnbp.status',
        'realisasi_pnbp.rejection_note',
        'realisasi_pnbp.created_at',
        'realisasi_pnbp.created_by',
      ])
      ->with([
        'creator:id,name',
        'regency:id,name',
        'pengelola_wisata:id,name'
      ])
      ->when($selectedYear, function ($query, $year) {
        return $query->where('year', $year);
      })
      ->when($request->search, function ($query, $search) {
        $query->where(function ($q) use ($search) {
          $q->where('types_of_forest_products', 'like', "%{$search}%")
            ->orWhereHas('regency', fn($q2) => $q2->where('name', 'like', "%{$search}%"))
            ->orWhereHas('pengelola_wisata', fn($q2) => $q2->where('name', 'like', "%{$search}%"));
        });
      })
      ->when($sortField === 'pengelola', function ($q) use ($sortDirection) {
        $q->leftJoin('m_pengelola_wisata', 'realisasi_pnbp.id_pengelola_wisata', '=', 'm_pengelola_wisata.id')
          ->orderBy('m_pengelola_wisata.name', $sortDirection);
      })
      ->when(!in_array($sortField, ['pengelola']), function ($q) use ($sortField, $sortDirection) {
        match ($sortField) {
          'month' => $q->orderBy('month', $sortDirection),
          'forest_product' => $q->orderBy('types_of_forest_products', $sortDirection),
          'target' => $q->orderBy('pnbp_target', $sortDirection),
          'realization' => $q->orderBy('pnbp_realization', $sortDirection),
          'status' => $q->orderBy('status', $sortDirection),
          default => $q->orderBy('created_at', 'desc'),
        };
      })
      ->paginate($request->integer('per_page', 10))
      ->withQueryString();

    // Stats with caching
    $cacheKey = "pnbp-stats-{$selectedYear}";
    $stats = cache()->remember($cacheKey, 300, function () use ($selectedYear) {
      return [
        'total_count' => RealisasiPnbp::when($selectedYear, fn($q) => $q->where('year', $selectedYear))->count(),
        'verified_count' => RealisasiPnbp::where('status', 'final')
          ->when($selectedYear, fn($q) => $q->where('year', $selectedYear))
          ->count(),
      ];
    });

    // Available Years with caching
    $availableYears = cache()->remember('pnbp-years', 3600, function () {
      $dbYears = RealisasiPnbp::distinct()
        ->pluck('year')
        ->toArray();
      $fixedYears = range(2025, 2021);
      $years = array_unique(array_merge($dbYears, $fixedYears));
      rsort($years);
      return $years;
    });

    return Inertia::render('RealisasiPnbp/Index', [
      'datas' => $datas,
      'stats' => $stats,
      'available_years' => $availableYears,
      'filters' => [
        'year' => (int) $selectedYear,
        'search' => $request->search,
        'sort' => $sortField,
        'direction' => $sortDirection,
        'per_page' => (int) $request->query('per_page', 10),
      ],
    ]);
  }

  public function create()
  {
    return Inertia::render('RealisasiPnbp/Create', [
      'provinces' => DB::table('m_provinces')->where('id', '35')->get(),
      'regencies' => DB::table('m_regencies')->where('province_id', '35')->get(),
      'pengelola_wisata' => PengelolaWisata::all(),
    ]);
  }

  public function store(Request $request)
  {
    $validated = $request->validate([
      'year' => 'required|integer|digits:4',
      'month' => 'required|integer|min:1|max:12',
      'province_id' => 'required|exists:m_provinces,id',
      'regency_id' => 'required|exists:m_regencies,id',
      'id_pengelola_wisata' => 'required|exists:m_pengelola_wisata,id',
      'types_of_forest_products' => 'required|string',
      'pnbp_target' => 'required|string',
      'pnbp_realization' => 'required|string',
    ]);

    RealisasiPnbp::create($validated);

    return redirect()->route('realisasi-pnbp.index')
      ->with('success', 'Data berhasil ditambahkan');
  }

  public function edit(RealisasiPnbp $realisasiPnbp)
  {
    return Inertia::render('RealisasiPnbp/Edit', [
      'data' => $realisasiPnbp->load(['regency']),
      'provinces' => DB::table('m_provinces')->where('id', '35')->get(),
      'regencies' => DB::table('m_regencies')->where('province_id', '35')->get(),
      'pengelola_wisata' => PengelolaWisata::all(),
    ]);
  }

  public function update(Request $request, RealisasiPnbp $realisasiPnbp)
  {
    $validated = $request->validate([
      'year' => 'required|integer|digits:4',
      'month' => 'required|integer|min:1|max:12',
      'province_id' => 'required|exists:m_provinces,id',
      'regency_id' => 'required|exists:m_regencies,id',
      'id_pengelola_wisata' => 'required|exists:m_pengelola_wisata,id',
      'types_of_forest_products' => 'required|string',
      'pnbp_target' => 'required|string',
      'pnbp_realization' => 'required|string',
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

  public function singleWorkflowAction(Request $request, RealisasiPnbp $realisasiPnbp, SingleWorkflowAction $action)
  {
    $request->validate([
      'action' => ['required', Rule::enum(WorkflowAction::class)],
      'rejection_note' => 'nullable|string|max:255',
    ]);

    $workflowAction = WorkflowAction::from($request->action);

    match ($workflowAction) {
      WorkflowAction::SUBMIT => $this->authorize('bina-usaha.edit'),
      WorkflowAction::APPROVE, WorkflowAction::REJECT => $this->authorize('bina-usaha.approve'),
      WorkflowAction::DELETE => $this->authorize('bina-usaha.delete'),
    };

    if ($workflowAction === WorkflowAction::REJECT && !$request->filled('rejection_note')) {
      return redirect()->back()->with('error', 'Catatan penolakan wajib diisi.');
    }

    $extraData = [];
    if ($request->filled('rejection_note')) {
      $extraData['rejection_note'] = $request->rejection_note;
    }

    $success = $action->execute(
      model: $realisasiPnbp,
      action: $workflowAction,
      user: auth()->user(),
      extraData: $extraData
    );

    if ($success) {
      cache()->forget("pnbp-stats-{$realisasiPnbp->year}");

      $message = match ($workflowAction) {
        WorkflowAction::DELETE => 'dihapus',
        WorkflowAction::SUBMIT => 'diajukan untuk verifikasi',
        WorkflowAction::APPROVE => 'disetujui',
        WorkflowAction::REJECT => 'ditolak',
      };
      return redirect()->back()->with('success', "Laporan berhasil {$message}.");
    }

    return redirect()->back()->with('error', 'Gagal memproses laporan atau status tidak sesuai.');
  }

  public function export(Request $request)
  {
    $year = $request->query('year');
    return \Maatwebsite\Excel\Facades\Excel::download(new \App\Exports\RealisasiPnbpExport($year), 'realisasi-pnbp-' . date('Y-m-d') . '.xlsx');
  }

  public function template()
  {
    return \Maatwebsite\Excel\Facades\Excel::download(new \App\Exports\RealisasiPnbpTemplateExport, 'template_import_realisasi_pnbp.xlsx');
  }

  public function import(Request $request)
  {
    $request->validate(['file' => 'required|mimes:xlsx,csv,xls']);

    $import = new \App\Imports\RealisasiPnbpImport();

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

  public function bulkWorkflowAction(Request $request, BulkWorkflowAction $action)
  {
    $request->validate([
      'ids' => 'required|array',
      'ids.*' => 'exists:realisasi_pnbp,id',
      'action' => 'required|string',
      'rejection_note' => 'nullable|string|max:255',
    ]);

    $workflowAction = WorkflowAction::from($request->action);

    match ($workflowAction) {
      WorkflowAction::SUBMIT => $this->authorize('bina-usaha.edit'),
      WorkflowAction::APPROVE, WorkflowAction::REJECT => $this->authorize('bina-usaha.approve'),
      WorkflowAction::DELETE => $this->authorize('bina-usaha.delete'),
    };

    if ($workflowAction === WorkflowAction::REJECT && !$request->filled('rejection_note')) {
      return redirect()->back()->with('error', 'Catatan penolakan wajib diisi.');
    }

    $extraData = [];
    if ($request->filled('rejection_note')) {
      $extraData['rejection_note'] = $request->rejection_note;
    }

    $count = $action->execute(
      model: RealisasiPnbp::class,
      action: $workflowAction,
      ids: $request->ids,
      user: auth()->user(),
      extraData: $extraData
    );

    if ($count > 0) {
      return redirect()->back()->with('success', 'Aksi berhasil dilakukan pada ' . $count . ' data.');
    }

    $message = match ($workflowAction) {
      WorkflowAction::DELETE => 'dihapus',
      WorkflowAction::SUBMIT => 'diajukan',
      WorkflowAction::APPROVE => 'disetujui',
      WorkflowAction::REJECT => 'ditolak',
    };

    return redirect()->back()->with('success', "{$count} data berhasil {$message}.");
  }
}
