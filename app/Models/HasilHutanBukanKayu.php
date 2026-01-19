<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Wildside\Userstamps\Userstamps;

class HasilHutanBukanKayu extends Model
{
    use HasFactory, SoftDeletes, Userstamps;

    protected $table = "hasil_hutan_bukan_kayu";

    protected $fillable = [
        "year",
        "month",
        "province_id",
        "regency_id",
        "district_id",
        "forest_type",
        "annual_volume_target",
        "id_bukan_kayu",
        "status",
        "approved_by_kasi_at",
        "approved_by_cdk_at",
        "rejection_note",
        'created_by',
        'updated_by',
        'deleted_by',
    ];

    public function province()
    {
        return $this->belongsTo(Provinces::class, 'province_id');
    }

    public function regency()
    {
        return $this->belongsTo(Regencies::class, 'regency_id');
    }

    public function district()
    {
        return $this->belongsTo(Districts::class, 'district_id');
    }

    public function kayu()
    {
        return $this->belongsTo(BukanKayu::class, 'id_bukan_kayu');
    }
}
