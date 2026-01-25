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
    Schema::create('nilai_transaksi_ekonomi', function (Blueprint $table) {
      $table->id();
      $table->integer('year');
      $table->integer('month');
      $table->unsignedBigInteger('province_id')->nullable();
      $table->unsignedBigInteger('regency_id')->nullable();
      $table->unsignedBigInteger('district_id')->nullable();
      $table->unsignedBigInteger('village_id')->nullable();
      $table->string('nama_kth');
      $table->decimal('total_nilai_transaksi', 20, 2)->default(0);

      $table->enum('status', ['draft', 'waiting_kasi', 'waiting_cdk', 'final', 'rejected'])->default('draft');
      $table->timestamp('approved_by_kasi_at')->nullable();
      $table->timestamp('approved_by_cdk_at')->nullable();
      $table->text('rejection_note')->nullable();

      $table->unsignedBigInteger('created_by')->nullable();
      $table->unsignedBigInteger('updated_by')->nullable();
      $table->unsignedBigInteger('deleted_by')->nullable();
      $table->timestamps();
      $table->softDeletes();
    });

    Schema::create('nilai_transaksi_ekonomi_details', function (Blueprint $table) {
      $table->id();
      $table->unsignedBigInteger('nilai_transaksi_ekonomi_id');
      $table->unsignedBigInteger('commodity_id');
      $table->decimal('volume_produksi', 15, 2)->default(0);
      $table->string('satuan')->default('Kg');
      $table->decimal('nilai_transaksi', 20, 2)->default(0);
      $table->timestamps();

      $table->foreign('nilai_transaksi_ekonomi_id', 'nte_details_nte_id_fk')
        ->references('id')->on('nilai_transaksi_ekonomi')->onDelete('cascade');
      $table->foreign('commodity_id', 'nte_details_commodity_fk')
        ->references('id')->on('m_commodities');
    });
  }

  /**
   * Reverse the migrations.
   */
  public function down(): void
  {
    Schema::dropIfExists('nilai_transaksi_ekonomi_details');
    Schema::dropIfExists('nilai_transaksi_ekonomi');
  }
};
