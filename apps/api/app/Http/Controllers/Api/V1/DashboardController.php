<?php

namespace App\Http\Controllers\Api\V1;

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

        $members = Person::query()
            ->where('organization_id', $orgId)
            ->whereNull('archived_at')
            ->where('membership_status', 'member')
            ->count();

        $newThisMonth = Person::query()
            ->where('organization_id', $orgId)
            ->whereNull('archived_at')
            ->where('membership_status', 'new')
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

        $openFollowUps = FollowUp::query()
            ->where('organization_id', $orgId)
            ->whereIn('status', ['open', 'in_progress'])
            ->count();

        $overdueFollowUps = FollowUp::query()
            ->where('organization_id', $orgId)
            ->where('status', '!=', 'completed')
            ->whereNotNull('next_action_at')
            ->where('next_action_at', '<', $now)
            ->count();

        $upcomingPrograms = Program::query()
            ->where('organization_id', $orgId)
            ->where('starts_at', '>=', $now)
            ->whereIn('status', ['scheduled', 'draft'])
            ->orderBy('starts_at')
            ->limit(5)
            ->get(['id', 'title', 'starts_at', 'location', 'status']);

        $pendingExpenses = Expense::query()
            ->where('organization_id', $orgId)
            ->where('status', 'submitted')
            ->count();

        $assetsCheckedOut = Asset::query()
            ->where('organization_id', $orgId)
            ->where('status', 'checked_out')
            ->count();

        $openAssetRequests = AssetCheckout::query()
            ->where('organization_id', $orgId)
            ->where('status', 'requested')
            ->count();

        return $this->json([
            'members' => $members,
            'new_this_month' => $newThisMonth,
            'active_volunteers' => $activeVolunteers,
            'programs_this_month' => $programsThisMonth,
            'open_follow_ups' => $openFollowUps,
            'overdue_follow_ups' => $overdueFollowUps,
            'upcoming_programs' => $upcomingPrograms,
            'pending_expenses' => $pendingExpenses,
            'assets_checked_out' => $assetsCheckedOut,
            'open_asset_requests' => $openAssetRequests,
        ]);
    }
}
