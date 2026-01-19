<?php

namespace Database\Seeders;

use App\Models\BukanKayu;
use Illuminate\Database\Seeder;

class BukanKayuSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $data = [
            'Porang',
            'Getah Pinus',
            'Madu',
            'Empon - Empon',
            'Jamur',
            'Gadung',
            'Sarang Burung Walet',
            'Gula Aren',
            'Pandan',
            'Daun Kelor',
            'Sereh Wangi',
            'Kopi',
            'Minyak Atsiri',
            'Umbi Lainnya',
        ];

        foreach ($data as $item) {
            BukanKayu::create([
                'name' => $item,
            ]);
        }
    }
}
