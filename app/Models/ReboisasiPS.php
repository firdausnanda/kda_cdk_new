<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Wildside\Userstamps\Userstamps;

class ReboisasiPS extends Model
{
    use HasFactory, SoftDeletes, Userstamps;

    protected $table = 'reboisasi_ps';
    protected $fillable = [
        'year',
        'month',
        'target_annual',
        'realization',
        'fund_source',
        'province_id',
        'regency_id',
        'district_id',
        'village_id',
        'coordinates',
        'status',
        'approved_by_kasi_at',
        'approved_by_cdk_at',
        'rejection_note',
    ];

    public function province_rel()
    {
        return $this->belongsTo(Provinces::class, 'province_id');
    }

    public function regency_rel()
    {
        return $this->belongsTo(Regencies::class, 'regency_id');
    }

    public function district_rel()
    {
        return $this->belongsTo(Districts::class, 'district_id');
    }

    public function village_rel()
    {
        return $this->belongsTo(Villages::class, 'village_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function getStatusColorAttribute()
    {
        return match ($this->status) {
            'draft' => 'gray',
            'waiting_kasi' => 'yellow',
            'waiting_cdk' => 'blue',
            'final' => 'green',
            'rejected' => 'red',
            default => 'gray',
        };
    }
}
