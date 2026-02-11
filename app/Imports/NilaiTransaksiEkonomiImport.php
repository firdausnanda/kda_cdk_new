<?php

namespace App\Imports;

use App\Models\NilaiTransaksiEkonomi;
use App\Models\Commodity;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithBatchInserts;
use Maatwebsite\Excel\Concerns\WithChunkReading;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;
use Maatwebsite\Excel\Concerns\SkipsOnFailure;
use Maatwebsite\Excel\Concerns\SkipsFailures;
use Illuminate\Support\Facades\Auth;

class NilaiTransaksiEkonomiImport implements
  ToModel,
  WithHeadingRow,
  WithValidation,
  SkipsOnFailure,
  WithChunkReading,
  WithBatchInserts
{
  use SkipsFailures;

  private $regencies = [];
  private $districts = [];
  private $villages = [];
  private $commodities = [];

  public function chunkSize(): int
  {
    return 500;
  }

  public function batchSize(): int
  {
    return 500;
  }

  public function rules(): array
  {
    return [
      'tahun' => 'required|numeric',
      'bulan_1_12' => 'required|numeric|min:1|max:12', // Matches template: Bulan (1-12)
      'nama_kth' => 'required|string',
      'nama_kabupaten' => 'required|string', // Matches template: Nama Kabupaten
      'nama_kecamatan' => 'required|string', // Matches template: Nama Kecamatan
      'nama_desa' => 'required|string',      // Matches template: Nama Desa
      'komoditas' => 'required',
      'volume_produksi' => 'required',
      'satuan' => 'required',
      'nilai_transaksi_rp' => 'required',
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
      return null;
    }

    // 1. Lookup Location IDs
    $kabKey = strtolower(trim($kabupatenInfo));

    if (!isset($this->regencies[$kabKey])) {
      $this->regencies[$kabKey] = DB::table('m_regencies')
        ->whereRaw('LOWER(name) LIKE ?', ["%{$kabKey}%"])
        ->first();
    }

    $regency = $this->regencies[$kabKey];

    if (!$regency) {
      $this->onFailure(new \Maatwebsite\Excel\Validators\Failure(
        $this->rowNumber,
        'nama_kabupaten',
        ["Kabupaten/Kota '{$kabupatenInfo}' tidak ditemukan."]
      ));
      return null;
    }

    $distKey = $regency->id . '_' . strtolower(trim($kecamatanInfo));

    if (!isset($this->districts[$distKey])) {
      $this->districts[$distKey] = DB::table('m_districts')
        ->where('regency_id', $regency->id)
        ->whereRaw('LOWER(name) LIKE ?', ['%' . strtolower(trim($kecamatanInfo)) . '%'])
        ->first();
    }

    $district = $this->districts[$distKey];

    if (!$district) {
      $this->onFailure(new \Maatwebsite\Excel\Validators\Failure(
        $this->rowNumber,
        'nama_kecamatan',
        ["Kecamatan '{$kecamatanInfo}' tidak ditemukan di {$regency->name}."]
      ));
      return null;
    }

    $villKey = $district->id . '_' . strtolower(trim($desaInfo));

    if (!isset($this->villages[$villKey])) {
      $this->villages[$villKey] = DB::table('m_villages')
        ->where('district_id', $district->id)
        ->whereRaw('LOWER(name) LIKE ?', ['%' . strtolower(trim($desaInfo)) . '%'])
        ->first();
    }

    $village = $this->villages[$villKey];

    if (!$village) {
      $this->onFailure(new \Maatwebsite\Excel\Validators\Failure(
        $this->rowNumber,
        'nama_desa',
        ["Desa '{$desaInfo}' tidak ditemukan di Kecamatan {$district->name}."]
      ));
      return null;
    }

    // 2. Find or Create Parent Record (NilaiTransaksiEkonomi)
    $transaction = NilaiTransaksiEkonomi::firstOrCreate([
      'year' => $row['tahun'],
      'month' => $bulanInfo,
      'nama_kth' => $row['nama_kth'],
      'province_id' => 35,
      'regency_id' => $regency->id,
      'district_id' => $district->id,
      'village_id' => $village->id,
    ], [
      'status' => 'draft',
      'created_by' => Auth::id(),
      'total_nilai_transaksi' => 0,
    ]);

    if (!$transaction->wasRecentlyCreated) {
      $transaction->update(['status' => 'draft']);
    }

    // 3. Parse Multi-input details
    $commodities = array_map('trim', explode(',', (string) $row['komoditas']));
    $volumes = array_map('trim', explode(',', (string) $row['volume_produksi']));
    $satuans = array_map('trim', explode(',', (string) $row['satuan']));
    $nilais = array_map('trim', explode(',', (string) $row['nilai_transaksi_rp']));

    // Use the count of commodities as the baseline
    $count = count($commodities);

    $detailsToInsert = [];
    $totalNilai = 0;
    $now = now(); // Timestamp for batch insert

    for ($i = 0; $i < $count; $i++) {
      $commodityName = $commodities[$i] ?? null;
      if (!$commodityName)
        continue;

      // Handle numeric formatting for volume and value
      // Since comma is the multi-item separator, we advise users to use DOT for decimals.
      // We still handle Indonesian format (1.000,50) if it's a SINGLE value, 
      // but in a multi-value list, commas will be split first.
      $volumeStr = $volumes[$i] ?? '0';
      if ($volumeStr !== '') {
        // If there is a dot AND it looks like a thousands separator (e.g. 1.000)
        // But wait, if they follow the rule "use dot for decimal", then 1.000 is 1.0
        // For now, let's just clean it up moderately.
        $volumeStr = str_replace([' ', "\r", "\n"], '', $volumeStr);
        // If it's a single value with no commas but has dot, we trust it's a decimal or just a number.
        // If it has a comma, it was likely NOT split by the top-level explode (which shouldn't happen).
        $volume = (float) str_replace(',', '.', $volumeStr);
      } else {
        $volume = 0;
      }

      $nilaiStr = $nilais[$i] ?? '0';
      if ($nilaiStr !== '') {
        $nilaiStr = str_replace([' ', "\r", "\n", '.'], '', $nilaiStr); // Remove dots (thousands)
        $nilaiStr = str_replace(',', '.', $nilaiStr); // Replace comma (decimal)
        $nilai = (float) $nilaiStr;
      } else {
        $nilai = 0;
      }


      $satuan = $satuans[$i] ?? '-';

      // Find or Create Commodity
      $commodityName = trim($commodityName);


      if (!array_key_exists($commodityName, $this->commodities)) {
        $this->commodities[$commodityName] = Commodity::withoutGlobalScope('not_nilai_transaksi_ekonomi')
          ->where('name', $commodityName)
          ->first();
      }

      $commodity = $this->commodities[$commodityName] ?? null;

      if (!$commodity) {
        continue;
      }

      // Add to batch insert array
      $detailsToInsert[] = [
        'nilai_transaksi_ekonomi_id' => $transaction->id,
        'commodity_id' => $commodity->id,
        'volume_produksi' => $volume,
        'satuan' => $satuan,
        'nilai_transaksi' => $nilai,
        'created_at' => $now,
        'updated_at' => $now,
      ];

      // Update Total Accumulator
      $totalNilai += $nilai;
    }

    // Single DB Update for Parent
    if ($totalNilai > 0 || $transaction->total_nilai_transaksi != $totalNilai) {
      $transaction->total_nilai_transaksi += $totalNilai;
      $transaction->save();
    }

    // Batch Insert Details
    if (!empty($detailsToInsert)) {
      \App\Models\NilaiTransaksiEkonomiDetail::insert($detailsToInsert);
    }

    return null;
  }

  private $rowNumber = 1;

  public function getRowNumber()
  {
    return $this->rowNumber++;
  }
}
