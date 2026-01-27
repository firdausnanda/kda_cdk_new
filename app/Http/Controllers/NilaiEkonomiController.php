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
        $this->middleware('permission:pemberdayaan.create|pemberdayaan.edit')->only(['edit', 'update']);
        $this->middleware('permission:pemberdayaan.delete')->only(['destroy']);
        $this->middleware('permission:pemberdayaan.approve')->only(['approve', 'reject']);
    }

    public function index(Request $request)
    {
        $selectedYear = $request->query('year');
        if (!$selectedYear) {
            $selectedYear = NilaiEkonomi::max('year') ?? date('Y');
        }

        $query = NilaiEkonomi::query() // Use query() to start building
            ->select('nilai_ekonomi.*') // Select main table columns to avoid id ambiguity
            ->with(['province', 'regency', 'district', 'details.commodity', 'creator'])
            ->leftJoin('m_districts', 'nilai_ekonomi.district_id', '=', 'm_districts.id') // Join for sorting by location
            ->when($selectedYear, fn($q) => $q->where('nilai_ekonomi.year', $selectedYear));

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nilai_ekonomi.nama_kelompok', 'like', "%{$search}%")
                    ->orWhereHas('details.commodity', function ($q2) use ($search) {
                        $q2->where('name', 'like', "%{$search}%");
                    });
            });
        }

        // Dynamic Sorting
        if ($request->has('sort') && $request->has('direction')) {
            $sort = $request->sort;
            $direction = $request->direction;

            if ($sort === 'location') {
                $query->orderBy('m_districts.name', $direction);
            } elseif ($sort === 'nama_kelompok') {
                $query->orderBy('nilai_ekonomi.nama_kelompok', $direction);
            } elseif ($sort === 'total_transaction_value') {
                $query->orderBy('nilai_ekonomi.total_transaction_value', $direction);
            } elseif ($sort === 'status') {
                $query->orderBy('nilai_ekonomi.status', $direction);
            } else {
                // Default fallback or for other columns
                $query->orderBy('nilai_ekonomi.' . $sort, $direction);
            }
        } else {
            $query->latest('nilai_ekonomi.created_at');
        }

        $stats = [
            'total_volume' => \App\Models\NilaiEkonomiDetail::whereIn('nilai_ekonomi_id', $query->clone()->pluck('nilai_ekonomi.id'))->sum('production_volume'),
            'total_transaction' => $query->clone()->sum('nilai_ekonomi.total_transaction_value'),
            'count' => $query->clone()->count(),
        ];

        $data = $query->paginate(10)->withQueryString();

        $dbYears = NilaiEkonomi::distinct()->orderBy('year', 'desc')->pluck('year')->toArray();
        $fixedYears = range(2025, 2021);
        $availableYears = array_values(array_unique(array_merge($dbYears, $fixedYears)));
        rsort($availableYears);

        return Inertia::render('NilaiEkonomi/Index', [
            'data' => $data,
            'filters' => [
                'year' => $selectedYear,
                'search' => $request->search,
                'sort' => $request->sort,
                'direction' => $request->direction,
            ],
            'stats' => $stats,
            'availableYears' => $availableYears,
        ]);
    }

    // ... (create, store, edit, update methods remain unchanged)

    public function destroy(NilaiEkonomi $nilaiEkonomi)
    {
        $nilaiEkonomi->deleted_by = Auth::id();
        $nilaiEkonomi->save();
        $nilaiEkonomi->delete();

        return redirect()->route('nilai-ekonomi.index')->with('success', 'Data Nilai Ekonomi berhasil dihapus.');
    }

    public function bulkDestroy(Request $request)
    {
        $ids = $request->ids;
        if (empty($ids)) {
            return back()->with('error', 'Tidak ada data yang dipilih.');
        }

        $count = NilaiEkonomi::whereIn('id', $ids)->delete();
        return back()->with('success', "$count data berhasil dihapus.");
    }

    public function submit(NilaiEkonomi $nilaiEkonomi)
    {
        // Custom authorization: Allow if user is creator OR has specific permissions
        if (auth()->id() !== $nilaiEkonomi->created_by && !auth()->user()->can('pemberdayaan.edit') && !auth()->user()->can('pemberdayaan.create')) {
            return redirect()->back()->with('error', 'Akses Ditolak: Anda tidak memiliki izin untuk melakukan aksi ini.');
        }

        $nilaiEkonomi->update(['status' => 'waiting_kasi']);
        return redirect()->back()->with('success', 'Laporan berhasil diajukan untuk verifikasi Kasi.');
    }

    public function bulkSubmit(Request $request)
    {
        $ids = $request->ids;
        if (empty($ids)) {
            return back()->with('error', 'Tidak ada data yang dipilih.');
        }

        $count = NilaiEkonomi::whereIn('id', $ids)
            ->whereIn('status', ['draft', 'rejected'])
            ->update(['status' => 'waiting_kasi']);

        return back()->with('success', "$count data berhasil disubmit ke Kasi.");
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

    public function bulkApprove(Request $request)
    {
        $ids = $request->ids;
        if (empty($ids)) {
            return back()->with('error', 'Tidak ada data yang dipilih.');
        }

        $user = Auth::user();
        $updatedCount = 0;

        if ($user->hasRole('kasi')) {
            $updatedCount = NilaiEkonomi::whereIn('id', $ids)
                ->where('status', 'waiting_kasi')
                ->update([
                    'status' => 'waiting_cdk',
                    'approved_by_kasi_at' => now(),
                ]);
        } elseif ($user->hasRole('kacdk') || $user->hasRole('admin')) {
            $updatedCount = NilaiEkonomi::whereIn('id', $ids)
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
