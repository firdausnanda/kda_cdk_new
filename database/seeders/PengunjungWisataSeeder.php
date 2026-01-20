<?php

namespace Database\Seeders;

use App\Models\PengunjungWisata;
use Illuminate\Database\Seeder;

class PengunjungWisataSeeder extends Seeder
{
  /**
   * Run the database seeds.
   */
  public function run(): void
  {
    PengunjungWisata::factory(100)->create();
  }
}
