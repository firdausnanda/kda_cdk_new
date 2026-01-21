<?php

namespace App\Imports;

use App\Models\PengunjungWisata;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;
use Maatwebsite\Excel\Concerns\SkipsOnFailure;
use Maatwebsite\Excel\Concerns\SkipsFailures;

class PengunjungWisataImport implements ToModel, WithHeadingRow, WithValidation, SkipsOnFailure
{
  use SkipsFailures;

  public function rules(): array
  {
    return [
      'tahun' => 'required|numeric',
      'bulan_angka_1_12' => 'required|numeric|min:1|max:12',
      'nama_pengelola_wisata' => 'required|string',
      'jumlah_pengunjung' => 'required|numeric|min:0',
      'pendapatan_bruto_rp' => 'required|numeric|min:0',
    ];
  }

  public function customValidationMessages()
  {
    return [
      'nama_pengelola_wisata.required' => 'Nama Pengelola Wisata harus diisi.',
    ];
  }

  public function model(array $row)
  {
    if (!isset($row['tahun']))
      return null;

    // Look up pengelola wisata by name (case-insensitive partial match)
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

    return new PengunjungWisata([
      'year' => $row['tahun'],
      'month' => $row['bulan_angka_1_12'],
      'id_pengelola_wisata' => $pengelolaWisata->id,
      'number_of_visitors' => $row['jumlah_pengunjung'],
      'gross_income' => $row['pendapatan_bruto_rp'],
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
