<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\MinistryMembership;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ServingController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $query = MinistryMembership::query()
            ->whereHas('ministry', fn ($builder) => $builder->where('organization_id', $this->organizationId()))
            ->with(['person', 'ministry']);

        if ($request->filled('ministry_id')) {
            $query->where('ministry_id', $request->integer('ministry_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        $memberships = $query->latest()->paginate($request->integer('per_page', 15));

        return $this->json($memberships);
    }
}
