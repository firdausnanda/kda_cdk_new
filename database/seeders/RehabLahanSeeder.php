<?php

namespace Database\Seeders;

use App\Models\RehabLahan;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class RehabLahanSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        RehabLahan::factory()->count(100)->create();
    }
}
