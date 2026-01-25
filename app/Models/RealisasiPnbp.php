<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;
use Wildside\Userstamps\Userstamps;
use Illuminate\Database\Eloquent\SoftDeletes;

class RealisasiPnbp extends Model
{
    use HasFactory, Userstamps, SoftDeletes, LogsActivity;

    protected $fillable = [
        "year",
        "month",
        "province_id",
        "regency_id",
        "id_pengelola_wisata",
        "types_of_forest_products",
        "pnbp_target",
        "pnbp_realization",
        "status",
        "approved_by_kasi_at",
        "approved_by_cdk_at",
        "rejection_note",
        "created_by",
        "updated_by",
        "deleted_by",
    ];

    protected $table = "realisasi_pnbp";

    public function province()
    {
        return $this->belongsTo(Provinces::class);
    }

    public function regency()
    {
        return $this->belongsTo(Regencies::class);
    }

    public function pengelola_wisata()
    {
        return $this->belongsTo(PengelolaWisata::class, 'id_pengelola_wisata', 'id');
    }


    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logAll()
            ->logOnlyDirty();
    }
}
