<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\Person;
use App\Models\Program;
use App\Models\ProgramTask;
use App\Services\ActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProgramTaskController extends BaseApiController
{
    public function __construct(private ActivityLogger $activityLogger) {}

    public function index(Program $program): JsonResponse
    {
        $this->ensureOrgProgram($program);

        $tasks = $program->tasks()->with('assignee')->orderBy('due_at')->get();

        return $this->json($tasks);
    }

    public function store(Request $request, Program $program): JsonResponse
    {
        $this->ensureOrgProgram($program);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'assignee_person_id' => ['nullable', 'exists:people,id'],
            'status' => ['nullable', 'in:todo,in_progress,done,cancelled'],
            'due_at' => ['nullable', 'date'],
        ]);

        $this->ensureOrgPerson($validated['assignee_person_id'] ?? null);

        $task = $program->tasks()->create([
            ...$validated,
            'status' => $validated['status'] ?? 'todo',
        ]);

        $this->activityLogger->log(
            $request->user(),
            $this->organizationId(),
            'program_task.created',
            $task,
            "Added task {$task->title} to program {$program->title}",
        );

        return $this->json($task->load('assignee'), 201);
    }

    public function update(Request $request, Program $program, ProgramTask $task): JsonResponse
    {
        $this->ensureOrgProgram($program);
        abort_unless($task->program_id === $program->id, 404);

        $validated = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'assignee_person_id' => ['nullable', 'exists:people,id'],
            'status' => ['sometimes', 'in:todo,in_progress,done,cancelled'],
            'due_at' => ['nullable', 'date'],
        ]);

        $this->ensureOrgPerson($validated['assignee_person_id'] ?? null);

        $task->update($validated);

        $this->activityLogger->log(
            $request->user(),
            $this->organizationId(),
            'program_task.updated',
            $task,
            "Updated task {$task->title} for program {$program->title}",
        );

        return $this->json($task->fresh()->load('assignee'));
    }

    public function destroy(Request $request, Program $program, ProgramTask $task): JsonResponse
    {
        $this->ensureOrgProgram($program);
        abort_unless($task->program_id === $program->id, 404);

        $title = $task->title;
        $task->delete();

        $this->activityLogger->log(
            $request->user(),
            $this->organizationId(),
            'program_task.deleted',
            $program,
            "Removed task {$title} from program {$program->title}",
        );

        return response()->json(['data' => ['message' => 'Task removed.']]);
    }

    private function ensureOrgProgram(Program $program): void
    {
        abort_unless($program->organization_id === $this->organizationId(), 404);
    }

    private function ensureOrgPerson(?int $personId): void
    {
        if ($personId === null) {
            return;
        }

        $person = Person::findOrFail($personId);
        abort_unless($person->organization_id === $this->organizationId(), 404);
    }
}
