<?php

namespace Database\Seeders;

use App\Models\NilaiTransaksiEkonomi;
use App\Models\NilaiTransaksiEkonomiDetail;
use App\Models\Commodity;
// use App\Models\Provinces;
// use App\Models\Regencies;
// use App\Models\Districts;
// use App\Models\Villages;
use Illuminate\Database\Seeder;

class NilaiTransaksiEkonomiSeeder extends Seeder
{
  public function run(): void
  {
    $commodities = Commodity::all();
    if ($commodities->isEmpty()) {
      $commodities = collect([
        Commodity::create(['name' => 'Kayu Jati']),
        Commodity::create(['name' => 'Kayu Sengon']),
        Commodity::create(['name' => 'Madu Hutan']),
        Commodity::create(['name' => 'Getah Pinus']),
      ]);
    }

    NilaiTransaksiEkonomi::factory()->count(100)->create()->each(function ($record) use ($commodities) {
      $detailCount = rand(1, 3);
      $totalValue = 0;

      // Pick random unique commodities for this record
      $recordCommodities = $commodities->random($detailCount);

      foreach ($recordCommodities as $commodity) {
        $nilai = rand(1000000, 50000000);
        $totalValue += $nilai;

        NilaiTransaksiEkonomiDetail::create([
          'nilai_transaksi_ekonomi_id' => $record->id,
          'commodity_id' => $commodity->id,
          'volume_produksi' => rand(10, 500),
          'satuan' => collect(['Kg', 'Ton', 'M3', 'Liter', 'Batang'])->random(),
          'nilai_transaksi' => $nilai,
        ]);
      }

      $record->update(['total_nilai_transaksi' => $totalValue]);
    });
  }
}
