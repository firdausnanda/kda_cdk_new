<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BukanKayu extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
    ];

    protected $table = 'm_bukan_kayu';
}
