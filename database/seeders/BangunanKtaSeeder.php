<?php

namespace Database\Seeders;

use App\Models\BangunanKta;
use Illuminate\Database\Seeder;

class BangunanKtaSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $data = [
            ['name' => 'Dam Penahan'],
            ['name' => 'Dam Pengendali'],
            ['name' => 'Gully Plug'],
            ['name' => 'Rehabilitasi Teras'],
            ['name' => 'Embung Air'],
            ['name' => 'Sumur Resapan'],
        ];

        foreach ($data as $item) {
            BangunanKta::updateOrCreate(['name' => $item['name']], $item);
        }
    }
}
