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
    Schema::create('m_bangunan_kta', function (Blueprint $table) {
      $table->id();
      $table->string('name');
      $table->string('description')->nullable();
      $table->timestamps();
    });

    Schema::create('rhl_teknis', function (Blueprint $table) {
      $table->id();
      $table->year('year');
      $table->tinyInteger('month'); // 1-12

      // Standard Mandatory
      $table->decimal('target_annual', 15, 2)->default(0);
      $table->string('fund_source');

      // Status & Approval
      $table->string('status')->default('draft'); // draft, waiting_kasi, waiting_cdk, finalized, rejected
      $table->timestamp('approved_by_kasi_at')->nullable();
      $table->timestamp('approved_by_cdk_at')->nullable();
      $table->text('rejection_note')->nullable(); // Alasan tolak

      // Meta (Userstamps)
      $table->unsignedBigInteger('created_by')->nullable();
      $table->unsignedBigInteger('updated_by')->nullable();
      $table->unsignedBigInteger('deleted_by')->nullable();
      $table->timestamps();
      $table->softDeletes();
    });

    Schema::create('rhl_teknis_details', function (Blueprint $table) {
      $table->id();
      $table->unsignedBigInteger('rhl_teknis_id');
      $table->unsignedBigInteger('bangunan_kta_id')->nullable();
      $table->integer('unit_amount')->default(0); // Jumlah Unit
      $table->timestamps();

      $table->foreign('rhl_teknis_id')->references('id')->on('rhl_teknis')->onDelete('cascade');
      $table->foreign('bangunan_kta_id')->references('id')->on('m_bangunan_kta')->onDelete('set null');
    });
  }

  /**
   * Reverse the migrations.
   */
  public function down(): void
  {
    Schema::dropIfExists('rhl_teknis_details');
    Schema::dropIfExists('rhl_teknis');
    Schema::dropIfExists('m_bangunan_kta');
  }
};
