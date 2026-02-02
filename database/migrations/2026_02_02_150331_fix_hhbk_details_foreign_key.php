<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
  /**
   * Run the migrations.
   */
  public function up(): void
  {
    Schema::table('hasil_hutan_bukan_kayu_details', function (Blueprint $table) {
      // Drop the old foreign key that mistakenly points to m_commodities
      // Even though column was renamed, the constraint name often persists unless explicitly changed
      $table->dropForeign('hasil_hutan_bukan_kayu_details_commodity_id_foreign');

      // Add the correct foreign key pointing to m_bukan_kayu
      $table->foreign('bukan_kayu_id')
        ->references('id')
        ->on('m_bukan_kayu')
        ->onDelete('cascade');
    });
  }

  /**
   * Reverse the migrations.
   */
  public function down(): void
  {
    Schema::table('hasil_hutan_bukan_kayu_details', function (Blueprint $table) {
      $table->dropForeign(['bukan_kayu_id']);
      $table->foreign('bukan_kayu_id')
        ->references('id')
        ->on('m_commodities')
        ->onDelete('cascade');
    });
  }
};
