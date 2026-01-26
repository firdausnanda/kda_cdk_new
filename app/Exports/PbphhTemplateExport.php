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

class PbphhTemplateExport implements WithHeadings, ShouldAutoSize, WithTitle, WithStyles, WithEvents
{
  public function headings(): array
  {
    return [
      'Nama Industri',
      'Nomor Izin',
      'Nama Kabupaten/Kota',
      'Nama Kecamatan',
      'Nilai Investasi',
      'Jumlah Tenaga Kerja',
      'Kondisi Saat Ini',
      'Jenis Produksi (Kapasitas)'
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

        // Investment value validation (number >= 0)
        $investmentValidation = $sheet->getCell('E2')->getDataValidation();
        $investmentValidation->setType(DataValidation::TYPE_WHOLE)
          ->setErrorStyle(DataValidation::STYLE_STOP)
          ->setAllowBlank(false)
          ->setShowInputMessage(true)
          ->setShowErrorMessage(true)
          ->setFormula1(0)
          ->setErrorTitle('Input Error')
          ->setError('Nilai investasi harus berupa angka positif');

        // Number of workers validation (number >= 0)
        $workersValidation = $sheet->getCell('F2')->getDataValidation();
        $workersValidation->setType(DataValidation::TYPE_WHOLE)
          ->setErrorStyle(DataValidation::STYLE_STOP)
          ->setAllowBlank(false)
          ->setShowInputMessage(true)
          ->setShowErrorMessage(true)
          ->setFormula1(0)
          ->setErrorTitle('Input Error')
          ->setError('Jumlah tenaga kerja harus berupa angka positif');

        // Condition validation (Aktif / Tidak Aktif)
        $conditionValidation = $sheet->getCell('G2')->getDataValidation();
        $conditionValidation->setType(DataValidation::TYPE_LIST)
          ->setErrorStyle(DataValidation::STYLE_STOP)
          ->setAllowBlank(false)
          ->setShowInputMessage(true)
          ->setShowErrorMessage(true)
          ->setShowDropDown(true)
          ->setFormula1('"Aktif,Tidak Aktif"')
          ->setErrorTitle('Input Error')
          ->setError('Pilih Aktif atau Tidak Aktif');

        for ($i = 2; $i <= 1000; $i++) {
          $sheet->getCell("E$i")->setDataValidation(clone $investmentValidation);
          $sheet->getCell("F$i")->setDataValidation(clone $workersValidation);
          $sheet->getCell("G$i")->setDataValidation(clone $conditionValidation);
        }

        // Add helpful comments
        $sheet->getComment('A1')->getText()->createTextRun('Nama industri/perusahaan');
        $sheet->getComment('B1')->getText()->createTextRun('Nomor izin PBPHH');
        $sheet->getComment('C1')->getText()->createTextRun('Contoh: TRENGGALEK, TULUNGAGUNG');
        $sheet->getComment('D1')->getText()->createTextRun('Contoh: WATULIMO, MUNJUNGAN');
        $sheet->getComment('E1')->getText()->createTextRun('Nilai investasi dalam Rupiah (angka saja)');
        $sheet->getComment('F1')->getText()->createTextRun('Jumlah tenaga kerja (angka)');
        $sheet->getComment('G1')->getText()->createTextRun('Pilih: Aktif atau Tidak Aktif');
        $sheet->getComment('H1')->getText()->createTextRun("Format: Nama Jenis (Kapasitas)\nPisahkan dengan koma (,) untuk lebih dari satu.\nContoh: Plywood (1000 m3), Blockboard (500 m3)");
      },
    ];
  }
}
