<?php

namespace Database\Factories;

use App\Models\JenisProduksi;
use App\Models\User;
use App\Models\Villages;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\IndustriBerizin>
 */
class IndustriBerizinFactory extends Factory
{
  /**
   * Define the model's default state.
   *
   * @return array<string, mixed>
   */
  public function definition(): array
  {
    $village = Villages::whereHas('district.regency', function ($q) {
      $q->where('province_id', 35);
    })->inRandomOrder()->first();

    $district = $village->district;
    $regency = $district->regency;
    $jenisProduksi = JenisProduksi::inRandomOrder()->first();
    $user = User::inRandomOrder()->first();

    return [
      'year' => 2026,
      'month' => fake()->month(),
      'province_id' => 35,
      'regency_id' => $regency->id,
      'district_id' => $district->id,
      'phhk_pbhh' => fake()->numberBetween(1, 20),
      'phhbk_pbphh' => fake()->numberBetween(1, 20),
      'id_jenis_produksi' => $jenisProduksi->id ?? 1,
      'status' => 'final',
      'approved_by_kasi_at' => now(),
      'approved_by_cdk_at' => now(),
      'created_by' => $user->id,
      'updated_by' => $user->id
    ];
  }
}
