<?php

namespace App\Http\Controllers;

use App\Models\Kups;
use App\Models\Provinces;
use App\Models\Regencies;
use App\Models\Districts;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class KupsController extends Controller
{
  use \App\Traits\HandlesImportFailures;
  public function __construct()
  {
    $this->middleware('permission:pemberdayaan.view')->only(['index', 'show']);
    $this->middleware('permission:pemberdayaan.create')->only(['create', 'store']);
    $this->middleware('permission:pemberdayaan.edit')->only(['edit', 'update', 'submit']);
    $this->middleware('permission:pemberdayaan.delete')->only(['destroy']);
  }

  public function index(Request $request)
  {
    $query = Kups::query()
      ->select('kups.*')
      ->with(['province', 'regency', 'district'])
      ->leftJoin('m_districts', 'kups.district_id', '=', 'm_districts.id');

    // Filter by Year (if applicable, though KUPS table doesn't have year column strictly, sticking to standard filters if needed or just basic)
    // Ignoring year filter for now as schema doesn't have it, but standard filters might be requested separately.

    if ($request->has('search')) {
      $search = $request->search;
      $query->where(function ($q) use ($search) {
        $q->where('kups.commodity', 'like', "%{$search}%")
          ->orWhere('kups.category', 'like', "%{$search}%")
          ->orWhere('kups.nama_kups', 'like', "%{$search}%")
          ->orWhereHas('regency', function ($q2) use ($search) {
            $q2->where('name', 'like', "%{$search}%");
          })
          ->orWhereHas('district', function ($q2) use ($search) {
            $q2->where('name', 'like', "%{$search}%");
          });
      });
    }

    if ($request->has('sort') && $request->has('direction')) {
      $sort = $request->sort;
      $direction = $request->direction;

      if ($sort === 'location') {
        $query->orderBy('m_districts.name', $direction);
      } elseif ($sort === 'nama_kups') {
        $query->orderBy('kups.nama_kups', $direction);
      } elseif ($sort === 'category') {
        $query->orderBy('kups.category', $direction);
      } elseif ($sort === 'commodity') {
        $query->orderBy('kups.commodity', $direction);
      } elseif ($sort === 'status') {
        $query->orderBy('kups.status', $direction);
      } else {
        $query->orderBy('kups.' . $sort, $direction);
      }
    } else {
      $query->latest('kups.created_at');
    }

    $kups = $query->paginate(10)->withQueryString();

    // Calculate Stats
    $stats = [
      'total_categories' => Kups::distinct('category')->count('category'),
      'total_commodities' => Kups::distinct('commodity')->count('commodity'),
      'total_count' => Kups::count(),
    ];

    return Inertia::render('Kups/Index', [
      'kups' => $kups,
      'stats' => $stats,
      'filters' => $request->only(['search', 'sort', 'direction']),
    ]);
  }

  public function create()
  {
    return Inertia::render('Kups/Create');
  }

  public function store(Request $request)
  {
    $validated = $request->validate([
      'province_id' => 'required|exists:m_provinces,id',
      'regency_id' => 'required|exists:m_regencies,id',
      'district_id' => 'required|exists:m_districts,id',
      'nama_kups' => 'required|string',
      'category' => 'required|string',
      'commodity' => 'required|string',
    ]);

    $validated['status'] = 'draft';
    $validated['created_by'] = Auth::id();

    Kups::create($validated);

    return redirect()->route('kups.index')->with('success', 'Data KUPS berhasil disimpan.');
  }

  public function edit(Kups $kup)
  {
    return Inertia::render('Kups/Edit', [
      'kups' => $kup,
      'regency' => Regencies::find($kup->regency_id),
      'district' => Districts::find($kup->district_id),
    ]);
  }

  public function update(Request $request, Kups $kup)
  {
    $validated = $request->validate([
      'province_id' => 'required|exists:m_provinces,id',
      'regency_id' => 'required|exists:m_regencies,id',
      'district_id' => 'required|exists:m_districts,id',
      'nama_kups' => 'required|string',
      'category' => 'required|string',
      'commodity' => 'required|string',
    ]);

    $validated['updated_by'] = Auth::id();

    $kup->update($validated);

    return redirect()->route('kups.index')->with('success', 'Data KUPS berhasil diperbarui.');
  }

  public function destroy(Kups $kup)
  {
    $kup->deleted_by = Auth::id();
    $kup->save();
    $kup->delete();

    return redirect()->route('kups.index')->with('success', 'Data KUPS berhasil dihapus.');
  }

  public function bulkDestroy(Request $request)
  {
    $ids = $request->ids;
    if (empty($ids)) {
      return back()->with('error', 'Tidak ada data yang dipilih.');
    }

    $count = Kups::whereIn('id', $ids)->delete();
    return back()->with('success', "$count data berhasil dihapus.");
  }

  public function submit($id)
  {
    $kup = Kups::findOrFail($id);
    if ($kup->status === 'draft' || $kup->status === 'rejected') {
      $kup->update(['status' => 'waiting_kasi']);
      return back()->with('success', 'Laporan berhasil disubmit ke Kasi.');
    }
    return back()->with('error', 'Status laporan tidak valid untuk submit.');
  }

  public function bulkSubmit(Request $request)
  {
    $ids = $request->ids;
    if (empty($ids)) {
      return back()->with('error', 'Tidak ada data yang dipilih.');
    }

    $count = Kups::whereIn('id', $ids)
      ->whereIn('status', ['draft', 'rejected'])
      ->update(['status' => 'waiting_kasi']);

    return back()->with('success', "$count data berhasil disubmit ke Kasi.");
  }

  public function approve($id)
  {
    $kup = Kups::findOrFail($id);
    $user = Auth::user();

    if ($user->hasRole('kasi') && $kup->status === 'waiting_kasi') {
      $kup->update([
        'status' => 'waiting_cdk',
        'approved_by_kasi_at' => now(),
      ]);
      return back()->with('success', 'Laporan disetujui oleh Kasi.');
    }

    if (($user->hasRole('cdk') || $user->hasRole('admin')) && $kup->status === 'waiting_cdk') {
      $kup->update([
        'status' => 'final',
        'approved_by_cdk_at' => now(),
      ]);
      return back()->with('success', 'Laporan disetujui oleh Kepala CDK.');
    }

    return back()->with('error', 'Anda tidak memiliki akses untuk menyetujui laporan ini.');
  }

  public function bulkApprove(Request $request)
  {
    $ids = $request->ids;
    if (empty($ids)) {
      return back()->with('error', 'Tidak ada data yang dipilih.');
    }

    $user = Auth::user();
    $updatedCount = 0;

    if ($user->hasRole('kasi')) {
      $updatedCount = Kups::whereIn('id', $ids)
        ->where('status', 'waiting_kasi')
        ->update([
          'status' => 'waiting_cdk',
          'approved_by_kasi_at' => now(),
        ]);
    } elseif ($user->hasRole('cdk') || $user->hasRole('admin')) { // Admin can finalize waiting_cdk items too? Assuming logic similar to approve
      // Note: In approve(), admin works on waiting_cdk to final.
      // Admin usually can approve anything or step in.
      // Based on approve() logic:
      // if waiting_cdk -> final (Admin/CDK)

      $updatedCount = Kups::whereIn('id', $ids)
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

  public function reject(Request $request, $id)
  {
    $request->validate(['rejection_note' => 'required|string']);
    $kup = Kups::findOrFail($id);
    $kup->update([
      'status' => 'rejected',
      'rejection_note' => $request->rejection_note
    ]);

    return back()->with('success', 'Laporan ditolak.');
  }

  public function export()
  {
    return \Maatwebsite\Excel\Facades\Excel::download(new \App\Exports\KupsExport, 'perkembangan-kups-' . date('Y-m-d') . '.xlsx');
  }

  public function template()
  {
    return \Maatwebsite\Excel\Facades\Excel::download(new \App\Exports\KupsTemplateExport, 'template_import_kups.xlsx');
  }

  public function import(Request $request)
  {
    $request->validate(['file' => 'required|mimes:xlsx,csv,xls']);

    $import = new \App\Imports\KupsImport();

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
