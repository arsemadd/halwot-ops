<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\Announcement;
use App\Models\MinistryMembership;
use App\Models\Person;
use App\Models\Program;
use App\Models\ProgramAssignment;
use App\Models\ProgramRsvp;
use App\Services\ActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PortalController extends BaseApiController
{
    public function __construct(private ActivityLogger $activityLogger) {}

    public function overview(Request $request): JsonResponse
    {
        abort_unless($request->user()->can('portal.access'), 403);
        $person = $this->requireLinkedPerson($request);

        $orgId = $this->organizationId();

        $serving = MinistryMembership::query()
            ->where('person_id', $person->id)
            ->where('status', 'active')
            ->with('ministry:id,name,slug')
            ->get();

        $assignments = ProgramAssignment::query()
            ->where('person_id', $person->id)
            ->whereHas('program', function ($q) use ($orgId) {
                $q->where('organization_id', $orgId)
                    ->where('starts_at', '>=', now()->subDay())
                    ->whereIn('status', ['scheduled', 'draft']);
            })
            ->with(['program:id,title,starts_at,location,status'])
            ->orderBy('id')
            ->get();

        $upcomingPrograms = Program::query()
            ->where('organization_id', $orgId)
            ->where('starts_at', '>=', now())
            ->whereIn('status', ['scheduled', 'draft'])
            ->orderBy('starts_at')
            ->limit(12)
            ->get(['id', 'title', 'starts_at', 'location', 'status', 'description']);

        $rsvps = ProgramRsvp::query()
            ->where('person_id', $person->id)
            ->where('organization_id', $orgId)
            ->get()
            ->keyBy('program_id');

        $announcements = Announcement::query()
            ->where('organization_id', $orgId)
            ->where('status', 'published')
            ->where(function ($q) {
                $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
            })
            ->where('published_at', '<=', now())
            ->whereIn('audience', ['all', 'members'])
            ->orderByDesc('published_at')
            ->limit(5)
            ->get(['id', 'title', 'body', 'published_at', 'audience']);

        return $this->json([
            'person' => $person->load('household:id,name,address,phone'),
            'serving' => $serving,
            'assignments' => $assignments,
            'upcoming_programs' => $upcomingPrograms->map(function (Program $program) use ($rsvps) {
                $rsvp = $rsvps->get($program->id);

                return [
                    ...$program->toArray(),
                    'rsvp_status' => $rsvp?->status,
                    'rsvp_id' => $rsvp?->id,
                ];
            }),
            'announcements' => $announcements,
        ]);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        abort_unless($request->user()->can('portal.access'), 403);
        $person = $this->requireLinkedPerson($request);

        $validated = $request->validate([
            'preferred_name' => ['nullable', 'string', 'max:120'],
            'phone' => ['nullable', 'string', 'max:40'],
            'email' => ['nullable', 'email', 'max:180'],
            'address' => ['nullable', 'string', 'max:500'],
        ]);

        $person->update($validated);

        $this->activityLogger->log(
            $request->user(),
            $this->organizationId(),
            'portal.profile_updated',
            $person,
            'Updated self-service profile',
        );

        return $this->json($person->fresh()->load('household:id,name,address,phone'));
    }

    public function upsertRsvp(Request $request): JsonResponse
    {
        abort_unless($request->user()->can('portal.access'), 403);
        $person = $this->requireLinkedPerson($request);

        $validated = $request->validate([
            'program_id' => ['required', 'exists:programs,id'],
            'status' => ['required', 'in:attending,not_attending,maybe'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $program = Program::query()
            ->where('organization_id', $this->organizationId())
            ->where('id', $validated['program_id'])
            ->firstOrFail();

        $rsvp = ProgramRsvp::query()->updateOrCreate(
            [
                'program_id' => $program->id,
                'person_id' => $person->id,
            ],
            [
                'organization_id' => $this->organizationId(),
                'status' => $validated['status'],
                'notes' => $validated['notes'] ?? null,
            ],
        );

        $this->activityLogger->log(
            $request->user(),
            $this->organizationId(),
            'portal.rsvp_updated',
            $rsvp,
            "RSVP {$validated['status']} for {$program->title}",
        );

        return $this->json($rsvp->load('program:id,title,starts_at,location'));
    }

    public function updateAssignment(Request $request, ProgramAssignment $programAssignment): JsonResponse
    {
        abort_unless($request->user()->can('portal.access'), 403);
        $person = $this->requireLinkedPerson($request);

        abort_unless($programAssignment->person_id === $person->id, 403);

        $program = Program::query()->findOrFail($programAssignment->program_id);
        abort_unless($program->organization_id === $this->organizationId(), 404);

        $validated = $request->validate([
            'confirmation_status' => ['required', 'in:pending,confirmed,declined'],
        ]);

        $programAssignment->update($validated);

        $this->activityLogger->log(
            $request->user(),
            $this->organizationId(),
            'portal.serving_confirmed',
            $programAssignment,
            "Serving {$validated['confirmation_status']} for {$program->title}",
        );

        return $this->json($programAssignment->fresh()->load('program:id,title,starts_at,location'));
    }

    private function requireLinkedPerson(Request $request): Person
    {
        $user = $request->user();
        abort_unless($user->person_id, 422, 'Your account is not linked to a member profile.');

        $person = Person::query()
            ->where('organization_id', $this->organizationId())
            ->where('id', $user->person_id)
            ->whereNull('archived_at')
            ->first();

        abort_unless($person, 404, 'Linked member profile not found.');

        return $person;
    }
}
