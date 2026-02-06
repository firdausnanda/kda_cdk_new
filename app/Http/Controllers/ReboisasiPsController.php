<?php

namespace App\Http\Controllers;

use App\Actions\SingleWorkflowAction;
use App\Actions\BulkWorkflowAction;
use App\Enums\WorkflowAction;
use Illuminate\Validation\Rule;
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
    $this->middleware('permission:rehab.edit')->only(['edit', 'update']);
    $this->middleware('permission:rehab.delete')->only(['destroy']);
  }

  public function index(Request $request)
  {
    $defaultYear = ReboisasiPS::max('year') ?? now()->year;
    $selectedYear = $request->integer('year', $defaultYear);

    $sortField = $request->query('sort', 'created_at');
    $sortDirection = $request->query('direction', 'desc');

    $datas = ReboisasiPS::query()
      ->select([
        'reboisasi_ps.id',
        'reboisasi_ps.year',
        'reboisasi_ps.month',
        'reboisasi_ps.regency_id',
        'reboisasi_ps.district_id',
        'reboisasi_ps.village_id',
        'reboisasi_ps.fund_source',
        'reboisasi_ps.target_annual',
        'reboisasi_ps.realization',
        'reboisasi_ps.status',
        'reboisasi_ps.rejection_note',
        'reboisasi_ps.created_at',
        'reboisasi_ps.created_by',
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
          $qq->where('fund_source', 'like', "{$search}%")
            ->orWhereHas('village_rel', fn($q) => $q->where('name', 'like', "{$search}%"))
            ->orWhereHas('district_rel', fn($q) => $q->where('name', 'like', "{$search}%"))
            ->orWhereHas('regency_rel', fn($q) => $q->where('name', 'like', "{$search}%"));
        });
      })

      ->when($sortField === 'location', function ($q) use ($sortDirection) {
        $q->leftJoin('m_villages', 'reboisasi_ps.village_id', '=', 'm_villages.id')
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
          'month' => $q->orderBy('month', $sortDirection),
          'realization' => $q->orderBy('realization', $sortDirection),
          'target' => $q->orderBy('target_annual', $sortDirection),
          'fund_source' => $q->orderBy('fund_source', $sortDirection),
          'status' => $q->orderBy('status', $sortDirection),
          default => $q->orderBy('created_at', 'desc'),
        };
      })

      ->paginate($request->integer('per_page', 10))
      ->withQueryString();

    $stats = cache()->remember(
      "reboisasi-ps-stats-{$selectedYear}",
      300,
      fn() => [
        'total_target' => ReboisasiPS::where('year', $selectedYear)->where('status', 'final')->sum('target_annual'),
        'total_realization' => ReboisasiPS::where('year', $selectedYear)->where('status', 'final')->sum('realization'),
        'total_count' => ReboisasiPS::where('year', $selectedYear)->where('status', 'final')->count(),
      ]
    );

    $availableYears = cache()->remember('reboisasi-ps-years', 3600, function () {
      $dbYears = ReboisasiPS::distinct()->pluck('year')->toArray();
      $fixedYears = range(2025, 2021);
      $years = array_unique(array_merge($dbYears, $fixedYears));
      rsort($years);
      return $years;
    });

    $sumberDana = cache()->remember('sumber-dana', 3600, fn() => SumberDana::select('id', 'name')->get());

    return Inertia::render('ReboisasiPs/Index', [
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
   * Single workflow action.
   */
  public function singleWorkflowAction(Request $request, ReboisasiPS $reboisasiPs, SingleWorkflowAction $action)
  {
    $request->validate([
      'action' => ['required', Rule::enum(WorkflowAction::class)],
      'rejection_note' => 'nullable|string|max:255',
    ]);

    $workflowAction = WorkflowAction::from($request->action);

    match ($workflowAction) {
      WorkflowAction::SUBMIT => $this->authorize('rehab.edit'),
      WorkflowAction::APPROVE, WorkflowAction::REJECT => $this->authorize('rehab.approve'),
      WorkflowAction::DELETE => $this->authorize('rehab.delete'),
    };

    if ($workflowAction === WorkflowAction::REJECT && !$request->filled('rejection_note')) {
      return redirect()->back()->with('error', 'Catatan penolakan wajib diisi.');
    }

    $extraData = [];
    if ($request->filled('rejection_note')) {
      $extraData['rejection_note'] = $request->rejection_note;
    }

    $success = $action->execute(
      model: $reboisasiPs,
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
  /**
   * Bulk workflow action.
   */
  public function bulkWorkflowAction(Request $request, BulkWorkflowAction $action)
  {
    $request->validate([
      'ids' => 'required|array',
      'ids.*' => 'exists:reboisasi_ps,id',
      'action' => ['required', Rule::enum(WorkflowAction::class)],
      'rejection_note' => 'nullable|string|max:255',
    ]);

    $workflowAction = WorkflowAction::from($request->action);

    match ($workflowAction) {
      WorkflowAction::SUBMIT => $this->authorize('rehab.edit'),
      WorkflowAction::APPROVE, WorkflowAction::REJECT => $this->authorize('rehab.approve'),
      WorkflowAction::DELETE => $this->authorize('rehab.delete'),
    };

    if ($workflowAction === WorkflowAction::REJECT && !$request->filled('rejection_note')) {
      return redirect()->back()->with('error', 'Catatan penolakan wajib diisi.');
    }

    $extraData = [];
    if ($request->filled('rejection_note')) {
      $extraData['rejection_note'] = $request->rejection_note;
    }

    $count = $action->execute(
      model: ReboisasiPS::class,
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
