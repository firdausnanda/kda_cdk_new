<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class SumberDanaSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        \App\Models\SumberDana::create([
            'name' => 'APBN'
        ]);

        \App\Models\SumberDana::create([
            'name' => 'APBD Provinsi'
        ]);

        \App\Models\SumberDana::create([
            'name' => 'APBD Kabupaten/Kota'
        ]);

        \App\Models\SumberDana::create([
            'name' => 'BUMS'
        ]);

        \App\Models\SumberDana::create([
            'name' => 'CSR'
        ]);

        \App\Models\SumberDana::create([
            'name' => 'BPDLH'
        ]);

        \App\Models\SumberDana::create([
            'name' => 'Lainnya'
        ]);

    }
}
