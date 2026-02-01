<?php

namespace App\Http\Controllers;

use App\Models\NilaiTransaksiEkonomi;
use App\Models\Commodity;
use App\Models\NilaiTransaksiEkonomiDetail;
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
    $this->middleware('permission:pemberdayaan.create|pemberdayaan.edit')->only(['edit', 'update']); // submit removed
    $this->middleware('permission:pemberdayaan.delete')->only(['destroy']);
    $this->middleware('permission:pemberdayaan.approve')->only(['verify', 'approve', 'reject']);
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

  public function bulkDestroy(Request $request)
  {
    $ids = collect((array) $request->ids)
      ->filter()
      ->unique()
      ->values();

    if ($ids->isEmpty()) {
      return back()->with('error', 'Tidak ada data yang dipilih.');
    }

    $user = auth()->user();

    /**
     * Role yang TIDAK boleh hapus
     */
    if ($user->hasAnyRole(['kasi', 'kacdk'])) {
      return back()->with('error', 'Aksi tidak diijinkan.');
    }

    /**
     * Role terbatas: hanya hapus draft
     */
    if ($user->hasAnyRole(['pk', 'peh', 'pelaksana'])) {
      $count = NilaiTransaksiEkonomi::whereIn('id', $ids)
        ->where('status', 'draft')
        ->delete();

      if ($count === 0) {
        return back()->with('error', 'Hanya data dengan status draft yang dapat dihapus.');
      }

      return back()->with('success', "{$count} data berhasil dihapus.");
    }

    /**
     * Admin: bebas hapus
     */
    if ($user->hasRole('admin')) {
      $count = NilaiTransaksiEkonomi::whereIn('id', $ids)->delete();

      return back()->with('success', "{$count} data berhasil dihapus.");
    }

    return back()->with('error', 'Hak akses tidak dikenali.');
  }

  public function bulkSubmit(Request $request)
  {
    $ids = $request->ids;
    if (empty($ids)) {
      return back()->with('error', 'Tidak ada data yang dipilih.');
    }

    $count = NilaiTransaksiEkonomi::whereIn('id', $ids)
      ->whereIn('status', ['draft', 'rejected'])
      ->update(['status' => 'waiting_kasi']);

    return back()->with('success', "$count data berhasil disubmit ke Kasi.");
  }

  public function bulkApprove(Request $request)
  {
    $ids = $request->ids;
    if (empty($ids)) {
      return back()->with('error', 'Tidak ada data yang dipilih.');
    }

    $user = auth()->user();
    $updatedCount = 0;

    if ($user->hasRole('kasi')) {
      $updatedCount = NilaiTransaksiEkonomi::whereIn('id', $ids)
        ->where('status', 'waiting_kasi')
        ->update([
          'status' => 'waiting_cdk',
          'approved_by_kasi_at' => now(),
        ]);
    } elseif ($user->hasRole('kacdk') || $user->hasRole('admin')) {
      $updatedCount = NilaiTransaksiEkonomi::whereIn('id', $ids)
        ->where('status', 'waiting_cdk')
        ->update([
          'status' => 'final',
          'approved_by_cdk_at' => now(),
        ]);
    }

    if ($updatedCount > 0) {
      return back()->with('success', "$updatedCount data berhasil disetujui.");
    }

    return back()->with('error', 'Tidak ada data yang dapat disetujui sesuai status dan hak akses.');
  }

  public function create()
  {
    return Inertia::render('NilaiTransaksiEkonomi/Create', [
      'commodities' => Commodity::orderBy('name')->get(),
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
      'commodities' => Commodity::orderBy('name')->get(),
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

  public function submit(NilaiTransaksiEkonomi $nilaiTransaksiEkonomi)
  {
    // Custom authorization: Allow if user is creator OR has specific permissions
    if (auth()->id() !== $nilaiTransaksiEkonomi->created_by && !auth()->user()->can('pemberdayaan.edit') && !auth()->user()->can('pemberdayaan.create')) {
      return redirect()->back()->with('error', 'Akses Ditolak: Anda tidak memiliki izin untuk melakukan aksi ini.');
    }

    $nilaiTransaksiEkonomi->update(['status' => 'waiting_kasi']);
    return redirect()->back()->with('success', 'Laporan berhasil diajukan untuk verifikasi Kasi.');
  }

  public function approve(NilaiTransaksiEkonomi $nilaiTransaksiEkonomi)
  {
    $user = auth()->user();

    if (($user->hasRole('kasi') || $user->hasRole('admin')) && $nilaiTransaksiEkonomi->status === 'waiting_kasi') {
      $nilaiTransaksiEkonomi->update(['status' => 'waiting_cdk', 'approved_by_kasi_at' => now()]);
      return redirect()->back()->with('success', 'Laporan disetujui dan diteruskan ke KaCDK.');
    }

    if (($user->hasRole('kacdk') || $user->hasRole('admin')) && $nilaiTransaksiEkonomi->status === 'waiting_cdk') {
      $nilaiTransaksiEkonomi->update(['status' => 'final', 'approved_by_cdk_at' => now()]);
      return redirect()->back()->with('success', 'Laporan telah disetujui secara final.');
    }

    return redirect()->back()->with('error', 'Aksi tidak diijinkan.');
  }

  public function reject(Request $request, NilaiTransaksiEkonomi $nilaiTransaksiEkonomi)
  {
    $request->validate(['rejection_note' => 'required|string|max:255']);
    $nilaiTransaksiEkonomi->update(['status' => 'rejected', 'rejection_note' => $request->rejection_note]);
    return redirect()->back()->with('success', 'Laporan telah ditolak dengan catatan.');
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
