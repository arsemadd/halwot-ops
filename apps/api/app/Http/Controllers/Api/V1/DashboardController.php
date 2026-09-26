<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\ActivityLog;
use App\Models\Asset;
use App\Models\AssetCheckout;
use App\Models\Expense;
use App\Models\FollowUp;
use App\Models\MinistryMembership;
use App\Models\Person;
use App\Models\Program;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;

class DashboardController extends BaseApiController
{
    public function index(): JsonResponse
    {
        $orgId = $this->organizationId();
        $now = Carbon::now();
        $startOfMonth = $now->copy()->startOfMonth();
        $endOfMonth = $now->copy()->endOfMonth();

        $totalPeople = Person::query()
            ->where('organization_id', $orgId)
            ->whereNull('archived_at')
            ->count();

        $members = Person::query()
            ->where('organization_id', $orgId)
            ->whereNull('archived_at')
            ->where('membership_status', 'member')
            ->count();

        $newThisMonth = Person::query()
            ->where('organization_id', $orgId)
            ->whereNull('archived_at')
            ->whereBetween('created_at', [$startOfMonth, $endOfMonth])
            ->count();

        $activeVolunteers = MinistryMembership::query()
            ->where('status', 'active')
            ->whereHas('ministry', fn ($query) => $query->where('organization_id', $orgId))
            ->distinct('person_id')
            ->count('person_id');

        $programsThisMonth = Program::query()
            ->where('organization_id', $orgId)
            ->whereBetween('starts_at', [$startOfMonth, $endOfMonth])
            ->where('status', '!=', 'cancelled')
            ->count();

        $nextProgram = Program::query()
            ->where('organization_id', $orgId)
            ->where('starts_at', '>=', $now)
            ->whereIn('status', ['scheduled', 'draft'])
            ->orderBy('starts_at')
            ->first(['id', 'title', 'starts_at']);

        $openFollowUps = FollowUp::query()
            ->where('organization_id', $orgId)
            ->whereIn('status', ['open', 'in_progress'])
            ->count();

        $overdueFollowUpsQuery = FollowUp::query()
            ->where('organization_id', $orgId)
            ->where('status', '!=', 'completed')
            ->whereNotNull('next_action_at')
            ->where('next_action_at', '<', $now)
            ->with('person')
            ->orderBy('next_action_at');

        $overdueFollowUps = (clone $overdueFollowUpsQuery)->count();

        $priorityFollowUps = FollowUp::query()
            ->where('organization_id', $orgId)
            ->whereIn('status', ['open', 'in_progress'])
            ->with('person')
            ->orderByRaw('CASE WHEN next_action_at IS NULL THEN 1 ELSE 0 END')
            ->orderBy('next_action_at')
            ->limit(5)
            ->get()
            ->map(function (FollowUp $followUp) use ($now) {
                $daysOverdue = null;
                $isOverdue = false;
                if ($followUp->next_action_at && $followUp->next_action_at->lt($now)) {
                    $isOverdue = true;
                    $daysOverdue = (int) $followUp->next_action_at->diffInDays($now);
                }

                $dueToday = $followUp->next_action_at
                    && $followUp->next_action_at->isSameDay($now);

                return [
                    'id' => $followUp->id,
                    'person_id' => $followUp->person_id,
                    'person_name' => $followUp->person?->full_name,
                    'preferred_name' => $followUp->person?->preferred_name,
                    'reason' => $followUp->notes
                        ?: ($followUp->person?->membership_status === 'new'
                            ? 'New member check-in'
                            : 'Follow-up'),
                    'status' => $followUp->status,
                    'next_action_at' => $followUp->next_action_at,
                    'is_overdue' => $isOverdue,
                    'due_today' => $dueToday,
                    'days_overdue' => $daysOverdue,
                ];
            })
            ->values();

        $attention = null;
        $topOverdue = $overdueFollowUpsQuery->first();
        if ($topOverdue) {
            $days = (int) $topOverdue->next_action_at->diffInDays($now);
            $name = $topOverdue->person?->preferred_name ?: $topOverdue->person?->full_name;
            $attention = [
                'type' => 'overdue_follow_up',
                'count' => $overdueFollowUps,
                'title' => $overdueFollowUps === 1
                    ? '1 follow-up is overdue'
                    : "{$overdueFollowUps} follow-ups are overdue",
                'message' => trim(($name ?: 'A person')."'s ".($topOverdue->notes
                    ? \Illuminate\Support\Str::limit($topOverdue->notes, 80)
                    : 'check-in').' was due '.($days === 0 ? 'today' : "{$days} day".($days === 1 ? '' : 's').' ago').'. Needs attention.'),
                'link' => '/people/follow-ups/'.$topOverdue->id,
                'follow_up_id' => $topOverdue->id,
            ];
        }

        $memberGrowth = [];
        for ($i = 5; $i >= 0; $i--) {
            $month = $now->copy()->startOfMonth()->subMonths($i);
            $monthEnd = $month->copy()->endOfMonth();
            $count = Person::query()
                ->where('organization_id', $orgId)
                ->whereNull('archived_at')
                ->where('created_at', '<=', $monthEnd)
                ->count();

            $memberGrowth[] = [
                'month' => $month->format('Y-m'),
                'label' => $month->format('M'),
                'count' => $count,
            ];
        }

        $upcomingPrograms = Program::query()
            ->where('organization_id', $orgId)
            ->where('starts_at', '>=', $now)
            ->whereIn('status', ['scheduled', 'draft'])
            ->withCount('assignments')
            ->orderBy('starts_at')
            ->limit(5)
            ->get()
            ->map(fn (Program $program) => [
                'id' => $program->id,
                'title' => $program->title,
                'starts_at' => $program->starts_at,
                'location' => $program->location,
                'status' => $program->status,
                'serving_count' => $program->assignments_count,
            ]);

        $recentActivity = ActivityLog::query()
            ->where('organization_id', $orgId)
            ->with('user')
            ->latest('created_at')
            ->limit(8)
            ->get()
            ->map(fn (ActivityLog $log) => [
                'id' => $log->id,
                'action' => $log->action,
                'description' => $log->description,
                'created_at' => $log->created_at,
                'user_name' => $log->user?->name,
                'tone' => str_contains($log->action, 'created') || str_contains($log->action, 'person')
                    ? 'success'
                    : (str_contains($log->action, 'expense') || str_contains($log->action, 'asset')
                        ? 'accent'
                        : 'neutral'),
            ]);

        return $this->json([
            'members' => $members,
            'total_people' => $totalPeople,
            'new_this_month' => $newThisMonth,
            'active_volunteers' => $activeVolunteers,
            'programs_this_month' => $programsThisMonth,
            'next_program_title' => $nextProgram?->title,
            'open_follow_ups' => $openFollowUps,
            'overdue_follow_ups' => $overdueFollowUps,
            'attention' => $attention,
            'priority_follow_ups' => $priorityFollowUps,
            'member_growth' => $memberGrowth,
            'upcoming_programs' => $upcomingPrograms,
            'recent_activity' => $recentActivity,
            'pending_expenses' => Expense::query()
                ->where('organization_id', $orgId)
                ->where('status', 'submitted')
                ->count(),
            'assets_checked_out' => Asset::query()
                ->where('organization_id', $orgId)
                ->where('status', 'checked_out')
                ->count(),
            'open_asset_requests' => AssetCheckout::query()
                ->where('organization_id', $orgId)
                ->where('status', 'requested')
                ->count(),
        ]);
    }
}
