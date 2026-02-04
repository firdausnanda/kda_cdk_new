<?php

namespace App\Http\Controllers;

use App\Models\Pbphh;
use App\Models\JenisProduksi;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use App\Actions\SingleWorkflowAction;
use App\Actions\BulkWorkflowAction;
use App\Enums\WorkflowAction;
use Illuminate\Validation\Rule;

class PbphhController extends Controller
{
  use \App\Traits\HandlesImportFailures;
  public function __construct()
  {
    $this->middleware('permission:bina-usaha.view')->only(['index', 'show']);
    $this->middleware('permission:bina-usaha.create')->only(['create', 'store']);
    $this->middleware('permission:bina-usaha.edit')->only(['edit', 'update', 'submit']);
    $this->middleware('permission:bina-usaha.delete')->only(['destroy']);
  }

  public function index(Request $request)
  {
    $sortField = $request->query('sort', 'created_at');
    $sortDirection = $request->query('direction', 'desc');

    $datas = Pbphh::query()
      ->select([
        'pbphh.id',
        'pbphh.name',
        'pbphh.number',
        'pbphh.province_id',
        'pbphh.regency_id',
        'pbphh.district_id',
        'pbphh.investment_value',
        'pbphh.number_of_workers',
        'pbphh.present_condition',
        'pbphh.status',
        'pbphh.rejection_note',
        'pbphh.created_at',
        'pbphh.created_by',
      ])
      ->with([
        'creator:id,name',
        'regency:id,name',
        'district:id,name',
        'jenis_produksi:id,name'
      ])
      ->when($request->search, function ($query, $search) {
        $query->where(function ($q) use ($search) {
          $q->where('name', 'like', "%{$search}%")
            ->orWhere('number', 'like', "%{$search}%")
            ->orWhereHas('jenis_produksi', fn($q2) => $q2->where('name', 'like', "%{$search}%"))
            ->orWhereHas('regency', fn($q2) => $q2->where('name', 'like', "%{$search}%"))
            ->orWhereHas('district', fn($q2) => $q2->where('name', 'like', "%{$search}%"));
        });
      })
      ->when($sortField === 'location', function ($q) use ($sortDirection) {
        $q->leftJoin('m_regencies', 'pbphh.regency_id', '=', 'm_regencies.id')
          ->leftJoin('m_districts', 'pbphh.district_id', '=', 'm_districts.id')
          ->orderByRaw("COALESCE(m_districts.name, m_regencies.name) $sortDirection");
      })
      ->when(!in_array($sortField, ['location']), function ($q) use ($sortField, $sortDirection) {
        match ($sortField) {
          'name' => $q->orderBy('name', $sortDirection),
          'number' => $q->orderBy('number', $sortDirection),
          'investment' => $q->orderBy('investment_value', $sortDirection),
          'workers' => $q->orderBy('number_of_workers', $sortDirection),
          'condition' => $q->orderBy('present_condition', $sortDirection),
          'status' => $q->orderBy('status', $sortDirection),
          default => $q->orderBy('created_at', 'desc'),
        };
      })
      ->paginate($request->integer('per_page', 10))
      ->withQueryString();

    // Stats with caching
    $stats = cache()->remember('pbphh-stats', 300, function () {
      return [
        'total_count' => Pbphh::count(),
        'verified_count' => Pbphh::where('status', 'final')->count(),
      ];
    });

    return Inertia::render('Pbphh/Index', [
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

  public function create()
  {
    return Inertia::render('Pbphh/Create', [
      'jenis_produksi_list' => JenisProduksi::all(),
      'provinces' => DB::table('m_provinces')->where('id', '35')->get(),
      'regencies' => DB::table('m_regencies')->where('province_id', '35')->get()
    ]);
  }

  public function store(Request $request)
  {
    $validated = $request->validate([
      'name' => 'required|string|max:255',
      'number' => 'required|string|max:255',
      'province_id' => 'required|exists:m_provinces,id',
      'regency_id' => 'required|exists:m_regencies,id',
      'district_id' => 'required|exists:m_districts,id',
      'investment_value' => 'required|integer|min:0',
      'number_of_workers' => 'required|integer|min:0',
      'present_condition' => 'required|boolean',
      'jenis_produksi' => 'required|array|min:1',
      'jenis_produksi.*.jenis_produksi_id' => 'required|exists:m_jenis_produksi,id',
      'jenis_produksi.*.kapasitas_ijin' => 'required|string',
    ]);

    $data = collect($validated)->except('jenis_produksi')->toArray();
    $pbphh = Pbphh::create($data);

    $pivotData = [];
    foreach ($request->jenis_produksi as $item) {
      $pivotData[$item['jenis_produksi_id']] = ['kapasitas_ijin' => $item['kapasitas_ijin']];
    }
    $pbphh->jenis_produksi()->sync($pivotData);

    return redirect()->route('pbphh.index')
      ->with('success', 'Data berhasil ditambahkan');
  }

  public function edit(Pbphh $pbphh)
  {
    return Inertia::render('Pbphh/Edit', [
      'data' => $pbphh->load(['jenis_produksi', 'regency', 'district']),
      'jenis_produksi_list' => JenisProduksi::all(),
      'provinces' => DB::table('m_provinces')->where('id', '35')->get(),
      'regencies' => DB::table('m_regencies')->where('province_id', '35')->get(),
      'districts' => DB::table('m_districts')->where('regency_id', $pbphh->regency_id)->get(),
    ]);
  }

  public function update(Request $request, Pbphh $pbphh)
  {
    $validated = $request->validate([
      'name' => 'required|string|max:255',
      'number' => 'required|string|max:255',
      'province_id' => 'required|exists:m_provinces,id',
      'regency_id' => 'required|exists:m_regencies,id',
      'district_id' => 'required|exists:m_districts,id',
      'investment_value' => 'required|integer|min:0',
      'number_of_workers' => 'required|integer|min:0',
      'present_condition' => 'required|boolean',
      'jenis_produksi' => 'required|array|min:1',
      'jenis_produksi.*.jenis_produksi_id' => 'required|exists:m_jenis_produksi,id',
      'jenis_produksi.*.kapasitas_ijin' => 'required|string',
    ]);

    $data = collect($validated)->except('jenis_produksi')->toArray();
    $pbphh->update($data);

    $pivotData = [];
    foreach ($request->jenis_produksi as $item) {
      $pivotData[$item['jenis_produksi_id']] = ['kapasitas_ijin' => $item['kapasitas_ijin']];
    }
    $pbphh->jenis_produksi()->sync($pivotData);

    return redirect()->route('pbphh.index')
      ->with('success', 'Data berhasil diperbarui');
  }

  public function destroy(Pbphh $pbphh)
  {
    $pbphh->delete();

    return redirect()->route('pbphh.index')
      ->with('success', 'Data berhasil dihapus');
  }

  /**
   * Single workflow action.
   */
  public function singleWorkflowAction(Request $request, Pbphh $pbphh, SingleWorkflowAction $action)
  {
    $request->validate([
      'action' => ['required', Rule::enum(WorkflowAction::class)],
      'rejection_note' => 'nullable|string|max:255',
    ]);

    $workflowAction = WorkflowAction::from($request->action);

    if ($workflowAction === WorkflowAction::REJECT && !$request->filled('rejection_note')) {
      return redirect()->back()->with('error', 'Catatan penolakan wajib diisi.');
    }

    $extraData = [];
    if ($request->filled('rejection_note')) {
      $extraData['rejection_note'] = $request->rejection_note;
    }

    $success = $action->execute(
      model: $pbphh,
      action: $workflowAction,
      user: auth()->user(),
      extraData: $extraData
    );

    if ($success) {
      cache()->forget('pbphh-stats');

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
    return \Maatwebsite\Excel\Facades\Excel::download(new \App\Exports\PbphhExport(), 'pbphh-' . date('Y-m-d') . '.xlsx');
  }

  public function template()
  {
    return \Maatwebsite\Excel\Facades\Excel::download(new \App\Exports\PbphhTemplateExport, 'template_import_pbphh.xlsx');
  }

  public function import(Request $request)
  {
    $request->validate(['file' => 'required|mimes:xlsx,csv,xls']);

    $import = new \App\Imports\PbphhImport();

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
   * Bulk workflow action.
   */
  public function bulkWorkflowAction(Request $request, BulkWorkflowAction $action)
  {
    $request->validate([
      'ids' => 'required|array',
      'ids.*' => 'exists:pbphh,id',
      'action' => ['required', Rule::enum(WorkflowAction::class)],
      'rejection_note' => 'nullable|string|max:255',
    ]);

    $workflowAction = WorkflowAction::from($request->action);

    if ($workflowAction === WorkflowAction::REJECT && !$request->filled('rejection_note')) {
      return redirect()->back()->with('error', 'Catatan penolakan wajib diisi.');
    }

    $extraData = [];
    if ($request->filled('rejection_note')) {
      $extraData['rejection_note'] = $request->rejection_note;
    }

    $count = $action->execute(
      model: Pbphh::class,
      action: $workflowAction,
      ids: $request->ids,
      user: auth()->user(),
      extraData: $extraData
    );

    // Clear cache
    cache()->forget('pbphh-stats');

    $message = match ($workflowAction) {
      WorkflowAction::DELETE => 'dihapus',
      WorkflowAction::SUBMIT => 'diajukan',
      WorkflowAction::APPROVE => 'disetujui',
      WorkflowAction::REJECT => 'ditolak',
    };

    return redirect()->back()->with('success', "{$count} data berhasil {$message}.");
  }
}
