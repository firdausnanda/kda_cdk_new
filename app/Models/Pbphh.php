<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;
use Wildside\Userstamps\Userstamps;

class Pbphh extends Model
{
    use HasFactory, Userstamps, SoftDeletes, LogsActivity;

    protected $fillable = [
        'name',
        'number',
        'province_id',
        'regency_id',
        'district_id',
        'investment_value',
        'number_of_workers',
        'present_condition',
        'id_jenis_produksi',
        'status',
        'approved_by_kasi_at',
        'approved_by_cdk_at',
        'rejection_note',
        'created_by',
        'updated_by',
        'deleted_by'
    ];

    protected $table = 'pbphh';

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

    public function jenis_produksi()
    {
        return $this->belongsTo(JenisProduksi::class, 'id_jenis_produksi');
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logAll()
            ->logOnlyDirty();
    }
}
