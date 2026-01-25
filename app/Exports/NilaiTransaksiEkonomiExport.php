<?php

namespace App\Exports;

use App\Models\NilaiTransaksiEkonomi;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class NilaiTransaksiEkonomiExport implements FromCollection, WithHeadings, WithMapping, WithStyles
{
  protected $year;

  public function __construct($year = null)
  {
    $this->year = $year;
  }

  public function collection()
  {
    // We want to export details, so we load them
    $records = NilaiTransaksiEkonomi::query()
      ->with(['regency_rel', 'district_rel', 'village_rel', 'details.commodity'])
      ->when($this->year, fn($q) => $q->where('year', $this->year))
      ->where('status', 'final')
      ->get();

    $rows = collect();
    foreach ($records as $record) {
      foreach ($record->details as $detail) {
        // Attach the parent record info to each detail for mapping
        $detail->parent = $record;
        $rows->push($detail);
      }
    }

    return $rows;
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
      'Nama KTH',
      'Komoditas',
      'Volume Produksi',
      'Satuan',
      'Nilai Transaksi (Rp)',
      'Status',
    ];
  }

  public function map($detail): array
  {
    static $no = 0;
    $no++;

    $row = $detail->parent;
    $months = [
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
      $months[$row->month] ?? $row->month,
      $row->regency_rel?->name ?? '-',
      $row->district_rel?->name ?? '-',
      $row->village_rel?->name ?? '-',
      $row->nama_kth,
      $detail->commodity?->name ?? '-',
      $detail->volume_produksi,
      $detail->satuan,
      $detail->nilai_transaksi,
      ucfirst($row->status),
    ];
  }

  public function styles(Worksheet $sheet)
  {
    return [
      1 => ['font' => ['bold' => true]],
    ];
  }
}
