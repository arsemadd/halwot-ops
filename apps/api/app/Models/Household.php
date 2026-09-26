<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Household extends Model
{
    protected $fillable = [
        'organization_id',
        'name',
        'address',
        'phone',
        'emergency_contact',
        'notes',
    ];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function people(): HasMany
    {
        return $this->hasMany(Person::class);
    }

    public function members(): BelongsToMany
    {
        return $this->belongsToMany(Person::class, 'household_members')
            ->withPivot('role')
            ->withTimestamps();
    }
}
