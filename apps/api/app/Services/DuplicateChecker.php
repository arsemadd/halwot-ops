<?php

namespace App\Services;

use App\Models\Person;
use Illuminate\Support\Collection;

class DuplicateChecker
{
    public function findDuplicates(int $organizationId, ?string $phone, ?string $email, ?int $excludePersonId = null): Collection
    {
        if (blank($phone) && blank($email)) {
            return collect();
        }

        return Person::query()
            ->where('organization_id', $organizationId)
            ->whereNull('archived_at')
            ->when($excludePersonId, fn ($query) => $query->where('id', '!=', $excludePersonId))
            ->where(function ($query) use ($phone, $email) {
                if (filled($phone)) {
                    $query->orWhere('phone', $phone);
                }

                if (filled($email)) {
                    $query->orWhere('email', $email);
                }
            })
            ->get(['id', 'full_name', 'phone', 'email', 'membership_status']);
    }
}
