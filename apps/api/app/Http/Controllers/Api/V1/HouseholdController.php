<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\Household;
use App\Models\Person;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HouseholdController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $households = Household::query()
            ->where('organization_id', $this->organizationId())
            ->withCount('members')
            ->latest()
            ->paginate($request->integer('per_page', 15));

        return $this->json($households);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'address' => ['nullable', 'string'],
            'phone' => ['nullable', 'string', 'max:50'],
            'emergency_contact' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
        ]);

        $household = Household::create([
            ...$validated,
            'organization_id' => $this->organizationId(),
        ]);

        return $this->json($household, 201);
    }

    public function show(Household $household): JsonResponse
    {
        $this->ensureOrgHousehold($household);

        return $this->json($household->load('members'));
    }

    public function update(Request $request, Household $household): JsonResponse
    {
        $this->ensureOrgHousehold($household);

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'address' => ['nullable', 'string'],
            'phone' => ['nullable', 'string', 'max:50'],
            'emergency_contact' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
        ]);

        $household->update($validated);

        return $this->json($household->fresh()->load('members'));
    }

    public function addMember(Request $request, Household $household): JsonResponse
    {
        $this->ensureOrgHousehold($household);

        $validated = $request->validate([
            'person_id' => ['required', 'exists:people,id'],
            'role' => ['required', 'in:head,spouse,child,other'],
        ]);

        $person = Person::findOrFail($validated['person_id']);
        abort_unless($person->organization_id === $this->organizationId(), 404);

        $household->members()->syncWithoutDetaching([
            $person->id => ['role' => $validated['role']],
        ]);

        $person->update(['household_id' => $household->id]);

        return $this->json($household->fresh()->load('members'));
    }

    public function removeMember(Household $household, Person $person): JsonResponse
    {
        $this->ensureOrgHousehold($household);
        abort_unless($person->organization_id === $this->organizationId(), 404);

        $household->members()->detach($person->id);

        if ($person->household_id === $household->id) {
            $person->update(['household_id' => null]);
        }

        return $this->json($household->fresh()->load('members'));
    }

    private function ensureOrgHousehold(Household $household): void
    {
        abort_unless($household->organization_id === $this->organizationId(), 404);
    }
}
