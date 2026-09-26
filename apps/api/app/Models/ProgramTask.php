<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProgramTask extends Model
{
    protected $fillable = [
        'program_id',
        'title',
        'description',
        'assignee_person_id',
        'status',
        'due_at',
    ];

    protected function casts(): array
    {
        return [
            'due_at' => 'datetime',
        ];
    }

    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class);
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(Person::class, 'assignee_person_id');
    }
}
