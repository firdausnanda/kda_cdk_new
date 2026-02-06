<?php

namespace App\Http\Controllers;

use App\Models\Kups;
use App\Models\Provinces;
use App\Models\Regencies;
use App\Models\Districts;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use App\Actions\BulkWorkflowAction;
use App\Actions\SingleWorkflowAction;
use App\Enums\WorkflowAction;
use Illuminate\Validation\Rule;

class KupsController extends Controller
{
  use \App\Traits\HandlesImportFailures;
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

    $datas = Kups::query()
      ->select([
        'kups.id',
        'kups.province_id',
        'kups.regency_id',
        'kups.district_id',
        'kups.nama_kups',
        'kups.category',
        'kups.commodity',
        'kups.status',
        'kups.rejection_note',
        'kups.created_at',
        'kups.created_by'
      ])
      ->with(['regency:id,name', 'district:id,name'])
      ->when($request->search, function ($query, $search) {
        $query->where(function ($q) use ($search) {
          $q->whereHas('regency', fn($q2) => $q2->where('name', 'like', "%{$search}%"))
            ->orWhereHas('district', fn($q2) => $q2->where('name', 'like', "%{$search}%"))
            ->orWhere('nama_kups', 'like', "%{$search}%")
            ->orWhere('category', 'like', "%{$search}%")
            ->orWhere('commodity', 'like', "%{$search}%");
        });
      })
      ->when($sortField === 'location', function ($q) use ($sortDirection) {
        $q->leftJoin('m_districts', 'kups.district_id', '=', 'm_districts.id')
          ->orderBy('m_districts.name', $sortDirection);
      })
      ->when(!in_array($sortField, ['location']), function ($q) use ($sortField, $sortDirection) {
        $user = auth()->user();

        if ($sortField === 'created_at' && $sortDirection === 'desc') {
          if ($user->hasRole('kacdk')) {
            $q->orderByRaw("CASE WHEN status = 'waiting_cdk' THEN 0 ELSE 1 END");
          } elseif ($user->hasRole('kasi')) {
            $q->orderByRaw("CASE WHEN status = 'waiting_kasi' THEN 0 ELSE 1 END");
          }
        }

        $q->orderBy($sortField, $sortDirection);
      })
      ->paginate($request->integer('per_page', 10))
      ->withQueryString();

    // Stats with caching
    $stats = cache()->remember('kups-stats', 300, function () {
      return [
        'total_categories' => Kups::distinct('category')->count('category'),
        'total_commodities' => Kups::distinct('commodity')->count('commodity'),
        'total_count' => Kups::count(),
      ];
    });

    return Inertia::render('Kups/Index', [
      'kups' => $datas,
      'stats' => $stats,
      'filters' => [
        'search' => $request->search,
        'sort' => $sortField,
        'direction' => $sortDirection,
        'per_page' => (int) $request->query('per_page', 10),
      ],
    ]);
  }

  public function create()
  {
    return Inertia::render('Kups/Create');
  }

  public function store(Request $request)
  {
    $validated = $request->validate([
      'province_id' => 'required|exists:m_provinces,id',
      'regency_id' => 'required|exists:m_regencies,id',
      'district_id' => 'required|exists:m_districts,id',
      'nama_kups' => 'required|string',
      'category' => 'required|string',
      'commodity' => 'required|string',
    ]);

    $validated['status'] = 'draft';
    $validated['created_by'] = Auth::id();

    Kups::create($validated);

    return redirect()->route('kups.index')->with('success', 'Data KUPS berhasil disimpan.');
  }

  public function edit(Kups $kup)
  {
    return Inertia::render('Kups/Edit', [
      'kups' => $kup,
      'regency' => Regencies::find($kup->regency_id),
      'district' => Districts::find($kup->district_id),
    ]);
  }

  public function update(Request $request, Kups $kup)
  {
    $validated = $request->validate([
      'province_id' => 'required|exists:m_provinces,id',
      'regency_id' => 'required|exists:m_regencies,id',
      'district_id' => 'required|exists:m_districts,id',
      'nama_kups' => 'required|string',
      'category' => 'required|string',
      'commodity' => 'required|string',
    ]);

    $validated['updated_by'] = Auth::id();

    $kup->update($validated);

    return redirect()->route('kups.index')->with('success', 'Data KUPS berhasil diperbarui.');
  }

  public function destroy(Kups $kup)
  {
    $kup->deleted_by = Auth::id();
    $kup->save();
    $kup->delete();

    return redirect()->route('kups.index')->with('success', 'Data KUPS berhasil dihapus.');
  }

  /**
   * Handle single workflow action.
   */
  public function singleWorkflowAction(Request $request, Kups $kup, SingleWorkflowAction $action)
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
      model: $kup,
      action: $workflowAction,
      user: auth()->user(),
      extraData: $extraData
    );

    if ($success) {
      cache()->forget('kups-stats');

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
    return \Maatwebsite\Excel\Facades\Excel::download(new \App\Exports\KupsExport, 'perkembangan-kups-' . date('Y-m-d') . '.xlsx');
  }

  public function template()
  {
    return \Maatwebsite\Excel\Facades\Excel::download(new \App\Exports\KupsTemplateExport, 'template_import_kups.xlsx');
  }

  public function import(Request $request)
  {
    $request->validate(['file' => 'required|mimes:xlsx,csv,xls']);

    $import = new \App\Imports\KupsImport();

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
      'ids.*' => 'exists:kups,id',
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
      model: Kups::class,
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

