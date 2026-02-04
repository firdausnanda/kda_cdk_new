<?php

namespace App\Models;

use App\Contracts\Workflowable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;
use Wildside\Userstamps\Userstamps;

class HasilHutanBukanKayu extends Model implements Workflowable
{
    use HasFactory, SoftDeletes, Userstamps, LogsActivity;

    protected $table = "hasil_hutan_bukan_kayu";

    protected $fillable = [
        "year",
        "month",
        "province_id",
        "regency_id",
        "district_id",
        "pengelola_hutan_id",
        "forest_type",
        "pengelola_wisata_id",
        "volume_target",
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

    public function pengelolaHutan()
    {
        return $this->belongsTo(PengelolaHutan::class, 'pengelola_hutan_id');
    }

    public function pengelolaWisata()
    {
        return $this->belongsTo(PengelolaWisata::class, 'pengelola_wisata_id');
    }

    public function details()
    {
        return $this->hasMany(HasilHutanBukanKayuDetail::class, 'hasil_hutan_bukan_kayu_id');
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logAll()
            ->logOnlyDirty();
    }

    public static function baseQuery(array $ids): Builder
    {
        return self::query()->whereIn('id', $ids);
    }

    public static function workflowMap(): array
    {
        return [
            'submit' => [
                'pelaksana' => [
                    'from' => ['draft', 'rejected'],
                    'to' => 'waiting_kasi',
                ],
                'pk' => [
                    'from' => ['draft', 'rejected'],
                    'to' => 'waiting_kasi',
                ],
                'peh' => [
                    'from' => ['draft', 'rejected'],
                    'to' => 'waiting_kasi',
                ],
            ],
            'approve' => [
                'kasi' => [
                    'from' => 'waiting_kasi',
                    'to' => 'waiting_cdk',
                    'timestamp' => 'approved_by_kasi_at',
                ],
                'kacdk' => [
                    'from' => 'waiting_cdk',
                    'to' => 'final',
                    'timestamp' => 'approved_by_cdk_at',
                ],
            ],
            'reject' => [
                'admin' => [],
                'kasi' => [
                    'from' => 'waiting_kasi',
                ],
                'kacdk' => [
                    'from' => 'waiting_cdk',
                ],
            ],
            'delete' => [
                'admin' => [
                    'delete' => true,
                ],
                'pelaksana' => [
                    'status' => 'draft',
                    'delete' => true,
                ],
                'pk' => [
                    'status' => 'draft',
                    'delete' => true,
                ],
                'peh' => [
                    'status' => 'draft',
                    'delete' => true,
                ],
            ],
        ];
    }
}
