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

    $data = [
      [
        'name' => 'Log',
        'is_nilai_transaksi_ekonomi' => true
      ],
      [
        'name' => 'Kayu Gergajian',
        'is_nilai_transaksi_ekonomi' => true
      ],
      [
        'name' => 'Mebelair',
        'is_nilai_transaksi_ekonomi' => true
      ],
      [
        'name' => 'Bibit',
        'is_nilai_transaksi_ekonomi' => true
      ],
      [
        'name' => 'Hasil Panen',
        'is_nilai_transaksi_ekonomi' => true
      ],
      [
        'name' => 'Produk Olahan',
        'is_nilai_transaksi_ekonomi' => true
      ],
      [
        'name' => 'Tanaman Hias',
        'is_nilai_transaksi_ekonomi' => true
      ],
      [
        'name' => 'Stup',
        'is_nilai_transaksi_ekonomi' => true
      ],
      [
        'name' => 'Madu',
        'is_nilai_transaksi_ekonomi' => true
      ],
      [
        'name' => 'Jasa Terapi Sengat Lebah',
        'is_nilai_transaksi_ekonomi' => true
      ],
      [
        'name' => 'Bibit Tumbuhan',
        'is_nilai_transaksi_ekonomi' => true
      ],
      [
        'name' => 'Buah-Buahan Segar',
        'is_nilai_transaksi_ekonomi' => true
      ],
      [
        'name' => 'Minyak Astiri',
        'is_nilai_transaksi_ekonomi' => true
      ],
      [
        'name' => 'Gula',
        'is_nilai_transaksi_ekonomi' => true
      ],
      [
        'name' => 'Bibit Mangrove',
        'is_nilai_transaksi_ekonomi' => true
      ],
      [
        'name' => 'Penjualan Ternak',
        'is_nilai_transaksi_ekonomi' => true
      ],
      [
        'name' => 'Produk Turunan',
        'is_nilai_transaksi_ekonomi' => true
      ],
      [
        'name' => 'Pakan Segar Hijauan Makanan Ternak',
        'is_nilai_transaksi_ekonomi' => true
      ],
      [
        'name' => 'Produk Olahan Hijauan Makanan Ternak',
        'is_nilai_transaksi_ekonomi' => true
      ],
      [
        'name' => 'Bahan Baku',
        'is_nilai_transaksi_ekonomi' => true
      ],
      [
        'name' => 'Tanaman Pangan',
        'is_nilai_transaksi_ekonomi' => true
      ],
      [
        'name' => 'Produk Turunan Sagu',
        'is_nilai_transaksi_ekonomi' => true
      ],
      [
        'name' => 'Panen Segar',
        'is_nilai_transaksi_ekonomi' => true
      ],
      [
        'name' => 'Kerajinan Berbahan Bambu',
        'is_nilai_transaksi_ekonomi' => true
      ],
      [
        'name' => 'Produk Turunan Aren',
        'is_nilai_transaksi_ekonomi' => true
      ],
      [
        'name' => 'Kerajinan Bambu',
        'is_nilai_transaksi_ekonomi' => true
      ],
      [
        'name' => 'Pupuk Organik',
        'is_nilai_transaksi_ekonomi' => true
      ],
      [
        'name' => 'Biji-Bijian Segar',
        'is_nilai_transaksi_ekonomi' => true
      ],
      [
        'name' => 'Pupuk Padat',
        'is_nilai_transaksi_ekonomi' => true
      ],
      [
        'name' => 'Lainnya',
        'is_nilai_transaksi_ekonomi' => true
      ]
    ];

    foreach ($data as $item) {
      Commodity::create($item);
    }
    $commodities = Commodity::withoutGlobalScope('not_nilai_transaksi_ekonomi')->where('is_nilai_transaksi_ekonomi', true)->get();

    NilaiTransaksiEkonomi::factory()->count(500)->create()->each(function ($record) use ($commodities) {
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
