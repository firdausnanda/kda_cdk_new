<?php

namespace App\Exports;

use App\Models\HasilHutanBukanKayu;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;

class HasilHutanBukanKayuExport implements FromQuery, WithHeadings, WithMapping, ShouldAutoSize
{
  protected $forestType;
  protected $year;

  public function __construct($forestType, $year = null)
  {
    $this->forestType = $forestType;
    $this->year = $year;
  }

  public function query()
  {
    return HasilHutanBukanKayu::query()
      ->with(['regency', 'district', 'kayu', 'creator']) // 'kayu' relation name in model is `kayu()` but points to BukanKayu
      ->where('forest_type', $this->forestType)
      ->when($this->year, function ($q) {
        return $q->where('year', $this->year);
      });
  }

  public function headings(): array
  {
    return [
      'ID',
      'Tahun',
      'Bulan',
      'Provinsi',
      'Kabupaten/Kota',
      'Kecamatan',
      'Jenis Komoditas',
      'Volume',
      'Status',
      'Dibuat Oleh',
      'Tanggal Input',
    ];
  }

  public function map($row): array
  {
    return [
      $row->id,
      $row->year,
      date('F', mktime(0, 0, 0, $row->month, 10)),
      'JAWA TIMUR',
      $row->regency->name ?? '-',
      $row->district->name ?? '-',
      $row->kayu->name ?? '-', // Relation is named 'kayu' in model
      $row->annual_volume_target,
      $row->status,
      $row->creator->name ?? 'Unknown',
      $row->created_at->format('d-m-Y H:i'),
    ];
  }
}
