<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\RehabLahanController;
use App\Http\Controllers\PenghijauanLingkunganController;
use App\Http\Controllers\RehabManggroveController;
use App\Http\Controllers\RhlTeknisController;
use App\Http\Controllers\LocationController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
|
*/

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/dashboard', [DashboardController::class, 'index'])->middleware(['auth', 'verified'])->name('dashboard');

// Public Dashboard Routes
Route::get('/public/dashboard', [DashboardController::class, 'publicDashboard'])->name('public.dashboard');

Route::middleware('auth')->group(function () {
    // Dashboard Export
    Route::get('/dashboard/export-rehab-lahan', [DashboardController::class, 'exportRehabLahan'])->name('dashboard.export-rehab-lahan');

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::get('/locations/regencies/{provinceId}', [LocationController::class, 'getRegencies'])->name('locations.regencies');
    Route::get('/locations/districts/{regencyId}', [LocationController::class, 'getDistricts'])->name('locations.districts');
    Route::get('/locations/villages/{districtId}', [LocationController::class, 'getVillages'])->name('locations.villages');

    Route::post('/rehab-lahan/{rehab_lahan}/submit', [RehabLahanController::class, 'submit'])->name('rehab-lahan.submit');
    Route::post('/rehab-lahan/{rehab_lahan}/approve', [RehabLahanController::class, 'approve'])->name('rehab-lahan.approve');
    Route::post('/rehab-lahan/{rehab_lahan}/reject', [RehabLahanController::class, 'reject'])->name('rehab-lahan.reject');
    Route::resource('rehab-lahan', RehabLahanController::class);

    Route::post('/penghijauan-lingkungan/{penghijauan_lingkungan}/submit', [PenghijauanLingkunganController::class, 'submit'])->name('penghijauan-lingkungan.submit');
    Route::post('/penghijauan-lingkungan/{penghijauan_lingkungan}/approve', [PenghijauanLingkunganController::class, 'approve'])->name('penghijauan-lingkungan.approve');
    Route::post('/penghijauan-lingkungan/{penghijauan_lingkungan}/reject', [PenghijauanLingkunganController::class, 'reject'])->name('penghijauan-lingkungan.reject');
    Route::resource('penghijauan-lingkungan', PenghijauanLingkunganController::class);

    Route::post('/rehab-manggrove/{rehab_manggrove}/submit', [RehabManggroveController::class, 'submit'])->name('rehab-manggrove.submit');
    Route::post('/rehab-manggrove/{rehab_manggrove}/approve', [RehabManggroveController::class, 'approve'])->name('rehab-manggrove.approve');
    Route::post('/rehab-manggrove/{rehab_manggrove}/reject', [RehabManggroveController::class, 'reject'])->name('rehab-manggrove.reject');

    // RHL Teknis
    Route::resource('rhl-teknis', RhlTeknisController::class)->parameters(['rhl-teknis' => 'rhl_teknis']);
    Route::post('/rhl-teknis/{rhl_teknis}/submit', [RhlTeknisController::class, 'submit'])->name('rhl-teknis.submit');
    Route::post('/rhl-teknis/{rhl_teknis}/approve', [RhlTeknisController::class, 'approve'])->name('rhl-teknis.approve');
    Route::post('/rhl-teknis/{rhl_teknis}/reject', [RhlTeknisController::class, 'reject'])->name('rhl-teknis.reject');

    // Reboisasi Area PS
    Route::resource('reboisasi-ps', \App\Http\Controllers\ReboisasiPsController::class)->parameters(['reboisasi-ps' => 'reboisasi_ps']);
    Route::post('/reboisasi-ps/{reboisasi_ps}/submit', [\App\Http\Controllers\ReboisasiPsController::class, 'submit'])->name('reboisasi-ps.submit');
    Route::post('/reboisasi-ps/{reboisasi_ps}/approve', [\App\Http\Controllers\ReboisasiPsController::class, 'approve'])->name('reboisasi-ps.approve');
    Route::post('/reboisasi-ps/{reboisasi_ps}/reject', [\App\Http\Controllers\ReboisasiPsController::class, 'reject'])->name('reboisasi-ps.reject');

    // Pengunjung Objek Wisata
    Route::resource('pengunjung-wisata', \App\Http\Controllers\PengunjungWisataController::class)->parameters(['pengunjung-wisata' => 'pengunjung_wisata']);
    Route::post('/pengunjung-wisata/{pengunjung_wisata}/submit', [\App\Http\Controllers\PengunjungWisataController::class, 'submit'])->name('pengunjung-wisata.submit');
    Route::post('/pengunjung-wisata/{pengunjung_wisata}/approve', [\App\Http\Controllers\PengunjungWisataController::class, 'approve'])->name('pengunjung-wisata.approve');
    Route::post('/pengunjung-wisata/{pengunjung_wisata}/reject', [\App\Http\Controllers\PengunjungWisataController::class, 'reject'])->name('pengunjung-wisata.reject');

    // Kebakaran Hutan
    Route::resource('kebakaran-hutan', \App\Http\Controllers\KebakaranHutanController::class)->parameters(['kebakaran-hutan' => 'kebakaran_hutan']);
    Route::post('/kebakaran-hutan/{kebakaran_hutan}/submit', [\App\Http\Controllers\KebakaranHutanController::class, 'submit'])->name('kebakaran-hutan.submit');
    Route::post('/kebakaran-hutan/{kebakaran_hutan}/approve', [\App\Http\Controllers\KebakaranHutanController::class, 'approve'])->name('kebakaran-hutan.approve');
    Route::post('/kebakaran-hutan/{kebakaran_hutan}/reject', [\App\Http\Controllers\KebakaranHutanController::class, 'reject'])->name('kebakaran-hutan.reject');

    Route::resource('rehab-manggrove', RehabManggroveController::class);

    // Hasil Hutan Kayu
    Route::get('hasil-hutan-kayu/export', [\App\Http\Controllers\HasilHutanKayuController::class, 'export'])->name('hasil-hutan-kayu.export');
    Route::get('hasil-hutan-kayu/template', [\App\Http\Controllers\HasilHutanKayuController::class, 'template'])->name('hasil-hutan-kayu.template');
    Route::post('hasil-hutan-kayu/import', [\App\Http\Controllers\HasilHutanKayuController::class, 'import'])->name('hasil-hutan-kayu.import');
    Route::resource('hasil-hutan-kayu', \App\Http\Controllers\HasilHutanKayuController::class)->parameters(['hasil-hutan-kayu' => 'hasil_hutan_kayu']);
    Route::post('/hasil-hutan-kayu/{hasil_hutan_kayu}/submit', [\App\Http\Controllers\HasilHutanKayuController::class, 'submit'])->name('hasil-hutan-kayu.submit');
    Route::post('/hasil-hutan-kayu/{hasil_hutan_kayu}/approve', [\App\Http\Controllers\HasilHutanKayuController::class, 'approve'])->name('hasil-hutan-kayu.approve');
    Route::post('/hasil-hutan-kayu/{hasil_hutan_kayu}/reject', [\App\Http\Controllers\HasilHutanKayuController::class, 'reject'])->name('hasil-hutan-kayu.reject');

    // Hasil Hutan Bukan Kayu
    Route::get('hasil-hutan-bukan-kayu/export', [\App\Http\Controllers\HasilHutanBukanKayuController::class, 'export'])->name('hasil-hutan-bukan-kayu.export');
    Route::get('hasil-hutan-bukan-kayu/template', [\App\Http\Controllers\HasilHutanBukanKayuController::class, 'template'])->name('hasil-hutan-bukan-kayu.template');
    Route::post('hasil-hutan-bukan-kayu/import', [\App\Http\Controllers\HasilHutanBukanKayuController::class, 'import'])->name('hasil-hutan-bukan-kayu.import');
    Route::resource('hasil-hutan-bukan-kayu', \App\Http\Controllers\HasilHutanBukanKayuController::class)->parameters(['hasil-hutan-bukan-kayu' => 'hasil_hutan_bukan_kayu']);
    Route::post('/hasil-hutan-bukan-kayu/{hasil_hutan_bukan_kayu}/submit', [\App\Http\Controllers\HasilHutanBukanKayuController::class, 'submit'])->name('hasil-hutan-bukan-kayu.submit');
    Route::post('/hasil-hutan-bukan-kayu/{hasil_hutan_bukan_kayu}/approve', [\App\Http\Controllers\HasilHutanBukanKayuController::class, 'approve'])->name('hasil-hutan-bukan-kayu.approve');
    Route::post('/hasil-hutan-bukan-kayu/{hasil_hutan_bukan_kayu}/reject', [\App\Http\Controllers\HasilHutanBukanKayuController::class, 'reject'])->name('hasil-hutan-bukan-kayu.reject');

    // Industri Berizin
    Route::resource('industri-berizin', \App\Http\Controllers\IndustriBerizinController::class)->parameters(['industri-berizin' => 'industri_berizin']);
    Route::post('/industri-berizin/{industri_berizin}/submit', [\App\Http\Controllers\IndustriBerizinController::class, 'submit'])->name('industri-berizin.submit');
    Route::post('/industri-berizin/{industri_berizin}/approve', [\App\Http\Controllers\IndustriBerizinController::class, 'approve'])->name('industri-berizin.approve');
    Route::post('/industri-berizin/{industri_berizin}/reject', [\App\Http\Controllers\IndustriBerizinController::class, 'reject'])->name('industri-berizin.reject');

    // Realisasi PNBP
    Route::resource('realisasi-pnbp', \App\Http\Controllers\RealisasiPnbpController::class)->parameters(['realisasi-pnbp' => 'realisasi_pnbp']);
    Route::post('/realisasi-pnbp/{realisasi_pnbp}/submit', [\App\Http\Controllers\RealisasiPnbpController::class, 'submit'])->name('realisasi-pnbp.submit');
    Route::post('/realisasi-pnbp/{realisasi_pnbp}/approve', [\App\Http\Controllers\RealisasiPnbpController::class, 'approve'])->name('realisasi-pnbp.approve');
    Route::post('/realisasi-pnbp/{realisasi_pnbp}/reject', [\App\Http\Controllers\RealisasiPnbpController::class, 'reject'])->name('realisasi-pnbp.reject');

    // Perkembangan SK PS
    Route::resource('skps', \App\Http\Controllers\SkpsController::class);
    Route::post('/skps/{skps}/submit', [\App\Http\Controllers\SkpsController::class, 'submit'])->name('skps.submit');
    Route::post('/skps/{skps}/approve', [\App\Http\Controllers\SkpsController::class, 'approve'])->name('skps.approve');
    Route::post('/skps/{skps}/reject', [\App\Http\Controllers\SkpsController::class, 'reject'])->name('skps.reject');

    // Perkembangan KUPS
    Route::resource('kups', \App\Http\Controllers\KupsController::class);
    Route::post('/kups/{kups}/submit', [\App\Http\Controllers\KupsController::class, 'submit'])->name('kups.submit');
    Route::post('/kups/{kups}/approve', [\App\Http\Controllers\KupsController::class, 'approve'])->name('kups.approve');
    Route::post('/kups/{kups}/reject', [\App\Http\Controllers\KupsController::class, 'reject'])->name('kups.reject');
    // User Management
    // User Management
    Route::resource('users', \App\Http\Controllers\UserController::class);

    // Impersonation Routes
    Route::impersonate();

    // Activity Log
    Route::resource('activity-log', \App\Http\Controllers\ActivityLogController::class)->only(['index']);
});

require __DIR__ . '/auth.php';
