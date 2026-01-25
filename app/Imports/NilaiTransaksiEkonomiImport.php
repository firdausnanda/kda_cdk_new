<?php

namespace App\Imports;

use App\Models\NilaiTransaksiEkonomi;
use App\Models\NilaiTransaksiEkonomiDetail;
use App\Models\Commodity;
use App\Models\Regencies;
use App\Models\Districts;
use App\Models\Villages;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;
use Maatwebsite\Excel\Concerns\SkipsOnFailure;
use Maatwebsite\Excel\Concerns\SkipsFailures;
use Maatwebsite\Excel\Concerns\Importable;
use Illuminate\Support\Facades\Auth;

class NilaiTransaksiEkonomiImport implements ToCollection, WithHeadingRow, WithValidation, SkipsOnFailure
{
  use SkipsFailures, Importable;

  public function collection(Collection $rows)
  {
    foreach ($rows as $row) {
      // Basic data extraction
      $year = $row['tahun'];
      $month = $row['bulan_112'] ?? $row['bulan'];
      $namaKth = $row['nama_kth'];

      // Find location IDs by name
      $regency = Regencies::whereRaw('LOWER(name) LIKE ?', ['%' . strtolower(trim($row['kabupatenkota'])) . '%'])->first();
      $district = Districts::whereRaw('LOWER(name) LIKE ?', ['%' . strtolower(trim($row['kecamatan'])) . '%'])
        ->when($regency, fn($q) => $q->where('regency_id', $regency->id))
        ->first();
      $village = Villages::whereRaw('LOWER(name) LIKE ?', ['%' . strtolower(trim($row['desa'])) . '%'])
        ->when($district, fn($q) => $q->where('district_id', $district->id))
        ->first();

      // Find or create the main record
      $transaction = NilaiTransaksiEkonomi::firstOrCreate([
        'year' => $year,
        'month' => $month,
        'nama_kth' => $namaKth,
        'province_id' => 35,
        'regency_id' => $regency?->id,
        'district_id' => $district?->id,
        'village_id' => $village?->id,
      ], [
        'status' => 'draft',
        'created_by' => Auth::id(),
        'total_nilai_transaksi' => 0,
      ]);

      // Find or create commodity
      $commodityName = trim($row['komoditas']);
      $commodity = Commodity::firstOrCreate(['name' => $commodityName]);

      // Add detail
      $volume = $row['volume_produksi'] ?? 0;
      $satuan = $row['satuan'] ?? 'Kg';
      $nilai = $row['nilai_transaksi_rp'] ?? $row['nilai_transaksi'] ?? 0;

      $transaction->details()->create([
        'commodity_id' => $commodity->id,
        'volume_produksi' => $volume,
        'satuan' => $satuan,
        'nilai_transaksi' => $nilai,
      ]);

      // Update total
      $transaction->increment('total_nilai_transaksi', $nilai);
    }
  }

  public function rules(): array
  {
    return [
      'tahun' => 'required|integer',
      'nama_kth' => 'required|string',
      'komoditas' => 'required|string',
    ];
  }
}
