<?php

namespace App\Http\Controllers;

use App\Models\Skps;
use App\Models\SkemaPerhutananSosial;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Redirect;
use App\Actions\BulkWorkflowAction;
use App\Actions\SingleWorkflowAction;
use App\Enums\WorkflowAction;
use Illuminate\Validation\Rule;

class SkpsController extends Controller
{
  use \App\Traits\HandlesImportFailures;
  /**
   * Display a listing of the resource.
   */
  public function __construct()
  {
    $this->middleware('permission:pemberdayaan.view')->only(['index', 'show']);
    $this->middleware('permission:pemberdayaan.create')->only(['create', 'store']);
    $this->middleware('permission:pemberdayaan.edit')->only(['edit', 'update']);
    $this->middleware('permission:pemberdayaan.delete')->only(['destroy']);
  }

  public function index(Request $request)
  {
    $sortField = $request->query('sort', 'created_at');
    $sortDirection = $request->query('direction', 'desc');

    $datas = Skps::query()
      ->select([
        'skps.id',
        'skps.province_id',
        'skps.regency_id',
        'skps.district_id',
        'skps.id_skema_perhutanan_sosial',
        'skps.nama_kelompok',
        'skps.potential',
        'skps.ps_area',
        'skps.number_of_kk',
        'skps.status',
        'skps.rejection_note',
        'skps.created_at',
        'skps.created_by',
      ])
      ->with([
        'creator:id,name',
        'regency:id,name',
        'district:id,name',
        'skema:id,name'
      ])
      ->when($request->search, function ($query, $search) {
        $query->where(function ($q) use ($search) {
          $q->whereHas('regency', fn($q2) => $q2->where('name', 'like', "{$search}%"))
            ->orWhereHas('district', fn($q2) => $q2->where('name', 'like', "{$search}%"))
            ->orWhereHas('skema', fn($q2) => $q2->where('name', 'like', "{$search}%"))
            ->orWhere('nama_kelompok', 'like', "{$search}%");
        });
      })
      ->when($sortField === 'location', function ($q) use ($sortDirection) {
        $q->leftJoin('m_districts', 'skps.district_id', '=', 'm_districts.id')
          ->orderBy('m_districts.name', $sortDirection);
      })
      ->when($sortField === 'skema', function ($q) use ($sortDirection) {
        $q->leftJoin('m_skema_perhutanan_sosial', 'skps.id_skema_perhutanan_sosial', '=', 'm_skema_perhutanan_sosial.id')
          ->orderBy('m_skema_perhutanan_sosial.name', $sortDirection);
      })
      ->when(!in_array($sortField, ['location', 'skema']), function ($q) use ($sortField, $sortDirection) {
        $user = auth()->user();

        if ($sortField === 'created_at' && $sortDirection === 'desc') {
          if ($user->hasRole('kacdk')) {
            $q->orderByRaw("CASE WHEN status = 'waiting_cdk' THEN 0 ELSE 1 END");
          } elseif ($user->hasRole('kasi')) {
            $q->orderByRaw("CASE WHEN status = 'waiting_kasi' THEN 0 ELSE 1 END");
          }
        }

        match ($sortField) {
          'group_name' => $q->orderBy('nama_kelompok', $sortDirection),
          'area' => $q->orderBy('ps_area', $sortDirection),
          'potential' => $q->orderBy('potential', $sortDirection),
          'kk_count' => $q->orderBy('number_of_kk', $sortDirection),
          'status' => $q->orderBy('status', $sortDirection),
          default => $q->orderBy('created_at', 'desc'),
        };
      })
      ->paginate($request->integer('per_page', 10))
      ->withQueryString();

    // Stats with caching
    $stats = cache()->remember('skps-stats', 300, function () {
      return SkemaPerhutananSosial::leftJoin('skps', function ($join) {
        $join->on('m_skema_perhutanan_sosial.id', '=', 'skps.id_skema_perhutanan_sosial')
          ->where('skps.status', 'final');
      })
        ->selectRaw('m_skema_perhutanan_sosial.name, count(skps.id) as total')
        ->groupBy('m_skema_perhutanan_sosial.id', 'm_skema_perhutanan_sosial.name')
        ->get();
    });

    return Inertia::render('Skps/Index', [
      'datas' => $datas,
      'stats' => $stats,
      'filters' => [
        'search' => $request->search,
        'sort' => $sortField,
        'direction' => $sortDirection,
        'per_page' => (int) $request->query('per_page', 10),
      ],
    ]);
  }

  /**
   * Show the form for creating a new resource.
   */
  public function create()
  {
    return Inertia::render('Skps/Create', [
      'skemas' => SkemaPerhutananSosial::all(),
    ]);
  }

  /**
   * Store a newly created resource in storage.
   */
  public function store(Request $request)
  {
    $validated = $request->validate([
      'province_id' => 'required|exists:m_provinces,id',
      'regency_id' => 'required|exists:m_regencies,id',
      'district_id' => 'required|exists:m_districts,id',
      'id_skema_perhutanan_sosial' => 'required|exists:m_skema_perhutanan_sosial,id',
      'nama_kelompok' => 'required|string',
      'potential' => 'required|string',
      'ps_area' => 'required|string',
      'number_of_kk' => 'required|string',
    ]);

    Skps::create($validated);

    return Redirect::route('skps.index')->with('success', 'Data Perkembangan SK PS berhasil ditambahkan.');
  }

  /**
   * Show the form for editing the specified resource.
   */
  public function edit(Skps $skp)
  {
    return Inertia::render('Skps/Edit', [
      'data' => $skp->load(['regency', 'district', 'skema']),
      'skemas' => SkemaPerhutananSosial::all(),
    ]);
  }

  /**
   * Update the specified resource in storage.
   */
  public function update(Request $request, Skps $skp)
  {
    $validated = $request->validate([
      'province_id' => 'required|exists:m_provinces,id',
      'regency_id' => 'required|exists:m_regencies,id',
      'district_id' => 'required|exists:m_districts,id',
      'id_skema_perhutanan_sosial' => 'required|exists:m_skema_perhutanan_sosial,id',
      'nama_kelompok' => 'required|string',
      'potential' => 'required|string',
      'ps_area' => 'required|string',
      'number_of_kk' => 'required|string',
    ]);

    $skp->update($validated);

    return Redirect::route('skps.index')->with('success', 'Data Perkembangan SK PS berhasil diperbarui.');
  }

  /**
   * Remove the specified resource from storage.
   */
  public function destroy(Skps $skp)
  {
    $skp->delete();

    return Redirect::route('skps.index')->with('success', 'Data berhasil dihapus.');
  }

  /**
   * Handle single workflow action.
   */
  public function singleWorkflowAction(Request $request, Skps $skp, SingleWorkflowAction $action)
  {
    $request->validate([
      'action' => ['required', Rule::enum(WorkflowAction::class)],
      'rejection_note' => 'nullable|string|max:255',
    ]);

    $workflowAction = WorkflowAction::from($request->action);

    match ($workflowAction) {
      WorkflowAction::SUBMIT => $this->authorize('pemberdayaan.edit'),
      WorkflowAction::APPROVE, WorkflowAction::REJECT => $this->authorize('pemberdayaan.approve'),
      WorkflowAction::DELETE => $this->authorize('pemberdayaan.delete'),
    };

    if ($workflowAction === WorkflowAction::REJECT && !$request->filled('rejection_note')) {
      return redirect()->back()->with('error', 'Catatan penolakan wajib diisi.');
    }

    $extraData = [];
    if ($request->filled('rejection_note')) {
      $extraData['rejection_note'] = $request->rejection_note;
    }

    $success = $action->execute(
      model: $skp,
      action: $workflowAction,
      user: auth()->user(),
      extraData: $extraData
    );

    if ($success) {
      cache()->forget('skps-stats');

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

  public function export()
  {
    return \Maatwebsite\Excel\Facades\Excel::download(new \App\Exports\SkpsExport, 'perkembangan-skps-' . date('Y-m-d') . '.xlsx');
  }

  public function template()
  {
    return \Maatwebsite\Excel\Facades\Excel::download(new \App\Exports\SkpsTemplateExport, 'template_import_skps.xlsx');
  }

  public function import(Request $request)
  {
    $request->validate(['file' => 'required|mimes:xlsx,csv,xls']);

    $import = new \App\Imports\SkpsImport();

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
      'ids.*' => 'exists:skps,id',
      'action' => 'required|string',
      'rejection_note' => 'nullable|string|max:255',
    ]);

    $workflowAction = WorkflowAction::from($request->action);

    match ($workflowAction) {
      WorkflowAction::SUBMIT => $this->authorize('pemberdayaan.edit'),
      WorkflowAction::APPROVE, WorkflowAction::REJECT => $this->authorize('pemberdayaan.approve'),
      WorkflowAction::DELETE => $this->authorize('pemberdayaan.delete'),
    };

    if ($workflowAction === WorkflowAction::REJECT && !$request->filled('rejection_note')) {
      return redirect()->back()->with('error', 'Catatan penolakan wajib diisi.');
    }

    $extraData = [];
    if ($request->filled('rejection_note')) {
      $extraData['rejection_note'] = $request->rejection_note;
    }

    $count = $action->execute(
      model: Skps::class,
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
