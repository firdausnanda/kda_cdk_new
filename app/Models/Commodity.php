<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Commodity extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'm_commodities';

    protected $fillable = [
        'name',
        'is_nilai_transaksi_ekonomi',
    ];

    protected $casts = [
        'is_nilai_transaksi_ekonomi' => 'boolean',
    ];

    /**
     * The "booted" method of the model.
     */
    protected static function booted(): void
    {
        static::addGlobalScope('not_nilai_transaksi_ekonomi', function (\Illuminate\Database\Eloquent\Builder $builder) {
            $builder->where('is_nilai_transaksi_ekonomi', false);
        });
    }
}
