<?php

namespace App\Imports;

use App\Models\PenghijauanLingkungan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;
use Maatwebsite\Excel\Concerns\SkipsOnFailure;
use Maatwebsite\Excel\Concerns\SkipsFailures;

class PenghijauanLingkunganImport implements ToModel, WithHeadingRow, WithValidation, SkipsOnFailure
{
  use SkipsFailures;

  public function rules(): array
  {
    return [
      'tahun' => 'required|numeric',
      'bulan_angka' => 'required|numeric|min:1|max:12',
      'nama_kabupaten' => 'required|exists:m_regencies,name',
      'nama_kecamatan' => 'required|exists:m_districts,name',
      'target_tahunan_ha' => 'required|numeric',
      'realisasi_ha' => 'required|numeric',
      'sumber_dana' => 'required|in:apbn,apbd,swasta,swadaya,other',
    ];
  }

  public function customValidationMessages()
  {
    return [
      'nama_kabupaten.exists' => 'Kabupaten tidak ditemukan.',
      'nama_kecamatan.exists' => 'Kecamatan tidak ditemukan.',
      'bulan_angka.min' => 'Bulan harus 1-12.',
      'bulan_angka.max' => 'Bulan harus 1-12.',
      'sumber_dana.in' => 'Sumber Dana harus: apbn, apbd, swasta, swadaya, atau other.',
    ];
  }

  public function model(array $row)
  {
    if (!isset($row['tahun']))
      return null;

    $regency = DB::table('m_regencies')
      ->where('province_id', 35)
      ->where('name', 'like', '%' . $row['nama_kabupaten'] . '%')
      ->first();
    if (!$regency)
      return null;

    $district = DB::table('m_districts')
      ->where('regency_id', $regency->id)
      ->where('name', 'like', '%' . $row['nama_kecamatan'] . '%')
      ->first();

    if (!$district) {
      $district = DB::table('m_districts')
        ->where('name', 'like', '%' . $row['nama_kecamatan'] . '%')
        ->first();
    }

    if (!$district)
      return null;

    $village = null;
    if (!empty($row['nama_desa'])) {
      $village = DB::table('m_villages')
        ->where('district_id', $district->id)
        ->where('name', 'like', '%' . $row['nama_desa'] . '%')
        ->first();
    }

    return new PenghijauanLingkungan([
      'year' => $row['tahun'],
      'month' => $row['bulan_angka'],
      'province_id' => 35,
      'regency_id' => $regency->id,
      'district_id' => $district->id,
      'village_id' => $village?->id,
      'target_annual' => $row['target_tahunan_ha'] ?? 0,
      'realization' => $row['realisasi_ha'] ?? 0,
      'fund_source' => $row['sumber_dana'] ?? 'other',
      'status' => 'draft',
      'created_by' => Auth::id(),
    ]);
  }
}
