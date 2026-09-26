<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\ActivityLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ActivityLogController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $logs = ActivityLog::query()
            ->where('organization_id', $this->organizationId())
            ->with('user')
            ->latest('created_at')
            ->paginate($request->integer('per_page', 20));

        return $this->json($logs);
    }
}
