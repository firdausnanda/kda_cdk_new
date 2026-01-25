<?php

namespace Tests\Feature;

use App\Models\Pbphh;
use App\Models\User;
use App\Models\JenisProduksi;
use App\Models\Villages;
use App\Models\Districts;
use App\Models\Regencies;
use App\Models\Provinces;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class PbphhTest extends TestCase
{
  use DatabaseTransactions;

  protected function setUp(): void
  {
    parent::setUp();
    // Since we are using DatabaseTransactions on a seeded DB, 
    // we expect roles, permissions and wilayah data to exist.
    // We might need to ensure a user exists or create one.
  }

  public function test_index_page_is_accessible()
  {
    $user = User::factory()->create();
    $user->assignRole('admin');

    $response = $this->actingAs($user)->get(route('pbphh.index'));

    $response->assertStatus(200);
    $response->assertInertia(
      fn($page) => $page
        ->component('Pbphh/Index')
    );
  }

  public function test_create_page_is_accessible()
  {
    $user = User::factory()->create();
    $user->assignRole('admin');

    $response = $this->actingAs($user)->get(route('pbphh.create'));

    $response->assertStatus(200);
    $response->assertInertia(
      fn($page) => $page
        ->component('Pbphh/Create')
    );
  }

  public function test_can_create_pbphh_data()
  {
    $user = User::factory()->create();
    $user->assignRole('admin');

    $jenisProduksi = JenisProduksi::first();
    // Fallback if no jenis produksi exists (though it should from seed)
    if (!$jenisProduksi) {
      $jenisProduksi = JenisProduksi::create(['name' => 'Test Jenis']);
    }

    // Get existing random location data to avoid foreign key errors
    $village = Villages::first();
    if (!$village) {
      $this->markTestSkipped('Wilayah data not found. Please seed database.');
    }
    $district = Districts::find($village->district_id);
    $regency = Regencies::find($district->regency_id);
    $province = Provinces::find($regency->province_id);

    $data = [
      'name' => 'Test PBPHH',
      'number' => 'PBPHH-123',
      'id_jenis_produksi' => $jenisProduksi->id,
      'province_id' => $province->id,
      'regency_id' => $regency->id,
      'district_id' => $district->id,
      'village_id' => $village->id,
      'investment_value' => '100000000',
      'number_of_workers' => '50',
      'present_condition' => '1',
      'year' => '2024',
      'latitude' => '-6.200000',
      'longitude' => '106.816666',
    ];

    $response = $this->actingAs($user)->post(route('pbphh.store'), $data);

    $response->assertRedirect(route('pbphh.index'));
    $this->assertDatabaseHas('pbphh', [
      'name' => 'Test PBPHH',
      'number' => 'PBPHH-123',
    ]);
  }

  public function test_can_update_pbphh_data()
  {
    $user = User::factory()->create();
    $user->assignRole('admin');

    $jenisProduksi = JenisProduksi::first();

    // Get existing random location data
    $village = Villages::first();
    $district = Districts::find($village->district_id);
    $regency = Regencies::find($district->regency_id);
    $province = Provinces::find($regency->province_id);

    $pbphh = Pbphh::create([
      'name' => 'Original PBPHH',
      'number' => 'PBPHH-OLD',
      'id_jenis_produksi' => $jenisProduksi->id,
      'province_id' => $province->id,
      'regency_id' => $regency->id,
      'district_id' => $district->id,
      'village_id' => $village->id,
      'investment_value' => 100000000,
      'number_of_workers' => 50,
      'present_condition' => true,
      'year' => 2024,
      'latitude' => '-6.200000',
      'longitude' => '106.816666',
      'user_id' => $user->id,
    ]);

    $data = [
      'name' => 'Updated PBPHH',
      'number' => 'PBPHH-NEW',
      'id_jenis_produksi' => $jenisProduksi->id,
      'province_id' => $province->id,
      'regency_id' => $regency->id,
      'district_id' => $district->id,
      'village_id' => $village->id,
      'investment_value' => '200000000',
      'number_of_workers' => '60',
      'present_condition' => '0',
      'year' => '2024',
      'latitude' => '-6.200000',
      'longitude' => '106.816666',
    ];

    $response = $this->actingAs($user)->put(route('pbphh.update', $pbphh->id), $data);

    $response->assertRedirect(route('pbphh.index'));
    $this->assertDatabaseHas('pbphh', [
      'name' => 'Updated PBPHH',
      'number_of_workers' => 60,
      'present_condition' => 0,
    ]);
  }

  public function test_can_delete_pbphh_data()
  {
    $user = User::factory()->create();
    $user->assignRole('admin');

    $jenisProduksi = JenisProduksi::first();
    // Get existing random location data
    $village = Villages::first();
    $district = Districts::find($village->district_id);
    $regency = Regencies::find($district->regency_id);
    $province = Provinces::find($regency->province_id);

    $pbphh = Pbphh::create([
      'name' => 'To Delete PBPHH',
      'number' => 'PBPHH-DEL',
      'id_jenis_produksi' => $jenisProduksi->id,
      'province_id' => $province->id,
      'regency_id' => $regency->id,
      'district_id' => $district->id,
      'village_id' => $village->id,
      'investment_value' => 100000000,
      'number_of_workers' => 50,
      'present_condition' => true,
      'year' => 2024,
      'latitude' => '-6.200000',
      'longitude' => '106.816666',
      'user_id' => $user->id,
    ]);

    $response = $this->actingAs($user)->delete(route('pbphh.destroy', $pbphh->id));

    $response->assertRedirect(route('pbphh.index'));
    $this->assertSoftDeleted('pbphh', [
      'id' => $pbphh->id,
    ]);
  }
}
