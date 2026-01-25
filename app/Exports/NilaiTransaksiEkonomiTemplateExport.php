<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class NilaiTransaksiEkonomiTemplateExport implements FromArray, WithHeadings, WithStyles
{
  public function array(): array
  {
    return [
      [
        2026,
        1,
        'TRENGGALEK',
        'BENDUNGAN',
        'MASARAN',
        'KTH Makmur Sejahtera',
        'Kayu Jati',
        100.5,
        'M3',
        15000000
      ],
    ];
  }

  public function headings(): array
  {
    return [
      'Tahun',
      'Bulan (1-12)',
      'Kabupaten/Kota',
      'Kecamatan',
      'Desa',
      'Nama KTH',
      'Komoditas',
      'Volume Produksi',
      'Satuan',
      'Nilai Transaksi (Rp)',
    ];
  }

  public function styles(Worksheet $sheet)
  {
    return [
      1 => ['font' => ['bold' => true]],
    ];
  }
}
