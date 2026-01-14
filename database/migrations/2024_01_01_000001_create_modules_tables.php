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
        // 1. Rehabilitasi Lahan
        // Schema::create('rehab_lahan', function (Blueprint $table) {
        //     $table->id();
        //     $table->year('year');
        //     $table->tinyInteger('month'); // 1-12

        //     // Standard Mandatory
        //     $table->decimal('target_annual', 15, 2)->default(0);
        //     $table->decimal('realization', 15, 2)->default(0);
        //     $table->string('fund_source');

        //     // Specific
        //     $table->string('village')->nullable(); // Desa
        //     $table->string('district')->nullable(); // Kecamatan
        //     $table->string('coordinates')->nullable(); // Lat,Long

        //     // Status & Approval
        //     $table->string('status')->default('draft'); // draft, waiting_kasi, waiting_cdk, finalized, rejected
        //     $table->timestamp('approved_by_kasi_at')->nullable();
        //     $table->timestamp('approved_by_cdk_at')->nullable();
        //     $table->text('rejection_note')->nullable(); // Alasan tolak

        //     // Meta
        //     $table->unsignedBigInteger('created_by')->nullable();
        //     $table->unsignedBigInteger('updated_by')->nullable();
        //     $table->unsignedBigInteger('deleted_by')->nullable();
        //     $table->timestamps();
        //     $table->softDeletes();
        // });

        // 2. Kegiatan Penghijauan
        Schema::create('penghijauan', function (Blueprint $table) {
            $table->id();
            $table->year('year');
            $table->tinyInteger('month');

            $table->decimal('target_annual', 15, 2)->default(0);
            $table->decimal('realization', 15, 2)->default(0);
            $table->string('fund_source');

            // Specific
            $table->string('seed_type')->nullable(); // Jenis Bibit
            $table->integer('amount')->default(0); // Jumlah Batang

            $table->string('status')->default('draft');
            $table->timestamp('approved_by_kasi_at')->nullable();
            $table->timestamp('approved_by_cdk_at')->nullable();
            $table->text('rejection_note')->nullable();

            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->unsignedBigInteger('deleted_by')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        // 3. Rehabilitasi Mangrove
        Schema::create('mangrove', function (Blueprint $table) {
            $table->id();
            $table->year('year');
            $table->tinyInteger('month');

            $table->decimal('target_annual', 15, 2)->default(0);
            $table->decimal('realization', 15, 2)->default(0);
            $table->string('fund_source');

            // Specific
            $table->string('mangrove_type')->nullable(); // Jenis Mangrove
            $table->string('density')->nullable(); // Kerapatan Tanam

            $table->string('status')->default('draft');
            $table->timestamp('approved_by_kasi_at')->nullable();
            $table->timestamp('approved_by_cdk_at')->nullable();
            $table->text('rejection_note')->nullable();

            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->unsignedBigInteger('deleted_by')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        // 4. Rehabilitasi Lahan Teknis (Bangunan KTA)
        Schema::create('lahan_teknis', function (Blueprint $table) {
            $table->id();
            $table->year('year');
            $table->tinyInteger('month');

            $table->decimal('target_annual', 15, 2)->default(0);
            $table->decimal('realization', 15, 2)->default(0); // Luas/Unit? Usually Unit or Ha. Request says Amount Unit.
            $table->string('fund_source');

            // Specific
            $table->string('construction_type')->nullable(); // Jenis Bangunan
            $table->integer('unit_amount')->default(0); // Jumlah Unit

            $table->string('status')->default('draft');
            $table->timestamp('approved_by_kasi_at')->nullable();
            $table->timestamp('approved_by_cdk_at')->nullable();
            $table->text('rejection_note')->nullable();

            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->unsignedBigInteger('deleted_by')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        // 5. Reboisasi Area PS
        Schema::create('reboisasi_ps', function (Blueprint $table) {
            $table->id();
            $table->year('year');
            $table->tinyInteger('month');

            $table->decimal('target_annual', 15, 2)->default(0);
            $table->decimal('realization', 15, 2)->default(0);
            $table->string('fund_source');

            // Specific
            $table->string('group_name')->nullable(); // Nama KTH/LPHD
            $table->string('sk_number')->nullable(); // Nomor SK Izin PS

            $table->string('status')->default('draft');
            $table->timestamp('approved_by_kasi_at')->nullable();
            $table->timestamp('approved_by_cdk_at')->nullable();
            $table->text('rejection_note')->nullable();

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
        Schema::dropIfExists('rehab_lahan');
        Schema::dropIfExists('penghijauan');
        Schema::dropIfExists('mangrove');
        Schema::dropIfExists('lahan_teknis');
        Schema::dropIfExists('reboisasi_ps');
    }
};
