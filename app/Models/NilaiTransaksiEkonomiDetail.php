<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class NilaiTransaksiEkonomiDetail extends Model
{
  use HasFactory;

  protected $table = 'nilai_transaksi_ekonomi_details';

  protected $fillable = [
    'nilai_transaksi_ekonomi_id',
    'commodity_id',
    'volume_produksi',
    'satuan',
    'nilai_transaksi',
  ];

  public function nilaiTransaksiEkonomi()
  {
    return $this->belongsTo(NilaiTransaksiEkonomi::class);
  }

  public function commodity()
  {
    return $this->belongsTo(Commodity::class);
  }
}
