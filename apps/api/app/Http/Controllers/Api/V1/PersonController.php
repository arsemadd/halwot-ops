<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\FollowUp;
use App\Models\Person;
use App\Services\ActivityLogger;
use App\Services\DuplicateChecker;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PersonController extends BaseApiController
{
    public function __construct(
        private ActivityLogger $activityLogger,
        private DuplicateChecker $duplicateChecker,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = Person::query()
            ->where('organization_id', $this->organizationId())
            ->with('household');

        if (! $request->boolean('include_archived')) {
            $query->whereNull('archived_at');
        }

        if ($request->filled('status')) {
            $query->where('membership_status', $request->string('status'));
        }

        if ($request->filled('q')) {
            $search = $request->string('q');
            $query->where(function ($builder) use ($search) {
                $builder->where('full_name', 'like', "%{$search}%")
                    ->orWhere('preferred_name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        $people = $query->latest()->paginate($request->integer('per_page', 15));

        return $this->json($people);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'full_name' => ['required', 'string', 'max:255'],
            'preferred_name' => ['nullable', 'string', 'max:255'],
            'gender' => ['nullable', 'string', 'max:50'],
            'date_of_birth' => ['nullable', 'date'],
            'phone' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'address' => ['nullable', 'string'],
            'first_contact_date' => ['nullable', 'date'],
            'membership_status' => ['nullable', 'string', 'max:50'],
            'membership_date' => ['nullable', 'date'],
            'baptism_status' => ['nullable', 'string', 'max:50'],
            'pastoral_notes' => ['nullable', 'string'],
            'household_id' => ['nullable', 'exists:households,id'],
            'owner_user_id' => ['nullable', 'exists:users,id'],
        ]);

        $orgId = $this->organizationId();
        $ownerUserId = $validated['owner_user_id'] ?? null;
        unset($validated['owner_user_id']);

        $person = Person::create([
            ...$validated,
            'organization_id' => $orgId,
            'membership_status' => $validated['membership_status'] ?? 'new',
        ]);

        if ($ownerUserId) {
            FollowUp::create([
                'organization_id' => $orgId,
                'person_id' => $person->id,
                'owner_user_id' => $ownerUserId,
                'status' => 'open',
            ]);
        }

        $this->activityLogger->log(
            $request->user(),
            $orgId,
            'person.created',
            $person,
            "Created person {$person->full_name}",
        );

        return $this->json($person->load('household'), 201);
    }

    public function show(Person $person): JsonResponse
    {
        $this->ensureOrgPerson($person);

        return $this->json($person->load(['household', 'followUps', 'ministryMemberships.ministry']));
    }

    public function update(Request $request, Person $person): JsonResponse
    {
        $this->ensureOrgPerson($person);

        $validated = $request->validate([
            'full_name' => ['sometimes', 'string', 'max:255'],
            'preferred_name' => ['nullable', 'string', 'max:255'],
            'gender' => ['nullable', 'string', 'max:50'],
            'date_of_birth' => ['nullable', 'date'],
            'phone' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'address' => ['nullable', 'string'],
            'first_contact_date' => ['nullable', 'date'],
            'membership_status' => ['nullable', 'string', 'max:50'],
            'membership_date' => ['nullable', 'date'],
            'baptism_status' => ['nullable', 'string', 'max:50'],
            'pastoral_notes' => ['nullable', 'string'],
            'household_id' => ['nullable', 'exists:households,id'],
        ]);

        $person->update($validated);

        $this->activityLogger->log(
            $request->user(),
            $this->organizationId(),
            'person.updated',
            $person,
            "Updated person {$person->full_name}",
        );

        return $this->json($person->fresh()->load('household'));
    }

    public function archive(Request $request, Person $person): JsonResponse
    {
        $this->ensureOrgPerson($person);

        $person->update(['archived_at' => now()]);

        $this->activityLogger->log(
            $request->user(),
            $this->organizationId(),
            'person.archived',
            $person,
            "Archived person {$person->full_name}",
        );

        return $this->json($person->fresh());
    }

    public function checkDuplicates(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'phone' => ['nullable', 'string'],
            'email' => ['nullable', 'email'],
            'exclude_person_id' => ['nullable', 'integer'],
        ]);

        $duplicates = $this->duplicateChecker->findDuplicates(
            $this->organizationId(),
            $validated['phone'] ?? null,
            $validated['email'] ?? null,
            $validated['exclude_person_id'] ?? null,
        );

        return $this->json([
            'duplicates' => $duplicates->values(),
            'has_duplicates' => $duplicates->isNotEmpty(),
        ]);
    }

    private function ensureOrgPerson(Person $person): void
    {
        abort_unless($person->organization_id === $this->organizationId(), 404);
    }
}
