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

  public function __construct($forestType)
  {
    $this->forestType = $forestType;
  }

  public function rules(): array
  {
    return [
      'tahun' => 'required|numeric',
      'bulan_angka' => 'required|numeric|min:1|max:12',
      'nama_kabupaten' => 'required|exists:m_regencies,name',
      'nama_kecamatan' => 'required|exists:m_districts,name',
      'jenis_komoditas' => 'required|exists:m_bukan_kayu,name', // Lookup by name
      'volume' => 'required', // Assuming string or numeric
    ];
  }

  public function customValidationMessages()
  {
    return [
      'nama_kabupaten.exists' => 'Kabupaten tidak ditemukan.',
      'nama_kecamatan.exists' => 'Kecamatan tidak ditemukan.',
      'jenis_komoditas.exists' => 'Jenis Komoditas tidak ditemukan.',
      'bulan_angka.min' => 'Bulan harus 1-12.',
      'bulan_angka.max' => 'Bulan harus 1-12.',
    ];
  }

  public function model(array $row)
  {
    if (!isset($row['tahun']))
      return null;

    // 1. Lookup ID Bukan Kayu
    $bukanKayu = BukanKayu::where('name', 'like', '%' . $row['jenis_komoditas'] . '%')->first();
    if (!$bukanKayu)
      return null;

    // 2. Lookup Regency ID
    $regency = DB::table('m_regencies')
      ->where('province_id', 35)
      ->where('name', 'like', '%' . $row['nama_kabupaten'] . '%')
      ->first();
    if (!$regency)
      return null;

    // 3. Lookup District ID
    $district = DB::table('m_districts')
      ->where('regency_id', $regency->id) // Strict check
      ->where('name', 'like', '%' . $row['nama_kecamatan'] . '%')
      ->first();

    if (!$district) {
      $district = DB::table('m_districts')
        ->where('name', 'like', '%' . $row['nama_kecamatan'] . '%')
        ->first();
    }

    if (!$district)
      return null;

    return new HasilHutanBukanKayu([
      'year' => $row['tahun'],
      'month' => $row['bulan_angka'],
      'province_id' => 35, // Default JAWA TIMUR
      'regency_id' => $regency->id,
      'district_id' => $district->id,
      'forest_type' => $this->forestType,
      'annual_volume_target' => $row['volume'] ?? '0',
      'id_bukan_kayu' => $bukanKayu->id,
      'status' => 'draft',
      'created_by' => Auth::id(),
    ]);
  }
}
