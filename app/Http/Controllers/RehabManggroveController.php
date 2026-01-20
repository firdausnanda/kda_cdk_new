<?php

namespace App\Http\Controllers;

use App\Models\RehabManggrove;
use App\Models\SumberDana;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RehabManggroveController extends Controller
{
  public function __construct()
  {
    $this->middleware('permission:rehab.view')->only(['index', 'show']);
    $this->middleware('permission:rehab.create')->only(['create', 'store']);
    $this->middleware('permission:rehab.edit')->only(['edit', 'update', 'submit']);
    $this->middleware('permission:rehab.delete')->only(['destroy']);
    $this->middleware('permission:rehab.approve')->only(['verify', 'approve', 'reject']);
  }

  public function index(Request $request)
  {
    $selectedYear = $request->query('year', date('Y'));

    $datas = RehabManggrove::query()
      ->leftJoin('m_regencies', 'rehab_manggrove.regency_id', '=', 'm_regencies.id')
      ->leftJoin('m_districts', 'rehab_manggrove.district_id', '=', 'm_districts.id')
      ->leftJoin('m_villages', 'rehab_manggrove.village_id', '=', 'm_villages.id')
      ->select(
        'rehab_manggrove.*',
        'm_regencies.name as regency_name',
        'm_districts.name as district_name',
        'm_villages.name as village_name'
      )
      ->when($selectedYear, function ($query, $year) {
        return $query->where('rehab_manggrove.year', $year);
      })
      ->with(['creator', 'regency_rel', 'district_rel', 'village_rel'])
      ->latest('rehab_manggrove.created_at')
      ->paginate(10)
      ->withQueryString();

    $stats = [
      'total_target' => RehabManggrove::where('year', $selectedYear)->where('status', 'final')->sum('target_annual'),
      'total_realization' => RehabManggrove::where('year', $selectedYear)->where('status', 'final')->sum('realization'),
      'total_count' => RehabManggrove::where('year', $selectedYear)->where('status', 'final')->count(),
    ];

    $availableYears = RehabManggrove::distinct()->orderBy('year', 'desc')->pluck('year');
    if ($availableYears->isEmpty()) {
      $availableYears = [date('Y')];
    }

    return Inertia::render('RehabManggrove/Index', [
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
    return Inertia::render('RehabManggrove/Create', [
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
      'coordinates' => 'nullable|string',
    ]);

    RehabManggrove::create($validated);

    return redirect()->route('rehab-manggrove.index')->with('success', 'Data Created Successfully');
  }

  /**
   * Show the form for editing the specified resource.
   */
  public function edit(RehabManggrove $rehabManggrove)
  {
    return Inertia::render('RehabManggrove/Edit', [
      'data' => $rehabManggrove->load(['regency_rel', 'district_rel', 'village_rel']),
      'sumberDana' => SumberDana::all()
    ]);
  }

  /**
   * Update the specified resource in storage.
   */
  public function update(Request $request, RehabManggrove $rehabManggrove)
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
      'coordinates' => 'nullable|string',
    ]);

    $rehabManggrove->update($validated);

    return redirect()->route('rehab-manggrove.index')->with('success', 'Data Updated Successfully');
  }

  /**
   * Remove the specified resource from storage.
   */
  public function destroy(RehabManggrove $rehabManggrove)
  {
    $rehabManggrove->delete();

    return redirect()->route('rehab-manggrove.index')->with('success', 'Data Deleted Successfully');
  }

  /**
   * Submit the report for verification.
   */
  public function submit(RehabManggrove $rehabManggrove)
  {
    $rehabManggrove->update(['status' => 'waiting_kasi']);
    return redirect()->back()->with('success', 'Laporan berhasil diajukan untuk verifikasi Kasi.');
  }

  /**
   * Approve the report.
   */
  public function approve(RehabManggrove $rehabManggrove)
  {
    $user = auth()->user();

    if (($user->hasRole('kasi') || $user->hasRole('admin')) && $rehabManggrove->status === 'waiting_kasi') {
      $rehabManggrove->update([
        'status' => 'waiting_cdk',
        'approved_by_kasi_at' => now(),
      ]);
      return redirect()->back()->with('success', 'Laporan disetujui dan diteruskan ke KaCDK.');
    }

    if (($user->hasRole('kacdk') || $user->hasRole('admin')) && $rehabManggrove->status === 'waiting_cdk') {
      $rehabManggrove->update([
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
  public function reject(Request $request, RehabManggrove $rehabManggrove)
  {
    $request->validate([
      'rejection_note' => 'required|string|max:255',
    ]);

    $rehabManggrove->update([
      'status' => 'rejected',
      'rejection_note' => $request->rejection_note,
    ]);

    return redirect()->back()->with('success', 'Laporan telah ditolak dengan catatan.');
  }
}
