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
    Route::get('rehab-lahan/export', [RehabLahanController::class, 'export'])->name('rehab-lahan.export');
    Route::get('rehab-lahan/template', [RehabLahanController::class, 'template'])->name('rehab-lahan.template');
    Route::post('rehab-lahan/import', [RehabLahanController::class, 'import'])->name('rehab-lahan.import');
    Route::resource('rehab-lahan', RehabLahanController::class);

    Route::post('/penghijauan-lingkungan/{penghijauan_lingkungan}/submit', [PenghijauanLingkunganController::class, 'submit'])->name('penghijauan-lingkungan.submit');
    Route::post('/penghijauan-lingkungan/{penghijauan_lingkungan}/approve', [PenghijauanLingkunganController::class, 'approve'])->name('penghijauan-lingkungan.approve');
    Route::post('/penghijauan-lingkungan/{penghijauan_lingkungan}/reject', [PenghijauanLingkunganController::class, 'reject'])->name('penghijauan-lingkungan.reject');
    Route::get('penghijauan-lingkungan/export', [PenghijauanLingkunganController::class, 'export'])->name('penghijauan-lingkungan.export');
    Route::get('penghijauan-lingkungan/template', [PenghijauanLingkunganController::class, 'template'])->name('penghijauan-lingkungan.template');
    Route::post('penghijauan-lingkungan/import', [PenghijauanLingkunganController::class, 'import'])->name('penghijauan-lingkungan.import');
    Route::resource('penghijauan-lingkungan', PenghijauanLingkunganController::class);

    Route::post('/rehab-manggrove/{rehab_manggrove}/submit', [RehabManggroveController::class, 'submit'])->name('rehab-manggrove.submit');
    Route::post('/rehab-manggrove/{rehab_manggrove}/approve', [RehabManggroveController::class, 'approve'])->name('rehab-manggrove.approve');
    Route::post('/rehab-manggrove/{rehab_manggrove}/reject', [RehabManggroveController::class, 'reject'])->name('rehab-manggrove.reject');
    Route::get('rehab-manggrove/export', [RehabManggroveController::class, 'export'])->name('rehab-manggrove.export');
    Route::get('rehab-manggrove/template', [RehabManggroveController::class, 'template'])->name('rehab-manggrove.template');
    Route::post('rehab-manggrove/import', [RehabManggroveController::class, 'import'])->name('rehab-manggrove.import');

    // RHL Teknis
    Route::get('rhl-teknis/export', [RhlTeknisController::class, 'export'])->name('rhl-teknis.export');
    Route::get('rhl-teknis/template', [RhlTeknisController::class, 'template'])->name('rhl-teknis.template');
    Route::post('rhl-teknis/import', [RhlTeknisController::class, 'import'])->name('rhl-teknis.import');
    Route::resource('rhl-teknis', RhlTeknisController::class)->parameters(['rhl-teknis' => 'rhl_teknis']);
    Route::post('/rhl-teknis/{rhl_teknis}/submit', [RhlTeknisController::class, 'submit'])->name('rhl-teknis.submit');
    Route::post('/rhl-teknis/{rhl_teknis}/approve', [RhlTeknisController::class, 'approve'])->name('rhl-teknis.approve');
    Route::post('/rhl-teknis/{rhl_teknis}/reject', [RhlTeknisController::class, 'reject'])->name('rhl-teknis.reject');

    // Reboisasi Area PS
    Route::get('reboisasi-ps/export', [\App\Http\Controllers\ReboisasiPsController::class, 'export'])->name('reboisasi-ps.export');
    Route::get('reboisasi-ps/template', [\App\Http\Controllers\ReboisasiPsController::class, 'template'])->name('reboisasi-ps.template');
    Route::post('reboisasi-ps/import', [\App\Http\Controllers\ReboisasiPsController::class, 'import'])->name('reboisasi-ps.import');
    Route::resource('reboisasi-ps', \App\Http\Controllers\ReboisasiPsController::class)->parameters(['reboisasi-ps' => 'reboisasi_ps']);
    Route::post('/reboisasi-ps/{reboisasi_ps}/submit', [\App\Http\Controllers\ReboisasiPsController::class, 'submit'])->name('reboisasi-ps.submit');
    Route::post('/reboisasi-ps/{reboisasi_ps}/approve', [\App\Http\Controllers\ReboisasiPsController::class, 'approve'])->name('reboisasi-ps.approve');
    Route::post('/reboisasi-ps/{reboisasi_ps}/reject', [\App\Http\Controllers\ReboisasiPsController::class, 'reject'])->name('reboisasi-ps.reject');


    // Pengunjung Objek Wisata
    Route::get('pengunjung-wisata/export', [\App\Http\Controllers\PengunjungWisataController::class, 'export'])->name('pengunjung-wisata.export');
    Route::get('pengunjung-wisata/template', [\App\Http\Controllers\PengunjungWisataController::class, 'template'])->name('pengunjung-wisata.template');
    Route::post('pengunjung-wisata/import', [\App\Http\Controllers\PengunjungWisataController::class, 'import'])->name('pengunjung-wisata.import');
    Route::resource('pengunjung-wisata', \App\Http\Controllers\PengunjungWisataController::class)->parameters(['pengunjung-wisata' => 'pengunjung_wisata']);
    Route::post('/pengunjung-wisata/{pengunjung_wisata}/submit', [\App\Http\Controllers\PengunjungWisataController::class, 'submit'])->name('pengunjung-wisata.submit');
    Route::post('/pengunjung-wisata/{pengunjung_wisata}/approve', [\App\Http\Controllers\PengunjungWisataController::class, 'approve'])->name('pengunjung-wisata.approve');
    Route::post('/pengunjung-wisata/{pengunjung_wisata}/reject', [\App\Http\Controllers\PengunjungWisataController::class, 'reject'])->name('pengunjung-wisata.reject');

    // Kebakaran Hutan
    Route::get('kebakaran-hutan/export', [\App\Http\Controllers\KebakaranHutanController::class, 'export'])->name('kebakaran-hutan.export');
    Route::get('kebakaran-hutan/template', [\App\Http\Controllers\KebakaranHutanController::class, 'template'])->name('kebakaran-hutan.template');
    Route::post('kebakaran-hutan/import', [\App\Http\Controllers\KebakaranHutanController::class, 'import'])->name('kebakaran-hutan.import');
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

    // PBPHH
    Route::get('pbphh/export', [\App\Http\Controllers\PbphhController::class, 'export'])->name('pbphh.export');
    Route::get('pbphh/template', [\App\Http\Controllers\PbphhController::class, 'template'])->name('pbphh.template');
    Route::post('pbphh/import', [\App\Http\Controllers\PbphhController::class, 'import'])->name('pbphh.import');
    Route::resource('pbphh', \App\Http\Controllers\PbphhController::class);
    Route::post('/pbphh/{pbphh}/submit', [\App\Http\Controllers\PbphhController::class, 'submit'])->name('pbphh.submit');
    Route::post('/pbphh/{pbphh}/approve', [\App\Http\Controllers\PbphhController::class, 'approve'])->name('pbphh.approve');
    Route::post('/pbphh/{pbphh}/reject', [\App\Http\Controllers\PbphhController::class, 'reject'])->name('pbphh.reject');

    // Realisasi PNBP
    Route::get('realisasi-pnbp/export', [\App\Http\Controllers\RealisasiPnbpController::class, 'export'])->name('realisasi-pnbp.export');
    Route::get('realisasi-pnbp/template', [\App\Http\Controllers\RealisasiPnbpController::class, 'template'])->name('realisasi-pnbp.template');
    Route::post('realisasi-pnbp/import', [\App\Http\Controllers\RealisasiPnbpController::class, 'import'])->name('realisasi-pnbp.import');
    Route::resource('realisasi-pnbp', \App\Http\Controllers\RealisasiPnbpController::class)->parameters(['realisasi-pnbp' => 'realisasi_pnbp']);
    Route::post('/realisasi-pnbp/{realisasi_pnbp}/submit', [\App\Http\Controllers\RealisasiPnbpController::class, 'submit'])->name('realisasi-pnbp.submit');
    Route::post('/realisasi-pnbp/{realisasi_pnbp}/approve', [\App\Http\Controllers\RealisasiPnbpController::class, 'approve'])->name('realisasi-pnbp.approve');
    Route::post('/realisasi-pnbp/{realisasi_pnbp}/reject', [\App\Http\Controllers\RealisasiPnbpController::class, 'reject'])->name('realisasi-pnbp.reject');

    // Perkembangan SK PS
    Route::get('skps/export', [\App\Http\Controllers\SkpsController::class, 'export'])->name('skps.export');
    Route::get('skps/template', [\App\Http\Controllers\SkpsController::class, 'template'])->name('skps.template');
    Route::post('skps/import', [\App\Http\Controllers\SkpsController::class, 'import'])->name('skps.import');
    Route::resource('skps', \App\Http\Controllers\SkpsController::class);
    Route::post('/skps/{skp}/submit', [\App\Http\Controllers\SkpsController::class, 'submit'])->name('skps.submit');
    Route::post('/skps/{skp}/approve', [\App\Http\Controllers\SkpsController::class, 'approve'])->name('skps.approve');
    Route::post('/skps/{skp}/reject', [\App\Http\Controllers\SkpsController::class, 'reject'])->name('skps.reject');

    // Perkembangan KUPS
    Route::get('kups/export', [\App\Http\Controllers\KupsController::class, 'export'])->name('kups.export');
    Route::get('kups/template', [\App\Http\Controllers\KupsController::class, 'template'])->name('kups.template');
    Route::post('kups/import', [\App\Http\Controllers\KupsController::class, 'import'])->name('kups.import');
    Route::resource('kups', \App\Http\Controllers\KupsController::class);
    Route::post('/kups/{kups}/submit', [\App\Http\Controllers\KupsController::class, 'submit'])->name('kups.submit');
    Route::post('/kups/{kups}/approve', [\App\Http\Controllers\KupsController::class, 'approve'])->name('kups.approve');
    Route::post('/kups/{kups}/reject', [\App\Http\Controllers\KupsController::class, 'reject'])->name('kups.reject');

    // Nilai Ekonomi (NEKON)
    Route::resource('nilai-ekonomi', \App\Http\Controllers\NilaiEkonomiController::class);
    Route::post('/nilai-ekonomi/{nilai_ekonomi}/submit', [\App\Http\Controllers\NilaiEkonomiController::class, 'submit'])->name('nilai-ekonomi.submit');
    Route::post('/nilai-ekonomi/{nilai_ekonomi}/approve', [\App\Http\Controllers\NilaiEkonomiController::class, 'approve'])->name('nilai-ekonomi.approve');
    Route::post('/nilai-ekonomi/{nilai_ekonomi}/reject', [\App\Http\Controllers\NilaiEkonomiController::class, 'reject'])->name('nilai-ekonomi.reject');


    // Perkembangan KTH
    Route::get('perkembangan-kth/export', [\App\Http\Controllers\PerkembanganKthController::class, 'export'])->name('perkembangan-kth.export');
    Route::get('perkembangan-kth/template', [\App\Http\Controllers\PerkembanganKthController::class, 'template'])->name('perkembangan-kth.template');
    Route::post('perkembangan-kth/import', [\App\Http\Controllers\PerkembanganKthController::class, 'import'])->name('perkembangan-kth.import');
    Route::resource('perkembangan-kth', \App\Http\Controllers\PerkembanganKthController::class)->parameters(['perkembangan-kth' => 'perkembangan_kth']);
    Route::post('/perkembangan-kth/{perkembangan_kth}/submit', [\App\Http\Controllers\PerkembanganKthController::class, 'submit'])->name('perkembangan-kth.submit');
    Route::post('/perkembangan-kth/{perkembangan_kth}/approve', [\App\Http\Controllers\PerkembanganKthController::class, 'approve'])->name('perkembangan-kth.approve');
    Route::post('/perkembangan-kth/{perkembangan_kth}/reject', [\App\Http\Controllers\PerkembanganKthController::class, 'reject'])->name('perkembangan-kth.reject');

    // Nilai Transaksi Ekonomi
    Route::get('nilai-transaksi-ekonomi/export', [\App\Http\Controllers\NilaiTransaksiEkonomiController::class, 'export'])->name('nilai-transaksi-ekonomi.export');
    Route::get('nilai-transaksi-ekonomi/template', [\App\Http\Controllers\NilaiTransaksiEkonomiController::class, 'template'])->name('nilai-transaksi-ekonomi.template');
    Route::post('nilai-transaksi-ekonomi/import', [\App\Http\Controllers\NilaiTransaksiEkonomiController::class, 'import'])->name('nilai-transaksi-ekonomi.import');
    Route::resource('nilai-transaksi-ekonomi', \App\Http\Controllers\NilaiTransaksiEkonomiController::class)->parameters(['nilai-transaksi-ekonomi' => 'nilai_transaksi_ekonomi']);
    Route::post('/nilai-transaksi-ekonomi/{nilai_transaksi_ekonomi}/submit', [\App\Http\Controllers\NilaiTransaksiEkonomiController::class, 'submit'])->name('nilai-transaksi-ekonomi.submit');
    Route::post('/nilai-transaksi-ekonomi/{nilai_transaksi_ekonomi}/approve', [\App\Http\Controllers\NilaiTransaksiEkonomiController::class, 'approve'])->name('nilai-transaksi-ekonomi.approve');
    Route::post('/nilai-transaksi-ekonomi/{nilai_transaksi_ekonomi}/reject', [\App\Http\Controllers\NilaiTransaksiEkonomiController::class, 'reject'])->name('nilai-transaksi-ekonomi.reject');

    // User Management
    // User Management
    Route::resource('users', \App\Http\Controllers\UserController::class);

    // Impersonation Routes
    Route::impersonate();


    // Activity Log
    Route::resource('activity-log', \App\Http\Controllers\ActivityLogController::class)->only(['index']);

    // Master Data
    Route::resource('provinces', \App\Http\Controllers\ProvinceController::class);
    Route::resource('regencies', \App\Http\Controllers\RegencyController::class);
    Route::resource('districts', \App\Http\Controllers\DistrictController::class);
    Route::resource('villages', \App\Http\Controllers\VillageController::class);
    Route::resource('bangunan-kta', \App\Http\Controllers\BangunanKtaController::class);
    Route::resource('sumber-dana', \App\Http\Controllers\SumberDanaController::class);
    Route::resource('commodities', \App\Http\Controllers\CommodityController::class);
    Route::resource('bukan-kayu', \App\Http\Controllers\BukanKayuController::class);
    Route::resource('kayu', \App\Http\Controllers\KayuController::class);
    Route::resource('jenis-produksi', \App\Http\Controllers\JenisProduksiController::class);
    Route::resource('pengelola-wisata', \App\Http\Controllers\PengelolaWisataController::class);
    Route::resource('skema-perhutanan-sosial', \App\Http\Controllers\SkemaPerhutananSosialController::class);
});

require __DIR__ . '/auth.php';
