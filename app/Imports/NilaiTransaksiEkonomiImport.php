<?php

namespace App\Imports;

use App\Models\NilaiTransaksiEkonomi;
use App\Models\Commodity;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;
use Maatwebsite\Excel\Concerns\SkipsOnFailure;
use Maatwebsite\Excel\Concerns\SkipsFailures;
use Illuminate\Support\Facades\Auth;

class NilaiTransaksiEkonomiImport implements ToModel, WithHeadingRow, WithValidation, SkipsOnFailure
{
  use SkipsFailures;

  public function rules(): array
  {
    return [
      'tahun' => 'required|numeric',
      'bulan_1_12' => 'required|numeric|min:1|max:12', // Matches template: Bulan (1-12)
      'nama_kth' => 'required|string',
      'nama_kabupaten' => 'required|string', // Matches template: Nama Kabupaten
      'nama_kecamatan' => 'required|string', // Matches template: Nama Kecamatan
      'nama_desa' => 'required|string',      // Matches template: Nama Desa
      'komoditas' => 'required|string',
      'volume_produksi' => 'required|numeric',
      'satuan' => 'required|string',
      'nilai_transaksi_rp' => 'required|numeric',
    ];
  }

  public function customValidationMessages()
  {
    return [
      'nama_kabupaten.required' => 'Kabupaten/Kota harus diisi.',
      'nama_kecamatan.required' => 'Kecamatan harus diisi.',
      'nama_desa.required' => 'Desa harus diisi.',
      'komoditas.required' => 'Komoditas harus diisi.',
    ];
  }

  public function model(array $row)
  {
    \Illuminate\Support\Facades\Log::info('NTE Import Row:', $row);

    if (!isset($row['tahun'])) {
      return null;
    }

    // Handle nuances in keys (Slugified headers)
    $kabupatenInfo = $row['nama_kabupaten'] ?? $row['kabupatenkota'] ?? null;
    $kecamatanInfo = $row['nama_kecamatan'] ?? $row['kecamatan'] ?? null;
    $desaInfo = $row['nama_desa'] ?? $row['desa'] ?? null;
    $bulanInfo = $row['bulan_1_12'] ?? $row['bulan'] ?? null;

    if (!$kabupatenInfo || !$kecamatanInfo || !$desaInfo || !$bulanInfo) {
      // Should have been caught by validation, but if keys mismatch validation might behave oddly or we need manual check
      return null;
    }

    // 1. Lookup Location IDs using DB facade for performance
    $regency = DB::table('m_regencies')
      ->whereRaw('LOWER(name) LIKE ?', ['%' . strtolower(trim($kabupatenInfo)) . '%'])
      ->first();

    if (!$regency) {
      $this->onFailure(new \Maatwebsite\Excel\Validators\Failure(
        $this->getRowNumber(),
        'nama_kabupaten',
        ["Kabupaten/Kota '{$kabupatenInfo}' tidak ditemukan."]
      ));
      return null;
    }

    $district = DB::table('m_districts')
      ->where('regency_id', $regency->id)
      ->whereRaw('LOWER(name) LIKE ?', ['%' . strtolower(trim($kecamatanInfo)) . '%'])
      ->first();

    if (!$district) {
      $this->onFailure(new \Maatwebsite\Excel\Validators\Failure(
        $this->getRowNumber(),
        'nama_kecamatan',
        ["Kecamatan '{$kecamatanInfo}' tidak ditemukan di {$regency->name}."]
      ));
      return null;
    }

    $village = DB::table('m_villages')
      ->where('district_id', $district->id)
      ->whereRaw('LOWER(name) LIKE ?', ['%' . strtolower(trim($desaInfo)) . '%'])
      ->first();

    if (!$village) {
      $this->onFailure(new \Maatwebsite\Excel\Validators\Failure(
        $this->getRowNumber(),
        'nama_desa',
        ["Desa '{$desaInfo}' tidak ditemukan di Kecamatan {$district->name}."]
      ));
      return null;
    }

    // 2. Find or Create Parent Record (NilaiTransaksiEkonomi)
    $transaction = NilaiTransaksiEkonomi::firstOrCreate([
      'year' => $row['tahun'],
      'month' => $bulanInfo,
      'nama_kth' => strtoupper($row['nama_kth']),
      'province_id' => 35,
      'regency_id' => $regency->id,
      'district_id' => $district->id,
      'village_id' => $village->id,
    ], [
      'status' => 'draft',
      'created_by' => Auth::id(),
      'total_nilai_transaksi' => 0,
    ]);

    // 3. Find or Create Commodity
    $commodityName = trim($row['komoditas']);
    $commodity = Commodity::firstOrCreate(['name' => $commodityName]);

    // 4. Create Detail
    $nilai = $row['nilai_transaksi_rp'] ?? 0;

    $transaction->details()->create([
      'commodity_id' => $commodity->id,
      'volume_produksi' => $row['volume_produksi'],
      'satuan' => $row['satuan'],
      'nilai_transaksi' => $nilai,
    ]);

    // 5. Update Total on Parent
    $transaction->increment('total_nilai_transaksi', $nilai);

    return $transaction;
  }

  private $rowNumber = 1;

  public function getRowNumber()
  {
    return $this->rowNumber++;
  }
}
