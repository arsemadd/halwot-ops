<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FollowUp extends Model
{
    protected $fillable = [
        'organization_id',
        'person_id',
        'owner_user_id',
        'status',
        'last_contact_at',
        'next_action_at',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'last_contact_at' => 'datetime',
            'next_action_at' => 'datetime',
        ];
    }

    protected $appends = ['is_overdue'];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function person(): BelongsTo
    {
        return $this->belongsTo(Person::class);
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_user_id');
    }

    public function getIsOverdueAttribute(): bool
    {
        if ($this->status === 'completed' || $this->next_action_at === null) {
            return false;
        }

        return $this->next_action_at->isPast();
    }
}
