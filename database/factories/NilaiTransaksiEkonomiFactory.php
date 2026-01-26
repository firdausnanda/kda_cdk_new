<?php

namespace Database\Factories;

use App\Models\NilaiTransaksiEkonomi;
use App\Models\Regencies;
use App\Models\Districts;
use App\Models\Villages;
use Illuminate\Database\Eloquent\Factories\Factory;

class NilaiTransaksiEkonomiFactory extends Factory
{
  protected $model = NilaiTransaksiEkonomi::class;

  public function definition(): array
  {
    $regency = Regencies::where('province_id', 35)->whereIn('name', [
      'KABUPATEN TRENGGALEK',
      'KABUPATEN TULUNGAGUNG',
      'KABUPATEN KEDIRI',
      'KOTA KEDIRI'
    ])->inRandomOrder()->first();
    $district = $regency ? Districts::where('regency_id', $regency->id)->inRandomOrder()->first() : null;
    $village = $district ? Villages::where('district_id', $district->id)->inRandomOrder()->first() : null;

    $namaKth = [
      'KTH Makmur Sejahtera',
      'KTH Lestari Hijau',
      'KTH Harapan Jaya',
      'KTH Mandiri Bersama',
      'KTH Sumber Rezeki',
      'KTH Maju Bersama',
      'KTH Cahaya Rimba',
      'KTH Tunas Harapan',
    ];

    $komoditas = [
      'Kayu Jati',
      'Kayu Sengon',
      'Kayu Mahoni',
      'Getah Pinus',
      'Madu Hutan',
      'Kopi',
      'Cengkeh',
      'Kelapa',
      'Empon-empon',
      'Bambu',
    ];

    $satuan = ['Kg', 'Ton', 'M3', 'Liter', 'Batang'];

    return [
      'year' => $this->faker->numberBetween(2024, 2026),
      'month' => $this->faker->numberBetween(1, 12),
      'province_id' => 35,
      'regency_id' => $regency?->id,
      'district_id' => $district?->id,
      'village_id' => $village?->id,
      'nama_kth' => $this->faker->randomElement($namaKth),
      'total_nilai_transaksi' => 0, // Will be calculated in seeder
      'status' => $this->faker->randomElement(['draft', 'waiting_kasi', 'waiting_cdk', 'final']),
      'created_by' => 1,
    ];
  }
}
