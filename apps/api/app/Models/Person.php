<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Person extends Model
{
    use SoftDeletes;

    protected $table = 'people';

    protected $fillable = [
        'organization_id',
        'full_name',
        'preferred_name',
        'gender',
        'date_of_birth',
        'phone',
        'email',
        'address',
        'first_contact_date',
        'membership_status',
        'membership_date',
        'baptism_status',
        'pastoral_notes',
        'household_id',
        'archived_at',
    ];

    protected function casts(): array
    {
        return [
            'date_of_birth' => 'date',
            'first_contact_date' => 'date',
            'membership_date' => 'date',
            'archived_at' => 'datetime',
        ];
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function household(): BelongsTo
    {
        return $this->belongsTo(Household::class);
    }

    public function followUps(): HasMany
    {
        return $this->hasMany(FollowUp::class);
    }

    public function ministryMemberships(): HasMany
    {
        return $this->hasMany(MinistryMembership::class);
    }

    public function programAssignments(): HasMany
    {
        return $this->hasMany(ProgramAssignment::class);
    }

    public function attendanceRecords(): HasMany
    {
        return $this->hasMany(AttendanceRecord::class);
    }

    public function isArchived(): bool
    {
        return $this->archived_at !== null;
    }
}
