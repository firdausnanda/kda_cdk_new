<?php

namespace Database\Seeders;

use App\Models\RealisasiPnbp;
use Illuminate\Database\Seeder;

class RealisasiPnbpSeeder extends Seeder
{
  /**
   * Run the database seeds.
   */
  public function run(): void
  {
    RealisasiPnbp::factory(100)->create();
  }
}
