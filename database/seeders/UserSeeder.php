<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {

        $data = public_path('data/user.csv');

        $file = fopen($data, 'r');

        $pk = [
            'rehab.view',
            'rehab.create',
            'rehab.edit',
            'rehab.delete',
            'perlindungan.view',
            'perlindungan.create',
            'perlindungan.edit',
            'perlindungan.delete',
            'pemberdayaan.view',
            'pemberdayaan.create',
            'pemberdayaan.edit',
            'pemberdayaan.delete',
            'bina-usaha.view',
            'bina-usaha.create',
            'bina-usaha.edit',
            'bina-usaha.delete',
            'penghijauan.view',
            'penghijauan.create',
            'penghijauan.edit',
            'penghijauan.delete',
        ];

        $kasiCdk = [
            'rehab.view',
            'rehab.approve',
            'perlindungan.view',
            'perlindungan.approve',
            'pemberdayaan.view',
            'pemberdayaan.approve',
            'bina-usaha.view',
            'bina-usaha.approve',
            'penghijauan.view',
            'penghijauan.approve',
        ];

        $permission = Permission::get();
        $permission_pk = $permission->whereIn('name', $pk);
        $permission_kasi = $permission->whereIn('name', $kasiCdk);
        $permission_cdk = $permission->whereIn('name', $kasiCdk);

        while (($row = fgetcsv($file)) !== false) {

            $user = User::create([
                'name' => $row[0],
                'username' => $row[1],
                'email' => $row[1],
                'password' => bcrypt($row[1]),
            ]);

            $user->assignRole($row[2]);

            if ($row[2] == 'admin') {
                $user->syncPermissions($permission);
            } else if ($row[2] == 'pk') {
                $user->syncPermissions($permission_pk);
            } else if ($row[2] == 'kasi') {
                $user->syncPermissions($permission_kasi);
            } else if ($row[2] == 'kacdk') {
                $user->syncPermissions($permission_cdk);
            }
        }

        fclose($file);
    }
}
