<?php

namespace App\Imports;

use App\Models\Pbphh;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;
use Maatwebsite\Excel\Concerns\SkipsOnFailure;
use Maatwebsite\Excel\Concerns\SkipsFailures;

class PbphhImport implements ToModel, WithHeadingRow, WithValidation, SkipsOnFailure
{
  use SkipsFailures;

  public function rules(): array
  {
    return [
      'nama_industri' => 'required|string',
      'nomor_izin' => 'required|string',
      'nama_kabupatenkota' => 'required|string',
      'nama_kecamatan' => 'required|string',
      'nilai_investasi' => 'required|numeric|min:0',
      'jumlah_tenaga_kerja' => 'required|numeric|min:0',
      'kondisi_saat_ini' => 'required|in:Aktif,aktif,Tidak Aktif,tidak aktif,1,0,true,false',
      'nama_jenis_produksi' => 'required|string',
    ];
  }

  public function customValidationMessages()
  {
    return [
      'nama_industri.required' => 'Nama Industri harus diisi.',
      'nomor_izin.required' => 'Nomor Izin harus diisi.',
      'nama_kabupatenkota.required' => 'Nama Kabupaten/Kota harus diisi.',
      'nama_kecamatan.required' => 'Nama Kecamatan harus diisi.',
      'nilai_investasi.required' => 'Nilai Investasi harus diisi.',
      'jumlah_tenaga_kerja.required' => 'Jumlah Tenaga Kerja harus diisi.',
      'kondisi_saat_ini.required' => 'Kondisi Saat Ini harus diisi.',
      'nama_jenis_produksi.required' => 'Nama Jenis Produksi harus diisi.',
    ];
  }

  public function model(array $row)
  {
    if (!isset($row['nama_industri']))
      return null;

    // Look up regency by name
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

    // Look up jenis produksi by name
    $jenisProduksi = DB::table('m_jenis_produksi')
      ->whereRaw('LOWER(name) LIKE ?', ['%' . strtolower(trim($row['nama_jenis_produksi'])) . '%'])
      ->first();

    if (!$jenisProduksi) {
      $this->onFailure(new \Maatwebsite\Excel\Validators\Failure(
        $this->getRowNumber(),
        'nama_jenis_produksi',
        ["Jenis Produksi '{$row['nama_jenis_produksi']}' tidak ditemukan."]
      ));
      return null;
    }

    // Parse present_condition
    $condition = strtolower(trim($row['kondisi_saat_ini']));
    $presentCondition = in_array($condition, ['aktif', '1', 'true']) ? true : false;

    return new Pbphh([
      'name' => $row['nama_industri'],
      'number' => $row['nomor_izin'],
      'province_id' => $regency->province_id,
      'regency_id' => $regency->id,
      'district_id' => $district->id,
      'investment_value' => (int) $row['nilai_investasi'],
      'number_of_workers' => (int) $row['jumlah_tenaga_kerja'],
      'present_condition' => $presentCondition,
      'id_jenis_produksi' => $jenisProduksi->id,
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
