<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class PublicDashboardTest extends TestCase
{
  use DatabaseTransactions;

  public function test_public_dashboard_is_accessible()
  {
    $response = $this->get(route('public.dashboard'));

    $response->assertStatus(200);
    $response->assertInertia(
      fn($page) => $page
        ->component('Public/PublicDashboard')
    );
  }
}
