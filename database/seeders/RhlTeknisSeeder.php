<?php

namespace Database\Seeders;

use App\Models\BangunanKta;
use App\Models\RhlTeknis;
use App\Models\RhlTeknisDetail;
use Illuminate\Database\Seeder;

class RhlTeknisSeeder extends Seeder
{
  /**
   * Run the database seeds.
   */
  public function run(): void
  {
    $bangunanKtaIds = BangunanKta::pluck('id')->toArray();

    RhlTeknis::factory(100)->create()->each(function ($rhlTeknis) use ($bangunanKtaIds) {
      $numDetails = rand(1, 3);
      for ($i = 0; $i < $numDetails; $i++) {
        RhlTeknisDetail::create([
          'rhl_teknis_id' => $rhlTeknis->id,
          'bangunan_kta_id' => $bangunanKtaIds[array_rand($bangunanKtaIds)] ?? 1,
          'unit_amount' => rand(1, 10),
        ]);
      }
    });
  }
}
