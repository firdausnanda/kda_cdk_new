<?php

namespace Database\Factories;

use App\Models\SumberDana;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\RhlTeknis>
 */
class RhlTeknisFactory extends Factory
{
  /**
   * Define the model's default state.
   *
   * @return array<string, mixed>
   */
  public function definition(): array
  {
    $fund_source = SumberDana::inRandomOrder()->first();
    $user = User::inRandomOrder()->first();

    return [
      'year' => 2026,
      'month' => fake()->month(),
      'target_annual' => fake()->numberBetween(1, 50),
      'fund_source' => $fund_source->name ?? 'APBD',
      'status' => 'final',
      'created_by' => $user->id,
      'updated_by' => $user->id,
      'approved_by_kasi_at' => now(),
      'approved_by_cdk_at' => now()
    ];
  }
}
