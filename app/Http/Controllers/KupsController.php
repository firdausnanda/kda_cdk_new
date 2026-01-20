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
  public function __construct()
  {
    $this->middleware('permission:pemberdayaan.view')->only(['index', 'show']);
    $this->middleware('permission:pemberdayaan.create')->only(['create', 'store']);
    $this->middleware('permission:pemberdayaan.edit')->only(['edit', 'update', 'submit']);
    $this->middleware('permission:pemberdayaan.delete')->only(['destroy']);
  }

  public function index(Request $request)
  {
    $query = Kups::with(['province', 'regency', 'district']);

    // Filter by Year (if applicable, though KUPS table doesn't have year column strictly, sticking to standard filters if needed or just basic)
    // Ignoring year filter for now as schema doesn't have it, but standard filters might be requested separately.

    if ($request->has('search')) {
      $search = $request->search;
      $query->where(function ($q) use ($search) {
        $q->where('commodity', 'like', "%{$search}%")
          ->orWhere('category', 'like', "%{$search}%");
      });
    }

    $kups = $query->latest()->paginate(10)->appends($request->all());

    // Calculate Stats
    $stats = [
      'total_kups' => Kups::get()->sum(function ($row) {
        return (int) $row->number_of_kups;
      }),
      'total_categories' => Kups::distinct('category')->count('category'),
      'total_commodities' => Kups::distinct('commodity')->count('commodity'),
      'total_count' => Kups::count(),
    ];

    return Inertia::render('Kups/Index', [
      'kups' => $kups,
      'stats' => $stats,
      'filters' => $request->only(['search']),
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
      'category' => 'required|string',
      'number_of_kups' => 'required|string',
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
      'category' => 'required|string',
      'number_of_kups' => 'required|string',
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

  public function submit($id)
  {
    $kup = Kups::findOrFail($id);
    if ($kup->status === 'draft' || $kup->status === 'rejected') {
      $kup->update(['status' => 'waiting_kasi']);
      return back()->with('success', 'Laporan berhasil disubmit ke Kasi.');
    }
    return back()->with('error', 'Status laporan tidak valid untuk submit.');
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
        'status' => 'finalized',
        'approved_by_cdk_at' => now(),
      ]);
      return back()->with('success', 'Laporan disetujui oleh Kepala CDK.');
    }

    return back()->with('error', 'Anda tidak memiliki akses untuk menyetujui laporan ini.');
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
}
