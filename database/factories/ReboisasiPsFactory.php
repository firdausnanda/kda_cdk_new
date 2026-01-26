<?php

namespace Database\Factories;

use App\Models\SumberDana;
use App\Models\User;
use App\Models\Villages;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ReboisasiPs>
 */
class ReboisasiPsFactory extends Factory
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
    $fund_source = SumberDana::inRandomOrder()->first();
    $user = User::inRandomOrder()->first();

    return [
      'year' => 2026,
      'month' => fake()->month(),
      'target_annual' => fake()->numberBetween(10, 500),
      'realization' => fake()->numberBetween(10, 500),
      'fund_source' => $fund_source->name ?? 'DAK',
      'province_id' => 35,
      'regency_id' => $regency->id,
      'district_id' => $district->id,
      'village_id' => $village->id,
      'coordinates' => fake()->latitude() . ',' . fake()->longitude(),
      'created_by' => $user->id,
      'updated_by' => $user->id,
      'status' => 'final',
      'approved_by_kasi_at' => now(),
      'approved_by_cdk_at' => now()
    ];
  }
}
