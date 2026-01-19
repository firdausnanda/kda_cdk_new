<?php

namespace App\Http\Controllers;

use App\Models\ReboisasiPS;
use App\Models\SumberDana;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ReboisasiPsController extends Controller
{
  public function index(Request $request)
  {
    $selectedYear = $request->query('year', date('Y'));

    $datas = ReboisasiPS::query()
      ->leftJoin('m_regencies', 'reboisasi_ps.regency_id', '=', 'm_regencies.id')
      ->leftJoin('m_districts', 'reboisasi_ps.district_id', '=', 'm_districts.id')
      ->leftJoin('m_villages', 'reboisasi_ps.village_id', '=', 'm_villages.id')
      ->select(
        'reboisasi_ps.*',
        'm_regencies.name as regency_name',
        'm_districts.name as district_name',
        'm_villages.name as village_name'
      )
      ->when($selectedYear, function ($query, $year) {
        return $query->where('reboisasi_ps.year', $year);
      })
      ->with(['creator', 'regency_rel', 'district_rel', 'village_rel'])
      ->latest('reboisasi_ps.created_at')
      ->paginate(10)
      ->withQueryString();

    $stats = [
      'total_target' => ReboisasiPS::where('year', $selectedYear)->where('status', 'final')->sum('target_annual'),
      'total_realization' => ReboisasiPS::where('year', $selectedYear)->where('status', 'final')->sum('realization'),
      'total_count' => ReboisasiPS::where('year', $selectedYear)->where('status', 'final')->count(),
    ];

    $availableYears = ReboisasiPS::distinct()->orderBy('year', 'desc')->pluck('year');
    if ($availableYears->isEmpty()) {
      $availableYears = [date('Y')];
    }

    return Inertia::render('ReboisasiPs/Index', [
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
    return Inertia::render('ReboisasiPs/Create', [
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

    ReboisasiPS::create($validated);

    return redirect()->route('reboisasi-ps.index')->with('success', 'Data Created Successfully');
  }

  /**
   * Display the specified resource.
   */
  public function show(ReboisasiPS $reboisasiPs)
  {
    //
  }

  /**
   * Show the form for editing the specified resource.
   */
  public function edit(ReboisasiPS $reboisasiPs)
  {
    return Inertia::render('ReboisasiPs/Edit', [
      'data' => $reboisasiPs->load(['regency_rel', 'district_rel', 'village_rel']),
      'sumberDana' => SumberDana::all()
    ]);
  }

  /**
   * Update the specified resource in storage.
   */
  public function update(Request $request, ReboisasiPS $reboisasiPs)
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

    $reboisasiPs->update($validated);

    return redirect()->route('reboisasi-ps.index')->with('success', 'Data Updated Successfully');
  }

  /**
   * Remove the specified resource from storage.
   */
  public function destroy(ReboisasiPS $reboisasiPs)
  {
    $reboisasiPs->delete();

    return redirect()->route('reboisasi-ps.index')->with('success', 'Data Deleted Successfully');
  }

  /**
   * Submit the report for verification.
   */
  public function submit(ReboisasiPS $reboisasiPs)
  {
    $reboisasiPs->update(['status' => 'waiting_kasi']);
    return redirect()->back()->with('success', 'Laporan berhasil diajukan untuk verifikasi Kasi.');
  }

  /**
   * Approve the report.
   */
  public function approve(ReboisasiPS $reboisasiPs)
  {
    $user = auth()->user();

    if (($user->hasRole('kasi') || $user->hasRole('admin')) && $reboisasiPs->status === 'waiting_kasi') {
      $reboisasiPs->update([
        'status' => 'waiting_cdk',
        'approved_by_kasi_at' => now(),
      ]);
      return redirect()->back()->with('success', 'Laporan disetujui dan diteruskan ke KaCDK.');
    }

    if (($user->hasRole('kacdk') || $user->hasRole('admin')) && $reboisasiPs->status === 'waiting_cdk') {
      $reboisasiPs->update([
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
  public function reject(Request $request, ReboisasiPS $reboisasiPs)
  {
    $request->validate([
      'rejection_note' => 'required|string|max:255',
    ]);

    $reboisasiPs->update([
      'status' => 'rejected',
      'rejection_note' => $request->rejection_note,
    ]);

    return redirect()->back()->with('success', 'Laporan telah ditolak dengan catatan.');
  }
}
