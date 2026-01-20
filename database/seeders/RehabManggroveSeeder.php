<?php

namespace Database\Seeders;

use App\Models\RehabManggrove;
use Illuminate\Database\Seeder;

class RehabManggroveSeeder extends Seeder
{
  /**
   * Run the database seeds.
   */
  public function run(): void
  {
    RehabManggrove::factory(100)->create();
  }
}
