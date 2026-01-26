<?php

namespace Database\Factories;

use App\Models\SkemaPerhutananSosial;
use App\Models\User;
use App\Models\Villages;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Skps>
 */
class SkpsFactory extends Factory
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
    $skema = SkemaPerhutananSosial::inRandomOrder()->first();
    $user = User::inRandomOrder()->first();

    return [
      'province_id' => 35,
      'regency_id' => $regency->id,
      'district_id' => $district->id,
      'id_skema_perhutanan_sosial' => $skema->id ?? 1,
      'potential' => fake()->word(),
      'ps_area' => fake()->randomFloat(2, 1, 500),
      'number_of_kk' => fake()->numberBetween(10, 200),
      'status' => 'final',
      'approved_by_kasi_at' => now(),
      'approved_by_cdk_at' => now(),
      'created_by' => $user->id,
      'updated_by' => $user->id,
    ];
  }
}
