<?php

namespace Database\Seeders;

use App\Models\JenisProduksi;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class JenisProduksiSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $data = [
            [
                'name' => 'Kayu Gergajian (m3)',
            ],
            [
                'name' => 'Vineer (m3)',
            ],
            [
                'name' => 'Plywood (m3)',
            ],
            [
                'name' => 'Blockboard (m3)',
            ],
            [
                'name' => 'Barecore (m3)',
            ],
        ];

        foreach ($data as $item) {
            JenisProduksi::create($item);
        }
    }
}
