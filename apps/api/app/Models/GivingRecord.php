<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GivingRecord extends Model
{
    protected $fillable = [
        'organization_id',
        'person_id',
        'recorded_by_user_id',
        'type',
        'amount',
        'currency',
        'given_on',
        'method',
        'fund',
        'is_anonymous',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'given_on' => 'date',
            'is_anonymous' => 'boolean',
        ];
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function person(): BelongsTo
    {
        return $this->belongsTo(Person::class);
    }

    public function recordedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by_user_id');
    }
}
