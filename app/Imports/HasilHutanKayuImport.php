<?php

namespace App\Imports;

use App\Models\HasilHutanKayu;
use App\Models\Kayu;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;
use Maatwebsite\Excel\Concerns\SkipsOnFailure;
use Maatwebsite\Excel\Concerns\SkipsFailures;
use Illuminate\Support\Facades\Auth;

class HasilHutanKayuImport implements ToModel, WithHeadingRow, WithValidation, SkipsOnFailure
{
  use SkipsFailures;

  protected $forestType;

  public function __construct($forestType)
  {
    $this->forestType = $forestType;
  }

  public function rules(): array
  {
    $rules = [
      'tahun' => 'required|numeric',
      'bulan_angka' => 'required|numeric|min:1|max:12',
      'nama_kabupaten' => 'required|exists:m_regencies,name',
      'total_target_m3' => 'required|numeric|min:0',
    ];

    if ($this->forestType === 'Hutan Rakyat') {
      $rules['nama_kecamatan'] = 'required|exists:m_districts,name';
    }

    if ($this->forestType === 'Perhutanan Sosial') {
      $rules['nama_pengelola_wisata'] = 'required|exists:m_pengelola_wisata,name';
    }

    return $rules;
  }

  public function customValidationMessages()
  {
    return [
      'nama_kabupaten.exists' => 'Kabupaten tidak ditemukan.',
      'nama_kecamatan.exists' => 'Kecamatan tidak ditemukan.',
      'nama_kecamatan.required' => 'Kecamatan wajib diisi untuk jenis hutan ini.',
      'nama_pengelola_wisata.exists' => 'Pengelola Wisata tidak ditemukan.',
      'nama_pengelola_wisata.required' => 'Pengelola Wisata wajib diisi untuk jenis hutan ini.',
      'bulan_angka.min' => 'Bulan harus 1-12.',
      'bulan_angka.max' => 'Bulan harus 1-12.',
    ];
  }

  public function model(array $row)
  {
    if (!isset($row['tahun']))
      return null;

    // Resolve Location
    $regency = DB::table('m_regencies')
      ->where('province_id', 35)
      ->where('name', 'like', '%' . $row['nama_kabupaten'] . '%')
      ->first();
    if (!$regency)
      return null;

    $district = null;
    $districtId = null;

    if ($this->forestType === 'Hutan Rakyat') {
      if (empty($row['nama_kecamatan'])) {
        return null;
      }
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
      $districtId = $district->id;
    }

    // Resolve Pengelola Wisata
    $pengelolaWisataId = null;
    if ($this->forestType === 'Perhutanan Sosial' && !empty($row['nama_pengelola_wisata'])) {
      $pengelolaWisata = \App\Models\PengelolaWisata::where('name', 'like', '%' . $row['nama_pengelola_wisata'] . '%')->first();
      if ($pengelolaWisata) {
        $pengelolaWisataId = $pengelolaWisata->id;
      }
    }

    // Resolve Pengelola Hutan (Optional/Nullable in DB but good to have)
    $pengelolaHutanId = null;
    if ($this->forestType === 'Hutan Negara' && !empty($row['nama_pengelola_hutan'])) {
      $pengelola = \App\Models\PengelolaHutan::firstOrCreate(
        ['name' => $row['nama_pengelola_hutan']]
      );
      $pengelolaHutanId = $pengelola->id;
    }

    // Build Details array from dynamic columns
    $detailsData = [];
    $allKayu = Kayu::all();

    foreach ($allKayu as $kayu) {
      $slugName = \Illuminate\Support\Str::slug($kayu->name, '_');
      $realizationKey = $slugName . '_realisasi';

      // Check if realization key exists in row
      if (array_key_exists($realizationKey, $row)) {
        $realization = $row[$realizationKey] ?? 0;

        // Add detail if realization is 0 or more
        if ($realization >= 0) {
          $detailsData[] = [
            'kayu_id' => $kayu->id,
            'volume_realization' => $realization,
          ];
        }
      }
    }

    return DB::transaction(function () use ($row, $regency, $districtId, $pengelolaHutanId, $pengelolaWisataId, $detailsData) {
      $parent = HasilHutanKayu::create([
        'year' => $row['tahun'],
        'month' => $row['bulan_angka'],
        'province_id' => 35,
        'regency_id' => $regency->id,
        'district_id' => $districtId,
        'pengelola_hutan_id' => $pengelolaHutanId,
        'pengelola_wisata_id' => $pengelolaWisataId,
        'forest_type' => $this->forestType,
        'volume_target' => $row['total_target_m3'],
        'status' => 'draft',
        'created_by' => Auth::id(),
      ]);

      foreach ($detailsData as $detail) {
        $parent->details()->create($detail);
      }

      return $parent;
    });
  }
}
