<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;
use Wildside\Userstamps\Userstamps;
use Illuminate\Database\Eloquent\SoftDeletes;

use App\Contracts\Workflowable;
use Illuminate\Database\Eloquent\Builder;

class RealisasiPnbp extends Model implements Workflowable
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
                    'from' => 'draft',
                    'delete' => true,
                ],
                'pk' => [
                    'from' => 'draft',
                    'delete' => true,
                ],
                'peh' => [
                    'from' => 'draft',
                    'delete' => true,
                ],
            ],
        ];
    }
}
