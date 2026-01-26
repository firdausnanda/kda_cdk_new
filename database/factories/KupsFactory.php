<?php

namespace Database\Factories;

use App\Models\User;
use App\Models\Villages;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Kups>
 */
class KupsFactory extends Factory
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

    return [
      'province_id' => 35,
      'regency_id' => $regency->id,
      'district_id' => $district->id,
      'category' => fake()->randomElement(['Blue', 'Silver', 'Gold', 'Platinum']),
      'number_of_kups' => fake()->numberBetween(1, 10),
      'commodity' => fake()->randomElement(['Kopi', 'Madu', 'Aren', 'Wisata', 'Bambu']),
      'status' => 'final',
      'approved_by_kasi_at' => now(),
      'approved_by_cdk_at' => now(),
      'created_by' => $user->id,
      'updated_by' => $user->id,
    ];
  }
}
