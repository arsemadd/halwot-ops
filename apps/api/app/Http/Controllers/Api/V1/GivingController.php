<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\GivingRecord;
use App\Models\Person;
use App\Services\ActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class GivingController extends BaseApiController
{
    public function __construct(private ActivityLogger $activityLogger) {}

    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()->can('giving.view'), 403);

        $query = GivingRecord::query()
            ->where('organization_id', $this->organizationId())
            ->with(['person:id,full_name,preferred_name,email', 'recordedBy:id,name'])
            ->orderByDesc('given_on')
            ->orderByDesc('id');

        if ($request->filled('type')) {
            $query->where('type', $request->string('type'));
        }

        if ($request->filled('from')) {
            $query->whereDate('given_on', '>=', $request->string('from'));
        }

        if ($request->filled('to')) {
            $query->whereDate('given_on', '<=', $request->string('to'));
        }

        if ($request->filled('person_id')) {
            $query->where('person_id', $request->integer('person_id'));
        }

        return $this->json($query->paginate($request->integer('per_page', 25)));
    }

    public function summary(Request $request): JsonResponse
    {
        abort_unless($request->user()->can('giving.view'), 403);

        $orgId = $this->organizationId();
        $from = $request->filled('from')
            ? Carbon::parse($request->string('from'))->startOfDay()
            : now()->startOfMonth();
        $to = $request->filled('to')
            ? Carbon::parse($request->string('to'))->endOfDay()
            : now()->endOfMonth();

        $base = GivingRecord::query()
            ->where('organization_id', $orgId)
            ->whereBetween('given_on', [$from->toDateString(), $to->toDateString()]);

        $total = (clone $base)->sum('amount');
        $byType = (clone $base)
            ->selectRaw('type, SUM(amount) as total, COUNT(*) as count')
            ->groupBy('type')
            ->get();

        $byMethod = (clone $base)
            ->selectRaw('method, SUM(amount) as total, COUNT(*) as count')
            ->groupBy('method')
            ->get();

        $monthly = [];
        for ($i = 5; $i >= 0; $i--) {
            $month = now()->subMonths($i)->startOfMonth();
            $end = $month->copy()->endOfMonth();
            $monthTotal = GivingRecord::query()
                ->where('organization_id', $orgId)
                ->whereBetween('given_on', [$month->toDateString(), $end->toDateString()])
                ->sum('amount');
            $monthly[] = [
                'month' => $month->format('Y-m'),
                'label' => $month->format('M'),
                'total' => (string) $monthTotal,
            ];
        }

        return $this->json([
            'from' => $from->toDateString(),
            'to' => $to->toDateString(),
            'total' => (string) $total,
            'currency' => 'ETB',
            'record_count' => (clone $base)->count(),
            'by_type' => $byType,
            'by_method' => $byMethod,
            'monthly' => $monthly,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        abort_unless($request->user()->can('giving.create'), 403);

        $validated = $request->validate([
            'person_id' => ['nullable', 'exists:people,id'],
            'type' => ['required', 'in:tithe,offering,special,other'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'currency' => ['nullable', 'string', 'max:3'],
            'given_on' => ['required', 'date'],
            'method' => ['required', 'in:cash,bank,mobile,card,other'],
            'fund' => ['nullable', 'string', 'max:120'],
            'is_anonymous' => ['nullable', 'boolean'],
            'notes' => ['nullable', 'string'],
        ]);

        if (! empty($validated['person_id'])) {
            $this->ensureOrgPerson((int) $validated['person_id']);
        }

        $isAnonymous = $request->boolean('is_anonymous');

        $record = GivingRecord::create([
            ...$validated,
            'organization_id' => $this->organizationId(),
            'recorded_by_user_id' => $request->user()->id,
            'currency' => $validated['currency'] ?? 'ETB',
            'is_anonymous' => $isAnonymous,
            'person_id' => $isAnonymous ? null : ($validated['person_id'] ?? null),
        ]);

        $this->activityLogger->log(
            $request->user(),
            $this->organizationId(),
            'giving.recorded',
            $record,
            "Recorded {$record->type} of {$record->amount} {$record->currency}",
        );

        return $this->json($record->load(['person:id,full_name,preferred_name', 'recordedBy:id,name']), 201);
    }

    public function show(Request $request, GivingRecord $givingRecord): JsonResponse
    {
        abort_unless($request->user()->can('giving.view'), 403);
        $this->ensureOrgGiving($givingRecord);

        return $this->json($givingRecord->load(['person', 'recordedBy:id,name']));
    }

    public function update(Request $request, GivingRecord $givingRecord): JsonResponse
    {
        abort_unless($request->user()->can('giving.edit'), 403);
        $this->ensureOrgGiving($givingRecord);

        $validated = $request->validate([
            'person_id' => ['nullable', 'exists:people,id'],
            'type' => ['sometimes', 'in:tithe,offering,special,other'],
            'amount' => ['sometimes', 'numeric', 'min:0.01'],
            'currency' => ['nullable', 'string', 'max:3'],
            'given_on' => ['sometimes', 'date'],
            'method' => ['sometimes', 'in:cash,bank,mobile,card,other'],
            'fund' => ['nullable', 'string', 'max:120'],
            'is_anonymous' => ['nullable', 'boolean'],
            'notes' => ['nullable', 'string'],
        ]);

        if (array_key_exists('person_id', $validated) && $validated['person_id']) {
            $this->ensureOrgPerson((int) $validated['person_id']);
        }

        if ($request->has('is_anonymous') && $request->boolean('is_anonymous')) {
            $validated['person_id'] = null;
            $validated['is_anonymous'] = true;
        }

        $givingRecord->update($validated);

        $this->activityLogger->log(
            $request->user(),
            $this->organizationId(),
            'giving.updated',
            $givingRecord,
            "Updated giving record #{$givingRecord->id}",
        );

        return $this->json($givingRecord->fresh()->load(['person:id,full_name,preferred_name', 'recordedBy:id,name']));
    }

    private function ensureOrgGiving(GivingRecord $giving): void
    {
        abort_unless($giving->organization_id === $this->organizationId(), 404);
    }

    private function ensureOrgPerson(int $personId): void
    {
        $exists = Person::query()
            ->where('organization_id', $this->organizationId())
            ->where('id', $personId)
            ->exists();

        abort_unless($exists, 422, 'Person not found in this organization.');
    }
}
