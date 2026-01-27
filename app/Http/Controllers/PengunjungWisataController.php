<?php

namespace App\Http\Controllers;

use App\Models\PengunjungWisata;
use App\Models\PengelolaWisata;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PengunjungWisataController extends Controller
{
  use \App\Traits\HandlesImportFailures;
  public function __construct()
  {
    $this->middleware('permission:perlindungan.view')->only(['index', 'show']);
    $this->middleware('permission:perlindungan.create')->only(['create', 'store']);
    $this->middleware('permission:perlindungan.edit')->only(['edit', 'update', 'submit']);
    $this->middleware('permission:perlindungan.delete')->only(['destroy']);
  }

  public function index(Request $request)
  {
    $selectedYear = $request->query('year');
    if (!$selectedYear) {
      $selectedYear = PengunjungWisata::max('year') ?? date('Y');
    }

    $sortField = $request->query('sort', 'created_at');
    $sortDirection = $request->query('direction', 'desc');

    $datas = PengunjungWisata::query()
      ->with(['pengelolaWisata', 'creator'])
      ->when($selectedYear, function ($query, $year) {
        return $query->where('year', $year);
      })
      ->when($request->search, function ($query, $search) {
        $query->whereHas('pengelolaWisata', function ($q) use ($search) {
          $q->where('name', 'like', "%{$search}%");
        });
      })
      ->when($sortField, function ($query) use ($sortField, $sortDirection) {
        $sortMap = [
          'month' => 'month',
          'pengelola' => 'pengelolaWisata.name', // Relation sorting needs careful handling or join
          'visitors' => 'number_of_visitors',
          'income' => 'gross_income',
          'status' => 'status',
          'created_at' => 'created_at',
        ];

        if ($sortField === 'pengelola') {
          return $query->join('m_pengelola_wisata', 'pengunjung_wisata.id_pengelola_wisata', '=', 'm_pengelola_wisata.id')
            ->orderBy('m_pengelola_wisata.name', $sortDirection)
            ->select('pengunjung_wisata.*'); // Avoid column collision
        }

        $dbColumn = $sortMap[$sortField] ?? 'created_at';
        return $query->orderBy($dbColumn, $sortDirection);
      })
      ->paginate(10)
      ->withQueryString();

    $stats = [
      'total_visitors' => PengunjungWisata::where('year', $selectedYear)->where('status', 'final')->sum('number_of_visitors'),
      'total_income' => PengunjungWisata::where('year', $selectedYear)->where('status', 'final')->sum('gross_income'),
      'total_count' => PengunjungWisata::where('year', $selectedYear)->where('status', 'final')->count(),
    ];

    $dbYears = PengunjungWisata::distinct()->orderBy('year', 'desc')->pluck('year')->toArray();
    $fixedYears = range(2025, 2021);
    $availableYears = array_values(array_unique(array_merge($dbYears, $fixedYears)));
    rsort($availableYears);

    return Inertia::render('PengunjungWisata/Index', [
      'datas' => $datas,
      'stats' => $stats,
      'filters' => [
        'year' => (int) $selectedYear,
        'search' => $request->search,
        'sort' => $sortField,
        'direction' => $sortDirection
      ],
      'availableYears' => $availableYears,
    ]);
  }

  public function create()
  {
    return Inertia::render('PengunjungWisata/Create', [
      'pengelolaWisata' => PengelolaWisata::all()
    ]);
  }

  public function store(Request $request)
  {
    $validated = $request->validate([
      'year' => 'required|integer',
      'month' => 'required|integer|min:1|max:12',
      'id_pengelola_wisata' => 'required|exists:m_pengelola_wisata,id',
      'number_of_visitors' => 'required|numeric',
      'gross_income' => 'required|numeric',
    ]);

    PengunjungWisata::create($validated);

    return redirect()->route('pengunjung-wisata.index')->with('success', 'Data Created Successfully');
  }

  public function edit(PengunjungWisata $pengunjungWisata)
  {
    return Inertia::render('PengunjungWisata/Edit', [
      'data' => $pengunjungWisata->load('pengelolaWisata'),
      'pengelolaWisata' => PengelolaWisata::all()
    ]);
  }

  public function update(Request $request, PengunjungWisata $pengunjungWisata)
  {
    $validated = $request->validate([
      'year' => 'required|integer',
      'month' => 'required|integer|min:1|max:12',
      'id_pengelola_wisata' => 'required|exists:m_pengelola_wisata,id',
      'number_of_visitors' => 'required|numeric',
      'gross_income' => 'required|numeric',
    ]);

    $pengunjungWisata->update($validated);

    return redirect()->route('pengunjung-wisata.index')->with('success', 'Data Updated Successfully');
  }

  public function destroy(PengunjungWisata $pengunjungWisata)
  {
    $pengunjungWisata->delete();

    return redirect()->route('pengunjung-wisata.index')->with('success', 'Data Deleted Successfully');
  }

  public function submit(PengunjungWisata $pengunjungWisata)
  {
    $pengunjungWisata->update(['status' => 'waiting_kasi']);
    return redirect()->back()->with('success', 'Laporan berhasil diajukan untuk verifikasi Kasi.');
  }

  public function approve(PengunjungWisata $pengunjungWisata)
  {
    $user = auth()->user();

    if (($user->hasRole('kasi') || $user->hasRole('admin')) && $pengunjungWisata->status === 'waiting_kasi') {
      $pengunjungWisata->update([
        'status' => 'waiting_cdk',
        'approved_by_kasi_at' => now(),
      ]);
      return redirect()->back()->with('success', 'Laporan disetujui dan diteruskan ke KaCDK.');
    }

    if (($user->hasRole('kacdk') || $user->hasRole('admin')) && $pengunjungWisata->status === 'waiting_cdk') {
      $pengunjungWisata->update([
        'status' => 'final',
        'approved_by_cdk_at' => now(),
      ]);
      return redirect()->back()->with('success', 'Laporan telah disetujui secara final.');
    }

    return redirect()->back()->with('error', 'Aksi tidak diijinkan.');
  }

  public function reject(Request $request, PengunjungWisata $pengunjungWisata)
  {
    $request->validate([
      'rejection_note' => 'required|string|max:255',
    ]);

    $pengunjungWisata->update([
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
    return \Maatwebsite\Excel\Facades\Excel::download(new \App\Exports\PengunjungWisataExport($year), 'pengunjung-wisata-' . date('Y-m-d') . '.xlsx');
  }

  /**
   * Download import template.
   */
  public function template()
  {
    return \Maatwebsite\Excel\Facades\Excel::download(new \App\Exports\PengunjungWisataTemplateExport, 'template_import_pengunjung_wisata.xlsx');
  }

  /**
   * Import data from Excel.
   */
  public function import(Request $request)
  {
    $request->validate([
      'file' => 'required|mimes:xlsx,csv,xls',
    ]);

    $import = new \App\Imports\PengunjungWisataImport();

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
  public function bulkDestroy(Request $request)
  {
    $request->validate([
      'ids' => 'required|array',
      'ids.*' => 'exists:pengunjung_wisata,id', // Adjusted table name if needed, assuming standard naming
    ]);

    PengunjungWisata::whereIn('id', $request->ids)->delete();

    return redirect()->back()->with('success', count($request->ids) . ' data berhasil dihapus.');
  }

  /**
   * Bulk submit records.
   */
  public function bulkSubmit(Request $request)
  {
    $request->validate([
      'ids' => 'required|array',
      'ids.*' => 'exists:pengunjung_wisata,id',
    ]);

    $count = PengunjungWisata::whereIn('id', $request->ids)
      ->whereIn('status', ['draft', 'rejected'])
      ->update(['status' => 'waiting_kasi']);

    return redirect()->back()->with('success', $count . ' laporan berhasil diajukan.');
  }

  /**
   * Bulk approve records.
   */
  public function bulkApprove(Request $request)
  {
    $request->validate([
      'ids' => 'required|array',
      'ids.*' => 'exists:pengunjung_wisata,id',
    ]);

    $user = auth()->user();
    $count = 0;

    if ($user->hasRole('kasi') || $user->hasRole('admin')) {
      $count = PengunjungWisata::whereIn('id', $request->ids)
        ->where('status', 'waiting_kasi')
        ->update([
          'status' => 'waiting_cdk',
          'approved_by_kasi_at' => now(),
        ]);
    } elseif ($user->hasRole('kacdk') || $user->hasRole('admin')) {
      $count = PengunjungWisata::whereIn('id', $request->ids)
        ->where('status', 'waiting_cdk')
        ->update([
          'status' => 'final',
          'approved_by_cdk_at' => now(),
        ]);
    }

    return redirect()->back()->with('success', $count . ' laporan berhasil disetujui.');
  }
}
