<?php

namespace App\Http\Controllers;

use App\Models\PerkembanganKth;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PerkembanganKthController extends Controller
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
    $selectedYear = $request->query('year');
    if (!$selectedYear) {
      $selectedYear = PerkembanganKth::max('year') ?? date('Y');
    }

    $datas = PerkembanganKth::query()
      ->leftJoin('m_regencies', 'perkembangan_kth.regency_id', '=', 'm_regencies.id')
      ->leftJoin('m_districts', 'perkembangan_kth.district_id', '=', 'm_districts.id')
      ->leftJoin('m_villages', 'perkembangan_kth.village_id', '=', 'm_villages.id')
      ->select(
        'perkembangan_kth.*',
        'm_regencies.name as regency_name',
        'm_districts.name as district_name',
        'm_villages.name as village_name'
      )
      ->when($selectedYear, function ($query, $year) {
        return $query->where('perkembangan_kth.year', $year);
      })
      ->when($request->search, function ($query, $search) {
        $query->where(function ($q) use ($search) {
          $q->where('perkembangan_kth.nama_kth', 'like', "%{$search}%")
            ->orWhere('perkembangan_kth.nomor_register', 'like', "%{$search}%")
            ->orWhere('m_villages.name', 'like', "%{$search}%")
            ->orWhere('m_districts.name', 'like', "%{$search}%")
            ->orWhere('m_regencies.name', 'like', "%{$search}%");
        });
      })
      ->with(['creator', 'regency_rel', 'district_rel', 'village_rel'])
      ->latest('perkembangan_kth.created_at')
      ->paginate(10)
      ->withQueryString();

    $stats = [
      'total_kth' => PerkembanganKth::where('year', $selectedYear)->where('status', 'final')->count(),
      'total_anggota' => PerkembanganKth::where('year', $selectedYear)->where('status', 'final')->sum('jumlah_anggota'),
      'total_luas' => PerkembanganKth::where('year', $selectedYear)->where('status', 'final')->sum('luas_kelola'),
      'by_kelas' => [
        'pemula' => PerkembanganKth::where('year', $selectedYear)->where('status', 'final')->where('kelas_kelembagaan', 'pemula')->count(),
        'madya' => PerkembanganKth::where('year', $selectedYear)->where('status', 'final')->where('kelas_kelembagaan', 'madya')->count(),
        'utama' => PerkembanganKth::where('year', $selectedYear)->where('status', 'final')->where('kelas_kelembagaan', 'utama')->count(),
      ]
    ];

    $dbYears = PerkembanganKth::distinct()->orderBy('year', 'desc')->pluck('year')->toArray();
    $fixedYears = range(2025, 2021);
    $availableYears = array_values(array_unique(array_merge($dbYears, $fixedYears)));
    rsort($availableYears);

    return Inertia::render('PerkembanganKth/Index', [
      'datas' => $datas,
      'stats' => $stats,
      'filters' => [
        'year' => (int) $selectedYear,
        'search' => $request->search,
      ],
      'availableYears' => $availableYears,
    ]);
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
   * Submit the report for verification.
   */
  public function submit(PerkembanganKth $perkembanganKth)
  {
    $perkembanganKth->update(['status' => 'waiting_kasi']);
    return redirect()->back()->with('success', 'Laporan berhasil diajukan untuk verifikasi Kasi.');
  }

  /**
   * Approve the report.
   */
  public function approve(PerkembanganKth $perkembanganKth)
  {
    $user = auth()->user();

    if (($user->hasRole('kasi') || $user->hasRole('admin')) && $perkembanganKth->status === 'waiting_kasi') {
      $perkembanganKth->update([
        'status' => 'waiting_cdk',
        'approved_by_kasi_at' => now(),
      ]);
      return redirect()->back()->with('success', 'Laporan disetujui dan diteruskan ke KaCDK.');
    }

    if (($user->hasRole('kacdk') || $user->hasRole('admin')) && $perkembanganKth->status === 'waiting_cdk') {
      $perkembanganKth->update([
        'status' => 'final',
        'approved_by_cdk_at' => now(),
      ]);
      return redirect()->back()->with('success', 'Laporan telah disetujui secara final.');
    }

    return redirect()->back()->with('error', 'Aksi tidak diijinkan.');
  }

  /**
   * Reject the report.
   */
  public function reject(Request $request, PerkembanganKth $perkembanganKth)
  {
    $request->validate([
      'rejection_note' => 'required|string|max:255',
    ]);

    $perkembanganKth->update([
      'status' => 'rejected',
      'rejection_note' => $request->rejection_note,
    ]);

    return redirect()->back()->with('success', 'Laporan telah ditolak dengan catatan.');
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
