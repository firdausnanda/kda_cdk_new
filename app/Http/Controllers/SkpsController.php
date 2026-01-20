<?php

namespace App\Http\Controllers;

use App\Models\Skps;
use App\Models\SkemaPerhutananSosial;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Redirect;

class SkpsController extends Controller
{
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
      ->with(['creator', 'regency', 'district', 'skema'])
      ->latest('skps.created_at')
      ->paginate(10)
      ->withQueryString();

    $stats = [
      'total_count' => Skps::count(),
      'total_potential' => Skps::sum('potential'),
    ];

    return Inertia::render('Skps/Index', [
      'datas' => $datas,
      'stats' => $stats,
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
}
