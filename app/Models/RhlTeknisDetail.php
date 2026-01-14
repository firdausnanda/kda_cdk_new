<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RhlTeknisDetail extends Model
{
  use HasFactory;

  protected $table = 'rhl_teknis_details';

  protected $fillable = [
    'rhl_teknis_id',
    'bangunan_kta_id',
    'unit_amount',
  ];

  public function rhl_teknis()
  {
    return $this->belongsTo(RhlTeknis::class, 'rhl_teknis_id');
  }

  public function bangunan_kta()
  {
    return $this->belongsTo(BangunanKta::class, 'bangunan_kta_id');
  }
}
