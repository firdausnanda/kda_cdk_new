<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BangunanKta extends Model
{
  use HasFactory;

  protected $table = 'm_bangunan_kta';

  protected $fillable = [
    'name',
    'description',
  ];

  public function details()
  {
    return $this->hasMany(RhlTeknisDetail::class, 'bangunan_kta_id');
  }
}
