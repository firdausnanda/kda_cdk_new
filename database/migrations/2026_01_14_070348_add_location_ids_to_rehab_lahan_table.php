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
        Schema::table('rehab_lahan', function (Blueprint $table) {
            $table->unsignedBigInteger('province_id')->after('month')->nullable();
            $table->char('regency_id', 4)->after('province_id')->nullable();
            $table->char('district_id', 7)->after('regency_id')->nullable();
            $table->char('village_id', 10)->after('district_id')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('rehab_lahan', function (Blueprint $table) {
            //
        });
    }
};
