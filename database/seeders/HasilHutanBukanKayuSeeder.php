<?php

namespace Database\Seeders;

use App\Models\HasilHutanBukanKayu;
use Illuminate\Database\Seeder;

class HasilHutanBukanKayuSeeder extends Seeder
{
  /**
   * Run the database seeds.
   */
  public function run(): void
  {
    HasilHutanBukanKayu::factory(100)->create();
  }
}
