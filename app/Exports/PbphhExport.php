<?php

namespace App\Exports;

use App\Models\Pbphh;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithTitle;

class PbphhExport implements FromQuery, WithHeadings, WithMapping, ShouldAutoSize, WithTitle
{
  public function query()
  {
    return Pbphh::query()
      ->with(['creator', 'regency', 'district', 'jenis_produksi'])
      ->where('status', 'final')
      ->orderBy('name', 'asc');
  }

  public function headings(): array
  {
    return [
      'No',
      'Nama Industri',
      'Nomor Izin',
      'Kabupaten/Kota',
      'Kecamatan',
      'Nilai Investasi',
      'Jumlah Tenaga Kerja',
      'Kondisi Saat Ini',
      'Jenis Produksi',
      'Status',
      'Diinput Oleh',
      'Tanggal Input'
    ];
  }

  public function map($row): array
  {
    static $no = 0;
    $no++;

    return [
      $no,
      $row->name,
      $row->number,
      $row->regency->name ?? '-',
      $row->district->name ?? '-',
      number_format($row->investment_value, 0, ',', '.'),
      $row->number_of_workers,
      $row->present_condition ? 'Aktif' : 'Tidak Aktif',
      $row->jenis_produksi->name ?? '-',
      ucfirst($row->status),
      $row->creator->name ?? 'Unknown',
      $row->created_at->format('d-m-Y H:i'),
    ];
  }

  public function title(): string
  {
    return 'Data PBPHH';
  }
}
