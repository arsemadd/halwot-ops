<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\Program;
use App\Models\ProgramBudget;
use App\Services\ActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProgramBudgetController extends BaseApiController
{
    public function __construct(private ActivityLogger $activityLogger) {}

    public function index(Program $program): JsonResponse
    {
        $this->ensureOrgProgram($program);

        $budgets = $program->budgets()->orderBy('category')->get();

        return $this->json($budgets);
    }

    public function store(Request $request, Program $program): JsonResponse
    {
        $this->ensureOrgProgram($program);

        $validated = $request->validate([
            'category' => ['required', 'string', 'max:100'],
            'amount' => ['required', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
        ]);

        $budget = $program->budgets()->create($validated);

        $this->activityLogger->log(
            $request->user(),
            $this->organizationId(),
            'program_budget.created',
            $budget,
            "Added budget line {$budget->category} to program {$program->title}",
        );

        return $this->json($budget, 201);
    }

    public function update(Request $request, Program $program, ProgramBudget $budget): JsonResponse
    {
        $this->ensureOrgProgram($program);
        abort_unless($budget->program_id === $program->id, 404);

        $validated = $request->validate([
            'category' => ['sometimes', 'string', 'max:100'],
            'amount' => ['sometimes', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
        ]);

        $budget->update($validated);

        $this->activityLogger->log(
            $request->user(),
            $this->organizationId(),
            'program_budget.updated',
            $budget,
            "Updated budget line {$budget->category} for program {$program->title}",
        );

        return $this->json($budget->fresh());
    }

    public function destroy(Request $request, Program $program, ProgramBudget $budget): JsonResponse
    {
        $this->ensureOrgProgram($program);
        abort_unless($budget->program_id === $program->id, 404);

        $category = $budget->category;
        $budget->delete();

        $this->activityLogger->log(
            $request->user(),
            $this->organizationId(),
            'program_budget.deleted',
            $program,
            "Removed budget line {$category} from program {$program->title}",
        );

        return response()->json(['data' => ['message' => 'Budget line removed.']]);
    }

    private function ensureOrgProgram(Program $program): void
    {
        abort_unless($program->organization_id === $this->organizationId(), 404);
    }
}
