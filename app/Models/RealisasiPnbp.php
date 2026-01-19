<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Wildside\Userstamps\Userstamps;
use Illuminate\Database\Eloquent\SoftDeletes;

class RealisasiPnbp extends Model
{
    use HasFactory, Userstamps, SoftDeletes;

    protected $fillable = [
        "year",
        "month",
        "province_id",
        "regency_id",
        "district_id",
        "types_of_forest_products",
        "pnbp_target",
        "number_of_psdh",
        "number_of_dbhdr",
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

    public function district()
    {
        return $this->belongsTo(Districts::class);
    }
}
