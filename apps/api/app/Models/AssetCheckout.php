<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AssetCheckout extends Model
{
    protected $fillable = [
        'organization_id',
        'asset_id',
        'requested_by_user_id',
        'program_id',
        'approved_by_user_id',
        'status',
        'purpose',
        'expected_return_at',
        'checked_out_at',
        'returned_at',
        'return_condition',
        'return_notes',
    ];

    protected function casts(): array
    {
        return [
            'expected_return_at' => 'datetime',
            'checked_out_at' => 'datetime',
            'returned_at' => 'datetime',
        ];
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function asset(): BelongsTo
    {
        return $this->belongsTo(Asset::class);
    }

    public function requestedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by_user_id');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by_user_id');
    }

    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class);
    }
}
