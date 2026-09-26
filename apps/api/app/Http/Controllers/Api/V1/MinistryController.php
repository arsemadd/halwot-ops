<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\Ministry;
use App\Models\MinistryMembership;
use App\Models\Person;
use App\Services\ActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class MinistryController extends BaseApiController
{
    public function __construct(private ActivityLogger $activityLogger) {}

    public function index(Request $request): JsonResponse
    {
        $query = Ministry::query()
            ->where('organization_id', $this->organizationId())
            ->with(['leader'])
            ->withCount('memberships');

        if ($request->boolean('active_only')) {
            $query->where('is_active', true);
        }

        $ministries = $query->orderBy('name')->paginate($request->integer('per_page', 15));

        return $this->json($ministries);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'leader_person_id' => ['nullable', 'exists:people,id'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $slug = $validated['slug'] ?? Str::slug($validated['name']);

        $ministry = Ministry::create([
            ...$validated,
            'organization_id' => $this->organizationId(),
            'slug' => $slug,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        $this->activityLogger->log(
            $request->user(),
            $this->organizationId(),
            'ministry.created',
            $ministry,
            "Created ministry {$ministry->name}",
        );

        return $this->json($ministry->load('leader'), 201);
    }

    public function show(Ministry $ministry): JsonResponse
    {
        $this->ensureOrgMinistry($ministry);

        return $this->json($ministry->load(['leader', 'memberships.person']));
    }

    public function update(Request $request, Ministry $ministry): JsonResponse
    {
        $this->ensureOrgMinistry($ministry);

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'leader_person_id' => ['nullable', 'exists:people,id'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $ministry->update($validated);

        $this->activityLogger->log(
            $request->user(),
            $this->organizationId(),
            'ministry.updated',
            $ministry,
            "Updated ministry {$ministry->name}",
        );

        return $this->json($ministry->fresh()->load(['leader', 'memberships.person']));
    }

    public function addMembership(Request $request, Ministry $ministry): JsonResponse
    {
        $this->ensureOrgMinistry($ministry);

        $validated = $request->validate([
            'person_id' => ['required', 'exists:people,id'],
            'role' => ['nullable', 'string', 'max:100'],
            'availability' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', 'in:active,inactive'],
        ]);

        $person = Person::findOrFail($validated['person_id']);
        abort_unless($person->organization_id === $this->organizationId(), 404);

        $membership = MinistryMembership::updateOrCreate(
            [
                'ministry_id' => $ministry->id,
                'person_id' => $person->id,
            ],
            [
                'role' => $validated['role'] ?? null,
                'availability' => $validated['availability'] ?? null,
                'status' => $validated['status'] ?? 'active',
            ],
        );

        return $this->json($membership->load(['person', 'ministry']), 201);
    }

    public function updateMembership(Request $request, Ministry $ministry, MinistryMembership $ministryMembership): JsonResponse
    {
        $this->ensureOrgMinistry($ministry);
        abort_unless($ministryMembership->ministry_id === $ministry->id, 404);

        $validated = $request->validate([
            'role' => ['nullable', 'string', 'max:100'],
            'availability' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', 'in:active,inactive'],
        ]);

        $ministryMembership->update($validated);

        return $this->json($ministryMembership->fresh()->load(['person', 'ministry']));
    }

    public function removeMembership(Ministry $ministry, MinistryMembership $ministryMembership): JsonResponse
    {
        $this->ensureOrgMinistry($ministry);
        abort_unless($ministryMembership->ministry_id === $ministry->id, 404);

        $ministryMembership->delete();

        return response()->json(['data' => ['message' => 'Membership removed.']]);
    }

    private function ensureOrgMinistry(Ministry $ministry): void
    {
        abort_unless($ministry->organization_id === $this->organizationId(), 404);
    }
}
