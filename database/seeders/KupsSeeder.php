<?php

namespace Database\Seeders;

use App\Models\Kups;
use Illuminate\Database\Seeder;

class KupsSeeder extends Seeder
{
  /**
   * Run the database seeds.
   */
  public function run(): void
  {
    Kups::factory(100)->create();
  }
}
