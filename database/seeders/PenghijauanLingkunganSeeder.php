<?php

namespace Database\Seeders;

use App\Models\PenghijauanLingkungan;
use Illuminate\Database\Seeder;

class PenghijauanLingkunganSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        PenghijauanLingkungan::factory(100)->create();
    }
}
