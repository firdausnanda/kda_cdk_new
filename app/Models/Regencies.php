<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Regencies extends Model
{
    use HasFactory;

    protected $fillable = [
        "province_id",
        "name"
    ];

    protected $table = "m_regencies";

    public function province()
    {
        return $this->belongsTo(Provinces::class, "province_id");
    }
}
