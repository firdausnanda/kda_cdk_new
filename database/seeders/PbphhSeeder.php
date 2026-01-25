<?php

namespace Database\Seeders;

use App\Models\Pbphh;
use Illuminate\Database\Seeder;

class PbphhSeeder extends Seeder
{
  /**
   * Run the database seeds.
   */
  public function run(): void
  {
    Pbphh::factory(100)->create();
  }
}
