<?php

namespace App\Http\Controllers;

use App\Models\PerkembanganKth;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Actions\BulkWorkflowAction;
use App\Actions\SingleWorkflowAction;
use App\Enums\WorkflowAction;
use Illuminate\Validation\Rule;

class PerkembanganKthController extends Controller
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

    $query = PerkembanganKth::query()
      ->select([
        'perkembangan_kth.id',
        'perkembangan_kth.year',
        'perkembangan_kth.month',
        'perkembangan_kth.regency_id',
        'perkembangan_kth.district_id',
        'perkembangan_kth.village_id',
        'perkembangan_kth.nama_kth',
        'perkembangan_kth.nomor_register',
        'perkembangan_kth.kelas_kelembagaan',
        'perkembangan_kth.jumlah_anggota',
        'perkembangan_kth.luas_kelola',
        'perkembangan_kth.status',
        'perkembangan_kth.rejection_note',
        'perkembangan_kth.created_at',
        'perkembangan_kth.created_by'
      ])
      ->with([
        'creator:id,name',
        'regency_rel:id,name',
        'district_rel:id,name',
        'village_rel:id,name'
      ]);

    if ($request->has('search')) {
      $search = $request->search;
      $query->where(function ($q) use ($search) {
        $q->where('perkembangan_kth.nama_kth', 'like', "%{$search}%")
          ->orWhere('perkembangan_kth.nomor_register', 'like', "%{$search}%")
          ->orWhereHas('village_rel', fn($q2) => $q2->where('name', 'like', "%{$search}%"))
          ->orWhereHas('district_rel', fn($q2) => $q2->where('name', 'like', "%{$search}%"))
          ->orWhereHas('regency_rel', fn($q2) => $q2->where('name', 'like', "%{$search}%"));
      });
    }

    // Sorting logic
    $query->when($sortField === 'location', function ($q) use ($sortDirection) {
      $q->leftJoin('m_districts', 'perkembangan_kth.district_id', '=', 'm_districts.id')
        ->orderBy('m_districts.name', $sortDirection);
    })->when(!in_array($sortField, ['location']), function ($q) use ($sortField, $sortDirection) {
      $user = auth()->user();

      if ($sortField === 'created_at' && $sortDirection === 'desc') {
        if ($user->hasRole('kacdk')) {
          $q->orderByRaw("CASE WHEN status = 'waiting_cdk' THEN 0 ELSE 1 END");
        } elseif ($user->hasRole('kasi')) {
          $q->orderByRaw("CASE WHEN status = 'waiting_kasi' THEN 0 ELSE 1 END");
        }
      }

      match ($sortField) {
        'nama_kth' => $q->orderBy('perkembangan_kth.nama_kth', $sortDirection),
        'nomor_register' => $q->orderBy('perkembangan_kth.nomor_register', $sortDirection),
        'kelas' => $q->orderBy('perkembangan_kth.kelas_kelembagaan', $sortDirection),
        'anggota' => $q->orderBy('perkembangan_kth.jumlah_anggota', $sortDirection),
        'luas' => $q->orderBy('perkembangan_kth.luas_kelola', $sortDirection),
        'status' => $q->orderBy('perkembangan_kth.status', $sortDirection),
        default => $q->orderBy('perkembangan_kth.created_at', 'desc'),
      };
    });

    $datas = $query->paginate($request->integer('per_page', 10))->withQueryString();

    // Stats Caching
    $stats = cache()->remember('perkembangan-kth-stats-all', 300, function () {
      $baseQuery = PerkembanganKth::where('status', 'final');
      return [
        'total_kth' => (clone $baseQuery)->count(),
        'total_anggota' => (clone $baseQuery)->sum('jumlah_anggota'),
        'total_luas' => (clone $baseQuery)->sum('luas_kelola'),
        'by_kelas' => [
          'pemula' => (clone $baseQuery)->where('kelas_kelembagaan', 'pemula')->count(),
          'madya' => (clone $baseQuery)->where('kelas_kelembagaan', 'madya')->count(),
          'utama' => (clone $baseQuery)->where('kelas_kelembagaan', 'utama')->count(),
        ]
      ];
    });

    return Inertia::render('PerkembanganKth/Index', [
      'datas' => $datas,
      'stats' => $stats,
      'filters' => [
        'search' => $request->search,
        'sort' => $sortField,
        'direction' => $sortDirection,
        'per_page' => (int) $request->query('per_page', 10),
      ],
      'availableYears' => [],
    ]);
  }

  public function bulkWorkflowAction(Request $request, BulkWorkflowAction $action)
  {
    $request->validate([
      'ids' => 'required|array',
      'ids.*' => 'exists:perkembangan_kth,id',
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
      model: PerkembanganKth::class,
      action: $workflowAction,
      ids: $request->ids,
      user: auth()->user(),
      extraData: $extraData
    );

    if ($count > 0) {
      cache()->forget('perkembangan-kth-stats-all');
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

  /**
   * Show the form for creating a new resource.
   */
  public function create()
  {
    return Inertia::render('PerkembanganKth/Create');
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
      'nama_kth' => 'required|string|max:255',
      'nomor_register' => 'nullable|string|max:100',
      'kelas_kelembagaan' => 'required|in:pemula,madya,utama',
      'jumlah_anggota' => 'required|integer|min:0',
      'luas_kelola' => 'required|numeric|min:0',
      'potensi_kawasan' => 'nullable|string',
    ]);

    PerkembanganKth::create($validated);

    return redirect()->route('perkembangan-kth.index')->with('success', 'Data KTH berhasil ditambahkan.');
  }

  /**
   * Display the specified resource.
   */
  public function show(PerkembanganKth $perkembanganKth)
  {
    //
  }

  /**
   * Show the form for editing the specified resource.
   */
  public function edit(PerkembanganKth $perkembanganKth)
  {
    return Inertia::render('PerkembanganKth/Edit', [
      'data' => $perkembanganKth->load(['regency_rel', 'district_rel', 'village_rel']),
    ]);
  }

  /**
   * Update the specified resource in storage.
   */
  public function update(Request $request, PerkembanganKth $perkembanganKth)
  {
    $validated = $request->validate([
      'year' => 'required|integer',
      'month' => 'required|integer|min:1|max:12',
      'province_id' => 'nullable|exists:m_provinces,id',
      'regency_id' => 'nullable|exists:m_regencies,id',
      'district_id' => 'nullable|exists:m_districts,id',
      'village_id' => 'nullable|exists:m_villages,id',
      'nama_kth' => 'required|string|max:255',
      'nomor_register' => 'nullable|string|max:100',
      'kelas_kelembagaan' => 'required|in:pemula,madya,utama',
      'jumlah_anggota' => 'required|integer|min:0',
      'luas_kelola' => 'required|numeric|min:0',
      'potensi_kawasan' => 'nullable|string',
    ]);

    $perkembanganKth->update($validated);

    return redirect()->route('perkembangan-kth.index')->with('success', 'Data KTH berhasil diperbarui.');
  }

  /**
   * Remove the specified resource from storage.
   */
  public function destroy(PerkembanganKth $perkembanganKth)
  {
    $perkembanganKth->delete();

    return redirect()->route('perkembangan-kth.index')->with('success', 'Data KTH berhasil dihapus.');
  }

  /**
   * Handle single workflow action.
   */
  public function singleWorkflowAction(Request $request, PerkembanganKth $perkembanganKth, SingleWorkflowAction $action)
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
      model: $perkembanganKth,
      action: $workflowAction,
      user: auth()->user(),
      extraData: $extraData
    );

    if ($success) {
      cache()->forget('perkembangan-kth-stats-all');

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

  public function bulkReject(Request $request)
  {
    $request->validate([
      'ids' => 'required|array',
      'ids.*' => 'exists:perkembangan_kth,id',
      'rejection_note' => 'required|string|max:255',
    ]);

    $user = auth()->user();
    $ids = $request->ids;
    $count = 0;

    if ($user->hasRole('kasi') || $user->hasRole('admin')) {
      $count = PerkembanganKth::whereIn('id', $ids)
        ->where('status', 'waiting_kasi')
        ->update([
          'status' => 'rejected',
          'rejection_note' => $request->rejection_note,
        ]);
    }

    if ($user->hasRole('kacdk') || $user->hasRole('admin')) {
      $count = PerkembanganKth::whereIn('id', $ids)
        ->where('status', 'waiting_cdk')
        ->update([
          'status' => 'rejected',
          'rejection_note' => $request->rejection_note,
        ]);
    }

    if ($count > 0) {
      cache()->forget('perkembangan-kth-stats-all');
    }

    return redirect()->back()->with('success', $count . ' laporan berhasil ditolak.');
  }

  /**
   * Export data to Excel.
   */
  public function export(Request $request)
  {
    $year = $request->query('year');
    return \Maatwebsite\Excel\Facades\Excel::download(new \App\Exports\PerkembanganKthExport($year), 'perkembangan-kth-' . date('Y-m-d') . '.xlsx');
  }

  /**
   * Download import template.
   */
  public function template()
  {
    return \Maatwebsite\Excel\Facades\Excel::download(new \App\Exports\PerkembanganKthTemplateExport, 'template_import_perkembangan_kth.xlsx');
  }

  /**
   * Import data from Excel.
   */
  public function import(Request $request)
  {
    $request->validate([
      'file' => 'required|mimes:xlsx,csv,xls',
    ]);

    $import = new \App\Imports\PerkembanganKthImport();

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
