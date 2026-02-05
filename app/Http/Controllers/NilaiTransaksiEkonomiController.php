<?php

namespace App\Http\Controllers;

use App\Models\NilaiTransaksiEkonomi;
use App\Models\Commodity;
use App\Models\NilaiTransaksiEkonomiDetail;
use App\Actions\BulkWorkflowAction;
use App\Actions\SingleWorkflowAction;
use App\Enums\WorkflowAction;
use Illuminate\Validation\Rule;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class NilaiTransaksiEkonomiController extends Controller
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
    $selectedYear = $request->query('year')
      ?? NilaiTransaksiEkonomi::max('year')
      ?? date('Y');

    $sort = $request->query('sort');
    $direction = $request->query('direction', 'asc');

    $datas = NilaiTransaksiEkonomi::query()
      ->with([
        'creator:id,name',
        'regency_rel:id,name',
        'district_rel:id,name',
        'village_rel:id,name',
        'details:id,nilai_transaksi_ekonomi_id,commodity_id,volume_produksi,satuan',
        'details.commodity:id,name'
      ])
      ->where('year', $selectedYear)

      ->when($request->search, function ($q, $search) {
        $q->where('nama_kth', 'like', "%{$search}%")
          ->orWhereHas('village_rel', fn($q) => $q->where('name', 'like', "%{$search}%"))
          ->orWhereHas('district_rel', fn($q) => $q->where('name', 'like', "%{$search}%"))
          ->orWhereHas('regency_rel', fn($q) => $q->where('name', 'like', "%{$search}%"))
          ->orWhereHas('details.commodity', fn($q) => $q->where('name', 'like', "%{$search}%"));
      })

      ->when($request->sort, function ($q) use ($request) {
        match ($request->sort) {
          'nama_kth' => $q->orderBy('nama_kth', $request->direction),
          'nilai' => $q->orderBy('total_nilai_transaksi', $request->direction),
          'status' => $q->orderBy('status', $request->direction),
          'month' => $q->orderBy('month', $request->direction),
          'user' => $q->select('nilai_transaksi_ekonomi.*')
            ->leftJoin('users', 'nilai_transaksi_ekonomi.created_by', '=', 'users.id')
            ->orderBy('users.name', $request->direction),
          default => $q->latest(),
        };
      }, fn($q) => $q->latest())

      ->paginate($request->integer('per_page', 10))
      ->withQueryString();

    $stats = cache()->remember(
      "nilai-transaksi-stats-{$selectedYear}",
      300,
      function () use ($selectedYear) {
        return [
          'total_transaksi' => NilaiTransaksiEkonomi::where('year', $selectedYear)->where('status', 'final')->count(),
          'total_nilai' => NilaiTransaksiEkonomi::where('year', $selectedYear)->where('status', 'final')->sum('total_nilai_transaksi'),
          'total_volume' => NilaiTransaksiEkonomiDetail::whereHas(
            'nilaiTransaksiEkonomi',
            fn($q) => $q->where('year', $selectedYear)->where('status', 'final')
          )->sum('volume_produksi'),
          'total_kth' => NilaiTransaksiEkonomi::where('year', $selectedYear)->where('status', 'final')->distinct()->count('nama_kth'),
        ];
      }
    );

    $availableYears = cache()->remember('nilai-transaksi-years', 3600, function () {
      $dbYears = NilaiTransaksiEkonomi::distinct()->pluck('year')->toArray();
      $fixedYears = range(2025, 2021);
      $years = array_unique(array_merge($dbYears, $fixedYears));
      rsort($years);
      return $years;
    });

    return Inertia::render('NilaiTransaksiEkonomi/Index', [
      'datas' => $datas,
      'stats' => $stats,
      'filters' => [
        'year' => (int) $selectedYear,
        'search' => $request->search,
        'sort' => $sort,
        'direction' => $direction,
        'per_page' => (int) $request->query('per_page', 10),
      ],
      'availableYears' => $availableYears,
    ]);
  }

  public function bulkWorkflowAction(Request $request, BulkWorkflowAction $action)
  {
    $request->validate([
      'ids' => 'required|array',
      'ids.*' => 'exists:nilai_transaksi_ekonomi,id',
      'action' => 'required|string|in:submit,approve,reject,delete',
      'rejection_note' => 'nullable|string|required_if:action,reject',
    ]);

    $data = [
      'ids' => $request->ids,
      'action' => WorkflowAction::tryFrom($request->action),
      'rejection_note' => $request->rejection_note,
    ];

    match ($data['action']) {
      WorkflowAction::SUBMIT => $this->authorize('pemberdayaan.edit'),
      WorkflowAction::APPROVE, WorkflowAction::REJECT => $this->authorize('pemberdayaan.approve'),
      WorkflowAction::DELETE => $this->authorize('pemberdayaan.delete'),
    };

    try {
      $count = $action->execute(
        model: NilaiTransaksiEkonomi::class,
        action: $data['action'],
        ids: $data['ids'],
        user: auth()->user(),
        extraData: ['rejection_note' => $data['rejection_note']]
      );
      $message = match ($request->action) {
        'delete' => "$count data berhasil dihapus.",
        'submit' => "$count data berhasil disubmit.",
        'approve' => "$count data berhasil disetujui.",
        'reject' => "$count data berhasil ditolak.",
      };
      return back()->with('success', $message);
    } catch (\Exception $e) {
      return back()->with('error', $e->getMessage());
    }
  }

  public function create()
  {
    return Inertia::render('NilaiTransaksiEkonomi/Create', [
      'commodities' => Commodity::withoutGlobalScope('not_nilai_transaksi_ekonomi')
        ->where('is_nilai_transaksi_ekonomi', true)
        ->get(),
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
      'nama_kth' => 'required|string|max:255',
      'details' => 'required|array|min:1',
      'details.*.commodity_id' => 'required|exists:m_commodities,id',
      'details.*.volume_produksi' => 'required|numeric|min:0',
      'details.*.satuan' => 'required|string|max:50',
      'details.*.nilai_transaksi' => 'required|numeric|min:0',
    ]);

    $validated['status'] = 'draft';
    $validated['created_by'] = Auth::id();

    $totalValue = collect($request->details)->sum('nilai_transaksi');
    $validated['total_nilai_transaksi'] = $totalValue;

    $record = NilaiTransaksiEkonomi::create($validated);

    foreach ($request->details as $detail) {
      $record->details()->create([
        'commodity_id' => $detail['commodity_id'],
        'volume_produksi' => $detail['volume_produksi'],
        'satuan' => $detail['satuan'],
        'nilai_transaksi' => $detail['nilai_transaksi'],
      ]);
    }

    return redirect()->route('nilai-transaksi-ekonomi.index')->with('success', 'Data transaksi berhasil ditambahkan.');
  }

  public function show(NilaiTransaksiEkonomi $nilaiTransaksiEkonomi)
  {
    //
  }

  public function edit(NilaiTransaksiEkonomi $nilaiTransaksiEkonomi)
  {
    $nilaiTransaksiEkonomi->load(['regency_rel', 'district_rel', 'village_rel', 'details.commodity']);

    return Inertia::render('NilaiTransaksiEkonomi/Edit', [
      'data' => $nilaiTransaksiEkonomi,
      'commodities' => Commodity::withoutGlobalScope('not_nilai_transaksi_ekonomi')
        ->where('is_nilai_transaksi_ekonomi', true)
        ->get(),
    ]);
  }

  public function update(Request $request, NilaiTransaksiEkonomi $nilaiTransaksiEkonomi)
  {
    if (!in_array($nilaiTransaksiEkonomi->status, ['draft', 'rejected'])) {
      return redirect()->back()->with('error', 'Data tidak dapat diedit karena sedang dalam proses verifikasi atau sudah final.');
    }

    $validated = $request->validate([
      'year' => 'required|integer',
      'month' => 'required|integer|min:1|max:12',
      'province_id' => 'nullable|exists:m_provinces,id',
      'regency_id' => 'nullable|exists:m_regencies,id',
      'district_id' => 'nullable|exists:m_districts,id',
      'village_id' => 'nullable|exists:m_villages,id',
      'nama_kth' => 'required|string|max:255',
      'details' => 'required|array|min:1',
      'details.*.commodity_id' => 'required|exists:m_commodities,id',
      'details.*.volume_produksi' => 'required|numeric|min:0',
      'details.*.satuan' => 'required|string|max:50',
      'details.*.nilai_transaksi' => 'required|numeric|min:0',
    ]);

    $validated['updated_by'] = Auth::id();
    $totalValue = collect($request->details)->sum('nilai_transaksi');
    $validated['total_nilai_transaksi'] = $totalValue;

    $nilaiTransaksiEkonomi->update($validated);
    $nilaiTransaksiEkonomi->details()->delete();

    foreach ($request->details as $detail) {
      $nilaiTransaksiEkonomi->details()->create([
        'commodity_id' => $detail['commodity_id'],
        'volume_produksi' => $detail['volume_produksi'],
        'satuan' => $detail['satuan'],
        'nilai_transaksi' => $detail['nilai_transaksi'],
      ]);
    }

    return redirect()->route('nilai-transaksi-ekonomi.index')->with('success', 'Data transaksi berhasil diperbarui.');
  }

  public function destroy(NilaiTransaksiEkonomi $nilaiTransaksiEkonomi)
  {
    $nilaiTransaksiEkonomi->delete();
    return redirect()->route('nilai-transaksi-ekonomi.index')->with('success', 'Data transaksi berhasil dihapus.');
  }

  /**
   * Handle single workflow action.
   */
  public function singleWorkflowAction(Request $request, NilaiTransaksiEkonomi $nilaiTransaksiEkonomi, SingleWorkflowAction $action)
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
      model: $nilaiTransaksiEkonomi,
      action: $workflowAction,
      user: auth()->user(),
      extraData: $extraData
    );

    if ($success) {
      cache()->forget("nilai-transaksi-stats-{$nilaiTransaksiEkonomi->year}");

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
    return \Maatwebsite\Excel\Facades\Excel::download(new \App\Exports\NilaiTransaksiEkonomiExport($year), 'nilai-transaksi-ekonomi-' . date('Y-m-d') . '.xlsx');
  }

  public function template()
  {
    return \Maatwebsite\Excel\Facades\Excel::download(new \App\Exports\NilaiTransaksiEkonomiTemplateExport, 'template_import_nilai_transaksi_ekonomi.xlsx');
  }

  public function import(Request $request)
  {
    $request->validate(['file' => 'required|mimes:xlsx,csv,xls']);
    $import = new \App\Imports\NilaiTransaksiEkonomiImport();

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
