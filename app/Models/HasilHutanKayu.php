<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;
use Wildside\Userstamps\Userstamps;

class HasilHutanKayu extends Model
{
    use HasFactory, SoftDeletes, Userstamps, LogsActivity;

    protected $fillable = [
        "year",
        "month",
        "province_id",
        "regency_id",
        "district_id",
        "forest_type",
        "annual_volume_target",
        "annual_volume_realization",
        "id_kayu",
        "status",
        "approved_by_kasi_at",
        "approved_by_cdk_at",
        "rejection_note",
        'created_by',
        'updated_by',
        'deleted_by',
    ];

    protected $table = 'hasil_hutan_kayu';

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
        return $this->belongsTo(Kayu::class, 'id_kayu');
    }

    public function jenis_produksi()
    {
        return $this->belongsToMany(JenisProduksi::class, 'hasil_hutan_kayu_jenis_produksi', 'hasil_hutan_kayu_id', 'jenis_produksi_id')
            ->withPivot('kapasitas_ijin')
            ->withTimestamps();
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logAll()
            ->logOnlyDirty();
    }
}
