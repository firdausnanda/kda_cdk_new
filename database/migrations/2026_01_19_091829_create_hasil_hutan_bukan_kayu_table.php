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
        Schema::create('hasil_hutan_bukan_kayu', function (Blueprint $table) {
            $table->id();
            $table->year('year');
            $table->tinyInteger('month');

            // Lokasi
            $table->unsignedBigInteger('province_id');
            $table->unsignedBigInteger('regency_id');
            $table->unsignedBigInteger('district_id');

            // Data
            $table->enum('forest_type', ['Hutan Negara', 'Hutan Rakyat', 'Perhutanan Sosial']);
            $table->string('annual_volume_target');
            $table->string('id_bukan_kayu');

            // Status & Approval
            $table->string('status')->default('draft'); // draft, waiting_kasi, waiting_cdk, finalized, rejected
            $table->timestamp('approved_by_kasi_at')->nullable();
            $table->timestamp('approved_by_cdk_at')->nullable();
            $table->text('rejection_note')->nullable(); // Alasan tolak

            // Meta
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->unsignedBigInteger('deleted_by')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('hasil_hutan_bukan_kayu');
    }
};
