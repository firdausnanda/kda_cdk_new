<?php

namespace App\Http\Controllers;

use App\Models\NilaiEkonomi;
use App\Models\Commodity;
use App\Models\Provinces;
use App\Models\Regencies;
use App\Models\Districts;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class NilaiEkonomiController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:pemberdayaan.view')->only(['index']);
        $this->middleware('permission:pemberdayaan.create')->only(['create', 'store']);
        $this->middleware('permission:pemberdayaan.edit')->only(['edit', 'update']);
        $this->middleware('permission:pemberdayaan.delete')->only(['destroy']);
        $this->middleware('permission:pemberdayaan.approve')->only(['submit', 'approve', 'reject']);
    }

    public function index(Request $request)
    {
        $selectedYear = $request->query('year');
        if (!$selectedYear) {
            $selectedYear = NilaiEkonomi::max('year') ?? date('Y');
        }

        $query = NilaiEkonomi::with(['province', 'regency', 'district', 'details.commodity', 'creator'])
            ->when($selectedYear, fn($q) => $q->where('year', $selectedYear));

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nama_kelompok', 'like', "%{$search}%")
                    ->orWhereHas('details.commodity', function ($q2) use ($search) {
                        $q2->where('name', 'like', "%{$search}%");
                    });
            });
        }

        $stats = [
            'total_volume' => \App\Models\NilaiEkonomiDetail::whereIn('nilai_ekonomi_id', $query->clone()->pluck('id'))->sum('production_volume'),
            'total_transaction' => $query->clone()->sum('total_transaction_value'),
            'count' => $query->clone()->count(),
        ];

        $data = $query->latest()->paginate(10)->withQueryString();

        $dbYears = NilaiEkonomi::distinct()->orderBy('year', 'desc')->pluck('year')->toArray();
        $fixedYears = range(2025, 2021);
        $availableYears = array_values(array_unique(array_merge($dbYears, $fixedYears)));
        rsort($availableYears);

        return Inertia::render('NilaiEkonomi/Index', [
            'data' => $data,
            'filters' => [
                'year' => $selectedYear,
                'search' => $request->search,
            ],
            'stats' => $stats,
            'availableYears' => $availableYears,
        ]);
    }

    public function create()
    {
        return Inertia::render('NilaiEkonomi/Create', [
            'commodities' => Commodity::all(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama_kelompok' => 'required|string',
            'year' => 'required|integer',
            'month' => 'required|integer|min:1|max:12',
            'province_id' => 'required|exists:m_provinces,id',
            'regency_id' => 'required|exists:m_regencies,id',
            'district_id' => 'required|exists:m_districts,id',
            'details' => 'required|array|min:1',
            'details.*.commodity_id' => 'required|exists:m_commodities,id',
            'details.*.production_volume' => 'required|numeric|min:0',
            'details.*.satuan' => 'required|string',
            'details.*.transaction_value' => 'required|numeric|min:0',
        ]);

        $validated['status'] = 'draft';
        $validated['created_by'] = Auth::id();

        $totalValue = 0;
        foreach ($request->details as $detail) {
            $totalValue += $detail['transaction_value'];
        }
        $validated['total_transaction_value'] = $totalValue;

        $nilaiEkonomi = NilaiEkonomi::create($validated);

        foreach ($request->details as $detail) {
            $nilaiEkonomi->details()->create([
                'commodity_id' => $detail['commodity_id'],
                'production_volume' => $detail['production_volume'],
                'satuan' => $detail['satuan'],
                'transaction_value' => $detail['transaction_value'],
            ]);
        }

        return redirect()->route('nilai-ekonomi.index')->with('success', 'Data Nilai Ekonomi berhasil disimpan.');
    }

    public function edit(NilaiEkonomi $nilaiEkonomi)
    {
        $nilaiEkonomi->load('details.commodity');

        return Inertia::render('NilaiEkonomi/Edit', [
            'nilaiEkonomi' => $nilaiEkonomi,
            'commodities' => Commodity::all(),
            'regency' => Regencies::find($nilaiEkonomi->regency_id),
            'district' => Districts::find($nilaiEkonomi->district_id),
        ]);
    }

    public function update(Request $request, NilaiEkonomi $nilaiEkonomi)
    {
        $validated = $request->validate([
            'nama_kelompok' => 'required|string',
            'year' => 'required|integer',
            'month' => 'required|integer|min:1|max:12',
            'province_id' => 'required|exists:m_provinces,id',
            'regency_id' => 'required|exists:m_regencies,id',
            'district_id' => 'required|exists:m_districts,id',
            'details' => 'required|array|min:1',
            'details.*.commodity_id' => 'required|exists:m_commodities,id',
            'details.*.production_volume' => 'required|numeric|min:0',
            'details.*.satuan' => 'required|string',
            'details.*.transaction_value' => 'required|numeric|min:0',
        ]);

        $validated['updated_by'] = Auth::id();

        $totalValue = 0;
        foreach ($request->details as $detail) {
            $totalValue += $detail['transaction_value'];
        }
        $validated['total_transaction_value'] = $totalValue;

        $nilaiEkonomi->update($validated);

        $nilaiEkonomi->details()->delete();
        foreach ($request->details as $detail) {
            $nilaiEkonomi->details()->create([
                'commodity_id' => $detail['commodity_id'],
                'production_volume' => $detail['production_volume'],
                'satuan' => $detail['satuan'],
                'transaction_value' => $detail['transaction_value'],
            ]);
        }

        return redirect()->route('nilai-ekonomi.index')->with('success', 'Data Nilai Ekonomi berhasil diperbarui.');
    }

    public function destroy(NilaiEkonomi $nilaiEkonomi)
    {
        $nilaiEkonomi->deleted_by = Auth::id();
        $nilaiEkonomi->save();
        $nilaiEkonomi->delete();

        return redirect()->route('nilai-ekonomi.index')->with('success', 'Data Nilai Ekonomi berhasil dihapus.');
    }

    public function submit(NilaiEkonomi $nilaiEkonomi)
    {
        $nilaiEkonomi->update(['status' => 'waiting_kasi']);
        return redirect()->back()->with('success', 'Laporan berhasil diajukan untuk verifikasi Kasi.');
    }

    public function approve(NilaiEkonomi $nilaiEkonomi)
    {
        $user = auth()->user();

        if (($user->hasRole('kasi') || $user->hasRole('admin')) && $nilaiEkonomi->status === 'waiting_kasi') {
            $nilaiEkonomi->update([
                'status' => 'waiting_cdk',
                'approved_by_kasi_at' => now(),
            ]);
            return redirect()->back()->with('success', 'Laporan disetujui dan diteruskan ke KaCDK.');
        }

        if (($user->hasRole('kacdk') || $user->hasRole('admin')) && $nilaiEkonomi->status === 'waiting_cdk') {
            $nilaiEkonomi->update([
                'status' => 'final',
                'approved_by_cdk_at' => now(),
            ]);
            return redirect()->back()->with('success', 'Laporan telah disetujui secara final.');
        }

        return redirect()->back()->with('error', 'Aksi tidak diijinkan.');
    }

    public function reject(Request $request, NilaiEkonomi $nilaiEkonomi)
    {
        $request->validate([
            'rejection_note' => 'required|string|max:255',
        ]);

        $nilaiEkonomi->update([
            'status' => 'rejected',
            'rejection_note' => $request->rejection_note,
        ]);

        return redirect()->back()->with('success', 'Laporan telah ditolak dengan catatan.');
    }
}
