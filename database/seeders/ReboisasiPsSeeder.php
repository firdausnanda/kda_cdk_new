<?php

namespace Database\Seeders;

use App\Models\ReboisasiPS;
use Illuminate\Database\Seeder;

class ReboisasiPsSeeder extends Seeder
{
  /**
   * Run the database seeds.
   */
  public function run(): void
  {
    ReboisasiPS::factory(100)->create();
  }
}
