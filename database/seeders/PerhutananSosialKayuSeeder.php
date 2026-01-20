<?php

namespace Database\Seeders;

use App\Models\HasilHutanKayu;
use Illuminate\Database\Seeder;

class PerhutananSosialKayuSeeder extends Seeder
{
  /**
   * Run the database seeds.
   */
  public function run(): void
  {
    HasilHutanKayu::factory(100)->create([
      'forest_type' => 'Perhutanan Sosial',
    ]);
  }
}
