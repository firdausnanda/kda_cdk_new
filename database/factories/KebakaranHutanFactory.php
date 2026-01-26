<?php

namespace Database\Factories;

use App\Models\PengelolaWisata;
use App\Models\User;
use App\Models\Villages;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\KebakaranHutan>
 */
class KebakaranHutanFactory extends Factory
{
  /**
   * Define the model's default state.
   *
   * @return array<string, mixed>
   */
  public function definition(): array
  {
    $village = Villages::whereHas('district.regency', function ($q) {
      $q->where('province_id', 35)->whereIn('name', [
        'KABUPATEN TRENGGALEK',
        'KABUPATEN TULUNGAGUNG',
        'KABUPATEN KEDIRI',
        'KOTA KEDIRI'
      ]);
    })->inRandomOrder()->first();

    $district = $village->district;
    $regency = $district->regency;
    $pengelola = PengelolaWisata::inRandomOrder()->first();
    $user = User::inRandomOrder()->first();

    return [
      'year' => 2026,
      'month' => fake()->month(),
      'province_id' => 35,
      'regency_id' => $regency->id,
      'district_id' => $district->id,
      'village_id' => $village->id,
      'coordinates' => fake()->latitude() . ',' . fake()->longitude(),
      'id_pengelola_wisata' => $pengelola->id ?? 1,
      'area_function' => fake()->randomElement(['Hutan Lindung', 'Hutan Produksi', 'Areal Penggunaan Lain']),
      'number_of_fires' => fake()->numberBetween(0, 5),
      'fire_area' => fake()->randomFloat(2, 0.1, 100),
      'status' => 'final',
      'approved_by_kasi_at' => now(),
      'approved_by_cdk_at' => now(),
      'created_by' => $user->id,
      'updated_by' => $user->id,
    ];
  }
}
