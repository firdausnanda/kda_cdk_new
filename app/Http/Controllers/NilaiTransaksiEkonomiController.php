<?php

namespace App\Http\Controllers;

use App\Models\NilaiTransaksiEkonomi;
use App\Models\Commodity;
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
    $this->middleware('permission:pemberdayaan.edit')->only(['edit', 'update', 'submit']);
    $this->middleware('permission:pemberdayaan.delete')->only(['destroy']);
    $this->middleware('permission:pemberdayaan.approve')->only(['verify', 'approve', 'reject']);
  }

  public function index(Request $request)
  {
    $selectedYear = $request->query('year', date('Y'));

    $datas = NilaiTransaksiEkonomi::query()
      ->leftJoin('m_regencies', 'nilai_transaksi_ekonomi.regency_id', '=', 'm_regencies.id')
      ->leftJoin('m_districts', 'nilai_transaksi_ekonomi.district_id', '=', 'm_districts.id')
      ->leftJoin('m_villages', 'nilai_transaksi_ekonomi.village_id', '=', 'm_villages.id')
      ->select(
        'nilai_transaksi_ekonomi.*',
        'm_regencies.name as regency_name',
        'm_districts.name as district_name',
        'm_villages.name as village_name'
      )
      ->when($selectedYear, fn($q, $y) => $q->where('nilai_transaksi_ekonomi.year', $y))
      ->when($request->search, function ($query, $search) {
        $query->where(function ($q) use ($search) {
          $q->where('nilai_transaksi_ekonomi.nama_kth', 'like', "%{$search}%")
            ->orWhere('m_villages.name', 'like', "%{$search}%")
            ->orWhere('m_districts.name', 'like', "%{$search}%")
            ->orWhere('m_regencies.name', 'like', "%{$search}%")
            ->orWhereHas('details.commodity', fn($q2) => $q2->where('name', 'like', "%{$search}%"));
        });
      })
      ->with(['creator', 'regency_rel', 'district_rel', 'village_rel', 'details.commodity'])
      ->latest('nilai_transaksi_ekonomi.created_at')
      ->paginate(10)
      ->withQueryString();

    $stats = [
      'total_transaksi' => NilaiTransaksiEkonomi::where('year', $selectedYear)->where('status', 'final')->count(),
      'total_nilai' => NilaiTransaksiEkonomi::where('year', $selectedYear)->where('status', 'final')->sum('total_nilai_transaksi'),
      'total_volume' => \App\Models\NilaiTransaksiEkonomiDetail::whereHas('nilaiTransaksiEkonomi', fn($q) => $q->where('year', $selectedYear)->where('status', 'final'))->sum('volume_produksi'),
      'total_kth' => NilaiTransaksiEkonomi::where('year', $selectedYear)->where('status', 'final')->distinct('nama_kth')->count('nama_kth'),
    ];

    $availableYears = NilaiTransaksiEkonomi::distinct()->orderBy('year', 'desc')->pluck('year');
    if ($availableYears->isEmpty()) {
      $availableYears = [date('Y')];
    }

    return Inertia::render('NilaiTransaksiEkonomi/Index', [
      'datas' => $datas,
      'stats' => $stats,
      'filters' => ['year' => (int) $selectedYear, 'search' => $request->search],
      'availableYears' => $availableYears,
    ]);
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
