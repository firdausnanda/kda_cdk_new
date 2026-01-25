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
    if (RealisasiPnbp::count() == 0) {
      RealisasiPnbp::factory(100)->create();
    }
  }
}
