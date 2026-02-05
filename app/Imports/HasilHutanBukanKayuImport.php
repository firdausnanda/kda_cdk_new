<?php

namespace App\Imports;

use App\Models\HasilHutanBukanKayu;
use App\Models\BukanKayu;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;
use Maatwebsite\Excel\Concerns\SkipsOnFailure;
use Maatwebsite\Excel\Concerns\SkipsFailures;
use Illuminate\Support\Facades\Auth;

class HasilHutanBukanKayuImport implements ToModel, WithHeadingRow, WithValidation, SkipsOnFailure
{
  use SkipsFailures;

  protected $forestType;
  protected $commodities;

  public function __construct($forestType)
  {
    $this->forestType = $forestType;
    $this->commodities = BukanKayu::all();
  }

  public function rules(): array
  {
    if ($this->forestType === 'Hutan Negara') {
      return [
        'tahun' => 'required|numeric',
        'bulan_angka' => 'required|numeric|min:1|max:12',
        'nama_kabupaten' => 'required|exists:m_regencies,name',
        'nama_pengelola' => 'required|string',
        'total_target' => 'required|numeric|min:0',
      ];
    }

    if ($this->forestType === 'Perhutanan Sosial') {
      return [
        'tahun' => 'required|numeric',
        'bulan_angka' => 'required|numeric|min:1|max:12',
        'nama_kabupaten' => 'required|exists:m_regencies,name',
        'nama_pengelola_wisata' => 'required|exists:m_pengelola_wisata,name',
        'total_target' => 'required|numeric|min:0',
      ];
    }

    return [
      'tahun' => 'required|numeric',
      'bulan_angka' => 'required|numeric|min:1|max:12',
      'nama_kabupaten' => 'required|exists:m_regencies,name',
      'nama_kecamatan' => 'required|exists:m_districts,name',
      'total_target' => 'required|numeric|min:0',
    ];
  }

  public function customValidationMessages()
  {
    return [
      'nama_kabupaten.exists' => 'Kabupaten tidak ditemukan.',
      'nama_kecamatan.exists' => 'Kecamatan tidak ditemukan.',
      'bulan_angka.min' => 'Bulan harus 1-12.',
      'bulan_angka.max' => 'Bulan harus 1-12.',
      'total_target.required' => 'Total Target wajib diisi.',
      'nama_pengelola.required' => 'Nama Pengelola wajib diisi untuk Hutan Negara.',
      'nama_pengelola_wisata.required' => 'Nama Pengelola wajib diisi untuk Perhutanan Sosial.',
      'nama_pengelola_wisata.exists' => 'Data Pengelola Wisata tidak ditemukan.',
    ];
  }

  public function model(array $row)
  {
    if (!isset($row['tahun']))
      return null;

    // 1. Lookup Regency ID
    $regency = DB::table('m_regencies')
      ->where('province_id', 35)
      ->where('name', 'like', '%' . $row['nama_kabupaten'] . '%')
      ->first();
    if (!$regency)
      return null;

    // 2. Lookup District ID (only for Rakyat/Sosial)
    $districtId = null;
    if ($this->forestType !== 'Hutan Negara' && !empty($row['nama_kecamatan'])) {
      $district = DB::table('m_districts')
        ->where('regency_id', $regency->id) // Strict check
        ->where('name', 'like', '%' . $row['nama_kecamatan'] . '%')
        ->first();

      if (!$district) {
        $district = DB::table('m_districts')
          ->where('name', 'like', '%' . $row['nama_kecamatan'] . '%')
          ->first();
      }
      $districtId = $district?->id;
    }

    if ($this->forestType === 'Hutan Rakyat' && !$districtId)
      return null;

    // 2.5 Lookup Pengelola ID (only for Hutan Negara)
    $pengelolaId = null;
    if ($this->forestType === 'Hutan Negara' && !empty($row['nama_pengelola'])) {
      $pengelola = DB::table('m_pengelola_hutan')
        ->where('name', 'like', '%' . $row['nama_pengelola'] . '%')
        ->first();
      $pengelolaId = $pengelola?->id;
    }

    if ($this->forestType === 'Hutan Negara' && !$pengelolaId)
      return null;

    // 2.7 Lookup Pengelola Wisata ID (only for Perhutanan Sosial)
    $pengelolaWisataId = null;
    if ($this->forestType === 'Perhutanan Sosial' && !empty($row['nama_pengelola_wisata'])) {
      $pengelolaWisata = DB::table('m_pengelola_wisata')
        ->where('name', 'like', '%' . $row['nama_pengelola_wisata'] . '%')
        ->first();
      $pengelolaWisataId = $pengelolaWisata?->id;
    }

    if ($this->forestType === 'Perhutanan Sosial' && !$pengelolaWisataId)
      return null;

    // Create Parent
    $hhbk = HasilHutanBukanKayu::create([
      'year' => $row['tahun'],
      'month' => $row['bulan_angka'],
      'province_id' => 35, // Default JAWA TIMUR
      'regency_id' => $regency->id,
      'district_id' => $this->forestType === 'Hutan Rakyat' ? $districtId : null,
      'pengelola_hutan_id' => $this->forestType === 'Hutan Negara' ? $pengelolaId : null,
      'pengelola_wisata_id' => $this->forestType === 'Perhutanan Sosial' ? $pengelolaWisataId : null,
      'forest_type' => $this->forestType,
      'volume_target' => $row['total_target'] ?? 0,
      'status' => 'draft',
      'created_by' => Auth::id(),
    ]);

    // 3. Loop through commodities and check for data in row
    foreach ($this->commodities as $commodity) {
      $slug = \Illuminate\Support\Str::slug($commodity->name, '_');
      $realizationKey = $slug . '_realisasi';
      $unitKey = $slug . '_satuan';

      $realizationVolume = $row[$realizationKey] ?? 0;
      $unit = $row[$unitKey] ?? 'Kg';

      // Only add detail if there is non-zero data
      if ($realizationVolume > 0) {
        $hhbk->details()->create([
          'bukan_kayu_id' => $commodity->id,
          'annual_volume_realization' => $realizationVolume,
          'unit' => $unit,
        ]);
      }
    }

    return $hhbk;
  }
}
