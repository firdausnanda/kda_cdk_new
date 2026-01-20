<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;

class PermissionSeeder extends Seeder
{
  /**
   * Run the database seeds.
   */
  public function run(): void
  {
    // Reset cached roles and permissions
    app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

    $modules = [
      'users' => 'Manajemen User',
      'rehab' => 'Rehabilitasi Lahan',
      'perlindungan' => 'Perlindungan Hutan',
      'pemberdayaan' => 'Pemberdayaan Masyarakat',
      'bina-usaha' => 'Bina Usaha',
      'penghijauan' => 'Penghijauan Lingkungan',
    ];

    $actions = [
      'view' => 'Melihat',
      'create' => 'Menambah',
      'edit' => 'Mengubah',
      'delete' => 'Menghapus',
      'approve' => 'Menyetujui',
    ];

    foreach ($modules as $moduleKey => $moduleName) {
      foreach ($actions as $actionKey => $actionName) {
        Permission::firstOrCreate([
          'name' => "{$moduleKey}.{$actionKey}",
          'guard_name' => 'web',
        ], [
          'description' => "{$actionName} {$moduleName}",
        ]);
      }
    }
  }
}
