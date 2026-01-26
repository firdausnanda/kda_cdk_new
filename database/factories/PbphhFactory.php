<?php

namespace Database\Factories;

use App\Models\JenisProduksi;
use App\Models\Pbphh;
use App\Models\User;
use App\Models\Villages;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Pbphh>
 */
class PbphhFactory extends Factory
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
    $jenisProduksi = JenisProduksi::inRandomOrder()->first();
    $user = User::inRandomOrder()->first();

    return [
      'name' => fake()->company(),
      'number' => 'PBPHH-' . fake()->unique()->numerify('####/####'),
      'province_id' => 35,
      'regency_id' => $regency->id,
      'district_id' => $district->id,
      'investment_value' => fake()->numberBetween(1000000, 1000000000),
      'number_of_workers' => fake()->numberBetween(10, 500),
      'present_condition' => fake()->boolean(),
      'id_jenis_produksi' => $jenisProduksi->id ?? 1,
      'status' => 'final',
      'approved_by_kasi_at' => now(),
      'approved_by_cdk_at' => now(),
      'created_by' => $user->id,
      'updated_by' => $user->id
    ];
  }
}
