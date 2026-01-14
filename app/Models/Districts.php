<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Districts extends Model
{
    use HasFactory;

    protected $table = "m_districts";

    protected $fillable = [
        "id",
        "regency_id",
        "name",
    ];

    public function regency()
    {
        return $this->belongsTo(Regencies::class, "regency_id");
    }
}
