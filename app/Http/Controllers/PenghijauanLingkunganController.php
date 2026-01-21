<?php

namespace App\Http\Controllers;

use App\Models\PenghijauanLingkungan;
use App\Models\SumberDana;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PenghijauanLingkunganController extends Controller
{
  public function __construct()
  {
    $this->middleware('permission:penghijauan.view')->only(['index', 'show']);
    $this->middleware('permission:penghijauan.create')->only(['create', 'store']);
    $this->middleware('permission:penghijauan.edit')->only(['edit', 'update', 'submit']);
    $this->middleware('permission:penghijauan.delete')->only(['destroy']);
    $this->middleware('permission:penghijauan.approve')->only(['verify', 'approve', 'reject']);
  }

  public function index(Request $request)
  {
    $selectedYear = $request->query('year', date('Y'));

    $datas = PenghijauanLingkungan::query()
      ->leftJoin('m_regencies', 'penghijauan_lingkungan.regency_id', '=', 'm_regencies.id')
      ->leftJoin('m_districts', 'penghijauan_lingkungan.district_id', '=', 'm_districts.id')
      ->leftJoin('m_villages', 'penghijauan_lingkungan.village_id', '=', 'm_villages.id')
      ->select(
        'penghijauan_lingkungan.*',
        'm_regencies.name as regency_name',
        'm_districts.name as district_name',
        'm_villages.name as village_name'
      )
      ->when($selectedYear, function ($query, $year) {
        return $query->where('penghijauan_lingkungan.year', $year);
      })
      ->when($request->search, function ($query, $search) {
        $query->where(function ($q) use ($search) {
          $q->where('m_villages.name', 'like', "%{$search}%")
            ->orWhere('m_districts.name', 'like', "%{$search}%")
            ->orWhere('m_regencies.name', 'like', "%{$search}%")
            ->orWhere('penghijauan_lingkungan.fund_source', 'like', "%{$search}%");
        });
      })
      ->with(['creator', 'regency_rel', 'district_rel', 'village_rel'])
      ->latest('penghijauan_lingkungan.created_at')
      ->paginate(10)
      ->withQueryString();

    $stats = [
      'total_target' => PenghijauanLingkungan::where('year', $selectedYear)->where('status', 'final')->sum('target_annual'),
      'total_realization' => PenghijauanLingkungan::where('year', $selectedYear)->where('status', 'final')->sum('realization'),
      'total_count' => PenghijauanLingkungan::where('year', $selectedYear)->where('status', 'final')->count(),
    ];

    $availableYears = PenghijauanLingkungan::distinct()->orderBy('year', 'desc')->pluck('year');
    if ($availableYears->isEmpty()) {
      $availableYears = [date('Y')];
    }

    return Inertia::render('PenghijauanLingkungan/Index', [
      'datas' => $datas,
      'stats' => $stats,
      'filters' => [
        'year' => (int) $selectedYear
      ],
      'availableYears' => $availableYears,
      'sumberDana' => SumberDana::all()
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
   * Submit the report for verification.
   */
  public function submit(PenghijauanLingkungan $penghijauanLingkungan)
  {
    $penghijauanLingkungan->update(['status' => 'waiting_kasi']);
    return redirect()->back()->with('success', 'Laporan berhasil diajukan untuk verifikasi Kasi.');
  }

  /**
   * Approve the report.
   */
  public function approve(PenghijauanLingkungan $penghijauanLingkungan)
  {
    $user = auth()->user();

    if (($user->hasRole('kasi') || $user->hasRole('admin')) && $penghijauanLingkungan->status === 'waiting_kasi') {
      $penghijauanLingkungan->update([
        'status' => 'waiting_cdk',
        'approved_by_kasi_at' => now(),
      ]);
      return redirect()->back()->with('success', 'Laporan disetujui dan diteruskan ke KaCDK.');
    }

    if (($user->hasRole('kacdk') || $user->hasRole('admin')) && $penghijauanLingkungan->status === 'waiting_cdk') {
      $penghijauanLingkungan->update([
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
  public function reject(Request $request, PenghijauanLingkungan $penghijauanLingkungan)
  {
    $request->validate([
      'rejection_note' => 'required|string|max:255',
    ]);

    $penghijauanLingkungan->update([
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
      $failures = $e->failures();
      return redirect()->back()->with('import_errors', $failures);
    }

    if ($import->failures()->isNotEmpty()) {
      return redirect()->back()->with('import_errors', $import->failures());
    }

    return redirect()->back()->with('success', 'Data berhasil diimport.');
  }
}
