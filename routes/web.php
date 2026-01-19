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

Route::middleware('auth')->group(function () {
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

    Route::resource('rehab-manggrove', RehabManggroveController::class);
});

require __DIR__ . '/auth.php';
