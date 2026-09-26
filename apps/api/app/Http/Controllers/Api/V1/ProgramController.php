<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\AttendanceRecord;
use App\Models\Person;
use App\Models\Program;
use App\Models\ProgramAssignment;
use App\Services\ActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProgramController extends BaseApiController
{
    public function __construct(private ActivityLogger $activityLogger) {}

    public function index(Request $request): JsonResponse
    {
        $query = Program::query()
            ->where('organization_id', $this->organizationId())
            ->with(['ministry', 'leader']);

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('ministry_id')) {
            $query->where('ministry_id', $request->integer('ministry_id'));
        }

        $programs = $query->orderByDesc('starts_at')->paginate($request->integer('per_page', 15));

        return $this->json($programs);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ministry_id' => ['nullable', 'exists:ministries,id'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'starts_at' => ['nullable', 'date'],
            'location' => ['nullable', 'string', 'max:255'],
            'leader_person_id' => ['nullable', 'exists:people,id'],
            'status' => ['nullable', 'in:draft,scheduled,completed,cancelled'],
        ]);

        $program = Program::create([
            ...$validated,
            'organization_id' => $this->organizationId(),
            'status' => $validated['status'] ?? 'draft',
        ]);

        $this->activityLogger->log(
            $request->user(),
            $this->organizationId(),
            'program.created',
            $program,
            "Created program {$program->title}",
        );

        return $this->json($program->load(['ministry', 'leader']), 201);
    }

    public function show(Program $program): JsonResponse
    {
        $this->ensureOrgProgram($program);

        return $this->json($program->load(['ministry', 'leader', 'assignments.person', 'attendanceRecords.person']));
    }

    public function update(Request $request, Program $program): JsonResponse
    {
        $this->ensureOrgProgram($program);

        $validated = $request->validate([
            'ministry_id' => ['nullable', 'exists:ministries,id'],
            'title' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'starts_at' => ['nullable', 'date'],
            'location' => ['nullable', 'string', 'max:255'],
            'leader_person_id' => ['nullable', 'exists:people,id'],
            'status' => ['sometimes', 'in:draft,scheduled,completed,cancelled'],
        ]);

        $program->update($validated);

        $this->activityLogger->log(
            $request->user(),
            $this->organizationId(),
            'program.updated',
            $program,
            "Updated program {$program->title}",
        );

        return $this->json($program->fresh()->load(['ministry', 'leader', 'assignments.person']));
    }

    public function addAssignment(Request $request, Program $program): JsonResponse
    {
        $this->ensureOrgProgram($program);

        $validated = $request->validate([
            'person_id' => ['required', 'exists:people,id'],
            'role' => ['required', 'string', 'max:100'],
            'confirmation_status' => ['nullable', 'in:pending,confirmed,declined'],
        ]);

        $person = Person::findOrFail($validated['person_id']);
        abort_unless($person->organization_id === $this->organizationId(), 404);

        $assignment = ProgramAssignment::updateOrCreate(
            [
                'program_id' => $program->id,
                'person_id' => $person->id,
                'role' => $validated['role'],
            ],
            [
                'confirmation_status' => $validated['confirmation_status'] ?? 'pending',
            ],
        );

        return $this->json($assignment->load('person'), 201);
    }

    public function updateAssignment(Request $request, Program $program, ProgramAssignment $programAssignment): JsonResponse
    {
        $this->ensureOrgProgram($program);
        abort_unless($programAssignment->program_id === $program->id, 404);

        $validated = $request->validate([
            'role' => ['sometimes', 'string', 'max:100'],
            'confirmation_status' => ['sometimes', 'in:pending,confirmed,declined'],
        ]);

        $programAssignment->update($validated);

        return $this->json($programAssignment->fresh()->load('person'));
    }

    public function removeAssignment(Program $program, ProgramAssignment $programAssignment): JsonResponse
    {
        $this->ensureOrgProgram($program);
        abort_unless($programAssignment->program_id === $program->id, 404);

        $programAssignment->delete();

        return response()->json(['data' => ['message' => 'Assignment removed.']]);
    }

    public function listAttendance(Program $program): JsonResponse
    {
        $this->ensureOrgProgram($program);

        $records = $program->attendanceRecords()->with('person')->get();

        return $this->json($records);
    }

    public function upsertAttendance(Request $request, Program $program): JsonResponse
    {
        $this->ensureOrgProgram($program);

        $validated = $request->validate([
            'records' => ['required', 'array', 'min:1'],
            'records.*.person_id' => ['required', 'exists:people,id'],
            'records.*.status' => ['required', 'in:present,absent,excused,visitor'],
            'records.*.notes' => ['nullable', 'string'],
        ]);

        $results = [];

        foreach ($validated['records'] as $record) {
            $person = Person::findOrFail($record['person_id']);
            abort_unless($person->organization_id === $this->organizationId(), 404);

            $results[] = AttendanceRecord::updateOrCreate(
                [
                    'program_id' => $program->id,
                    'person_id' => $person->id,
                ],
                [
                    'status' => $record['status'],
                    'notes' => $record['notes'] ?? null,
                ],
            )->load('person');
        }

        return $this->json($results);
    }

    private function ensureOrgProgram(Program $program): void
    {
        abort_unless($program->organization_id === $this->organizationId(), 404);
    }
}
