<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class JenisProduksi extends Model
{
    use HasFactory;

    protected $table = "m_jenis_produksi";

    protected $fillable = [
        'name',
    ];

    public function hasil_hutan_kayu()
    {
        return $this->belongsToMany(HasilHutanKayu::class, 'hasil_hutan_kayu_jenis_produksi', 'jenis_produksi_id', 'hasil_hutan_kayu_id')
            ->withPivot('kapasitas_ijin')
            ->withTimestamps();
    }
}
