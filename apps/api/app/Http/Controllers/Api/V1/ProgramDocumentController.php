<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\Program;
use App\Models\ProgramDocument;
use App\Services\ActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProgramDocumentController extends BaseApiController
{
    public function __construct(private ActivityLogger $activityLogger) {}

    public function index(Program $program): JsonResponse
    {
        $this->ensureOrgProgram($program);

        $documents = $program->documents()->with('uploadedBy')->orderBy('title')->get();

        return $this->json($documents);
    }

    public function store(Request $request, Program $program): JsonResponse
    {
        $this->ensureOrgProgram($program);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'file_path' => ['nullable', 'string', 'max:500'],
        ]);

        $document = $program->documents()->create([
            ...$validated,
            'uploaded_by_user_id' => $request->user()->id,
        ]);

        $this->activityLogger->log(
            $request->user(),
            $this->organizationId(),
            'program_document.created',
            $document,
            "Added document {$document->title} to program {$program->title}",
        );

        return $this->json($document->load('uploadedBy'), 201);
    }

    public function update(Request $request, Program $program, ProgramDocument $document): JsonResponse
    {
        $this->ensureOrgProgram($program);
        abort_unless($document->program_id === $program->id, 404);

        $validated = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'file_path' => ['nullable', 'string', 'max:500'],
        ]);

        $document->update($validated);

        $this->activityLogger->log(
            $request->user(),
            $this->organizationId(),
            'program_document.updated',
            $document,
            "Updated document {$document->title} for program {$program->title}",
        );

        return $this->json($document->fresh()->load('uploadedBy'));
    }

    public function destroy(Request $request, Program $program, ProgramDocument $document): JsonResponse
    {
        $this->ensureOrgProgram($program);
        abort_unless($document->program_id === $program->id, 404);

        $title = $document->title;
        $document->delete();

        $this->activityLogger->log(
            $request->user(),
            $this->organizationId(),
            'program_document.deleted',
            $program,
            "Removed document {$title} from program {$program->title}",
        );

        return response()->json(['data' => ['message' => 'Document removed.']]);
    }

    private function ensureOrgProgram(Program $program): void
    {
        abort_unless($program->organization_id === $this->organizationId(), 404);
    }
}
