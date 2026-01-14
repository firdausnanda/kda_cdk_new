<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SumberDana extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
    ];

    protected $table = 'm_sumber_dana';
}
