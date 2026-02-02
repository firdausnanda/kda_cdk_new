<?php

namespace App\Imports;

use App\Models\PerkembanganKth;
use App\Models\Regencies;
use App\Models\Districts;
use App\Models\Villages;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;
use Maatwebsite\Excel\Concerns\SkipsOnFailure;
use Maatwebsite\Excel\Concerns\SkipsFailures;
use Maatwebsite\Excel\Concerns\Importable;

class PerkembanganKthImport implements ToModel, WithHeadingRow, WithValidation, SkipsOnFailure
{
  use SkipsFailures, Importable;

  public function model(array $row)
  {
    if (!isset($row['tahun'])) {
      return null;
    }

    // Robust field detection with fallbacks
    $kabupatenInfo = $row['nama_kabupaten'] ?? $row['kabupatenkota'] ?? null;
    $kecamatanInfo = $row['nama_kecamatan'] ?? $row['kecamatan'] ?? null;
    $desaInfo = $row['nama_desa'] ?? $row['desa'] ?? null;
    $bulanInfo = $row['bulan_angka'] ?? $row['bulan_1_12'] ?? $row['bulan'] ?? null;
    $kelasInfo = $row['kelas_kelembagaan'] ?? $row['kelas_kelembagaan_pemulamadyautama'] ?? 'pemula';
    $luasInfo = $row['luas_kelola_ha'] ?? $row['luas_kelola'] ?? 0;

    // Find location IDs by name using DB for performance and consistency
    $regency = \Illuminate\Support\Facades\DB::table('m_regencies')
      ->whereRaw('LOWER(name) LIKE ?', ['%' . strtolower(trim($kabupatenInfo)) . '%'])
      ->first();

    $district = null;
    if ($regency && $kecamatanInfo) {
      $district = \Illuminate\Support\Facades\DB::table('m_districts')
        ->where('regency_id', $regency->id)
        ->whereRaw('LOWER(name) LIKE ?', ['%' . strtolower(trim($kecamatanInfo)) . '%'])
        ->first();
    }

    $village = null;
    if ($district && $desaInfo) {
      $village = \Illuminate\Support\Facades\DB::table('m_villages')
        ->where('district_id', $district->id)
        ->whereRaw('LOWER(name) LIKE ?', ['%' . strtolower(trim($desaInfo)) . '%'])
        ->first();
    }

    return new PerkembanganKth([
      'year' => $row['tahun'],
      'month' => $bulanInfo,
      'province_id' => 35, // Jawa Timur
      'regency_id' => $regency?->id,
      'district_id' => $district?->id,
      'village_id' => $village?->id,
      'nama_kth' => $row['nama_kth'],
      'nomor_register' => $row['nomor_register'] ?? null,
      'kelas_kelembagaan' => strtolower(trim($kelasInfo)),
      'jumlah_anggota' => $row['jumlah_anggota'] ?? 0,
      'luas_kelola' => $luasInfo,
      'potensi_kawasan' => $row['potensi_kawasan'] ?? null,
      'status' => 'draft',
    ]);
  }

  public function rules(): array
  {
    return [
      'tahun' => 'required|integer',
      'nama_kth' => 'required|string',
    ];
  }
}
