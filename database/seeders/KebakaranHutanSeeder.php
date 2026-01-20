<?php

namespace Database\Seeders;

use App\Models\KebakaranHutan;
use Illuminate\Database\Seeder;

class KebakaranHutanSeeder extends Seeder
{
  /**
   * Run the database seeds.
   */
  public function run(): void
  {
    KebakaranHutan::factory(100)->create();
  }
}
