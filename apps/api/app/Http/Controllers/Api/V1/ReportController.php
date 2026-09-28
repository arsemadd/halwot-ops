<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\AttendanceRecord;
use App\Models\FollowUp;
use App\Models\GivingRecord;
use App\Models\Ministry;
use App\Models\MinistryMembership;
use App\Models\Person;
use App\Models\Program;
use App\Models\ProgramRsvp;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class ReportController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()->can('reports.view'), 403);

        $orgId = $this->organizationId();
        $now = Carbon::now();

        $membershipBreakdown = Person::query()
            ->where('organization_id', $orgId)
            ->whereNull('archived_at')
            ->selectRaw('membership_status, COUNT(*) as count')
            ->groupBy('membership_status')
            ->pluck('count', 'membership_status');

        $memberGrowth = [];
        for ($i = 5; $i >= 0; $i--) {
            $month = $now->copy()->subMonths($i)->startOfMonth();
            $end = $month->copy()->endOfMonth();
            $count = Person::query()
                ->where('organization_id', $orgId)
                ->whereNull('archived_at')
                ->where('created_at', '<=', $end)
                ->count();
            $memberGrowth[] = [
                'month' => $month->format('Y-m'),
                'label' => $month->format('M'),
                'count' => $count,
            ];
        }

        $attendanceByMonth = [];
        for ($i = 5; $i >= 0; $i--) {
            $month = $now->copy()->subMonths($i)->startOfMonth();
            $end = $month->copy()->endOfMonth();
            $present = AttendanceRecord::query()
                ->whereHas('program', fn ($q) => $q->where('organization_id', $orgId))
                ->whereIn('status', ['present', 'visitor'])
                ->whereHas('program', fn ($q) => $q->whereBetween('starts_at', [$month, $end]))
                ->count();
            $attendanceByMonth[] = [
                'month' => $month->format('Y-m'),
                'label' => $month->format('M'),
                'count' => $present,
            ];
        }

        $followUpStats = [
            'open' => FollowUp::query()->where('organization_id', $orgId)->where('status', 'open')->count(),
            'in_progress' => FollowUp::query()->where('organization_id', $orgId)->where('status', 'in_progress')->count(),
            'completed' => FollowUp::query()->where('organization_id', $orgId)->where('status', 'completed')->count(),
            'overdue' => FollowUp::query()
                ->where('organization_id', $orgId)
                ->where('status', '!=', 'completed')
                ->whereNotNull('next_action_at')
                ->where('next_action_at', '<', $now)
                ->count(),
        ];

        $ministryServing = Ministry::query()
            ->where('organization_id', $orgId)
            ->where('is_active', true)
            ->withCount(['memberships as active_count' => fn ($q) => $q->where('status', 'active')])
            ->orderBy('name')
            ->get(['id', 'name', 'slug'])
            ->map(fn (Ministry $m) => [
                'id' => $m->id,
                'name' => $m->name,
                'active_count' => $m->active_count,
            ]);

        $programStats = [
            'upcoming' => Program::query()
                ->where('organization_id', $orgId)
                ->where('starts_at', '>=', $now)
                ->whereIn('status', ['scheduled', 'draft'])
                ->count(),
            'this_month' => Program::query()
                ->where('organization_id', $orgId)
                ->whereBetween('starts_at', [$now->copy()->startOfMonth(), $now->copy()->endOfMonth()])
                ->where('status', '!=', 'cancelled')
                ->count(),
            'rsvp_attending' => ProgramRsvp::query()
                ->where('organization_id', $orgId)
                ->where('status', 'attending')
                ->count(),
        ];

        $volunteerCount = MinistryMembership::query()
            ->where('status', 'active')
            ->whereHas('ministry', fn ($q) => $q->where('organization_id', $orgId))
            ->distinct('person_id')
            ->count('person_id');

        $payload = [
            'generated_at' => $now->toIso8601String(),
            'people' => [
                'total' => Person::query()->where('organization_id', $orgId)->whereNull('archived_at')->count(),
                'members' => Person::query()->where('organization_id', $orgId)->whereNull('archived_at')->where('membership_status', 'member')->count(),
                'volunteers' => $volunteerCount,
                'by_status' => $membershipBreakdown,
                'growth' => $memberGrowth,
            ],
            'attendance' => [
                'by_month' => $attendanceByMonth,
            ],
            'follow_ups' => $followUpStats,
            'ministries' => $ministryServing,
            'programs' => $programStats,
            'giving' => null,
        ];

        if ($request->user()->can('giving.view')) {
            $monthStart = $now->copy()->startOfMonth()->toDateString();
            $monthEnd = $now->copy()->endOfMonth()->toDateString();
            $givingTotal = GivingRecord::query()
                ->where('organization_id', $orgId)
                ->whereBetween('given_on', [$monthStart, $monthEnd])
                ->sum('amount');
            $givingByType = GivingRecord::query()
                ->where('organization_id', $orgId)
                ->whereBetween('given_on', [$monthStart, $monthEnd])
                ->selectRaw('type, SUM(amount) as total')
                ->groupBy('type')
                ->get();

            $givingMonthly = [];
            for ($i = 5; $i >= 0; $i--) {
                $month = $now->copy()->subMonths($i)->startOfMonth();
                $end = $month->copy()->endOfMonth();
                $total = GivingRecord::query()
                    ->where('organization_id', $orgId)
                    ->whereBetween('given_on', [$month->toDateString(), $end->toDateString()])
                    ->sum('amount');
                $givingMonthly[] = [
                    'month' => $month->format('Y-m'),
                    'label' => $month->format('M'),
                    'total' => (string) $total,
                ];
            }

            $payload['giving'] = [
                'month_total' => (string) $givingTotal,
                'currency' => 'ETB',
                'by_type' => $givingByType,
                'monthly' => $givingMonthly,
            ];
        }

        return $this->json($payload);
    }
}
