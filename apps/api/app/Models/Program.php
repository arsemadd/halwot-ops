<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Program extends Model
{
    protected $fillable = [
        'organization_id',
        'ministry_id',
        'title',
        'description',
        'starts_at',
        'location',
        'leader_person_id',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'starts_at' => 'datetime',
        ];
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function ministry(): BelongsTo
    {
        return $this->belongsTo(Ministry::class);
    }

    public function leader(): BelongsTo
    {
        return $this->belongsTo(Person::class, 'leader_person_id');
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(ProgramAssignment::class);
    }

    public function attendanceRecords(): HasMany
    {
        return $this->hasMany(AttendanceRecord::class);
    }

    public function budgets(): HasMany
    {
        return $this->hasMany(ProgramBudget::class);
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(ProgramTask::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(ProgramDocument::class);
    }
}
