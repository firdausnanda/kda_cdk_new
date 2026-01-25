<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            RoleSeeder::class,
            PermissionSeeder::class,
            UserSeeder::class,
            WilayahSeeder::class,
            SumberDanaSeeder::class,
            BangunanKtaSeeder::class,
            PengelolaWisataSeeder::class,
            KayuSeeder::class,
            BukanKayuSeeder::class,
            JenisProduksiSeeder::class,
            SkemaPerhutananSosialSeeder::class,
            RehabLahanSeeder::class,
            PenghijauanLingkunganSeeder::class,
            RehabManggroveSeeder::class,
            RhlTeknisSeeder::class,
            ReboisasiPsSeeder::class,
            PengunjungWisataSeeder::class,
            KebakaranHutanSeeder::class,
            SkpsSeeder::class,
            KupsSeeder::class,
            HasilHutanKayuSeeder::class,
            HasilHutanBukanKayuSeeder::class,
            PbphhSeeder::class,
            RealisasiPnbpSeeder::class,
            PerhutananSosialKayuSeeder::class,
            PerhutananSosialBukanKayuSeeder::class,
            NilaiEkonomiSeeder::class,
            PerkembanganKthSeeder::class,
            NilaiTransaksiEkonomiSeeder::class,
        ]);
    }
}
