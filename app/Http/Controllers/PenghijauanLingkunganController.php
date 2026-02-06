<?php

namespace App\Http\Controllers;

use App\Models\PenghijauanLingkungan;
use App\Actions\SingleWorkflowAction;
use App\Actions\BulkWorkflowAction;
use App\Enums\WorkflowAction;
use Illuminate\Validation\Rule;
use App\Models\Regencies;
use App\Models\SumberDana;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PenghijauanLingkunganController extends Controller
{
  use \App\Traits\HandlesImportFailures;
  public function __construct()
  {
    $this->middleware('permission:penghijauan.view')->only(['index', 'show']);
    $this->middleware('permission:penghijauan.create')->only(['create', 'store']);
    $this->middleware('permission:penghijauan.edit')->only(['edit', 'update']);
    $this->middleware('permission:penghijauan.delete')->only(['destroy']);
  }

  public function index(Request $request)
  {
    $defaultYear = PenghijauanLingkungan::max('year') ?? now()->year;
    $selectedYear = $request->integer('year', $defaultYear);

    $sortField = $request->query('sort', 'created_at');
    $sortDirection = $request->query('direction', 'desc');

    $datas = PenghijauanLingkungan::query()
      ->select([
        'penghijauan_lingkungan.id',
        'penghijauan_lingkungan.year',
        'penghijauan_lingkungan.month',
        'penghijauan_lingkungan.regency_id',
        'penghijauan_lingkungan.district_id',
        'penghijauan_lingkungan.village_id',
        'penghijauan_lingkungan.fund_source',
        'penghijauan_lingkungan.target_annual',
        'penghijauan_lingkungan.realization',
        'penghijauan_lingkungan.status',
        'penghijauan_lingkungan.rejection_note',
        'penghijauan_lingkungan.created_at',
        'penghijauan_lingkungan.created_by',
      ])
      ->with([
        'creator:id,name',
        'regency_rel:id,name',
        'district_rel:id,name',
        'village_rel:id,name',
      ])
      ->where('year', $selectedYear)

      ->when($request->search, function ($q, $search) {
        $q->where(function ($qq) use ($search) {
          $qq->where('fund_source', 'like', "%{$search}%")
            ->orWhereHas('village_rel', fn($q) => $q->where('name', 'like', "%{$search}%"))
            ->orWhereHas('district_rel', fn($q) => $q->where('name', 'like', "%{$search}%"))
            ->orWhereHas('regency_rel', fn($q) => $q->where('name', 'like', "%{$search}%"));
        });
      })

      ->when($sortField === 'location', function ($q) use ($sortDirection) {
        $q->leftJoin('m_villages', 'penghijauan_lingkungan.village_id', '=', 'm_villages.id')
          ->orderBy('m_villages.name', $sortDirection);
      })

      ->when($sortField !== 'location', function ($q) use ($sortField, $sortDirection) {
        $user = auth()->user();

        if ($sortField === 'created_at' && $sortDirection === 'desc') {
          if ($user->hasRole('kacdk')) {
            $q->orderByRaw("CASE WHEN status = 'waiting_cdk' THEN 0 ELSE 1 END");
          } elseif ($user->hasRole('kasi')) {
            $q->orderByRaw("CASE WHEN status = 'waiting_kasi' THEN 0 ELSE 1 END");
          }
        }

        match ($sortField) {
          'year' => $q->orderBy('year', $sortDirection),
          'month' => $q->orderBy('month', $sortDirection),
          'realization' => $q->orderBy('realization', $sortDirection),
          'fund_source' => $q->orderBy('fund_source', $sortDirection),
          'status' => $q->orderBy('status', $sortDirection),
          default => $q->orderBy('created_at', 'desc'),
        };
      })

      ->paginate($request->integer('per_page', 10))
      ->withQueryString();

    $stats = cache()->remember(
      "penghijauan-lingkungan-stats-{$selectedYear}",
      300,
      fn() => [
        'total_target' => PenghijauanLingkungan::where('year', $selectedYear)->where('status', 'final')->sum('target_annual'),
        'total_realization' => PenghijauanLingkungan::where('year', $selectedYear)->where('status', 'final')->sum('realization'),
        'total_count' => PenghijauanLingkungan::where('year', $selectedYear)->where('status', 'final')->count(),
      ]
    );

    $availableYears = cache()->remember('penghijauan-lingkungan-years', 3600, function () {
      $dbYears = PenghijauanLingkungan::distinct()->pluck('year')->toArray();
      $fixedYears = range(2025, 2021);
      $years = array_unique(array_merge($dbYears, $fixedYears));
      rsort($years);
      return $years;
    });

    $sumberDana = cache()->remember(
      'sumber-dana',
      3600,
      fn() => SumberDana::select('id', 'name')->get()
    );

    return Inertia::render('PenghijauanLingkungan/Index', [
      'datas' => $datas,
      'stats' => $stats,
      'filters' => [
        'year' => (int) $selectedYear,
        'search' => $request->search,
        'sort' => $sortField,
        'direction' => $sortDirection,
        'per_page' => (int) $request->query('per_page', 10),
      ],
      'availableYears' => $availableYears,
      'sumberDana' => $sumberDana
    ]);
  }

  /**
   * Show the form for creating a new resource.
   */
  public function create()
  {
    return Inertia::render('PenghijauanLingkungan/Create', [
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

    PenghijauanLingkungan::create($validated);

    return redirect()->route('penghijauan-lingkungan.index')->with('success', 'Data Created Successfully');
  }

  /**
   * Show the form for editing the specified resource.
   */
  public function edit(PenghijauanLingkungan $penghijauanLingkungan)
  {
    return Inertia::render('PenghijauanLingkungan/Edit', [
      'data' => $penghijauanLingkungan->load(['regency_rel', 'district_rel', 'village_rel']),
      'sumberDana' => SumberDana::all()
    ]);
  }

  /**
   * Update the specified resource in storage.
   */
  public function update(Request $request, PenghijauanLingkungan $penghijauanLingkungan)
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

    $penghijauanLingkungan->update($validated);

    return redirect()->route('penghijauan-lingkungan.index')->with('success', 'Data Updated Successfully');
  }

  /**
   * Remove the specified resource from storage.
   */
  public function destroy(PenghijauanLingkungan $penghijauanLingkungan)
  {
    $penghijauanLingkungan->delete();

    return redirect()->route('penghijauan-lingkungan.index')->with('success', 'Data Deleted Successfully');
  }

  /**
   * Single workflow action.
   */
  public function singleWorkflowAction(Request $request, PenghijauanLingkungan $penghijauanLingkungan, SingleWorkflowAction $action)
  {
    $request->validate([
      'action' => ['required', Rule::enum(WorkflowAction::class)],
      'rejection_note' => 'nullable|string|max:255',
    ]);

    $workflowAction = WorkflowAction::from($request->action);

    match ($workflowAction) {
      WorkflowAction::SUBMIT => $this->authorize('penghijauan.edit'),
      WorkflowAction::APPROVE, WorkflowAction::REJECT => $this->authorize('penghijauan.approve'),
      WorkflowAction::DELETE => $this->authorize('penghijauan.delete'),
    };

    if ($workflowAction === WorkflowAction::REJECT && !$request->filled('rejection_note')) {
      return redirect()->back()->with('error', 'Catatan penolakan wajib diisi.');
    }

    $extraData = [];
    if ($request->filled('rejection_note')) {
      $extraData['rejection_note'] = $request->rejection_note;
    }

    $success = $action->execute(
      model: $penghijauanLingkungan,
      action: $workflowAction,
      user: auth()->user(),
      extraData: $extraData
    );

    if ($success) {
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

  /**
   * Export data to Excel.
   */
  public function export(Request $request)
  {
    $year = $request->query('year');
    return \Maatwebsite\Excel\Facades\Excel::download(new \App\Exports\PenghijauanLingkunganExport($year), 'penghijauan-lingkungan-' . date('Y-m-d') . '.xlsx');
  }

  /**
   * Download import template.
   */
  public function template()
  {
    return \Maatwebsite\Excel\Facades\Excel::download(new \App\Exports\PenghijauanLingkunganTemplateExport, 'template_import_penghijauan_lingkungan.xlsx');
  }

  /**
   * Import data from Excel.
   */
  public function import(Request $request)
  {
    $request->validate([
      'file' => 'required|mimes:xlsx,csv,xls',
    ]);

    $import = new \App\Imports\PenghijauanLingkunganImport();

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
  public function bulkWorkflowAction(Request $request, BulkWorkflowAction $action)
  {
    $request->validate([
      'ids' => 'required|array',
      'ids.*' => 'exists:penghijauan_lingkungan,id',
      'action' => ['required', Rule::enum(WorkflowAction::class)],
      'rejection_note' => 'nullable|string|max:255',
    ]);

    $workflowAction = WorkflowAction::from($request->action);

    match ($workflowAction) {
      WorkflowAction::SUBMIT => $this->authorize('penghijauan.edit'),
      WorkflowAction::APPROVE, WorkflowAction::REJECT => $this->authorize('penghijauan.approve'),
      WorkflowAction::DELETE => $this->authorize('penghijauan.delete'),
    };

    if ($workflowAction === WorkflowAction::REJECT && !$request->filled('rejection_note')) {
      return redirect()->back()->with('error', 'Catatan penolakan wajib diisi.');
    }

    $extraData = [];
    if ($request->filled('rejection_note')) {
      $extraData['rejection_note'] = $request->rejection_note;
    }

    $count = $action->execute(
      model: PenghijauanLingkungan::class,
      action: $workflowAction,
      ids: $request->ids,
      user: auth()->user(),
      extraData: $extraData
    );

    $message = match ($workflowAction) {
      WorkflowAction::DELETE => 'dihapus',
      WorkflowAction::SUBMIT => 'diajukan',
      WorkflowAction::APPROVE => 'disetujui',
      WorkflowAction::REJECT => 'ditolak',
    };

    return redirect()->back()->with('success', "{$count} data berhasil {$message}.");
  }
}
