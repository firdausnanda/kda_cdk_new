<?php

namespace App\Http\Controllers;

use App\Actions\SingleWorkflowAction;
use App\Models\RehabLahan;
use App\Actions\BulkWorkflowAction;
use App\Enums\WorkflowAction;
use Illuminate\Validation\Rule;
use App\Models\Regencies;
use App\Models\SumberDana;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RehabLahanController extends Controller
{
    use \App\Traits\HandlesImportFailures;
    public function __construct()
    {
        $this->middleware('permission:rehab.view')->only(['index', 'show']);
        $this->middleware('permission:rehab.create')->only(['create', 'store']);
        $this->middleware('permission:rehab.edit')->only(['edit', 'update']);
        $this->middleware('permission:rehab.delete')->only(['destroy']);
    }

    public function index(Request $request)
    {
        $defaultYear = RehabLahan::max('year') ?? now()->year;
        $selectedYear = $request->integer('year', $defaultYear);

        $sortField = $request->query('sort', 'created_at');
        $sortDirection = $request->query('direction', 'desc');

        $datas = RehabLahan::query()
            ->select([
                'rehab_lahan.id',
                'rehab_lahan.year',
                'rehab_lahan.month',
                'rehab_lahan.regency_id',
                'rehab_lahan.district_id',
                'rehab_lahan.village_id',
                'rehab_lahan.fund_source',
                'rehab_lahan.target_annual',
                'rehab_lahan.realization',
                'rehab_lahan.status',
                'rehab_lahan.rejection_note',
                'rehab_lahan.created_at',
                'rehab_lahan.created_by',
            ])
            ->with([
                'creator:id,name',
                'regency_rel:id,name',
                'district_rel:id,name',
                'village_rel:id,name',
            ])
            ->where('year', $selectedYear)

            ->when($request->search, function ($q, $search) {
                $q->where(function ($qq) use ($search) {
                    $qq->where('fund_source', 'like', "%{$search}%")
                        ->orWhereHas('village_rel', fn($q) => $q->where('name', 'like', "%{$search}%"))
                        ->orWhereHas('district_rel', fn($q) => $q->where('name', 'like', "%{$search}%"))
                        ->orWhereHas('regency_rel', fn($q) => $q->where('name', 'like', "%{$search}%"));
                });
            })

            ->when($sortField === 'location', function ($q) use ($sortDirection) {
                $q->leftJoin('m_villages', 'rehab_lahan.village_id', '=', 'm_villages.id')
                    ->orderBy('m_villages.name', $sortDirection);
            })

            ->when($sortField !== 'location', function ($q) use ($sortField, $sortDirection) {
                match ($sortField) {
                    'year' => $q->orderBy('year', $sortDirection),
                    'month' => $q->orderBy('month', $sortDirection),
                    'realization' => $q->orderBy('realization', $sortDirection),
                    'fund_source' => $q->orderBy('fund_source', $sortDirection),
                    'status' => $q->orderBy('status', $sortDirection),
                    default => $q->orderBy('created_at', 'desc'),
                };
            })

            ->paginate($request->integer('per_page', 10))
            ->withQueryString();

        $stats = cache()->remember(
            "rehab-lahan-stats-{$selectedYear}",
            300,
            fn() => [
                'total_target' => RehabLahan::where('year', $selectedYear)->where('status', 'final')->sum('target_annual'),
                'total_realization' => RehabLahan::where('year', $selectedYear)->where('status', 'final')->sum('realization'),
                'total_count' => RehabLahan::where('year', $selectedYear)->where('status', 'final')->count(),
            ]
        );

        $availableYears = cache()->remember('rehab-lahan-years', 3600, function () {
            $dbYears = RehabLahan::distinct()->pluck('year')->toArray();
            $fixedYears = range(2025, 2021);
            $years = array_unique(array_merge($dbYears, $fixedYears));
            rsort($years);
            return $years;
        });

        $sumberDana = cache()->remember('sumber-dana', 3600, fn() => SumberDana::select('id', 'name')->get());

        return Inertia::render('RehabLahan/Index', [
            'datas' => $datas,
            'stats' => $stats,
            'filters' => [
                'year' => (int) $selectedYear,
                'search' => $request->search,
                'sort' => $sortField,
                'direction' => $sortDirection,
                'per_page' => (int) $request->query('per_page', 10),
            ],
            'availableYears' => $availableYears,
            'sumberDana' => $sumberDana
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('RehabLahan/Create', [
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

        RehabLahan::create($validated);

        return redirect()->route('rehab-lahan.index')->with('success', 'Data Created Successfully');
    }

    /**
     * Display the specified resource.
     */
    public function show(RehabLahan $rehabLahan)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(RehabLahan $rehabLahan)
    {
        return Inertia::render('RehabLahan/Edit', [
            'data' => $rehabLahan->load(['regency_rel', 'district_rel', 'village_rel']),
            'sumberDana' => SumberDana::all()
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, RehabLahan $rehabLahan)
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

        $rehabLahan->update($validated);

        return redirect()->route('rehab-lahan.index')->with('success', 'Data Updated Successfully');
    }

    /**
     * Remove the specified resource from storage.
     */
    /**
     * Remove the specified resource from storage.
     */
    public function destroy(RehabLahan $rehabLahan)
    {
        $user = auth()->user();

        if ($user->hasAnyRole(['kasi', 'kacdk'])) {
            return redirect()->back()->with('error', 'Aksi tidak diijinkan. Role Anda tidak dapat menghapus data.');
        }

        if ($user->hasAnyRole(['pk', 'peh', 'pelaksana']) && $rehabLahan->status !== 'draft') {
            return redirect()->back()->with('error', 'Hanya data dengan status draft yang dapat dihapus.');
        }

        $rehabLahan->delete();

        return redirect()->route('rehab-lahan.index')->with('success', 'Data Deleted Successfully');
    }

    /**
     * Single workflow action.
     */
    public function singleWorkflowAction(Request $request, RehabLahan $rehabLahan, SingleWorkflowAction $action)
    {
        $request->validate([
            'action' => ['required', Rule::enum(WorkflowAction::class)],
            'rejection_note' => 'nullable|string|max:255',
        ]);

        $workflowAction = WorkflowAction::from($request->action);

        match ($workflowAction) {
            WorkflowAction::SUBMIT => $this->authorize('rehab.edit'),
            WorkflowAction::APPROVE, WorkflowAction::REJECT => $this->authorize('rehab.approve'),
            WorkflowAction::DELETE => $this->authorize('rehab.delete'),
        };

        if ($workflowAction === WorkflowAction::REJECT && !$request->filled('rejection_note')) {
            return redirect()->back()->with('error', 'Catatan penolakan wajib diisi.');
        }

        $extraData = [];
        if ($request->filled('rejection_note')) {
            $extraData['rejection_note'] = $request->rejection_note;
        }

        $success = $action->execute(
            model: $rehabLahan,
            action: $workflowAction,
            user: auth()->user(),
            extraData: $extraData
        );

        if ($success) {
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

    /**
     * Export data to Excel.
     */
    public function export(Request $request)
    {
        $year = $request->query('year');
        return \Maatwebsite\Excel\Facades\Excel::download(new \App\Exports\RehabLahanExport($year), 'rehab-lahan-' . date('Y-m-d') . '.xlsx');
    }

    /**
     * Download import template.
     */
    public function template()
    {
        return \Maatwebsite\Excel\Facades\Excel::download(new \App\Exports\RehabLahanTemplateExport, 'template_import_rehab_lahan.xlsx');
    }

    /**
     * Import data from Excel.
     */
    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|mimes:xlsx,csv,xls',
        ]);

        $import = new \App\Imports\RehabLahanImport();

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

    /**
     * Bulk delete records.
     */
    public function bulkWorkflowAction(Request $request, BulkWorkflowAction $action)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:rehab_lahan,id',
            'action' => ['required', Rule::enum(WorkflowAction::class)],
            'rejection_note' => 'nullable|string|max:255',
        ]);

        $workflowAction = WorkflowAction::from($request->action);

        match ($workflowAction) {
            WorkflowAction::SUBMIT => $this->authorize('rehab.edit'),
            WorkflowAction::APPROVE, WorkflowAction::REJECT => $this->authorize('rehab.approve'),
            WorkflowAction::DELETE => $this->authorize('rehab.delete'),
        };

        if ($workflowAction === WorkflowAction::REJECT && !$request->filled('rejection_note')) {
            return redirect()->back()->with('error', 'Catatan penolakan wajib diisi.');
        }

        $extraData = [];
        if ($request->filled('rejection_note')) {
            $extraData['rejection_note'] = $request->rejection_note;
        }

        $count = $action->execute(
            model: RehabLahan::class,
            action: $workflowAction,
            ids: $request->ids,
            user: auth()->user(),
            extraData: $extraData
        );

        $message = match ($workflowAction) {
            WorkflowAction::DELETE => 'dihapus',
            WorkflowAction::SUBMIT => 'diajukan',
            WorkflowAction::APPROVE => 'disetujui',
            WorkflowAction::REJECT => 'ditolak',
        };

        return redirect()->back()->with('success', "{$count} data berhasil {$message}.");
    }
}
