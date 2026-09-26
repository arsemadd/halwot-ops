<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\Expense;
use App\Models\Ministry;
use App\Models\Program;
use App\Services\ActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class ExpenseController extends BaseApiController
{
    public function __construct(private ActivityLogger $activityLogger) {}

    public function index(Request $request): JsonResponse
    {
        $query = Expense::query()
            ->where('organization_id', $this->organizationId())
            ->with(['program', 'ministry', 'requestedBy', 'approvedBy', 'paidBy']);

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('category')) {
            $query->where('category', $request->string('category'));
        }

        $expenses = $query->orderByDesc('created_at')->paginate($request->integer('per_page', 15));

        return $this->json($expenses);
    }

    public function store(Request $request): JsonResponse
    {
        $orgId = $this->organizationId();

        $validated = $request->validate([
            'category' => ['required', 'in:media,worship,youth,facilities,admin,transport,other'],
            'program_id' => ['nullable', 'exists:programs,id'],
            'ministry_id' => ['nullable', 'exists:ministries,id'],
            'amount' => ['required', 'numeric', 'min:0'],
            'currency' => ['nullable', 'string', 'max:3'],
            'description' => ['required', 'string'],
            'receipt_path' => ['nullable', 'string', 'max:500'],
        ]);

        $this->ensureOrgProgram($validated['program_id'] ?? null);
        $this->ensureOrgMinistry($validated['ministry_id'] ?? null);

        $expense = Expense::create([
            ...$validated,
            'organization_id' => $orgId,
            'requested_by_user_id' => $request->user()->id,
            'status' => 'draft',
            'currency' => $validated['currency'] ?? 'ETB',
        ]);

        $this->activityLogger->log(
            $request->user(),
            $orgId,
            'expense.created',
            $expense,
            "Created expense draft ({$expense->category})",
        );

        return $this->json($expense->load(['program', 'ministry', 'requestedBy']), 201);
    }

    public function show(Expense $expense): JsonResponse
    {
        $this->ensureOrgExpense($expense);

        return $this->json($expense->load(['program', 'ministry', 'requestedBy', 'approvedBy', 'paidBy']));
    }

    public function update(Request $request, Expense $expense): JsonResponse
    {
        $this->ensureOrgExpense($expense);
        abort_unless(in_array($expense->status, ['draft', 'rejected'], true), 422, 'Only draft or rejected expenses can be updated.');

        $validated = $request->validate([
            'category' => ['sometimes', 'in:media,worship,youth,facilities,admin,transport,other'],
            'program_id' => ['nullable', 'exists:programs,id'],
            'ministry_id' => ['nullable', 'exists:ministries,id'],
            'amount' => ['sometimes', 'numeric', 'min:0'],
            'currency' => ['nullable', 'string', 'max:3'],
            'description' => ['sometimes', 'string'],
            'receipt_path' => ['nullable', 'string', 'max:500'],
        ]);

        $this->ensureOrgProgram($validated['program_id'] ?? null);
        $this->ensureOrgMinistry($validated['ministry_id'] ?? null);

        if ($expense->status === 'rejected') {
            $validated['status'] = 'draft';
            $validated['rejection_reason'] = null;
        }

        $expense->update($validated);

        $this->activityLogger->log(
            $request->user(),
            $this->organizationId(),
            'expense.updated',
            $expense,
            "Updated expense #{$expense->id}",
        );

        return $this->json($expense->fresh()->load(['program', 'ministry', 'requestedBy']));
    }

    public function submit(Request $request, Expense $expense): JsonResponse
    {
        $this->ensureOrgExpense($expense);
        abort_unless(in_array($expense->status, ['draft', 'rejected'], true), 422, 'Only draft or rejected expenses can be submitted.');

        $expense->update([
            'status' => 'submitted',
            'submitted_at' => Carbon::now(),
            'rejection_reason' => null,
        ]);

        $this->activityLogger->log(
            $request->user(),
            $this->organizationId(),
            'expense.submitted',
            $expense,
            "Submitted expense #{$expense->id}",
        );

        return $this->json($expense->fresh()->load(['program', 'ministry', 'requestedBy']));
    }

    public function approve(Request $request, Expense $expense): JsonResponse
    {
        $this->ensureOrgExpense($expense);
        abort_unless($expense->status === 'submitted', 422, 'Only submitted expenses can be approved.');

        $expense->update([
            'status' => 'approved',
            'approved_by_user_id' => $request->user()->id,
            'approved_at' => Carbon::now(),
        ]);

        $this->activityLogger->log(
            $request->user(),
            $this->organizationId(),
            'expense.approved',
            $expense,
            "Approved expense #{$expense->id}",
        );

        return $this->json($expense->fresh()->load(['program', 'ministry', 'requestedBy', 'approvedBy']));
    }

    public function reject(Request $request, Expense $expense): JsonResponse
    {
        $this->ensureOrgExpense($expense);
        abort_unless($expense->status === 'submitted', 422, 'Only submitted expenses can be rejected.');

        $validated = $request->validate([
            'rejection_reason' => ['required', 'string'],
        ]);

        $expense->update([
            'status' => 'rejected',
            'rejection_reason' => $validated['rejection_reason'],
        ]);

        $this->activityLogger->log(
            $request->user(),
            $this->organizationId(),
            'expense.rejected',
            $expense,
            "Rejected expense #{$expense->id}",
        );

        return $this->json($expense->fresh()->load(['program', 'ministry', 'requestedBy']));
    }

    public function markPaid(Request $request, Expense $expense): JsonResponse
    {
        $this->ensureOrgExpense($expense);
        abort_unless($expense->status === 'approved', 422, 'Only approved expenses can be marked as paid.');

        $expense->update([
            'status' => 'paid',
            'paid_by_user_id' => $request->user()->id,
            'paid_at' => Carbon::now(),
        ]);

        $this->activityLogger->log(
            $request->user(),
            $this->organizationId(),
            'expense.paid',
            $expense,
            "Marked expense #{$expense->id} as paid",
        );

        return $this->json($expense->fresh()->load(['program', 'ministry', 'requestedBy', 'approvedBy', 'paidBy']));
    }

    public function reconcile(Request $request, Expense $expense): JsonResponse
    {
        $this->ensureOrgExpense($expense);
        abort_unless($expense->status === 'paid', 422, 'Only paid expenses can be reconciled.');

        $expense->update(['status' => 'reconciled']);

        $this->activityLogger->log(
            $request->user(),
            $this->organizationId(),
            'expense.reconciled',
            $expense,
            "Reconciled expense #{$expense->id}",
        );

        return $this->json($expense->fresh()->load(['program', 'ministry', 'requestedBy', 'approvedBy', 'paidBy']));
    }

    private function ensureOrgExpense(Expense $expense): void
    {
        abort_unless($expense->organization_id === $this->organizationId(), 404);
    }

    private function ensureOrgProgram(?int $programId): void
    {
        if ($programId === null) {
            return;
        }

        $program = Program::findOrFail($programId);
        abort_unless($program->organization_id === $this->organizationId(), 404);
    }

    private function ensureOrgMinistry(?int $ministryId): void
    {
        if ($ministryId === null) {
            return;
        }

        $ministry = Ministry::findOrFail($ministryId);
        abort_unless($ministry->organization_id === $this->organizationId(), 404);
    }
}
