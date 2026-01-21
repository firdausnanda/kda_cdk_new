<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Cell\DataValidation;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class PengunjungWisataTemplateExport implements WithHeadings, ShouldAutoSize, WithTitle, WithStyles, WithEvents
{
  public function headings(): array
  {
    return [
      'Tahun',
      'Bulan (Angka 1-12)',
      'Nama Pengelola Wisata',
      'Jumlah Pengunjung',
      'Pendapatan Bruto (Rp)'
    ];
  }

  public function title(): string
  {
    return 'Template Import';
  }

  public function styles(Worksheet $sheet)
  {
    return [
      1 => [
        'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
        'fill' => ['fillType' => 'solid', 'startColor' => ['rgb' => '059669']]
      ]
    ];
  }

  public function registerEvents(): array
  {
    return [
      AfterSheet::class => function (AfterSheet $event) {
        $sheet = $event->sheet->getDelegate();

        // Month validation (1-12)
        $monthValidation = $sheet->getCell('B2')->getDataValidation();
        $monthValidation->setType(DataValidation::TYPE_WHOLE)
          ->setErrorStyle(DataValidation::STYLE_STOP)
          ->setAllowBlank(false)
          ->setShowInputMessage(true)
          ->setShowErrorMessage(true)
          ->setFormula1(1)
          ->setFormula2(12)
          ->setErrorTitle('Input Error')
          ->setError('Bulan harus angka 1-12');

        for ($i = 2; $i <= 1000; $i++) {
          $sheet->getCell("B$i")->setDataValidation(clone $monthValidation);
        }

        $sheet->getComment('C1')->getText()->createTextRun('Contoh: KPH Trenggalek, Perhutani, TWA Prigi');
      },
    ];
  }
}
