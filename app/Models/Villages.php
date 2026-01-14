<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Villages extends Model
{
    use HasFactory;

    protected $fillable = [
        "district_id",
        "name"
    ];

    protected $table = "m_villages";

    public function district()
    {
        return $this->belongsTo(Districts::class, "district_id");
    }
}
