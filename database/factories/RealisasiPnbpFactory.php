<?php

namespace Database\Factories;

use App\Models\PengelolaWisata;
use App\Models\User;
use App\Models\Villages;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\RealisasiPnbp>
 */
class RealisasiPnbpFactory extends Factory
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
    $user = User::inRandomOrder()->first();

    $pengelola_wisata = PengelolaWisata::inRandomOrder()->first();

    return [
      'year' => 2026,
      'month' => fake()->month(),
      'province_id' => 35,
      'regency_id' => $regency->id,
      'types_of_forest_products' => fake()->randomElement(['Kayu Jati', 'Getah Pinus', 'Rotan']),
      'id_pengelola_wisata' => $pengelola_wisata->id,
      'pnbp_target' => fake()->numberBetween(1000000, 100000000),
      'pnbp_realization' => fake()->numberBetween(100000, 10000000),
      'status' => 'final',
      'approved_by_kasi_at' => now(),
      'approved_by_cdk_at' => now(),
      'created_by' => $user->id,
      'updated_by' => $user->id,
    ];
  }
}
