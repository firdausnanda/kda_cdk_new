<?php

namespace App\Http\Controllers;

use App\Models\BangunanKta;
use App\Models\RhlTeknis;
use App\Models\RhlTeknisDetail;
use App\Models\SumberDana;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class RhlTeknisController extends Controller
{
  public function index(Request $request)
  {
    $selectedYear = $request->query('year', date('Y'));

    $datas = RhlTeknis::query()
      ->when($selectedYear, function ($query, $year) {
        return $query->where('year', $year);
      })
      ->with(['creator', 'details.bangunan_kta'])
      ->latest()
      ->paginate(10)
      ->withQueryString();

    $stats = [
      'total_target' => RhlTeknis::where('year', $selectedYear)->where('status', 'final')->sum('target_annual'),
      'total_units' => RhlTeknis::where('year', $selectedYear)
        ->where('status', 'final')
        ->whereHas('details')
        ->withSum('details', 'unit_amount')
        ->get()
        ->sum('details_sum_unit_amount'),
      'total_count' => RhlTeknis::where('year', $selectedYear)->where('status', 'final')->count(),
    ];

    $availableYears = RhlTeknis::distinct()->orderBy('year', 'desc')->pluck('year');
    if ($availableYears->isEmpty()) {
      $availableYears = [date('Y')];
    }

    return Inertia::render('RhlTeknis/Index', [
      'datas' => $datas,
      'stats' => $stats,
      'filters' => [
        'year' => (int) $selectedYear
      ],
      'availableYears' => $availableYears,
      'sumberDana' => SumberDana::all()
    ]);
  }

  public function create()
  {
    return Inertia::render('RhlTeknis/Create', [
      'sumberDana' => SumberDana::all(),
      'bangunanKta' => BangunanKta::all()
    ]);
  }

  public function store(Request $request)
  {
    $validated = $request->validate([
      'year' => 'required|integer',
      'month' => 'required|integer|min:1|max:12',
      'target_annual' => 'required|numeric',
      'fund_source' => 'required|string',
      'details' => 'required|array|min:1',
      'details.*.bangunan_kta_id' => 'required|exists:m_bangunan_kta,id',
      'details.*.unit_amount' => 'required|integer|min:0',
    ]);

    DB::transaction(function () use ($validated) {
      $report = RhlTeknis::create([
        'year' => $validated['year'],
        'month' => $validated['month'],
        'target_annual' => $validated['target_annual'],
        'fund_source' => $validated['fund_source'],
      ]);

      foreach ($validated['details'] as $detail) {
        $report->details()->create($detail);
      }
    });

    return redirect()->route('rhl-teknis.index')->with('success', 'Data Berhasil Dibuat');
  }

  public function edit(RhlTeknis $rhl_teknis)
  {
    return Inertia::render('RhlTeknis/Edit', [
      'data' => $rhl_teknis->load('details.bangunan_kta'),
      'sumberDana' => SumberDana::all(),
      'bangunanKta' => BangunanKta::all()
    ]);
  }

  public function update(Request $request, RhlTeknis $rhl_teknis)
  {
    $validated = $request->validate([
      'year' => 'required|integer',
      'month' => 'required|integer|min:1|max:12',
      'target_annual' => 'required|numeric',
      'fund_source' => 'required|string',
      'details' => 'required|array|min:1',
      'details.*.bangunan_kta_id' => 'required|exists:m_bangunan_kta,id',
      'details.*.unit_amount' => 'required|integer|min:0',
    ]);

    DB::transaction(function () use ($validated, $rhl_teknis) {
      $rhl_teknis->update([
        'year' => $validated['year'],
        'month' => $validated['month'],
        'target_annual' => $validated['target_annual'],
        'fund_source' => $validated['fund_source'],
      ]);

      $rhl_teknis->details()->delete();
      foreach ($validated['details'] as $detail) {
        $rhl_teknis->details()->create($detail);
      }
    });

    return redirect()->route('rhl-teknis.index')->with('success', 'Data Berhasil Diperbarui');
  }

  public function destroy(RhlTeknis $rhl_teknis)
  {
    $rhl_teknis->delete();

    return redirect()->route('rhl-teknis.index')->with('success', 'Data Berhasil Dihapus');
  }

  public function submit(RhlTeknis $rhl_teknis)
  {
    $rhl_teknis->update(['status' => 'waiting_kasi']);
    return redirect()->back()->with('success', 'Laporan berhasil diajukan untuk verifikasi Kasi.');
  }

  public function approve(RhlTeknis $rhl_teknis)
  {
    $user = auth()->user();

    if (($user->hasRole('kasi') || $user->hasRole('admin')) && $rhl_teknis->status === 'waiting_kasi') {
      $rhl_teknis->update([
        'status' => 'waiting_cdk',
        'approved_by_kasi_at' => now(),
      ]);
      return redirect()->back()->with('success', 'Laporan disetujui and diteruskan ke KaCDK.');
    }

    if (($user->hasRole('kacdk') || $user->hasRole('admin')) && $rhl_teknis->status === 'waiting_cdk') {
      $rhl_teknis->update([
        'status' => 'final',
        'approved_by_cdk_at' => now(),
      ]);
      return redirect()->back()->with('success', 'Laporan telah disetujui secara final.');
    }

    return redirect()->back()->with('error', 'Aksi tidak diijinkan.');
  }

  public function reject(Request $request, RhlTeknis $rhl_teknis)
  {
    $request->validate([
      'rejection_note' => 'required|string|max:255',
    ]);

    $rhl_teknis->update([
      'status' => 'rejected',
      'rejection_note' => $request->rejection_note,
    ]);

    return redirect()->back()->with('success', 'Laporan telah ditolak dengan catatan.');
  }
}
