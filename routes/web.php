<?php

use App\Http\Controllers\ActivityLogController;
use App\Http\Controllers\BangunanKtaController;
use App\Http\Controllers\BukanKayuController;
use App\Http\Controllers\CommodityController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DistrictController;
use App\Http\Controllers\HasilHutanBukanKayuController;
use App\Http\Controllers\HasilHutanKayuController;
use App\Http\Controllers\JenisProduksiController;
use App\Http\Controllers\KayuController;
use App\Http\Controllers\KebakaranHutanController;
use App\Http\Controllers\KupsController;
use App\Http\Controllers\NilaiEkonomiController;
use App\Http\Controllers\NilaiTransaksiEkonomiController;
use App\Http\Controllers\PbphhController;
use App\Http\Controllers\PengelolaWisataController;
use App\Http\Controllers\PengunjungWisataController;
use App\Http\Controllers\PerkembanganKthController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ProvinceController;
use App\Http\Controllers\RealisasiPnbpController;
use App\Http\Controllers\RegencyController;
use App\Http\Controllers\RehabLahanController;
use App\Http\Controllers\PenghijauanLingkunganController;
use App\Http\Controllers\RehabManggroveController;
use App\Http\Controllers\RhlTeknisController;
use App\Http\Controllers\LocationController;
use App\Http\Controllers\ReboisasiPsController;
use App\Http\Controllers\SkemaPerhutananSosialController;
use App\Http\Controllers\SkpsController;
use App\Http\Controllers\SumberDanaController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\VillageController;
use App\Http\Middleware\CheckDashboardAccess;
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

Route::get('/', [\App\Http\Controllers\WelcomeController::class, 'index']);

Route::middleware('auth')->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])
        ->middleware(['verified', CheckDashboardAccess::class])
        ->name('dashboard');

    // Public Dashboard Routes (Accessible by all authed users)
    Route::get('/public/dashboard', [DashboardController::class, 'publicDashboard'])->name('public.dashboard');
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
    Route::post('rehab-lahan/bulk-workflow-action', [RehabLahanController::class, 'bulkWorkflowAction'])->name('rehab-lahan.bulk-workflow-action');
    Route::resource('rehab-lahan', RehabLahanController::class);

    Route::post('/penghijauan-lingkungan/{penghijauan_lingkungan}/submit', [PenghijauanLingkunganController::class, 'submit'])->name('penghijauan-lingkungan.submit');
    Route::post('/penghijauan-lingkungan/{penghijauan_lingkungan}/approve', [PenghijauanLingkunganController::class, 'approve'])->name('penghijauan-lingkungan.approve');
    Route::post('/penghijauan-lingkungan/{penghijauan_lingkungan}/reject', [PenghijauanLingkunganController::class, 'reject'])->name('penghijauan-lingkungan.reject');
    Route::get('penghijauan-lingkungan/export', [PenghijauanLingkunganController::class, 'export'])->name('penghijauan-lingkungan.export');
    Route::get('penghijauan-lingkungan/template', [PenghijauanLingkunganController::class, 'template'])->name('penghijauan-lingkungan.template');
    Route::post('penghijauan-lingkungan/import', [PenghijauanLingkunganController::class, 'import'])->name('penghijauan-lingkungan.import');
    Route::post('penghijauan-lingkungan/bulk-workflow-action', [PenghijauanLingkunganController::class, 'bulkWorkflowAction'])->name('penghijauan-lingkungan.bulk-workflow-action');
    Route::resource('penghijauan-lingkungan', PenghijauanLingkunganController::class);

    Route::post('/rehab-manggrove/{rehab_manggrove}/submit', [RehabManggroveController::class, 'submit'])->name('rehab-manggrove.submit');
    Route::post('/rehab-manggrove/{rehab_manggrove}/approve', [RehabManggroveController::class, 'approve'])->name('rehab-manggrove.approve');
    Route::post('/rehab-manggrove/{rehab_manggrove}/reject', [RehabManggroveController::class, 'reject'])->name('rehab-manggrove.reject');
    Route::get('rehab-manggrove/export', [RehabManggroveController::class, 'export'])->name('rehab-manggrove.export');
    Route::get('rehab-manggrove/template', [RehabManggroveController::class, 'template'])->name('rehab-manggrove.template');
    Route::post('rehab-manggrove/import', [RehabManggroveController::class, 'import'])->name('rehab-manggrove.import');
    Route::post('rehab-manggrove/bulk-workflow-action', [RehabManggroveController::class, 'bulkWorkflowAction'])->name('rehab-manggrove.bulk-workflow-action');

    // RHL Teknis
    Route::get('rhl-teknis/export', [RhlTeknisController::class, 'export'])->name('rhl-teknis.export');
    Route::get('rhl-teknis/template', [RhlTeknisController::class, 'template'])->name('rhl-teknis.template');
    Route::post('rhl-teknis/import', [RhlTeknisController::class, 'import'])->name('rhl-teknis.import');
    Route::post('rhl-teknis/bulk-workflow-action', [RhlTeknisController::class, 'bulkWorkflowAction'])->name('rhl-teknis.bulk-workflow-action');
    Route::resource('rhl-teknis', RhlTeknisController::class)->parameters(['rhl-teknis' => 'rhl_teknis']);
    Route::post('/rhl-teknis/{rhl_teknis}/submit', [RhlTeknisController::class, 'submit'])->name('rhl-teknis.submit');
    Route::post('/rhl-teknis/{rhl_teknis}/approve', [RhlTeknisController::class, 'approve'])->name('rhl-teknis.approve');
    Route::post('/rhl-teknis/{rhl_teknis}/reject', [RhlTeknisController::class, 'reject'])->name('rhl-teknis.reject');

    // Reboisasi Area PS
    Route::get('reboisasi-ps/export', [ReboisasiPsController::class, 'export'])->name('reboisasi-ps.export');
    Route::get('reboisasi-ps/template', [ReboisasiPsController::class, 'template'])->name('reboisasi-ps.template');
    Route::post('reboisasi-ps/import', [ReboisasiPsController::class, 'import'])->name('reboisasi-ps.import');
    Route::post('reboisasi-ps/bulk-workflow-action', [ReboisasiPsController::class, 'bulkWorkflowAction'])->name('reboisasi-ps.bulk-workflow-action');
    Route::resource('reboisasi-ps', ReboisasiPsController::class)->parameters(['reboisasi-ps' => 'reboisasi_ps']);
    Route::post('/reboisasi-ps/{reboisasi_ps}/submit', [ReboisasiPsController::class, 'submit'])->name('reboisasi-ps.submit');
    Route::post('/reboisasi-ps/{reboisasi_ps}/approve', [ReboisasiPsController::class, 'approve'])->name('reboisasi-ps.approve');
    Route::post('/reboisasi-ps/{reboisasi_ps}/reject', [ReboisasiPsController::class, 'reject'])->name('reboisasi-ps.reject');


    // Pengunjung Objek Wisata
    Route::get('pengunjung-wisata/export', [PengunjungWisataController::class, 'export'])->name('pengunjung-wisata.export');
    Route::get('pengunjung-wisata/template', [PengunjungWisataController::class, 'template'])->name('pengunjung-wisata.template');
    Route::post('pengunjung-wisata/import', [PengunjungWisataController::class, 'import'])->name('pengunjung-wisata.import');
    Route::post('pengunjung-wisata/bulk-workflow-action', [PengunjungWisataController::class, 'bulkWorkflowAction'])->name('pengunjung-wisata.bulk-workflow-action');
    Route::resource('pengunjung-wisata', PengunjungWisataController::class)->parameters(['pengunjung-wisata' => 'pengunjung_wisata']);
    Route::post('/pengunjung-wisata/{pengunjung_wisata}/submit', [PengunjungWisataController::class, 'submit'])->name('pengunjung-wisata.submit');
    Route::post('/pengunjung-wisata/{pengunjung_wisata}/approve', [PengunjungWisataController::class, 'approve'])->name('pengunjung-wisata.approve');
    Route::post('/pengunjung-wisata/{pengunjung_wisata}/reject', [PengunjungWisataController::class, 'reject'])->name('pengunjung-wisata.reject');

    // Kebakaran Hutan
    Route::get('kebakaran-hutan/export', [KebakaranHutanController::class, 'export'])->name('kebakaran-hutan.export');
    Route::get('kebakaran-hutan/template', [KebakaranHutanController::class, 'template'])->name('kebakaran-hutan.template');
    Route::post('kebakaran-hutan/import', [KebakaranHutanController::class, 'import'])->name('kebakaran-hutan.import');
    Route::post('kebakaran-hutan/bulk-workflow-action', [KebakaranHutanController::class, 'bulkWorkflowAction'])->name('kebakaran-hutan.bulk-workflow-action');
    Route::resource('kebakaran-hutan', KebakaranHutanController::class)->parameters(['kebakaran-hutan' => 'kebakaran_hutan']);
    Route::post('/kebakaran-hutan/{kebakaran_hutan}/submit', [KebakaranHutanController::class, 'submit'])->name('kebakaran-hutan.submit');
    Route::post('/kebakaran-hutan/{kebakaran_hutan}/approve', [KebakaranHutanController::class, 'approve'])->name('kebakaran-hutan.approve');
    Route::post('/kebakaran-hutan/{kebakaran_hutan}/reject', [KebakaranHutanController::class, 'reject'])->name('kebakaran-hutan.reject');

    Route::resource('rehab-manggrove', RehabManggroveController::class);

    // Hasil Hutan Kayu
    Route::get('hasil-hutan-kayu/export', [HasilHutanKayuController::class, 'export'])->name('hasil-hutan-kayu.export');
    Route::get('hasil-hutan-kayu/template', [HasilHutanKayuController::class, 'template'])->name('hasil-hutan-kayu.template');
    Route::post('hasil-hutan-kayu/import', [HasilHutanKayuController::class, 'import'])->name('hasil-hutan-kayu.import');
    Route::post('hasil-hutan-kayu/bulk-workflow-action', [HasilHutanKayuController::class, 'bulkWorkflowAction'])->name('hasil-hutan-kayu.bulk-workflow-action');
    Route::resource('hasil-hutan-kayu', HasilHutanKayuController::class)->parameters(['hasil-hutan-kayu' => 'hasil_hutan_kayu']);
    Route::post('/hasil-hutan-kayu/{hasil_hutan_kayu}/submit', [HasilHutanKayuController::class, 'submit'])->name('hasil-hutan-kayu.submit');
    Route::post('/hasil-hutan-kayu/{hasil_hutan_kayu}/approve', [HasilHutanKayuController::class, 'approve'])->name('hasil-hutan-kayu.approve');
    Route::post('/hasil-hutan-kayu/{hasil_hutan_kayu}/reject', [HasilHutanKayuController::class, 'reject'])->name('hasil-hutan-kayu.reject');

    // Hasil Hutan Bukan Kayu
    Route::get('hasil-hutan-bukan-kayu/export', [HasilHutanBukanKayuController::class, 'export'])->name('hasil-hutan-bukan-kayu.export');
    Route::get('hasil-hutan-bukan-kayu/template', [HasilHutanBukanKayuController::class, 'template'])->name('hasil-hutan-bukan-kayu.template');
    Route::post('hasil-hutan-bukan-kayu/import', [HasilHutanBukanKayuController::class, 'import'])->name('hasil-hutan-bukan-kayu.import');
    Route::post('hasil-hutan-bukan-kayu/bulk-workflow-action', [HasilHutanBukanKayuController::class, 'bulkWorkflowAction'])->name('hasil-hutan-bukan-kayu.bulk-workflow-action');
    Route::resource('hasil-hutan-bukan-kayu', HasilHutanBukanKayuController::class)->parameters(['hasil-hutan-bukan-kayu' => 'hasil_hutan_bukan_kayu']);
    Route::post('/hasil-hutan-bukan-kayu/{hasil_hutan_bukan_kayu}/submit', [HasilHutanBukanKayuController::class, 'submit'])->name('hasil-hutan-bukan-kayu.submit');
    Route::post('/hasil-hutan-bukan-kayu/{hasil_hutan_bukan_kayu}/approve', [HasilHutanBukanKayuController::class, 'approve'])->name('hasil-hutan-bukan-kayu.approve');
    Route::post('/hasil-hutan-bukan-kayu/{hasil_hutan_bukan_kayu}/reject', [HasilHutanBukanKayuController::class, 'reject'])->name('hasil-hutan-bukan-kayu.reject');

    // PBPHH
    Route::get('pbphh/export', [PbphhController::class, 'export'])->name('pbphh.export');
    Route::get('pbphh/template', [PbphhController::class, 'template'])->name('pbphh.template');
    Route::post('pbphh/import', [PbphhController::class, 'import'])->name('pbphh.import');
    Route::post('pbphh/bulk-workflow-action', [PbphhController::class, 'bulkWorkflowAction'])->name('pbphh.bulk-workflow-action');
    Route::resource('pbphh', PbphhController::class);
    Route::post('/pbphh/{pbphh}/submit', [PbphhController::class, 'submit'])->name('pbphh.submit');
    Route::post('/pbphh/{pbphh}/approve', [PbphhController::class, 'approve'])->name('pbphh.approve');
    Route::post('/pbphh/{pbphh}/reject', [PbphhController::class, 'reject'])->name('pbphh.reject');

    // Realisasi PNBP
    Route::get('realisasi-pnbp/export', [RealisasiPnbpController::class, 'export'])->name('realisasi-pnbp.export');
    Route::get('realisasi-pnbp/template', [RealisasiPnbpController::class, 'template'])->name('realisasi-pnbp.template');
    Route::post('realisasi-pnbp/import', [RealisasiPnbpController::class, 'import'])->name('realisasi-pnbp.import');
    Route::post('realisasi-pnbp/bulk-workflow-action', [RealisasiPnbpController::class, 'bulkWorkflowAction'])->name('realisasi-pnbp.bulk-workflow-action');
    Route::resource('realisasi-pnbp', RealisasiPnbpController::class)->parameters(['realisasi-pnbp' => 'realisasi_pnbp']);
    Route::post('/realisasi-pnbp/{realisasi_pnbp}/submit', [RealisasiPnbpController::class, 'submit'])->name('realisasi-pnbp.submit');
    Route::post('/realisasi-pnbp/{realisasi_pnbp}/approve', [RealisasiPnbpController::class, 'approve'])->name('realisasi-pnbp.approve');
    Route::post('/realisasi-pnbp/{realisasi_pnbp}/reject', [RealisasiPnbpController::class, 'reject'])->name('realisasi-pnbp.reject');

    // Perkembangan SK PS
    Route::get('skps/export', [SkpsController::class, 'export'])->name('skps.export');
    Route::get('skps/template', [SkpsController::class, 'template'])->name('skps.template');
    Route::post('skps/import', [SkpsController::class, 'import'])->name('skps.import');
    Route::post('skps/bulk-delete', [SkpsController::class, 'bulkDestroy'])
        ->name('skps.bulk-delete')
        ->middleware('permission:pemberdayaan.delete');
    Route::post('skps/bulk-submit', [SkpsController::class, 'bulkSubmit'])
        ->name('skps.bulk-submit')
        ->middleware('permission:pemberdayaan.edit');
    Route::post('skps/bulk-approve', [SkpsController::class, 'bulkApprove'])
        ->name('skps.bulk-approve')
        ->middleware('permission:pemberdayaan.approve');
    Route::post('skps/bulk-reject', [SkpsController::class, 'bulkReject'])
        ->name('skps.bulk-reject')
        ->middleware('permission:pemberdayaan.approve');
    Route::resource('skps', SkpsController::class);
    Route::post('/skps/{skp}/submit', [SkpsController::class, 'submit'])->name('skps.submit');
    Route::post('/skps/{skp}/approve', [SkpsController::class, 'approve'])->name('skps.approve');
    Route::post('/skps/{skp}/reject', [SkpsController::class, 'reject'])->name('skps.reject');

    // Perkembangan KUPS
    Route::get('kups/export', [KupsController::class, 'export'])->name('kups.export');
    Route::get('kups/template', [KupsController::class, 'template'])->name('kups.template');
    Route::post('kups/import', [KupsController::class, 'import'])->name('kups.import');
    Route::post('kups/bulk-delete', [KupsController::class, 'bulkDestroy'])
        ->name('kups.bulk-delete')
        ->middleware('permission:pemberdayaan.delete');
    Route::post('kups/bulk-submit', [KupsController::class, 'bulkSubmit'])
        ->name('kups.bulk-submit')
        ->middleware('permission:pemberdayaan.edit');
    Route::post('kups/bulk-approve', [KupsController::class, 'bulkApprove'])
        ->name('kups.bulk-approve')
        ->middleware('permission:pemberdayaan.approve');
    Route::post('kups/bulk-reject', [KupsController::class, 'bulkReject'])
        ->name('kups.bulk-reject')
        ->middleware('permission:pemberdayaan.approve');
    Route::resource('kups', KupsController::class);
    Route::post('/kups/{kups}/submit', [KupsController::class, 'submit'])->name('kups.submit');
    Route::post('/kups/{kups}/approve', [KupsController::class, 'approve'])->name('kups.approve');
    Route::post('/kups/{kups}/reject', [KupsController::class, 'reject'])->name('kups.reject');

    // Nilai Ekonomi (NEKON)
    Route::post('nilai-ekonomi/bulk-delete', [NilaiEkonomiController::class, 'bulkDestroy'])
        ->name('nilai-ekonomi.bulk-delete')
        ->middleware('permission:pemberdayaan.delete');
    Route::post('nilai-ekonomi/bulk-submit', [NilaiEkonomiController::class, 'bulkSubmit'])
        ->name('nilai-ekonomi.bulk-submit')
        ->middleware('permission:pemberdayaan.edit');
    Route::post('nilai-ekonomi/bulk-approve', [NilaiEkonomiController::class, 'bulkApprove'])
        ->name('nilai-ekonomi.bulk-approve')
        ->middleware('permission:pemberdayaan.approve');
    Route::post('nilai-ekonomi/bulk-reject', [NilaiEkonomiController::class, 'bulkReject'])
        ->name('nilai-ekonomi.bulk-reject')
        ->middleware('permission:pemberdayaan.approve');
    Route::resource('nilai-ekonomi', NilaiEkonomiController::class);
    Route::post('/nilai-ekonomi/{nilai_ekonomi}/submit', [NilaiEkonomiController::class, 'submit'])->name('nilai-ekonomi.submit');
    Route::post('/nilai-ekonomi/{nilai_ekonomi}/approve', [NilaiEkonomiController::class, 'approve'])->name('nilai-ekonomi.approve');
    Route::post('/nilai-ekonomi/{nilai_ekonomi}/reject', [NilaiEkonomiController::class, 'reject'])->name('nilai-ekonomi.reject');


    // Perkembangan KTH
    Route::post('perkembangan-kth/bulk-delete', [PerkembanganKthController::class, 'bulkDestroy'])
        ->name('perkembangan-kth.bulk-delete')
        ->middleware('permission:pemberdayaan.delete');
    Route::post('perkembangan-kth/bulk-submit', [PerkembanganKthController::class, 'bulkSubmit'])
        ->name('perkembangan-kth.bulk-submit')
        ->middleware('permission:pemberdayaan.edit');
    Route::post('perkembangan-kth/bulk-approve', [PerkembanganKthController::class, 'bulkApprove'])
        ->name('perkembangan-kth.bulk-approve')
        ->middleware('permission:pemberdayaan.approve');
    Route::post('perkembangan-kth/bulk-reject', [PerkembanganKthController::class, 'bulkReject'])
        ->name('perkembangan-kth.bulk-reject')
        ->middleware('permission:pemberdayaan.approve');
    Route::get('perkembangan-kth/export', [PerkembanganKthController::class, 'export'])->name('perkembangan-kth.export');
    Route::get('perkembangan-kth/template', [PerkembanganKthController::class, 'template'])->name('perkembangan-kth.template');
    Route::post('perkembangan-kth/import', [PerkembanganKthController::class, 'import'])->name('perkembangan-kth.import');
    Route::resource('perkembangan-kth', PerkembanganKthController::class)->parameters(['perkembangan-kth' => 'perkembangan_kth']);
    Route::post('/perkembangan-kth/{perkembangan_kth}/submit', [PerkembanganKthController::class, 'submit'])->name('perkembangan-kth.submit');
    Route::post('/perkembangan-kth/{perkembangan_kth}/approve', [PerkembanganKthController::class, 'approve'])->name('perkembangan-kth.approve');
    Route::post('/perkembangan-kth/{perkembangan_kth}/reject', [PerkembanganKthController::class, 'reject'])->name('perkembangan-kth.reject');

    // Nilai Transaksi Ekonomi
    Route::post('nilai-transaksi-ekonomi/bulk-delete', [NilaiTransaksiEkonomiController::class, 'bulkDestroy'])
        ->name('nilai-transaksi-ekonomi.bulk-delete')
        ->middleware('permission:pemberdayaan.delete');
    Route::post('nilai-transaksi-ekonomi/bulk-submit', [NilaiTransaksiEkonomiController::class, 'bulkSubmit'])
        ->name('nilai-transaksi-ekonomi.bulk-submit')
        ->middleware('permission:pemberdayaan.edit');
    Route::post('nilai-transaksi-ekonomi/bulk-approve', [NilaiTransaksiEkonomiController::class, 'bulkApprove'])
        ->name('nilai-transaksi-ekonomi.bulk-approve')
        ->middleware('permission:pemberdayaan.approve');
    Route::post('nilai-transaksi-ekonomi/bulk-reject', [NilaiTransaksiEkonomiController::class, 'bulkReject'])
        ->name('nilai-transaksi-ekonomi.bulk-reject')
        ->middleware('permission:pemberdayaan.approve');
    Route::get('nilai-transaksi-ekonomi/export', [NilaiTransaksiEkonomiController::class, 'export'])->name('nilai-transaksi-ekonomi.export');
    Route::get('nilai-transaksi-ekonomi/template', [NilaiTransaksiEkonomiController::class, 'template'])->name('nilai-transaksi-ekonomi.template');
    Route::post('nilai-transaksi-ekonomi/import', [NilaiTransaksiEkonomiController::class, 'import'])->name('nilai-transaksi-ekonomi.import');
    Route::resource('nilai-transaksi-ekonomi', NilaiTransaksiEkonomiController::class)->parameters(['nilai-transaksi-ekonomi' => 'nilai_transaksi_ekonomi']);
    Route::post('/nilai-transaksi-ekonomi/{nilai_transaksi_ekonomi}/submit', [NilaiTransaksiEkonomiController::class, 'submit'])->name('nilai-transaksi-ekonomi.submit');
    Route::post('/nilai-transaksi-ekonomi/{nilai_transaksi_ekonomi}/approve', [NilaiTransaksiEkonomiController::class, 'approve'])->name('nilai-transaksi-ekonomi.approve');
    Route::post('/nilai-transaksi-ekonomi/{nilai_transaksi_ekonomi}/reject', [NilaiTransaksiEkonomiController::class, 'reject'])->name('nilai-transaksi-ekonomi.reject');

    // User Management
    // User Management
    Route::resource('users', UserController::class);

    // Impersonation Routes
    Route::impersonate();


    // Activity Log
    Route::resource('activity-log', ActivityLogController::class)->only(['index']);

    // Master Data
    Route::resource('provinces', ProvinceController::class);
    Route::resource('regencies', RegencyController::class);
    Route::resource('districts', DistrictController::class);
    Route::resource('villages', VillageController::class);
    Route::resource('bangunan-kta', BangunanKtaController::class);
    Route::resource('sumber-dana', SumberDanaController::class);
    Route::resource('commodities', CommodityController::class);
    Route::resource('bukan-kayu', BukanKayuController::class);
    Route::resource('kayu', KayuController::class);
    Route::resource('jenis-produksi', JenisProduksiController::class);
    Route::resource('pengelola-wisata', PengelolaWisataController::class);
    Route::resource('skema-perhutanan-sosial', SkemaPerhutananSosialController::class);
});

require __DIR__ . '/auth.php';
