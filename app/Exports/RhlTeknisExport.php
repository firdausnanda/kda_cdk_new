<?php

namespace App\Exports;

use App\Models\RhlTeknis;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithTitle;

class RhlTeknisExport implements FromQuery, WithHeadings, WithMapping, ShouldAutoSize, WithTitle
{
  protected $year;

  public function __construct($year = null)
  {
    $this->year = $year;
  }

  public function query()
  {
    return RhlTeknis::query()
      ->with(['creator'])
      ->where('status', 'final')
      ->when($this->year, fn($q) => $q->where('year', $this->year))
      ->orderBy('year', 'desc')
      ->orderBy('month', 'asc');
  }

  public function headings(): array
  {
    return ['No', 'Tahun', 'Bulan', 'Target Tahunan (Ha)', 'Sumber Dana', 'Status', 'Diinput Oleh', 'Tanggal Input'];
  }

  public function map($row): array
  {
    static $no = 0;
    $no++;
    $monthNames = [1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April', 5 => 'Mei', 6 => 'Juni', 7 => 'Juli', 8 => 'Agustus', 9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember'];
    $fundSourceLabels = ['apbn' => 'APBN', 'apbd' => 'APBD', 'swasta' => 'Swasta', 'swadaya' => 'Swadaya Masyarakat', 'other' => 'Lainnya'];

    return [
      $no,
      $row->year,
      $monthNames[$row->month] ?? $row->month,
      number_format($row->target_annual, 2, ',', '.'),
      $fundSourceLabels[$row->fund_source] ?? $row->fund_source,
      ucfirst($row->status),
      $row->creator->name ?? 'Unknown',
      $row->created_at->format('d-m-Y H:i'),
    ];
  }

  public function title(): string
  {
    return 'RHL Teknis ' . ($this->year ?? 'Semua Tahun');
  }
}
