<?php

namespace App\Http\Controllers;

use App\Models\RehabLahan;
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
        $this->middleware('permission:rehab.edit')->only(['edit', 'update', 'submit']);
        $this->middleware('permission:rehab.delete')->only(['destroy']);
        $this->middleware('permission:rehab.approve')->only(['verify', 'approve', 'reject']);
    }

    public function index(Request $request)
    {
        $selectedYear = $request->query('year');
        if (!$selectedYear) {
            $selectedYear = RehabLahan::max('year') ?? date('Y');
        }

        $sortField = $request->query('sort', 'created_at');
        $sortDirection = $request->query('direction', 'desc');

        $datas = RehabLahan::query()
            ->leftJoin('m_regencies', 'rehab_lahan.regency_id', '=', 'm_regencies.id')
            ->leftJoin('m_districts', 'rehab_lahan.district_id', '=', 'm_districts.id')
            ->leftJoin('m_villages', 'rehab_lahan.village_id', '=', 'm_villages.id')
            ->select(
                'rehab_lahan.*',
                'm_regencies.name as regency_name',
                'm_districts.name as district_name',
                'm_villages.name as village_name'
            )
            ->when($selectedYear, function ($query, $year) {
                return $query->where('rehab_lahan.year', $year);
            })
            ->when($request->search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('m_villages.name', 'like', "%{$search}%")
                        ->orWhere('m_districts.name', 'like', "%{$search}%")
                        ->orWhere('m_regencies.name', 'like', "%{$search}%")
                        ->orWhere('rehab_lahan.fund_source', 'like', "%{$search}%");
                });
            })
            ->with(['creator', 'regency_rel', 'district_rel', 'village_rel'])
            ->when($sortField, function ($query) use ($sortField, $sortDirection) {
                // Map frontend sort keys to database columns
                $sortMap = [
                    'year' => 'rehab_lahan.year',
                    'month' => 'rehab_lahan.month', // Sort by month for "Bulan / Tahun"
                    'location' => 'm_villages.name', // Sort by village name for location
                    'realization' => 'rehab_lahan.realization',
                    'fund_source' => 'rehab_lahan.fund_source',
                    'status' => 'rehab_lahan.status',
                    'created_at' => 'rehab_lahan.created_at',
                ];

                $column = $sortMap[$sortField] ?? 'rehab_lahan.created_at';
                return $query->orderBy($column, $sortDirection);
            })
            ->paginate(10)
            ->withQueryString();

        $stats = [
            'total_target' => RehabLahan::where('year', $selectedYear)->where('status', 'final')->sum('target_annual'),
            'total_realization' => RehabLahan::where('year', $selectedYear)->where('status', 'final')->sum('realization'),
            'total_count' => RehabLahan::where('year', $selectedYear)->where('status', 'final')->count(),
        ];

        $dbYears = RehabLahan::distinct()->orderBy('year', 'desc')->pluck('year')->toArray();
        $fixedYears = range(2025, 2021);
        $availableYears = array_values(array_unique(array_merge($dbYears, $fixedYears)));
        rsort($availableYears);

        return Inertia::render('RehabLahan/Index', [
            'datas' => $datas,
            'stats' => $stats,
            'filters' => [
                'year' => (int) $selectedYear,
                'search' => $request->search,
                'sort' => $sortField,
                'direction' => $sortDirection,
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
        $rehabLahan->delete();

        return redirect()->route('rehab-lahan.index')->with('success', 'Data Deleted Successfully');
    }

    /**
     * Submit the report for verification.
     */
    public function submit(RehabLahan $rehabLahan)
    {
        $rehabLahan->update(['status' => 'waiting_kasi']);
        return redirect()->back()->with('success', 'Laporan berhasil diajukan untuk verifikasi Kasi.');
    }

    /**
     * Approve the report.
     */
    public function approve(RehabLahan $rehabLahan)
    {
        $user = auth()->user();

        if (($user->hasRole('kasi') || $user->hasRole('admin')) && $rehabLahan->status === 'waiting_kasi') {
            $rehabLahan->update([
                'status' => 'waiting_cdk',
                'approved_by_kasi_at' => now(),
            ]);
            return redirect()->back()->with('success', 'Laporan disetujui dan diteruskan ke KaCDK.');
        }

        if (($user->hasRole('kacdk') || $user->hasRole('admin')) && $rehabLahan->status === 'waiting_cdk') {
            $rehabLahan->update([
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
    public function reject(Request $request, RehabLahan $rehabLahan)
    {
        $request->validate([
            'rejection_note' => 'required|string|max:255',
        ]);

        $rehabLahan->update([
            'status' => 'rejected',
            'rejection_note' => $request->rejection_note,
        ]);

        return redirect()->back()->with('success', 'Laporan telah ditolak dengan catatan.');
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
    public function bulkDestroy(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:rehab_lahan,id',
        ]);

        RehabLahan::whereIn('id', $request->ids)->delete();

        return redirect()->back()->with('success', count($request->ids) . ' data berhasil dihapus.');
    }

    /**
     * Bulk submit records.
     */
    public function bulkSubmit(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:rehab_lahan,id',
        ]);

        $count = RehabLahan::whereIn('id', $request->ids)
            ->whereIn('status', ['draft', 'rejected'])
            ->update(['status' => 'waiting_kasi']);

        return redirect()->back()->with('success', $count . ' laporan berhasil diajukan.');
    }

    /**
     * Bulk approve records.
     */
    public function bulkApprove(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:rehab_lahan,id',
        ]);

        $user = auth()->user();
        $count = 0;

        if ($user->hasRole('kasi') || $user->hasRole('admin')) {
            $count = RehabLahan::whereIn('id', $request->ids)
                ->where('status', 'waiting_kasi')
                ->update([
                    'status' => 'waiting_cdk',
                    'approved_by_kasi_at' => now(),
                ]);
        } elseif ($user->hasRole('kacdk') || $user->hasRole('admin')) {
            $count = RehabLahan::whereIn('id', $request->ids)
                ->where('status', 'waiting_cdk')
                ->update([
                    'status' => 'final',
                    'approved_by_cdk_at' => now(),
                ]);
        }

        return redirect()->back()->with('success', $count . ' laporan berhasil disetujui.');
    }
}
