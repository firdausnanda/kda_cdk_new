<?php

namespace App\Http\Controllers;

use App\Models\Pbphh;
use App\Models\JenisProduksi;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

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
    $datas = Pbphh::query()
      ->leftJoin('m_regencies', 'pbphh.regency_id', '=', 'm_regencies.id')
      ->leftJoin('m_districts', 'pbphh.district_id', '=', 'm_districts.id')
      ->leftJoin('m_jenis_produksi', 'pbphh.id_jenis_produksi', '=', 'm_jenis_produksi.id')
      ->select(
        'pbphh.*',
        'm_regencies.name as regency_name',
        'm_districts.name as district_name',
        'm_jenis_produksi.name as jenis_produksi_name'
      )
      ->when($request->search, function ($query, $search) {
        $query->where(function ($q) use ($search) {
          $q->where('pbphh.name', 'like', "%{$search}%")
            ->orWhere('pbphh.number', 'like', "%{$search}%")
            ->orWhere('m_jenis_produksi.name', 'like', "%{$search}%")
            ->orWhere('m_regencies.name', 'like', "%{$search}%")
            ->orWhere('m_districts.name', 'like', "%{$search}%");
        });
      })
      ->with(['creator', 'regency', 'district', 'jenis_produksi'])
      ->latest('pbphh.created_at')
      ->paginate(10)
      ->withQueryString();

    // Stats
    $stats = [
      'total_count' => Pbphh::count(),
      'verified_count' => Pbphh::where('status', 'final')->count(),
    ];

    return Inertia::render('Pbphh/Index', [
      'datas' => $datas,
      'stats' => $stats,
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
      'id_jenis_produksi' => 'required|exists:m_jenis_produksi,id',
    ]);

    Pbphh::create($validated);

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
      'id_jenis_produksi' => 'required|exists:m_jenis_produksi,id',
    ]);

    $pbphh->update($validated);

    return redirect()->route('pbphh.index')
      ->with('success', 'Data berhasil diperbarui');
  }

  public function destroy(Pbphh $pbphh)
  {
    $pbphh->delete();

    return redirect()->route('pbphh.index')
      ->with('success', 'Data berhasil dihapus');
  }

  public function submit(Pbphh $pbphh)
  {
    $pbphh->update(['status' => 'waiting_kasi']);
    return redirect()->back()->with('success', 'Laporan berhasil diajukan untuk verifikasi Kasi.');
  }

  public function approve(Pbphh $pbphh)
  {
    $user = auth()->user();

    if (($user->hasRole('kasi') || $user->hasRole('admin')) && $pbphh->status === 'waiting_kasi') {
      $pbphh->update([
        'status' => 'waiting_cdk',
        'approved_by_kasi_at' => now(),
      ]);
      return redirect()->back()->with('success', 'Laporan disetujui dan diteruskan ke KaCDK.');
    }

    if (($user->hasRole('kacdk') || $user->hasRole('admin')) && $pbphh->status === 'waiting_cdk') {
      $pbphh->update([
        'status' => 'final',
        'approved_by_cdk_at' => now(),
      ]);
      return redirect()->back()->with('success', 'Laporan telah disetujui secara final.');
    }

    return redirect()->back()->with('error', 'Aksi tidak diijinkan.');
  }

  public function reject(Request $request, Pbphh $pbphh)
  {
    $request->validate([
      'rejection_note' => 'required|string|max:255',
    ]);

    $pbphh->update([
      'status' => 'rejected',
      'rejection_note' => $request->rejection_note,
    ]);

    return redirect()->back()->with('success', 'Laporan telah ditolak dengan catatan.');
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
}
