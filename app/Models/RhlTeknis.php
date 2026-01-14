<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Wildside\Userstamps\Userstamps;

class RhlTeknis extends Model
{
  use HasFactory, SoftDeletes, Userstamps;

  protected $table = 'rhl_teknis';

  protected $fillable = [
    'year',
    'month',
    'target_annual',
    'fund_source',
    'status',
    'approved_by_kasi_at',
    'approved_by_cdk_at',
    'rejection_note',
  ];

  public function details()
  {
    return $this->hasMany(RhlTeknisDetail::class, 'rhl_teknis_id');
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
