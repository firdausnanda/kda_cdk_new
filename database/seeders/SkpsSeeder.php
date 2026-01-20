<?php

namespace Database\Seeders;

use App\Models\Skps;
use Illuminate\Database\Seeder;

class SkpsSeeder extends Seeder
{
  /**
   * Run the database seeds.
   */
  public function run(): void
  {
    Skps::factory(100)->create();
  }
}
