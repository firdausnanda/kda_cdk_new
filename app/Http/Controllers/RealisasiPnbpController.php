<?php

namespace App\Http\Controllers;

use App\Models\RealisasiPnbp;
use App\Models\PengelolaWisata;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class RealisasiPnbpController extends Controller
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
    $selectedYear = $request->query('year');
    if (!$selectedYear) {
      $selectedYear = RealisasiPnbp::max('year') ?? date('Y');
    }

    $datas = RealisasiPnbp::query()
      ->leftJoin('m_regencies', 'realisasi_pnbp.regency_id', '=', 'm_regencies.id')
      ->leftJoin('m_pengelola_wisata', 'realisasi_pnbp.id_pengelola_wisata', '=', 'm_pengelola_wisata.id')
      ->select(
        'realisasi_pnbp.*',
        'm_regencies.name as regency_name',
        'm_pengelola_wisata.name as pengelola_name'
      )
      ->when($selectedYear, function ($query, $year) {
        return $query->where('realisasi_pnbp.year', $year);
      })
      ->when($request->search, function ($query, $search) {
        $query->where(function ($q) use ($search) {
          $q->where('types_of_forest_products', 'like', "%{$search}%")
            ->orWhere('m_regencies.name', 'like', "%{$search}%")
            ->orWhere('m_pengelola_wisata.name', 'like', "%{$search}%");
        });
      })
      ->when($request->has('sort') && $request->has('direction'), function ($query) use ($request) {
        $direction = $request->direction === 'desc' ? 'desc' : 'asc';
        $sort = $request->sort;

        switch ($sort) {
          case 'month':
            return $query->orderBy('realisasi_pnbp.month', $direction);
          case 'pengelola':
            return $query->orderBy('m_pengelola_wisata.name', $direction);
          case 'forest_product':
            return $query->orderBy('realisasi_pnbp.types_of_forest_products', $direction);
          case 'target':
            return $query->orderBy('realisasi_pnbp.pnbp_target', $direction);
          case 'realization':
            return $query->orderBy('realisasi_pnbp.pnbp_realization', $direction);
          case 'status':
            return $query->orderBy('realisasi_pnbp.status', $direction);
          default:
            return $query->orderBy('realisasi_pnbp.created_at', 'desc');
        }
      }, function ($query) {
        return $query->latest('realisasi_pnbp.created_at');
      })
      ->with(['creator', 'regency', 'pengelola_wisata'])
      ->paginate(10)
      ->withQueryString();

    // Stats
    $stats = [
      'total_count' => RealisasiPnbp::when($selectedYear, fn($q) => $q->where('year', $selectedYear))->count(),
      'verified_count' => RealisasiPnbp::where('status', 'final')
        ->when($selectedYear, fn($q) => $q->where('year', $selectedYear))
        ->count(),
    ];

    // Available Years
    $dbYears = RealisasiPnbp::distinct()
      ->orderBy('year', 'desc')
      ->pluck('year')
      ->toArray();
    $fixedYears = range(2025, 2021);
    $availableYears = array_values(array_unique(array_merge($dbYears, $fixedYears)));
    rsort($availableYears);

    return Inertia::render('RealisasiPnbp/Index', [
      'datas' => $datas,
      'stats' => $stats,
      'available_years' => $availableYears,
      'filters' => [
        'year' => $selectedYear,
        'sort' => $request->sort,
        'direction' => $request->direction,
      ],
    ]);
  }

  public function create()
  {
    return Inertia::render('RealisasiPnbp/Create', [
      'provinces' => DB::table('m_provinces')->where('id', '35')->get(),
      'regencies' => DB::table('m_regencies')->where('province_id', '35')->get(),
      'pengelola_wisata' => PengelolaWisata::all(),
    ]);
  }

  public function store(Request $request)
  {
    $validated = $request->validate([
      'year' => 'required|integer|digits:4',
      'month' => 'required|integer|min:1|max:12',
      'province_id' => 'required|exists:m_provinces,id',
      'regency_id' => 'required|exists:m_regencies,id',
      'id_pengelola_wisata' => 'required|exists:m_pengelola_wisata,id',
      'types_of_forest_products' => 'required|string',
      'pnbp_target' => 'required|string',
      'pnbp_realization' => 'required|string',
    ]);

    RealisasiPnbp::create($validated);

    return redirect()->route('realisasi-pnbp.index')
      ->with('success', 'Data berhasil ditambahkan');
  }

  public function edit(RealisasiPnbp $realisasiPnbp)
  {
    return Inertia::render('RealisasiPnbp/Edit', [
      'data' => $realisasiPnbp->load(['regency']),
      'provinces' => DB::table('m_provinces')->where('id', '35')->get(),
      'regencies' => DB::table('m_regencies')->where('province_id', '35')->get(),
      'pengelola_wisata' => PengelolaWisata::all(),
    ]);
  }

  public function update(Request $request, RealisasiPnbp $realisasiPnbp)
  {
    $validated = $request->validate([
      'year' => 'required|integer|digits:4',
      'month' => 'required|integer|min:1|max:12',
      'province_id' => 'required|exists:m_provinces,id',
      'regency_id' => 'required|exists:m_regencies,id',
      'id_pengelola_wisata' => 'required|exists:m_pengelola_wisata,id',
      'types_of_forest_products' => 'required|string',
      'pnbp_target' => 'required|string',
      'pnbp_realization' => 'required|string',
    ]);

    $realisasiPnbp->update($validated);

    return redirect()->route('realisasi-pnbp.index')
      ->with('success', 'Data berhasil diperbarui');
  }

  public function destroy(RealisasiPnbp $realisasiPnbp)
  {
    $realisasiPnbp->delete();

    return redirect()->route('realisasi-pnbp.index')
      ->with('success', 'Data berhasil dihapus');
  }

  public function submit(RealisasiPnbp $realisasiPnbp)
  {
    $realisasiPnbp->update(['status' => 'waiting_kasi']);
    return redirect()->back()->with('success', 'Laporan berhasil diajukan untuk verifikasi Kasi.');
  }

  public function approve(RealisasiPnbp $realisasiPnbp)
  {
    $user = auth()->user();

    if (($user->hasRole('kasi') || $user->hasRole('admin')) && $realisasiPnbp->status === 'waiting_kasi') {
      $realisasiPnbp->update([
        'status' => 'waiting_cdk',
        'approved_by_kasi_at' => now(),
      ]);
      return redirect()->back()->with('success', 'Laporan disetujui dan diteruskan ke KaCDK.');
    }

    if (($user->hasRole('kacdk') || $user->hasRole('admin')) && $realisasiPnbp->status === 'waiting_cdk') {
      $realisasiPnbp->update([
        'status' => 'final',
        'approved_by_cdk_at' => now(),
      ]);
      return redirect()->back()->with('success', 'Laporan telah disetujui secara final.');
    }

    return redirect()->back()->with('error', 'Aksi tidak diijinkan.');
  }

  public function reject(Request $request, RealisasiPnbp $realisasiPnbp)
  {
    $request->validate([
      'rejection_note' => 'required|string|max:255',
    ]);

    $realisasiPnbp->update([
      'status' => 'rejected',
      'rejection_note' => $request->rejection_note,
    ]);

    return redirect()->back()->with('success', 'Laporan telah ditolak dengan catatan.');
  }

  public function export(Request $request)
  {
    $year = $request->query('year');
    return \Maatwebsite\Excel\Facades\Excel::download(new \App\Exports\RealisasiPnbpExport($year), 'realisasi-pnbp-' . date('Y-m-d') . '.xlsx');
  }

  public function template()
  {
    return \Maatwebsite\Excel\Facades\Excel::download(new \App\Exports\RealisasiPnbpTemplateExport, 'template_import_realisasi_pnbp.xlsx');
  }

  public function import(Request $request)
  {
    $request->validate(['file' => 'required|mimes:xlsx,csv,xls']);

    $import = new \App\Imports\RealisasiPnbpImport();

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

  public function bulkDestroy(Request $request)
  {
    $request->validate([
      'ids' => 'required|array',
      'ids.*' => 'exists:realisasi_pnbp,id',
    ]);

    $user = auth()->user();
    $count = 0;

    if ($user->hasAnyRole(['kasi', 'kacdk'])) {
      return redirect()->back()->with('error', 'Aksi tidak diijinkan.');
    }

    if ($user->hasAnyRole(['pk', 'peh', 'pelaksana'])) {
      $count = RealisasiPnbp::whereIn('id', $request->ids)
        ->where('status', 'draft')
        ->delete();

      if ($count === 0) {
        return redirect()->back()->with('error', 'Hanya data dengan status draft yang dapat dihapus.');
      }

      return redirect()->back()->with('success', $count . ' data berhasil dihapus.');
    }

    if ($user->hasRole('admin')) {
      $count = RealisasiPnbp::whereIn('id', $request->ids)->delete();

      return redirect()->back()->with('success', $count . ' data berhasil dihapus.');
    }

    return redirect()->back()->with('success', count($request->ids) . ' data berhasil dihapus.');
  }

  public function bulkSubmit(Request $request)
  {
    $request->validate([
      'ids' => 'required|array',
      'ids.*' => 'exists:realisasi_pnbp,id',
    ]);

    // Only submit drafts or rejected items
    RealisasiPnbp::whereIn('id', $request->ids)
      ->whereIn('status', ['draft', 'rejected'])
      ->update(['status' => 'waiting_kasi']);

    return redirect()->back()->with('success', count($request->ids) . ' laporan berhasil diajukan.');
  }

  public function bulkApprove(Request $request)
  {
    $request->validate([
      'ids' => 'required|array',
      'ids.*' => 'exists:realisasi_pnbp,id',
    ]);

    $user = auth()->user();
    $ids = $request->ids;

    if ($user->hasRole('kasi') || $user->hasRole('admin')) {
      RealisasiPnbp::whereIn('id', $ids)
        ->where('status', 'waiting_kasi')
        ->update([
          'status' => 'waiting_cdk',
          'approved_by_kasi_at' => now(),
        ]);
    }

    if ($user->hasRole('kacdk') || $user->hasRole('admin')) {
      RealisasiPnbp::whereIn('id', $ids)
        ->where('status', 'waiting_cdk')
        ->update([
          'status' => 'final',
          'approved_by_cdk_at' => now(),
        ]);
    }

    return redirect()->back()->with('success', count($ids) . ' laporan berhasil disetujui.');
  }
}
