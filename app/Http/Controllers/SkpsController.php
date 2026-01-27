<?php

namespace App\Http\Controllers;

use App\Models\Skps;
use App\Models\SkemaPerhutananSosial;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Redirect;

class SkpsController extends Controller
{
  use \App\Traits\HandlesImportFailures;
  /**
   * Display a listing of the resource.
   */
  public function __construct()
  {
    $this->middleware('permission:pemberdayaan.view')->only(['index', 'show']);
    $this->middleware('permission:pemberdayaan.create')->only(['create', 'store']);
    $this->middleware('permission:pemberdayaan.edit')->only(['edit', 'update', 'submit']);
    $this->middleware('permission:pemberdayaan.delete')->only(['destroy']);
  }

  public function index(Request $request)
  {
    $datas = Skps::query()
      ->leftJoin('m_regencies', 'skps.regency_id', '=', 'm_regencies.id')
      ->leftJoin('m_districts', 'skps.district_id', '=', 'm_districts.id')
      ->leftJoin('m_skema_perhutanan_sosial', 'skps.id_skema_perhutanan_sosial', '=', 'm_skema_perhutanan_sosial.id')
      ->select(
        'skps.*',
        'm_regencies.name as regency_name',
        'm_districts.name as district_name',
        'm_skema_perhutanan_sosial.name as skema_name'
      )
      ->when($request->search, function ($query, $search) {
        $query->where(function ($q) use ($search) {
          $q->where('m_regencies.name', 'like', "%{$search}%")
            ->orWhere('m_districts.name', 'like', "%{$search}%")
            ->orWhere('m_skema_perhutanan_sosial.name', 'like', "%{$search}%");
        });
      })
      ->when($request->has('sort') && $request->has('direction'), function ($query) use ($request) {
        $direction = $request->direction === 'desc' ? 'desc' : 'asc';
        $sort = $request->sort;

        switch ($sort) {
          case 'location':
            return $query->orderBy('m_districts.name', $direction);
          case 'group_name':
            return $query->orderBy('skps.nama_kelompok', $direction);
          case 'skema':
            return $query->orderBy('m_skema_perhutanan_sosial.name', $direction);
          case 'area':
            return $query->orderBy('skps.ps_area', $direction);
          case 'potential':
            return $query->orderBy('skps.potential', $direction);
          case 'kk_count':
            return $query->orderBy('skps.number_of_kk', $direction);
          case 'status':
            return $query->orderBy('skps.status', $direction);
          default:
            return $query->orderBy('skps.created_at', 'desc');
        }
      }, function ($query) {
        return $query->latest('skps.created_at');
      })
      ->with(['creator', 'regency', 'district', 'skema'])
      ->paginate(10)
      ->withQueryString();

    $stats = SkemaPerhutananSosial::leftJoin('skps', function ($join) {
      $join->on('m_skema_perhutanan_sosial.id', '=', 'skps.id_skema_perhutanan_sosial')
        ->where('skps.status', 'final');
    })
      ->selectRaw('m_skema_perhutanan_sosial.name, count(skps.id) as total')
      ->groupBy('m_skema_perhutanan_sosial.id', 'm_skema_perhutanan_sosial.name')
      ->get();

    return Inertia::render('Skps/Index', [
      'datas' => $datas,
      'stats' => $stats,
      'filters' => [
        'search' => $request->search,
        'sort' => $request->sort,
        'direction' => $request->direction,
      ],
    ]);
  }

  /**
   * Show the form for creating a new resource.
   */
  public function create()
  {
    return Inertia::render('Skps/Create', [
      'skemas' => SkemaPerhutananSosial::all(),
    ]);
  }

  /**
   * Store a newly created resource in storage.
   */
  public function store(Request $request)
  {
    $validated = $request->validate([
      'province_id' => 'required|exists:m_provinces,id',
      'regency_id' => 'required|exists:m_regencies,id',
      'district_id' => 'required|exists:m_districts,id',
      'id_skema_perhutanan_sosial' => 'required|exists:m_skema_perhutanan_sosial,id',
      'nama_kelompok' => 'required|string',
      'potential' => 'required|string',
      'ps_area' => 'required|string',
      'number_of_kk' => 'required|string',
    ]);

    Skps::create($validated);

    return Redirect::route('skps.index')->with('success', 'Data Perkembangan SK PS berhasil ditambahkan.');
  }

  /**
   * Show the form for editing the specified resource.
   */
  public function edit(Skps $skp)
  {
    return Inertia::render('Skps/Edit', [
      'data' => $skp->load(['regency', 'district', 'skema']),
      'skemas' => SkemaPerhutananSosial::all(),
    ]);
  }

  /**
   * Update the specified resource in storage.
   */
  public function update(Request $request, Skps $skp)
  {
    $validated = $request->validate([
      'province_id' => 'required|exists:m_provinces,id',
      'regency_id' => 'required|exists:m_regencies,id',
      'district_id' => 'required|exists:m_districts,id',
      'id_skema_perhutanan_sosial' => 'required|exists:m_skema_perhutanan_sosial,id',
      'nama_kelompok' => 'required|string',
      'potential' => 'required|string',
      'ps_area' => 'required|string',
      'number_of_kk' => 'required|string',
    ]);

    $skp->update($validated);

    return Redirect::route('skps.index')->with('success', 'Data Perkembangan SK PS berhasil diperbarui.');
  }

  /**
   * Remove the specified resource from storage.
   */
  public function destroy(Skps $skp)
  {
    $skp->delete();

    return Redirect::route('skps.index')->with('success', 'Data berhasil dihapus.');
  }

  public function submit(Skps $skp)
  {
    $skp->update(['status' => 'waiting_kasi']);
    return Redirect::back()->with('success', 'Laporan berhasil diajukan untuk verifikasi Kasi.');
  }

  public function approve(Skps $skp)
  {
    $user = auth()->user();

    if (($user->hasRole('kasi') || $user->hasRole('admin')) && $skp->status === 'waiting_kasi') {
      $skp->update([
        'status' => 'waiting_cdk',
        'approved_by_kasi_at' => now(),
      ]);
      return Redirect::back()->with('success', 'Laporan disetujui dan diteruskan ke KaCDK.');
    }

    if (($user->hasRole('kacdk') || $user->hasRole('admin')) && $skp->status === 'waiting_cdk') {
      $skp->update([
        'status' => 'final',
        'approved_by_cdk_at' => now(),
      ]);
      return Redirect::back()->with('success', 'Laporan telah disetujui secara final.');
    }

    return Redirect::back()->with('error', 'Aksi tidak diijinkan.');
  }

  public function reject(Request $request, Skps $skp)
  {
    $request->validate([
      'rejection_note' => 'required|string|max:255',
    ]);

    $skp->update([
      'status' => 'rejected',
      'rejection_note' => $request->rejection_note,
    ]);

    return Redirect::back()->with('success', 'Laporan telah ditolak dengan catatan.');
  }

  public function export()
  {
    return \Maatwebsite\Excel\Facades\Excel::download(new \App\Exports\SkpsExport, 'perkembangan-skps-' . date('Y-m-d') . '.xlsx');
  }

  public function template()
  {
    return \Maatwebsite\Excel\Facades\Excel::download(new \App\Exports\SkpsTemplateExport, 'template_import_skps.xlsx');
  }

  public function import(Request $request)
  {
    $request->validate(['file' => 'required|mimes:xlsx,csv,xls']);

    $import = new \App\Imports\SkpsImport();

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
      'ids.*' => 'exists:skps,id',
    ]);

    Skps::whereIn('id', $request->ids)->delete();

    return redirect()->back()->with('success', count($request->ids) . ' data berhasil dihapus.');
  }

  public function bulkSubmit(Request $request)
  {
    $request->validate([
      'ids' => 'required|array',
      'ids.*' => 'exists:skps,id',
    ]);

    // Only submit drafts or rejected items
    Skps::whereIn('id', $request->ids)
      ->whereIn('status', ['draft', 'rejected'])
      ->update(['status' => 'waiting_kasi']);

    return redirect()->back()->with('success', count($request->ids) . ' laporan berhasil diajukan.');
  }

  public function bulkApprove(Request $request)
  {
    $request->validate([
      'ids' => 'required|array',
      'ids.*' => 'exists:skps,id',
    ]);

    $user = auth()->user();
    $ids = $request->ids;

    if ($user->hasRole('kasi') || $user->hasRole('admin')) {
      Skps::whereIn('id', $ids)
        ->where('status', 'waiting_kasi')
        ->update([
          'status' => 'waiting_cdk',
          'approved_by_kasi_at' => now(),
        ]);
    }

    if ($user->hasRole('kacdk') || $user->hasRole('admin')) {
      Skps::whereIn('id', $ids)
        ->where('status', 'waiting_cdk')
        ->update([
          'status' => 'final',
          'approved_by_cdk_at' => now(),
        ]);
    }

    return redirect()->back()->with('success', count($ids) . ' laporan berhasil disetujui.');
  }
}
