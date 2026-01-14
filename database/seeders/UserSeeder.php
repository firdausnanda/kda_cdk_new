<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {

        $admin = User::create([
            'name' => 'Admin',
            'email' => 'admin@admin.com',
            'password' => bcrypt('password'),
        ]);

        $admin->assignRole('admin');

        $pk = User::create([
            'name' => 'pk',
            'email' => 'pk@pk.com',
            'password' => bcrypt('password'),
        ]);

        $pk->assignRole('pk');

        $kasi = User::create([
            'name' => 'kasi',
            'email' => 'kasi@kasi.com',
            'password' => bcrypt('password'),
        ]);

        $kasi->assignRole('kasi');

        $cdk = User::create([
            'name' => 'cdk',
            'email' => 'cdk@cdk.com',
            'password' => bcrypt('password'),
        ]);

        $cdk->assignRole('kacdk');
    }
}
