<?php

namespace App\Http\Controllers;

use App\Models\PengunjungWisata;
use App\Models\PengelolaWisata;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PengunjungWisataController extends Controller
{
  public function __construct()
  {
    $this->middleware('permission:perlindungan.view')->only(['index', 'show']);
    $this->middleware('permission:perlindungan.create')->only(['create', 'store']);
    $this->middleware('permission:perlindungan.edit')->only(['edit', 'update', 'submit']);
    $this->middleware('permission:perlindungan.delete')->only(['destroy']);
  }

  public function index(Request $request)
  {
    $selectedYear = $request->query('year', date('Y'));

    $datas = PengunjungWisata::query()
      ->with(['pengelolaWisata', 'creator'])
      ->when($selectedYear, function ($query, $year) {
        return $query->where('year', $year);
      })
      ->latest('created_at')
      ->paginate(10)
      ->withQueryString();

    $stats = [
      'total_visitors' => PengunjungWisata::where('year', $selectedYear)->where('status', 'final')->sum('number_of_visitors'),
      'total_income' => PengunjungWisata::where('year', $selectedYear)->where('status', 'final')->sum('gross_income'),
      'total_count' => PengunjungWisata::where('year', $selectedYear)->where('status', 'final')->count(),
    ];

    $availableYears = PengunjungWisata::distinct()->orderBy('year', 'desc')->pluck('year');
    if ($availableYears->isEmpty()) {
      $availableYears = [date('Y')];
    }

    return Inertia::render('PengunjungWisata/Index', [
      'datas' => $datas,
      'stats' => $stats,
      'filters' => [
        'year' => (int) $selectedYear
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
}
