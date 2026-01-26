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
    Schema::create('hasil_hutan_kayu_jenis_produksi', function (Blueprint $table) {
      $table->id();
      $table->foreignId('hasil_hutan_kayu_id')->constrained('hasil_hutan_kayu')->onDelete('cascade');
      $table->foreignId('jenis_produksi_id')->constrained('m_jenis_produksi')->onDelete('cascade');
      $table->string('kapasitas_ijin')->nullable()->comment('Kapasitas Ijin per jenis produksi');
      $table->timestamps();
    });
  }

  /**
   * Reverse the migrations.
   */
  public function down(): void
  {
    Schema::dropIfExists('hasil_hutan_kayu_jenis_produksi');
  }
};
