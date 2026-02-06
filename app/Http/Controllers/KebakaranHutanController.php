<?php

namespace App\Http\Controllers;

use App\Models\KebakaranHutan;
use App\Models\PengelolaWisata;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use App\Actions\SingleWorkflowAction;
use App\Actions\BulkWorkflowAction;
use App\Enums\WorkflowAction;
use Illuminate\Validation\Rule;

class KebakaranHutanController extends Controller
{
  use \App\Traits\HandlesImportFailures;
  public function __construct()
  {
    $this->middleware('permission:perlindungan.view')->only(['index', 'show']);
    $this->middleware('permission:perlindungan.create')->only(['create', 'store']);
    $this->middleware('permission:perlindungan.edit')->only(['edit', 'update']);
    $this->middleware('permission:perlindungan.delete')->only(['destroy']);
  }

  public function index(Request $request)
  {
    $defaultYear = KebakaranHutan::max('year') ?? now()->year;
    $selectedYear = $request->integer('year', $defaultYear);

    $sortField = $request->query('sort', 'created_at');
    $sortDirection = $request->query('direction', 'desc');

    $datas = KebakaranHutan::query()
      ->select([
        'kebakaran_hutan.id',
        'kebakaran_hutan.year',
        'kebakaran_hutan.month',
        'kebakaran_hutan.regency_id',
        'kebakaran_hutan.district_id',
        'kebakaran_hutan.village_id',
        'kebakaran_hutan.id_pengelola_wisata',
        'kebakaran_hutan.area_function',
        'kebakaran_hutan.number_of_fires',
        'kebakaran_hutan.fire_area',
        'kebakaran_hutan.status',
        'kebakaran_hutan.created_at',
        'kebakaran_hutan.created_by',
      ])
      ->with([
        'creator:id,name',
        'regency:id,name',
        'district:id,name',
        'village:id,name',
        'pengelolaWisata:id,name'
      ])
      ->where('year', $selectedYear)

      ->when($request->search, function ($q, $search) {
        $q->where(function ($qq) use ($search) {
          $qq->where('area_function', 'like', "{$search}%")
            ->orWhereHas('village', fn($q) => $q->where('name', 'like', "{$search}%"))
            ->orWhereHas('district', fn($q) => $q->where('name', 'like', "{$search}%"))
            ->orWhereHas('regency', fn($q) => $q->where('name', 'like', "{$search}%"))
            ->orWhereHas('pengelolaWisata', fn($q) => $q->where('name', 'like', "{$search}%"));
        });
      })

      ->when($sortField === 'location', function ($q) use ($sortDirection) {
        $q->leftJoin('m_villages', 'kebakaran_hutan.village_id', '=', 'm_villages.id')
          ->orderBy('m_villages.name', $sortDirection);
      })
      ->when($sortField === 'pengelola', function ($q) use ($sortDirection) {
        $q->leftJoin('m_pengelola_wisata', 'kebakaran_hutan.id_pengelola_wisata', '=', 'm_pengelola_wisata.id')
          ->orderBy('m_pengelola_wisata.name', $sortDirection);
      })

      ->when(!in_array($sortField, ['location', 'pengelola']), function ($q) use ($sortField, $sortDirection) {
        $user = auth()->user();

        if ($sortField === 'created_at' && $sortDirection === 'desc') {
          if ($user->hasRole('kacdk')) {
            $q->orderByRaw("CASE WHEN status = 'waiting_cdk' THEN 0 ELSE 1 END");
          } elseif ($user->hasRole('kasi')) {
            $q->orderByRaw("CASE WHEN status = 'waiting_kasi' THEN 0 ELSE 1 END");
          }
        }

        match ($sortField) {
          'month' => $q->orderBy('month', $sortDirection),
          'area_function' => $q->orderBy('area_function', $sortDirection),
          'number_of_fires' => $q->orderBy('number_of_fires', $sortDirection),
          'fire_area' => $q->orderBy('fire_area', $sortDirection),
          'status' => $q->orderBy('status', $sortDirection),
          default => $q->orderBy('created_at', 'desc'),
        };
      })

      ->paginate($request->integer('per_page', 10))
      ->withQueryString();

    $stats = cache()->remember(
      "karhutla-stats-{$selectedYear}",
      300,
      fn() => [
        'total_fires' => KebakaranHutan::where('year', $selectedYear)->where('status', 'final')->sum('number_of_fires'),
        'total_area' => KebakaranHutan::where('year', $selectedYear)->where('status', 'final')->get()->sum(function ($item) {
          return (float) filter_var($item->fire_area, FILTER_SANITIZE_NUMBER_FLOAT, FILTER_FLAG_ALLOW_FRACTION);
        }),
        'total_count' => KebakaranHutan::where('year', $selectedYear)->where('status', 'final')->count(),
      ]
    );

    $availableYears = cache()->remember('karhutla-years', 3600, function () {
      $dbYears = KebakaranHutan::distinct()->pluck('year')->toArray();
      $fixedYears = range(2025, 2021);
      $years = array_unique(array_merge($dbYears, $fixedYears));
      rsort($years);
      return $years;
    });

    return Inertia::render('KebakaranHutan/Index', [
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
    ]);
  }

  public function create()
  {
    return Inertia::render('KebakaranHutan/Create', [
      'pengelolaWisata' => PengelolaWisata::all(),
      'provinces' => DB::table('m_provinces')->where('id', '35')->get(), // Default Jawa Timur
      'regencies' => DB::table('m_regencies')->where('province_id', '35')->get()
    ]);
  }

  public function store(Request $request)
  {
    $validated = $request->validate([
      'year' => 'required|integer',
      'month' => 'required|integer|min:1|max:12',
      'province_id' => 'required|exists:m_provinces,id',
      'regency_id' => 'required|exists:m_regencies,id',
      'district_id' => 'required|exists:m_districts,id',
      'village_id' => 'required|exists:m_villages,id',
      'coordinates' => 'nullable|string',
      'id_pengelola_wisata' => 'required|exists:m_pengelola_wisata,id',
      'area_function' => 'required|string',
      'number_of_fires' => 'required|integer',
      'fire_area' => 'required|string', // Keeping as string as per migration
    ]);

    KebakaranHutan::create($validated);

    return redirect()->route('kebakaran-hutan.index')->with('success', 'Data Created Successfully');
  }

  public function edit(KebakaranHutan $kebakaranHutan)
  {
    return Inertia::render('KebakaranHutan/Edit', [
      'data' => $kebakaranHutan->load(['pengelolaWisata', 'regency', 'district', 'village']),
      'pengelolaWisata' => PengelolaWisata::all(),
      'provinces' => DB::table('m_provinces')->where('id', '35')->get(),
      'regencies' => DB::table('m_regencies')->where('province_id', '35')->get(),
      'districts' => DB::table('m_districts')->where('regency_id', $kebakaranHutan->regency_id)->get(),
      'villages' => DB::table('m_villages')->where('district_id', $kebakaranHutan->district_id)->get(),
    ]);
  }

  public function update(Request $request, KebakaranHutan $kebakaranHutan)
  {
    $validated = $request->validate([
      'year' => 'required|integer',
      'month' => 'required|integer|min:1|max:12',
      'province_id' => 'required|exists:m_provinces,id',
      'regency_id' => 'required|exists:m_regencies,id',
      'district_id' => 'required|exists:m_districts,id',
      'village_id' => 'required|exists:m_villages,id',
      'coordinates' => 'nullable|string',
      'id_pengelola_wisata' => 'required|exists:m_pengelola_wisata,id',
      'area_function' => 'required|string',
      'number_of_fires' => 'required|integer',
      'fire_area' => 'required|string',
    ]);

    $kebakaranHutan->update($validated);

    return redirect()->route('kebakaran-hutan.index')->with('success', 'Data Updated Successfully');
  }

  public function destroy(KebakaranHutan $kebakaranHutan)
  {
    $kebakaranHutan->delete();

    return redirect()->route('kebakaran-hutan.index')->with('success', 'Data Deleted Successfully');
  }

  /**
   * Single workflow action.
   */
  public function singleWorkflowAction(Request $request, KebakaranHutan $kebakaranHutan, SingleWorkflowAction $action)
  {
    $request->validate([
      'action' => ['required', Rule::enum(WorkflowAction::class)],
      'rejection_note' => 'nullable|string|max:255',
    ]);

    $workflowAction = WorkflowAction::from($request->action);

    match ($workflowAction) {
      WorkflowAction::SUBMIT => $this->authorize('perlindungan.edit'),
      WorkflowAction::APPROVE, WorkflowAction::REJECT => $this->authorize('perlindungan.approve'),
      WorkflowAction::DELETE => $this->authorize('perlindungan.delete'),
    };

    if ($workflowAction === WorkflowAction::REJECT && !$request->filled('rejection_note')) {
      return redirect()->back()->with('error', 'Catatan penolakan wajib diisi.');
    }

    $extraData = [];
    if ($request->filled('rejection_note')) {
      $extraData['rejection_note'] = $request->rejection_note;
    }

    $success = $action->execute(
      model: $kebakaranHutan,
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
    return \Maatwebsite\Excel\Facades\Excel::download(new \App\Exports\KebakaranHutanExport($year), 'kebakaran-hutan-' . date('Y-m-d') . '.xlsx');
  }

  /**
   * Download import template.
   */
  public function template()
  {
    return \Maatwebsite\Excel\Facades\Excel::download(new \App\Exports\KebakaranHutanTemplateExport, 'template_import_kebakaran_hutan.xlsx');
  }

  /**
   * Import data from Excel.
   */
  public function import(Request $request)
  {
    $request->validate([
      'file' => 'required|mimes:xlsx,csv,xls',
    ]);

    $import = new \App\Imports\KebakaranHutanImport();

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

  public function bulkWorkflowAction(Request $request, BulkWorkflowAction $action)
  {
    $request->validate([
      'ids' => 'required|array',
      'ids.*' => 'exists:kebakaran_hutan,id',
      'action' => ['required', Rule::enum(WorkflowAction::class)],
      'rejection_note' => 'nullable|string|max:255',
    ]);

    $workflowAction = WorkflowAction::from($request->action);

    match ($workflowAction) {
      WorkflowAction::SUBMIT => $this->authorize('perlindungan.edit'),
      WorkflowAction::APPROVE, WorkflowAction::REJECT => $this->authorize('perlindungan.approve'),
      WorkflowAction::DELETE => $this->authorize('perlindungan.delete'),
    };

    if ($workflowAction === WorkflowAction::REJECT && !$request->filled('rejection_note')) {
      return redirect()->back()->with('error', 'Catatan penolakan wajib diisi.');
    }

    $extraData = [];
    if ($request->filled('rejection_note')) {
      $extraData['rejection_note'] = $request->rejection_note;
    }

    $count = $action->execute(
      model: KebakaranHutan::class,
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
