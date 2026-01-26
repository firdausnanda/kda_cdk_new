<?php

namespace Database\Factories;

use App\Models\PerkembanganKth;
use App\Models\Regencies;
use App\Models\Districts;
use App\Models\Villages;
use Illuminate\Database\Eloquent\Factories\Factory;

class PerkembanganKthFactory extends Factory
{
  protected $model = PerkembanganKth::class;

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
      'KTH Karya Tani',
      'KTH Mekar Jaya',
    ];

    $potensiKawasan = [
      'Hutan jati dengan potensi kayu berkualitas tinggi',
      'Hutan pinus dengan hasil getah dan kayu',
      'Kawasan hutan lindung dengan keanekaragaman hayati tinggi',
      'Hutan produksi dengan tanaman mahoni dan sengon',
      'Area agroforestri dengan tanaman kopi dan cengkeh',
      'Kawasan hutan rakyat dengan potensi kayu dan HHBK',
      'Hutan kemasyarakatan dengan potensi wisata alam',
      'Area reboisasi dengan tanaman keras produktif',
    ];

    return [
      'year' => $this->faker->numberBetween(2024, 2026),
      'month' => $this->faker->numberBetween(1, 12),
      'province_id' => 35,
      'regency_id' => $regency?->id,
      'district_id' => $district?->id,
      'village_id' => $village?->id,
      'nama_kth' => $this->faker->randomElement($namaKth),
      'nomor_register' => 'REG-' . $this->faker->unique()->numerify('####'),
      'kelas_kelembagaan' => $this->faker->randomElement(['pemula', 'madya', 'utama']),
      'jumlah_anggota' => $this->faker->numberBetween(15, 100),
      'luas_kelola' => $this->faker->randomFloat(2, 10, 500),
      'potensi_kawasan' => $this->faker->randomElement($potensiKawasan),
      'status' => $this->faker->randomElement(['draft', 'waiting_kasi', 'waiting_cdk', 'final']),
      'created_by' => 1,
    ];
  }
}
