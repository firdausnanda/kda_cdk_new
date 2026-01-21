<?php

namespace App\Exports;

use App\Models\KebakaranHutan;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithTitle;

class KebakaranHutanExport implements FromQuery, WithHeadings, WithMapping, ShouldAutoSize, WithTitle
{
  protected $year;

  public function __construct($year = null)
  {
    $this->year = $year;
  }

  public function query()
  {
    return KebakaranHutan::query()
      ->with(['creator', 'regency', 'district', 'village', 'pengelolaWisata'])
      ->where('status', 'final')
      ->when($this->year, fn($q) => $q->where('year', $this->year))
      ->orderBy('year', 'desc')
      ->orderBy('month', 'asc');
  }

  public function headings(): array
  {
    return [
      'No',
      'Tahun',
      'Bulan',
      'Kabupaten/Kota',
      'Kecamatan',
      'Desa',
      'Pengelola Wisata',
      'Fungsi Kawasan',
      'Jumlah Kejadian',
      'Luas Kebakaran (Ha)',
      'Status',
      'Diinput Oleh',
      'Tanggal Input'
    ];
  }

  public function map($row): array
  {
    static $no = 0;
    $no++;
    $monthNames = [
      1 => 'Januari',
      2 => 'Februari',
      3 => 'Maret',
      4 => 'April',
      5 => 'Mei',
      6 => 'Juni',
      7 => 'Juli',
      8 => 'Agustus',
      9 => 'September',
      10 => 'Oktober',
      11 => 'November',
      12 => 'Desember'
    ];

    return [
      $no,
      $row->year,
      $monthNames[$row->month] ?? $row->month,
      $row->regency->name ?? '-',
      $row->district->name ?? '-',
      $row->village->name ?? '-',
      $row->pengelolaWisata->name ?? '-',
      $row->area_function,
      $row->number_of_fires,
      $row->fire_area,
      ucfirst($row->status),
      $row->creator->name ?? 'Unknown',
      $row->created_at->format('d-m-Y H:i'),
    ];
  }

  public function title(): string
  {
    return 'Kebakaran Hutan ' . ($this->year ?? 'Semua Tahun');
  }
}
