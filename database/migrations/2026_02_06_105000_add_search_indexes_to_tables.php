<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
  /**
   * Run the migrations.
   */
  public function up(): void
  {
    $tablesToIndex = [
      'perkembangan_kth' => ['nama_kth', 'nomor_register'],
      'nilai_transaksi_ekonomi' => ['nama_kth'],
      'rehab_lahan' => ['fund_source'],
      'penghijauan_lingkungan' => ['fund_source'],
      'rehab_manggrove' => ['fund_source'],
      'rhl_teknis' => ['fund_source'],
      'reboisasi_ps' => ['fund_source'],
      'kebakaran_hutan' => ['area_function'],
      'pbphh' => ['name', 'number'],
      'realisasi_pnbp' => ['types_of_forest_products'],
      'skps' => ['nama_kelompok'],
      'kups' => ['nama_kups'],
      'nilai_ekonomi' => ['nama_kelompok'],
      'users' => ['username'],
      'm_provinces' => ['name'],
      'm_regencies' => ['name'],
      'm_districts' => ['name'],
      'm_villages' => ['name'],
      'm_commodities' => ['name'],
      'm_kayu' => ['name'],
      'm_bukan_kayu' => ['name'],
      'm_jenis_produksi' => ['name'],
      'm_pengelola_wisata' => ['name'],
      'm_skema_perhutanan_sosial' => ['name'],
    ];

    $dbName = DB::getDatabaseName();

    foreach ($tablesToIndex as $table => $columns) {
      foreach ($columns as $column) {
        $indexName = $table . '_' . $column . '_index';
        $exists = DB::select("SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND INDEX_NAME = ?", [$dbName, $table, $indexName]);

        if (empty($exists)) {
          Schema::table($table, function (Blueprint $t) use ($column) {
            $t->index($column);
          });
        }
      }
    }
  }

  /**
   * Reverse the migrations.
   */
  public function down(): void
  {
    $tablesToIndex = [
      'perkembangan_kth' => ['nama_kth', 'nomor_register'],
      'nilai_transaksi_ekonomi' => ['nama_kth'],
      'rehab_lahan' => ['fund_source'],
      'penghijauan_lingkungan' => ['fund_source'],
      'rehab_manggrove' => ['fund_source'],
      'rhl_teknis' => ['fund_source'],
      'reboisasi_ps' => ['fund_source'],
      'kebakaran_hutan' => ['area_function'],
      'pbphh' => ['name', 'number'],
      'realisasi_pnbp' => ['types_of_forest_products'],
      'skps' => ['nama_kelompok'],
      'kups' => ['nama_kups'],
      'nilai_ekonomi' => ['nama_kelompok'],
      'users' => ['username'],
      'm_provinces' => ['name'],
      'm_regencies' => ['name'],
      'm_districts' => ['name'],
      'm_villages' => ['name'],
      'm_commodities' => ['name'],
      'm_kayu' => ['name'],
      'm_bukan_kayu' => ['name'],
      'm_jenis_produksi' => ['name'],
      'm_pengelola_wisata' => ['name'],
      'm_skema_perhutanan_sosial' => ['name'],
    ];

    $dbName = DB::getDatabaseName();

    foreach ($tablesToIndex as $table => $columns) {
      foreach ($columns as $column) {
        $indexName = $table . '_' . $column . '_index';
        $exists = DB::select("SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND INDEX_NAME = ?", [$dbName, $table, $indexName]);

        if (!empty($exists)) {
          Schema::table($table, function (Blueprint $t) use ($indexName) {
            $t->dropIndex($indexName);
          });
        }
      }
    }
  }
};
