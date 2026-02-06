<?php

namespace App\Http\Controllers;

use App\Models\HasilHutanBukanKayu;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Actions\BulkWorkflowAction;
use App\Actions\SingleWorkflowAction;
use App\Enums\WorkflowAction;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;

class HasilHutanBukanKayuController extends Controller
{
  use \App\Traits\HandlesImportFailures;
  public function __construct()
  {
    $this->middleware('permission:bina-usaha.view')->only(['index', 'show']);
    $this->middleware('permission:bina-usaha.create')->only(['create', 'store']);
    $this->middleware('permission:bina-usaha.edit')->only(['edit', 'update']);
    $this->middleware('permission:bina-usaha.delete')->only(['destroy']);
  }

  public function index(Request $request)
  {
    $forestType = $request->query('forest_type', 'Hutan Negara');
    $defaultYear = HasilHutanBukanKayu::where('forest_type', $forestType)->max('year') ?? now()->year;
    $selectedYear = $request->integer('year', $defaultYear);

    $sortField = $request->query('sort', 'created_at');
    $sortDirection = $request->query('direction', 'desc');

    $datas = HasilHutanBukanKayu::query()
      ->select([
        'hasil_hutan_bukan_kayu.id',
        'hasil_hutan_bukan_kayu.year',
        'hasil_hutan_bukan_kayu.month',
        'hasil_hutan_bukan_kayu.regency_id',
        'hasil_hutan_bukan_kayu.district_id',
        'hasil_hutan_bukan_kayu.pengelola_hutan_id',
        'hasil_hutan_bukan_kayu.pengelola_wisata_id',
        'hasil_hutan_bukan_kayu.forest_type',
        'hasil_hutan_bukan_kayu.volume_target',
        'hasil_hutan_bukan_kayu.status',
        'hasil_hutan_bukan_kayu.rejection_note',
        'hasil_hutan_bukan_kayu.created_at',
        'hasil_hutan_bukan_kayu.created_by',
      ])
      ->with([
        'creator:id,name',
        'regency:id,name',
        'district:id,name',
        'pengelolaHutan:id,name',
        'pengelolaWisata:id,name',
        'details.bukanKayu:id,name'
      ])
      ->where('forest_type', $forestType)
      ->where('year', $selectedYear)

      ->when($request->search, function ($query, $search) {
        $query->where(function ($q) use ($search) {
          $q->whereHas('details.bukanKayu', fn($q2) => $q2->where('name', 'like', "%{$search}%"))
            ->orWhereHas('regency', fn($q2) => $q2->where('name', 'like', "%{$search}%"))
            ->orWhereHas('district', fn($q2) => $q2->where('name', 'like', "%{$search}%"))
            ->orWhereHas('pengelolaHutan', fn($q2) => $q2->where('name', 'like', "%{$search}%"))
            ->orWhereHas('pengelolaWisata', fn($q2) => $q2->where('name', 'like', "%{$search}%"));
        });
      })

      ->when($sortField === 'location', function ($q) use ($sortDirection) {
        $q->leftJoin('m_regencies', 'hasil_hutan_bukan_kayu.regency_id', '=', 'm_regencies.id')
          ->leftJoin('m_districts', 'hasil_hutan_bukan_kayu.district_id', '=', 'm_districts.id')
          ->orderByRaw("COALESCE(m_districts.name, m_regencies.name) $sortDirection");
      })
      ->when($sortField === 'pengelola', function ($q) use ($sortDirection) {
        $q->leftJoin('m_pengelola_hutan', 'hasil_hutan_bukan_kayu.pengelola_hutan_id', '=', 'm_pengelola_hutan.id')
          ->leftJoin('m_pengelola_wisata', 'hasil_hutan_bukan_kayu.pengelola_wisata_id', '=', 'm_pengelola_wisata.id')
          ->orderByRaw("COALESCE(m_pengelola_hutan.name, m_pengelola_wisata.name) $sortDirection");
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
          // 'volume' => $q->orderBy('volume_target', $sortDirection), // Sorting by target volume
          'status' => $q->orderBy('status', $sortDirection),
          default => $q->orderBy('created_at', 'desc'),
        };
      })

      ->paginate($request->integer('per_page', 10))
      ->withQueryString();

    // Stats with caching
    $cacheKey = "hhbk-stats-{$forestType}-{$selectedYear}";
    $stats = cache()->remember($cacheKey, 300, function () use ($forestType, $selectedYear) {
      return [
        'total_count' => HasilHutanBukanKayu::where('forest_type', $forestType)
          ->where('year', $selectedYear)
          ->whereNull('deleted_at')
          ->count(),
        'total_volume' => HasilHutanBukanKayu::where('forest_type', $forestType)
          ->where('year', $selectedYear)
          ->where('status', 'final')
          ->whereNull('deleted_at')
          ->sum('volume_target'),
        'total_volume_realization' => HasilHutanBukanKayu::where('forest_type', $forestType)
          ->where('year', $selectedYear)
          ->where('status', 'final')
          ->whereNull('deleted_at')
          ->whereHas('details')
          ->withSum('details', 'annual_volume_realization')
          ->get()
          ->sum('details_sum_annual_volume_realization'),
        'verified_count' => HasilHutanBukanKayu::where('forest_type', $forestType)
          ->where('year', $selectedYear)
          ->where('status', 'final')
          ->whereNull('deleted_at')
          ->count(),
      ];
    });

    // Available Years with caching
    $yearsCacheKey = "hhbk-years-{$forestType}";
    $availableYears = cache()->remember($yearsCacheKey, 3600, function () use ($forestType) {
      $dbYears = HasilHutanBukanKayu::where('forest_type', $forestType)
        ->distinct()
        ->pluck('year')
        ->toArray();
      $fixedYears = range(2025, 2021);
      $years = array_unique(array_merge($dbYears, $fixedYears));
      rsort($years);
      return $years;
    });

    return Inertia::render('HasilHutanBukanKayu/Index', [
      'datas' => $datas,
      'forest_type' => $forestType,
      'stats' => $stats,
      'available_years' => $availableYears,
      'filters' => [
        'year' => (int) $selectedYear,
        'search' => $request->search,
        'sort' => $sortField,
        'direction' => $sortDirection,
        'per_page' => (int) $request->query('per_page', 10),
      ],
    ]);
  }

  public function create(Request $request)
  {
    $forestType = $request->query('forest_type', 'Hutan Negara');

    return Inertia::render('HasilHutanBukanKayu/Create', [
      'forest_type' => $forestType,
      'bukan_kayu_list' => \App\Models\BukanKayu::all(),
      'provinces' => DB::table('m_provinces')->where('id', '35')->get(),
      'regencies' => DB::table('m_regencies')->where('province_id', '35')->get(),
      'pengelola_hutan' => \App\Models\PengelolaHutan::all(),
      'pengelola_wisata_list' => \App\Models\PengelolaWisata::all(),
    ]);
  }

  public function store(Request $request)
  {
    $validated = $request->validate([
      'year' => 'required|integer|digits:4',
      'month' => 'required|integer|min:1|max:12',
      'province_id' => 'required|exists:m_provinces,id',
      'regency_id' => 'required|exists:m_regencies,id',
      'district_id' => 'nullable|exists:m_districts,id',
      'pengelola_hutan_id' => 'nullable|exists:m_pengelola_hutan,id',
      'pengelola_wisata_id' => 'nullable|exists:m_pengelola_wisata,id',
      'forest_type' => 'required|in:Hutan Negara,Hutan Rakyat,Perhutanan Sosial',
      'volume_target' => 'required|numeric|min:0',
      'details' => 'required|array|min:1',
      'details.*.bukan_kayu_id' => 'required|exists:m_bukan_kayu,id',
      'details.*.annual_volume_realization' => 'nullable|numeric|min:0',
      'details.*.unit' => 'nullable|string',
    ]);

    // Custom Validation
    if ($validated['forest_type'] === 'Perhutanan Sosial' && empty($validated['pengelola_wisata_id'])) {
      return redirect()->back()->withErrors(['pengelola_wisata_id' => 'Pengelola wajib diisi untuk Perhutanan Sosial.'])->withInput();
    }
    if ($validated['forest_type'] === 'Hutan Rakyat' && empty($validated['district_id'])) {
      return redirect()->back()->withErrors(['district_id' => 'Kecamatan wajib diisi untuk Hutan Rakyat.'])->withInput();
    }
    if ($validated['forest_type'] === 'Hutan Negara' && empty($validated['pengelola_hutan_id'])) {
      return redirect()->back()->withErrors(['pengelola_hutan_id' => 'Pengelola Hutan wajib diisi untuk Hutan Negara.'])->withInput();
    }

    DB::transaction(function () use ($validated) {
      $parent = HasilHutanBukanKayu::create([
        'year' => $validated['year'],
        'month' => $validated['month'],
        'province_id' => $validated['province_id'],
        'regency_id' => $validated['regency_id'],
        'district_id' => $validated['forest_type'] === 'Hutan Rakyat' ? $validated['district_id'] : null,
        'pengelola_hutan_id' => $validated['forest_type'] === 'Hutan Negara' ? $validated['pengelola_hutan_id'] : null,
        'pengelola_wisata_id' => $validated['forest_type'] === 'Perhutanan Sosial' ? $validated['pengelola_wisata_id'] : null,
        'forest_type' => $validated['forest_type'],
        'volume_target' => $validated['volume_target'],
        'status' => 'draft'
      ]);

      foreach ($validated['details'] as $detail) {
        $parent->details()->create([
          'bukan_kayu_id' => $detail['bukan_kayu_id'],
          'annual_volume_realization' => $detail['annual_volume_realization'] ?? 0,
          'unit' => $detail['unit'] ?? 'Kg',
        ]);
      }
    });

    cache()->forget("hhbk-stats-{$validated['forest_type']}-{$validated['year']}");

    return redirect()->route('hasil-hutan-bukan-kayu.index', ['forest_type' => $validated['forest_type']])
      ->with('success', 'Data berhasil ditambahkan');
  }

  public function edit(HasilHutanBukanKayu $hasilHutanBukanKayu)
  {
    return Inertia::render('HasilHutanBukanKayu/Edit', [
      'data' => $hasilHutanBukanKayu->load(['details.bukanKayu', 'regency', 'district', 'pengelolaHutan', 'pengelolaWisata']),
      'bukan_kayu_list' => \App\Models\BukanKayu::all(),
      'provinces' => DB::table('m_provinces')->where('id', '35')->get(),
      'regencies' => DB::table('m_regencies')->where('province_id', '35')->get(),
      'districts' => DB::table('m_districts')->where('regency_id', $hasilHutanBukanKayu->regency_id)->get(),
      'pengelola_hutan' => \App\Models\PengelolaHutan::all(),
      'pengelola_wisata_list' => \App\Models\PengelolaWisata::all(),
    ]);
  }

  public function update(Request $request, HasilHutanBukanKayu $hasilHutanBukanKayu)
  {
    $validated = $request->validate([
      'year' => 'required|integer|digits:4',
      'month' => 'required|integer|min:1|max:12',
      'province_id' => 'required|exists:m_provinces,id',
      'regency_id' => 'required|exists:m_regencies,id',
      'district_id' => 'nullable|exists:m_districts,id',
      'pengelola_hutan_id' => 'nullable|exists:m_pengelola_hutan,id',
      'pengelola_wisata_id' => 'nullable|exists:m_pengelola_wisata,id',
      'forest_type' => 'required|in:Hutan Negara,Hutan Rakyat,Perhutanan Sosial',
      'volume_target' => 'required|numeric|min:0',
      'details' => 'required|array|min:1',
      'details.*.bukan_kayu_id' => 'required|exists:m_bukan_kayu,id',
      'details.*.annual_volume_realization' => 'nullable|numeric|min:0',
      'details.*.unit' => 'nullable|string',
    ]);

    // Custom Validation
    if ($validated['forest_type'] === 'Perhutanan Sosial' && empty($validated['pengelola_wisata_id'])) {
      return redirect()->back()->withErrors(['pengelola_wisata_id' => 'Pengelola wajib diisi untuk Perhutanan Sosial.'])->withInput();
    }
    if ($validated['forest_type'] === 'Hutan Rakyat' && empty($validated['district_id'])) {
      return redirect()->back()->withErrors(['district_id' => 'Kecamatan wajib diisi untuk Hutan Rakyat.'])->withInput();
    }
    if ($validated['forest_type'] === 'Hutan Negara' && empty($validated['pengelola_hutan_id'])) {
      return redirect()->back()->withErrors(['pengelola_hutan_id' => 'Pengelola Hutan wajib diisi untuk Hutan Negara.'])->withInput();
    }

    DB::transaction(function () use ($validated, $hasilHutanBukanKayu) {
      $hasilHutanBukanKayu->update([
        'year' => $validated['year'],
        'month' => $validated['month'],
        'province_id' => $validated['province_id'],
        'regency_id' => $validated['regency_id'],
        'district_id' => $validated['forest_type'] === 'Hutan Rakyat' ? $validated['district_id'] : null,
        'pengelola_hutan_id' => $validated['forest_type'] === 'Hutan Negara' ? $validated['pengelola_hutan_id'] : null,
        'pengelola_wisata_id' => $validated['forest_type'] === 'Perhutanan Sosial' ? $validated['pengelola_wisata_id'] : null,
        'forest_type' => $validated['forest_type'],
        'volume_target' => $validated['volume_target'],
      ]);

      $hasilHutanBukanKayu->details()->delete();
      foreach ($validated['details'] as $detail) {
        $hasilHutanBukanKayu->details()->create([
          'bukan_kayu_id' => $detail['bukan_kayu_id'],
          'annual_volume_realization' => $detail['annual_volume_realization'] ?? 0,
          'unit' => $detail['unit'] ?? 'Kg',
        ]);
      }
    });

    cache()->forget("hhbk-stats-{$hasilHutanBukanKayu->forest_type}-{$hasilHutanBukanKayu->year}");

    return redirect()->route('hasil-hutan-bukan-kayu.index', ['forest_type' => $hasilHutanBukanKayu->forest_type])
      ->with('success', 'Data berhasil diperbarui');
  }

  public function destroy(HasilHutanBukanKayu $hasilHutanBukanKayu)
  {
    $forestType = $hasilHutanBukanKayu->forest_type;
    $year = $hasilHutanBukanKayu->year;
    $hasilHutanBukanKayu->delete();

    cache()->forget("hhbk-stats-{$forestType}-{$year}");

    return redirect()->route('hasil-hutan-bukan-kayu.index', ['forest_type' => $forestType])
      ->with('success', 'Data berhasil dihapus');
  }

  /**
   * Single workflow action.
   */
  public function singleWorkflowAction(Request $request, HasilHutanBukanKayu $hasilHutanBukanKayu, SingleWorkflowAction $action)
  {
    $request->validate([
      'action' => ['required', Rule::enum(WorkflowAction::class)],
      'rejection_note' => 'nullable|string|max:255',
    ]);

    $workflowAction = WorkflowAction::from($request->action);

    match ($workflowAction) {
      WorkflowAction::SUBMIT => $this->authorize('bina-usaha.edit'),
      WorkflowAction::APPROVE, WorkflowAction::REJECT => $this->authorize('bina-usaha.approve'),
      WorkflowAction::DELETE => $this->authorize('bina-usaha.delete'),
    };

    if ($workflowAction === WorkflowAction::REJECT && !$request->filled('rejection_note')) {
      return redirect()->back()->with('error', 'Catatan penolakan wajib diisi.');
    }

    $extraData = [];
    if ($request->filled('rejection_note')) {
      $extraData['rejection_note'] = $request->rejection_note;
    }

    $success = $action->execute(
      model: $hasilHutanBukanKayu,
      action: $workflowAction,
      user: auth()->user(),
      extraData: $extraData
    );

    if ($success) {
      cache()->forget("hhbk-stats-{$hasilHutanBukanKayu->forest_type}-{$hasilHutanBukanKayu->year}");

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

  public function export(Request $request)
  {
    $forestType = $request->query('forest_type', 'Hutan Negara');
    $year = $request->query('year');
    return \Maatwebsite\Excel\Facades\Excel::download(new \App\Exports\HasilHutanBukanKayuExport($forestType, $year), 'hasil-hutan-bukan-kayu-' . date('Y-m-d') . '.xlsx');
  }

  public function template(Request $request)
  {
    $forestType = $request->query('forest_type', 'Hutan Negara');
    return \Maatwebsite\Excel\Facades\Excel::download(new \App\Exports\HasilHutanBukanKayuTemplateExport($forestType), 'template_import_hasil_hutan_bukan_kayu.xlsx');
  }

  public function import(Request $request)
  {
    $request->validate([
      'file' => 'required|mimes:xlsx,csv,xls',
      'forest_type' => 'required',
    ]);

    $import = new \App\Imports\HasilHutanBukanKayuImport($request->forest_type);

    try {
      \Maatwebsite\Excel\Facades\Excel::import($import, $request->file('file'));
    } catch (\Maatwebsite\Excel\Validators\ValidationException $e) {
      return redirect()->back()->with('import_errors', $this->mapImportFailures($e->failures()));
    }

    if ($import->failures()->isNotEmpty()) {
      return redirect()->back()->with('import_errors', $this->mapImportFailures($import->failures()));
    }

    // Clear cache for last 5 years as import might contain multiple years
    foreach (range(date('Y'), date('Y') - 5) as $y) {
      cache()->forget("hhbk-stats-{$request->forest_type}-{$y}");
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
      'ids.*' => 'exists:hasil_hutan_bukan_kayu,id',
      'action' => ['required', Rule::enum(WorkflowAction::class)],
      'rejection_note' => 'nullable|string|max:255',
    ]);

    $workflowAction = WorkflowAction::from($request->action);

    match ($workflowAction) {
      WorkflowAction::SUBMIT => $this->authorize('bina-usaha.edit'),
      WorkflowAction::APPROVE, WorkflowAction::REJECT => $this->authorize('bina-usaha.approve'),
      WorkflowAction::DELETE => $this->authorize('bina-usaha.delete'),
    };

    if ($workflowAction === WorkflowAction::REJECT && !$request->filled('rejection_note')) {
      return redirect()->back()->with('error', 'Catatan penolakan wajib diisi.');
    }

    $extraData = [];
    if ($request->filled('rejection_note')) {
      $extraData['rejection_note'] = $request->rejection_note;
    }

    $count = $action->execute(
      model: HasilHutanBukanKayu::class,
      action: $workflowAction,
      ids: $request->ids,
      user: auth()->user(),
      extraData: $extraData
    );

    // Clear cache
    $affected = HasilHutanBukanKayu::withTrashed()->whereIn('id', $request->ids)->get();
    foreach ($affected as $item) {
      cache()->forget("hhbk-stats-{$item->forest_type}-{$item->year}");
    }

    $message = match ($workflowAction) {
      WorkflowAction::DELETE => 'dihapus',
      WorkflowAction::SUBMIT => 'diajukan',
      WorkflowAction::APPROVE => 'disetujui',
      WorkflowAction::REJECT => 'ditolak',
    };

    return redirect()->back()->with('success', "{$count} data berhasil {$message}.");
  }
}
