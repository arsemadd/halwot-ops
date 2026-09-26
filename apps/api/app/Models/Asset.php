<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Asset extends Model
{
    protected $fillable = [
        'organization_id',
        'code',
        'name',
        'category',
        'brand',
        'model',
        'status',
        'condition',
        'location_id',
        'custodian_ministry_id',
        'purchase_date',
        'purchase_value',
        'currency',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'purchase_date' => 'date',
            'purchase_value' => 'decimal:2',
        ];
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(AssetLocation::class, 'location_id');
    }

    public function custodianMinistry(): BelongsTo
    {
        return $this->belongsTo(Ministry::class, 'custodian_ministry_id');
    }

    public function checkouts(): HasMany
    {
        return $this->hasMany(AssetCheckout::class);
    }
}
