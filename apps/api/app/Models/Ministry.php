<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Ministry extends Model
{
    protected $fillable = [
        'organization_id',
        'name',
        'slug',
        'description',
        'leader_person_id',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function leader(): BelongsTo
    {
        return $this->belongsTo(Person::class, 'leader_person_id');
    }

    public function memberships(): HasMany
    {
        return $this->hasMany(MinistryMembership::class);
    }

    public function programs(): HasMany
    {
        return $this->hasMany(Program::class);
    }
}
