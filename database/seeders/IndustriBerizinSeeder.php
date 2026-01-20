<?php

namespace Database\Seeders;

use App\Models\IndustriBerizin;
use Illuminate\Database\Seeder;

class IndustriBerizinSeeder extends Seeder
{
  /**
   * Run the database seeds.
   */
  public function run(): void
  {
    IndustriBerizin::factory(100)->create();
  }
}
