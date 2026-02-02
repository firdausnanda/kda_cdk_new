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

class PerkembanganKthTemplateExport implements WithHeadings, ShouldAutoSize, WithTitle, WithStyles, WithEvents
{
  public function headings(): array
  {
    return [
      'Tahun',
      'Bulan (Angka)',
      'Nama Kabupaten',
      'Nama Kecamatan',
      'Nama Desa',
      'Nama KTH',
      'Nomor Register',
      'Kelas Kelembagaan',
      'Jumlah Anggota',
      'Luas Kelola (Ha)',
      'Potensi Kawasan',
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
        $validationMonth = $sheet->getCell('B2')->getDataValidation();
        $validationMonth->setType(DataValidation::TYPE_WHOLE);
        $validationMonth->setErrorStyle(DataValidation::STYLE_STOP);
        $validationMonth->setAllowBlank(false);
        $validationMonth->setShowInputMessage(true);
        $validationMonth->setShowErrorMessage(true);
        $validationMonth->setFormula1(1);
        $validationMonth->setFormula2(12);
        $validationMonth->setErrorTitle('Input Error');
        $validationMonth->setError('Bulan harus angka 1-12');
        $validationMonth->setPromptTitle('Bulan');
        $validationMonth->setPrompt('Masukkan angka 1-12');

        // Kelas Validation
        $validationKelas = $sheet->getCell('H2')->getDataValidation();
        $validationKelas->setType(DataValidation::TYPE_LIST);
        $validationKelas->setErrorStyle(DataValidation::STYLE_STOP);
        $validationKelas->setAllowBlank(false);
        $validationKelas->setShowInputMessage(true);
        $validationKelas->setShowErrorMessage(true);
        $validationKelas->setShowDropDown(true);
        $validationKelas->setFormula1('"pemula,madya,utama"');
        $validationKelas->setErrorTitle('Input Error');
        $validationKelas->setError('Pilih kelas: pemula, madya, utama');
        $validationKelas->setPromptTitle('Kelas Kelembagaan');
        $validationKelas->setPrompt('Pilih dari daftar');

        // Apply validations to rows
        for ($i = 2; $i <= 1000; $i++) {
          $sheet->getCell("B$i")->setDataValidation(clone $validationMonth);
          $sheet->getCell("H$i")->setDataValidation(clone $validationKelas);
        }

        // Add comments
        $sheet->getComment('C1')->getText()->createTextRun('Contoh: TRENGGALEK');
        $sheet->getComment('D1')->getText()->createTextRun('Contoh: BENDUNGAN');
        $sheet->getComment('E1')->getText()->createTextRun('Contoh: MASARAN');
        $sheet->getComment('H1')->getText()->createTextRun('Pilih: pemula, madya, atau utama');
        $sheet->getComment('K1')->getText()->createTextRun('Deskripsi singkat potensi');
      },
    ];
  }
}
