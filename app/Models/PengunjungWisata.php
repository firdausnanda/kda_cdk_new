<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;
use Wildside\Userstamps\Userstamps;

use App\Contracts\Workflowable;
use Illuminate\Database\Eloquent\Builder;

class PengunjungWisata extends Model implements Workflowable
{
    use HasFactory, SoftDeletes, Userstamps, LogsActivity;

    protected $fillable = [
        "year",
        "month",
        "id_pengelola_wisata",
        "number_of_visitors",
        "gross_income",
        "status",
        "approved_by_kasi_at",
        "approved_by_cdk_at",
        "rejection_note",
        "created_by",
        "updated_by",
        "deleted_by"
    ];

    protected $table = "pengunjung_wisata";

    public function pengelolaWisata()
    {
        return $this->belongsTo(PengelolaWisata::class, 'id_pengelola_wisata');
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
                'pk' => ['from' => ['draft', 'rejected'], 'to' => 'waiting_kasi'],
                'peh' => ['from' => ['draft', 'rejected'], 'to' => 'waiting_kasi'],
                'pelaksana' => ['from' => ['draft', 'rejected'], 'to' => 'waiting_kasi'],
                'admin' => ['from' => ['draft', 'rejected'], 'to' => 'waiting_kasi'],
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
                'kasi' => ['from' => 'waiting_kasi'],
                'kacdk' => ['from' => 'waiting_cdk'],
            ],
            'delete' => [
                'admin' => ['delete' => true],
                'pk' => ['from' => 'draft', 'delete' => true],
                'peh' => ['from' => 'draft', 'delete' => true],
                'pelaksana' => ['from' => 'draft', 'delete' => true],
            ],
        ];
    }
}
