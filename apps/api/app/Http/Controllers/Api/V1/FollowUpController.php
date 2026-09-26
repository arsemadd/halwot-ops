<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\FollowUp;
use App\Models\Person;
use App\Services\ActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FollowUpController extends BaseApiController
{
    public function __construct(private ActivityLogger $activityLogger) {}

    public function index(Request $request): JsonResponse
    {
        $query = FollowUp::query()
            ->where('organization_id', $this->organizationId())
            ->with(['person', 'owner']);

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->boolean('overdue')) {
            $query->where('status', '!=', 'completed')
                ->whereNotNull('next_action_at')
                ->where('next_action_at', '<', now());
        }

        $followUps = $query->latest()->paginate($request->integer('per_page', 15));

        return $this->json($followUps);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'person_id' => ['required', 'exists:people,id'],
            'owner_user_id' => ['nullable', 'exists:users,id'],
            'status' => ['nullable', 'in:open,in_progress,completed'],
            'last_contact_at' => ['nullable', 'date'],
            'next_action_at' => ['nullable', 'date'],
            'notes' => ['nullable', 'string'],
        ]);

        $person = Person::findOrFail($validated['person_id']);
        abort_unless($person->organization_id === $this->organizationId(), 404);

        $followUp = FollowUp::create([
            ...$validated,
            'organization_id' => $this->organizationId(),
            'status' => $validated['status'] ?? 'open',
        ]);

        $this->activityLogger->log(
            $request->user(),
            $this->organizationId(),
            'follow_up.created',
            $followUp,
            "Created follow-up for {$person->full_name}",
        );

        return $this->json($followUp->load(['person', 'owner']), 201);
    }

    public function show(FollowUp $followUp): JsonResponse
    {
        $this->ensureOrgFollowUp($followUp);

        return $this->json($followUp->load(['person', 'owner']));
    }

    public function update(Request $request, FollowUp $followUp): JsonResponse
    {
        $this->ensureOrgFollowUp($followUp);

        $validated = $request->validate([
            'owner_user_id' => ['nullable', 'exists:users,id'],
            'status' => ['sometimes', 'in:open,in_progress,completed'],
            'last_contact_at' => ['nullable', 'date'],
            'next_action_at' => ['nullable', 'date'],
            'notes' => ['nullable', 'string'],
        ]);

        $followUp->update($validated);

        $this->activityLogger->log(
            $request->user(),
            $this->organizationId(),
            'follow_up.updated',
            $followUp,
            "Updated follow-up #{$followUp->id}",
        );

        return $this->json($followUp->fresh()->load(['person', 'owner']));
    }

    private function ensureOrgFollowUp(FollowUp $followUp): void
    {
        abort_unless($followUp->organization_id === $this->organizationId(), 404);
    }
}
