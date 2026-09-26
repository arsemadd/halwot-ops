<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\AppNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $notifications = AppNotification::query()
            ->where('organization_id', $this->organizationId())
            ->where(function ($query) use ($user) {
                $query->whereNull('user_id')
                    ->orWhere('user_id', $user->id);
            })
            ->latest()
            ->paginate($request->integer('per_page', 30));

        return $this->json($notifications);
    }

    public function markRead(AppNotification $notification): JsonResponse
    {
        abort_unless($notification->organization_id === $this->organizationId(), 404);

        $user = auth()->user();
        abort_unless(
            $notification->user_id === null || $notification->user_id === $user->id,
            403,
        );

        if ($notification->read_at === null) {
            $notification->update(['read_at' => now()]);
        }

        return $this->json($notification->fresh());
    }

    public function markAllRead(Request $request): JsonResponse
    {
        $user = $request->user();

        AppNotification::query()
            ->where('organization_id', $this->organizationId())
            ->whereNull('read_at')
            ->where(function ($query) use ($user) {
                $query->whereNull('user_id')
                    ->orWhere('user_id', $user->id);
            })
            ->update(['read_at' => now()]);

        return response()->json(['data' => ['message' => 'All notifications marked as read.']]);
    }
}
