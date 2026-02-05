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
use Illuminate\Support\Facades\DB;
use App\Actions\BulkWorkflowAction;
use App\Actions\SingleWorkflowAction;
use App\Enums\WorkflowAction;
use Illuminate\Validation\Rule;

class NilaiEkonomiController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:pemberdayaan.view')->only(['index']);
        $this->middleware('permission:pemberdayaan.create')->only(['create', 'store']);
        $this->middleware('permission:pemberdayaan.edit')->only(['edit', 'update']);
        $this->middleware('permission:pemberdayaan.delete')->only(['destroy']);
    }

    public function index(Request $request)
    {
        // Cache available years
        $availableYears = cache()->remember('nilai-ekonomi-years', 300, function () {
            $dbYears = NilaiEkonomi::distinct()->orderBy('year', 'desc')->pluck('year')->toArray();
            $fixedYears = range(date('Y'), 2021);
            $years = array_values(array_unique(array_merge($dbYears, $fixedYears)));
            rsort($years);
            return $years;
        });

        $selectedYear = $request->query('year')
            ?? NilaiEkonomi::max('year')
            ?? date('Y');

        $sortField = $request->query('sort', 'created_at');
        $sortDirection = $request->query('direction', 'desc');

        $query = NilaiEkonomi::query()
            ->select([
                'nilai_ekonomi.id',
                'nilai_ekonomi.year',
                'nilai_ekonomi.month',
                'nilai_ekonomi.regency_id',
                'nilai_ekonomi.district_id',
                'nilai_ekonomi.nama_kelompok',
                'nilai_ekonomi.total_transaction_value',
                'nilai_ekonomi.status',
                'nilai_ekonomi.created_at',
                'nilai_ekonomi.created_by'
            ])
            ->with([
                'province:id,name',
                'regency:id,name',
                'district:id,name',
                'details.commodity:id,name',
                'creator:id,name'
            ])
            ->where('nilai_ekonomi.year', $selectedYear);

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nilai_ekonomi.nama_kelompok', 'like', "%{$search}%")
                    ->orWhereHas('details.commodity', fn($q2) => $q2->where('name', 'like', "%{$search}%"))
                    ->orWhereHas('regency', fn($q2) => $q2->where('name', 'like', "%{$search}%"))
                    ->orWhereHas('district', fn($q2) => $q2->where('name', 'like', "%{$search}%"));
            });
        }

        // Sorting logic
        $query->when($sortField === 'location', function ($q) use ($sortDirection) {
            $q->leftJoin('m_districts', 'nilai_ekonomi.district_id', '=', 'm_districts.id')
                ->orderBy('m_districts.name', $sortDirection);
        })
            ->when(!in_array($sortField, ['location']), function ($q) use ($sortField, $sortDirection) {
                match ($sortField) {
                    'nama_kelompok' => $q->orderBy('nilai_ekonomi.nama_kelompok', $sortDirection),
                    'total_transaction_value' => $q->orderBy('nilai_ekonomi.total_transaction_value', $sortDirection),
                    'status' => $q->orderBy('nilai_ekonomi.status', $sortDirection),
                    default => $q->orderBy('nilai_ekonomi.created_at', 'desc'),
                };
            });

        $data = $query->paginate($request->integer('per_page', 10))->withQueryString();

        // Stats Caching
        $stats = cache()->remember('nilai-ekonomi-stats-' . $selectedYear, 300, function () use ($selectedYear) {
            $baseQuery = NilaiEkonomi::where('year', $selectedYear);
            return [
                'total_volume' => \App\Models\NilaiEkonomiDetail::whereHas('nilaiEkonomi', fn($q) => $q->where('year', $selectedYear))->sum('production_volume'),
                'total_transaction' => $baseQuery->sum('total_transaction_value'),
                'count' => $baseQuery->count(),
            ];
        });

        return Inertia::render('NilaiEkonomi/Index', [
            'data' => $data,
            'filters' => [
                'year' => $selectedYear,
                'search' => $request->search,
                'sort' => $sortField,
                'direction' => $sortDirection,
                'per_page' => (int) $request->query('per_page', 10),
            ],
            'stats' => $stats,
            'availableYears' => $availableYears,
        ]);
    }

    public function create()
    {
        $commodities = Commodity::orderBy('name')->get();

        return Inertia::render('NilaiEkonomi/Create', [
            'commodities' => $commodities,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nama_kelompok' => 'required|string|max:255',
            'year' => 'required|integer',
            'month' => 'required|integer|min:1|max:12',
            'province_id' => 'required|exists:m_provinces,id',
            'regency_id' => 'required|exists:m_regencies,id',
            'district_id' => 'required|exists:m_districts,id',
            'details' => 'required|array|min:1',
            'details.*.commodity_id' => 'required|exists:m_commodities,id',
            'details.*.production_volume' => 'required|numeric',
            'details.*.satuan' => 'required|string',
            'details.*.transaction_value' => 'required|numeric',
        ]);

        DB::beginTransaction();
        try {
            $totalTransaction = collect($request->details)->sum('transaction_value');

            $nilaiEkonomi = NilaiEkonomi::create([
                'nama_kelompok' => $request->nama_kelompok,
                'year' => $request->year,
                'month' => $request->month,
                'province_id' => $request->province_id,
                'regency_id' => $request->regency_id,
                'district_id' => $request->district_id,
                'total_transaction_value' => $totalTransaction,
                'status' => 'draft',
                'created_by' => Auth::id(),
            ]);

            foreach ($request->details as $detail) {
                $nilaiEkonomi->details()->create([
                    'commodity_id' => $detail['commodity_id'],
                    'production_volume' => $detail['production_volume'],
                    'satuan' => $detail['satuan'],
                    'transaction_value' => $detail['transaction_value'],
                ]);
            }

            DB::commit();
            $this->clearCache($request->year);
            return redirect()->route('nilai-ekonomi.index')->with('success', 'Data Nilai Ekonomi berhasil disimpan.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Terjadi kesalahan saat menyimpan data: ' . $e->getMessage());
        }
    }

    public function edit(NilaiEkonomi $nilaiEkonomi)
    {
        $nilaiEkonomi->load(['details', 'province', 'regency', 'district']);
        $commodities = Commodity::orderBy('name')->get();

        return Inertia::render('NilaiEkonomi/Edit', [
            'nilaiEkonomi' => $nilaiEkonomi,
            'commodities' => $commodities,
        ]);
    }

    public function update(Request $request, NilaiEkonomi $nilaiEkonomi)
    {
        $request->validate([
            'nama_kelompok' => 'required|string|max:255',
            'year' => 'required|integer',
            'month' => 'required|integer|min:1|max:12',
            'province_id' => 'required|exists:m_provinces,id',
            'regency_id' => 'required|exists:m_regencies,id',
            'district_id' => 'required|exists:m_districts,id',
            'details' => 'required|array|min:1',
            'details.*.commodity_id' => 'required|exists:m_commodities,id',
            'details.*.production_volume' => 'required|numeric',
            'details.*.satuan' => 'required|string',
            'details.*.transaction_value' => 'required|numeric',
        ]);

        DB::beginTransaction();
        try {
            $totalTransaction = collect($request->details)->sum('transaction_value');

            $nilaiEkonomi->update([
                'nama_kelompok' => $request->nama_kelompok,
                'year' => $request->year,
                'month' => $request->month,
                'province_id' => $request->province_id,
                'regency_id' => $request->regency_id,
                'district_id' => $request->district_id,
                'total_transaction_value' => $totalTransaction,
                'updated_by' => Auth::id(),
            ]);

            // Replace details
            $nilaiEkonomi->details()->delete();
            foreach ($request->details as $detail) {
                $nilaiEkonomi->details()->create([
                    'commodity_id' => $detail['commodity_id'],
                    'production_volume' => $detail['production_volume'],
                    'satuan' => $detail['satuan'],
                    'transaction_value' => $detail['transaction_value'],
                ]);
            }

            DB::commit();
            $this->clearCache($request->year);
            return redirect()->route('nilai-ekonomi.index')->with('success', 'Data Nilai Ekonomi berhasil diperbarui.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Terjadi kesalahan saat memperbarui data: ' . $e->getMessage());
        }
    }

    public function destroy(NilaiEkonomi $nilaiEkonomi)
    {
        $year = $nilaiEkonomi->year;
        $nilaiEkonomi->deleted_by = Auth::id();
        $nilaiEkonomi->save();
        $nilaiEkonomi->delete();

        $this->clearCache($year);

        return redirect()->route('nilai-ekonomi.index')->with('success', 'Data Nilai Ekonomi berhasil dihapus.');
    }

    /**
     * Handle single workflow action.
     */
    public function singleWorkflowAction(Request $request, NilaiEkonomi $nilaiEkonomi, SingleWorkflowAction $action)
    {
        $request->validate([
            'action' => ['required', Rule::enum(WorkflowAction::class)],
            'rejection_note' => 'nullable|string|max:255',
        ]);

        $workflowAction = WorkflowAction::from($request->action);

        match ($workflowAction) {
            WorkflowAction::SUBMIT => $this->authorize('pemberdayaan.edit'),
            WorkflowAction::APPROVE, WorkflowAction::REJECT => $this->authorize('pemberdayaan.approve'),
            WorkflowAction::DELETE => $this->authorize('pemberdayaan.delete'),
        };

        if ($workflowAction === WorkflowAction::REJECT && !$request->filled('rejection_note')) {
            return redirect()->back()->with('error', 'Catatan penolakan wajib diisi.');
        }

        $extraData = [];
        if ($request->filled('rejection_note')) {
            $extraData['rejection_note'] = $request->rejection_note;
        }

        $success = $action->execute(
            model: $nilaiEkonomi,
            action: $workflowAction,
            user: auth()->user(),
            extraData: $extraData
        );

        if ($success) {
            $this->clearCache($nilaiEkonomi->year);

            $message = match ($workflowAction) {
                WorkflowAction::DELETE => 'dihapus',
                WorkflowAction::SUBMIT => 'diajukan untuk verifikasi',
                WorkflowAction::APPROVE => 'disetujui',
                WorkflowAction::REJECT => 'ditolak',
            };
            return redirect()->back()->with('success', "Laporan berhasil {$message}.");
        }

        return redirect()->back()->with('error', 'Gagal memproses laporan atau status tidak sesuai.');
    }

    public function bulkWorkflowAction(Request $request, BulkWorkflowAction $action)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:nilai_ekonomi,id',
            'action' => 'required|string',
            'rejection_note' => 'nullable|string|max:255',
        ]);

        $workflowAction = WorkflowAction::from($request->action);

        match ($workflowAction) {
            WorkflowAction::SUBMIT => $this->authorize('pemberdayaan.edit'),
            WorkflowAction::APPROVE, WorkflowAction::REJECT => $this->authorize('pemberdayaan.approve'),
            WorkflowAction::DELETE => $this->authorize('pemberdayaan.delete'),
        };

        if ($workflowAction === WorkflowAction::REJECT && !$request->filled('rejection_note')) {
            return redirect()->back()->with('error', 'Catatan penolakan wajib diisi.');
        }

        $extraData = [];
        if ($request->filled('rejection_note')) {
            $extraData['rejection_note'] = $request->rejection_note;
        }

        $count = $action->execute(
            model: NilaiEkonomi::class,
            action: $workflowAction,
            ids: $request->ids,
            user: auth()->user(),
            extraData: $extraData
        );

        if ($count > 0) {
            $this->clearCache();
            return redirect()->back()->with('success', 'Aksi berhasil dilakukan pada ' . $count . ' data.');
        }

        $message = match ($workflowAction) {
            WorkflowAction::DELETE => 'dihapus',
            WorkflowAction::SUBMIT => 'diajukan',
            WorkflowAction::APPROVE => 'disetujui',
            WorkflowAction::REJECT => 'ditolak',
        };

        return redirect()->back()->with('success', "{$count} data berhasil {$message}.");
    }

    private function clearCache($year = null)
    {
        cache()->forget('nilai-ekonomi-years');
        if ($year) {
            cache()->forget('nilai-ekonomi-stats-' . $year);
        } else {
            // If year is not specified, clear for a reasonable range
            for ($i = date('Y') - 5; $i <= date('Y'); $i++) {
                cache()->forget('nilai-ekonomi-stats-' . $i);
            }
        }
    }
}
