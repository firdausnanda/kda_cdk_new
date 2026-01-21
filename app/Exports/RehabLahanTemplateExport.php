<?php

namespace App\Exports;

use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Cell\DataValidation;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class RehabLahanTemplateExport implements WithHeadings, ShouldAutoSize, WithTitle, WithStyles, WithEvents
{
  public function headings(): array
  {
    return [
      'Tahun',
      'Bulan (Angka)',
      'Nama Kabupaten',
      'Nama Kecamatan',
      'Nama Desa',
      'Target Tahunan (Ha)',
      'Realisasi (Ha)',
      'Sumber Dana',
    ];
  }

  public function title(): string
  {
    return 'Template Import';
  }

  public function styles(Worksheet $sheet)
  {
    return [
      1 => ['font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']], 'fill' => ['fillType' => 'solid', 'startColor' => ['rgb' => '059669']]],
    ];
  }

  public function registerEvents(): array
  {
    return [
      AfterSheet::class => function (AfterSheet $event) {
        $sheet = $event->sheet->getDelegate();

        // Month Validation (1-12)
        $validation = $sheet->getCell('B2')->getDataValidation();
        $validation->setType(DataValidation::TYPE_WHOLE);
        $validation->setErrorStyle(DataValidation::STYLE_STOP);
        $validation->setAllowBlank(false);
        $validation->setShowInputMessage(true);
        $validation->setShowErrorMessage(true);
        $validation->setFormula1(1);
        $validation->setFormula2(12);
        $validation->setErrorTitle('Input Error');
        $validation->setError('Bulan harus angka 1-12');
        $validation->setPromptTitle('Bulan');
        $validation->setPrompt('Masukkan angka 1-12');

        // Apply to column B
        for ($i = 2; $i <= 1000; $i++) {
          $sheet->getCell("B$i")->setDataValidation(clone $validation);
        }

        // Add comments for other columns
        $sheet->getComment('C1')->getText()->createTextRun('Isi dengan Nama Kabupaten/Kota (KABUPATEN TRENGGALEK, KABUPATEN TULUNGAGUNG, dll)');
        $sheet->getComment('D1')->getText()->createTextRun('Isi dengan Nama Kecamatan (e.g. TRENGGALEK)');
        $sheet->getComment('E1')->getText()->createTextRun('Isi dengan Nama Desa (e.g. KELUTAN)');
        $sheet->getComment('H1')->getText()->createTextRun('Isi dengan: apbn, apbd, swasta, swadaya, other');
      },
    ];
  }
}
