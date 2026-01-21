<?php

namespace App\Imports;

use App\Models\KebakaranHutan;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;
use Maatwebsite\Excel\Concerns\SkipsOnFailure;
use Maatwebsite\Excel\Concerns\SkipsFailures;

class KebakaranHutanImport implements ToModel, WithHeadingRow, WithValidation, SkipsOnFailure
{
  use SkipsFailures;

  public function rules(): array
  {
    return [
      'tahun' => 'required|numeric',
      'bulan_angka_1_12' => 'required|numeric|min:1|max:12',
      'nama_kabupatenkota' => 'required|string',
      'nama_kecamatan' => 'required|string',
      'nama_desa' => 'required|string',
      'nama_pengelola_wisata' => 'required|string',
      'fungsi_kawasan' => 'required|string',
      'jumlah_kejadian' => 'required|numeric|min:0',
      'luas_kebakaran_ha' => 'required|string',
    ];
  }

  public function customValidationMessages()
  {
    return [
      'nama_kabupatenkota.required' => 'Nama Kabupaten/Kota harus diisi.',
      'nama_kecamatan.required' => 'Nama Kecamatan harus diisi.',
      'nama_desa.required' => 'Nama Desa harus diisi.',
      'nama_pengelola_wisata.required' => 'Nama Pengelola Wisata harus diisi.',
    ];
  }

  public function model(array $row)
  {
    if (!isset($row['tahun']))
      return null;

    // Look up regency by name (case-insensitive)
    $regency = DB::table('m_regencies')
      ->whereRaw('LOWER(name) LIKE ?', ['%' . strtolower(trim($row['nama_kabupatenkota'])) . '%'])
      ->first();

    if (!$regency) {
      $this->onFailure(new \Maatwebsite\Excel\Validators\Failure(
        $this->getRowNumber(),
        'nama_kabupatenkota',
        ["Kabupaten/Kota '{$row['nama_kabupatenkota']}' tidak ditemukan."]
      ));
      return null;
    }

    // Look up district by name within regency
    $district = DB::table('m_districts')
      ->where('regency_id', $regency->id)
      ->whereRaw('LOWER(name) LIKE ?', ['%' . strtolower(trim($row['nama_kecamatan'])) . '%'])
      ->first();

    if (!$district) {
      $this->onFailure(new \Maatwebsite\Excel\Validators\Failure(
        $this->getRowNumber(),
        'nama_kecamatan',
        ["Kecamatan '{$row['nama_kecamatan']}' tidak ditemukan di {$regency->name}."]
      ));
      return null;
    }

    // Look up village by name within district
    $village = DB::table('m_villages')
      ->where('district_id', $district->id)
      ->whereRaw('LOWER(name) LIKE ?', ['%' . strtolower(trim($row['nama_desa'])) . '%'])
      ->first();

    if (!$village) {
      $this->onFailure(new \Maatwebsite\Excel\Validators\Failure(
        $this->getRowNumber(),
        'nama_desa',
        ["Desa '{$row['nama_desa']}' tidak ditemukan di Kec. {$district->name}."]
      ));
      return null;
    }

    // Look up pengelola wisata by name
    $pengelolaWisata = DB::table('m_pengelola_wisata')
      ->whereRaw('LOWER(name) LIKE ?', ['%' . strtolower(trim($row['nama_pengelola_wisata'])) . '%'])
      ->first();

    if (!$pengelolaWisata) {
      $this->onFailure(new \Maatwebsite\Excel\Validators\Failure(
        $this->getRowNumber(),
        'nama_pengelola_wisata',
        ["Pengelola Wisata '{$row['nama_pengelola_wisata']}' tidak ditemukan."]
      ));
      return null;
    }

    return new KebakaranHutan([
      'year' => $row['tahun'],
      'month' => $row['bulan_angka_1_12'],
      'province_id' => $regency->province_id,
      'regency_id' => $regency->id,
      'district_id' => $district->id,
      'village_id' => $village->id,
      'id_pengelola_wisata' => $pengelolaWisata->id,
      'area_function' => $row['fungsi_kawasan'],
      'number_of_fires' => $row['jumlah_kejadian'],
      'fire_area' => $row['luas_kebakaran_ha'],
      'status' => 'draft',
      'created_by' => Auth::id(),
    ]);
  }

  private $rowNumber = 1;

  public function getRowNumber()
  {
    return $this->rowNumber++;
  }
}
