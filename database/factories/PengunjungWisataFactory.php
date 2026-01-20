<?php

namespace Database\Factories;

use App\Models\PengelolaWisata;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\PengunjungWisata>
 */
class PengunjungWisataFactory extends Factory
{
  /**
   * Define the model's default state.
   *
   * @return array<string, mixed>
   */
  public function definition(): array
  {
    $pengelola = PengelolaWisata::inRandomOrder()->first();
    $user = User::inRandomOrder()->first();

    return [
      'year' => 2026,
      'month' => fake()->month(),
      'id_pengelola_wisata' => $pengelola->id ?? 1,
      'number_of_visitors' => fake()->numberBetween(100, 5000),
      'gross_income' => fake()->numberBetween(1000000, 50000000),
      'status' => 'final',
      'approved_by_kasi_at' => now(),
      'approved_by_cdk_at' => now(),
      'created_by' => $user->id,
      'updated_by' => $user->id,
    ];
  }
}
