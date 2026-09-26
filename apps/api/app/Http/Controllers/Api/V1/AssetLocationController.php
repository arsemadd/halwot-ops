<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\AssetLocation;
use App\Services\ActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AssetLocationController extends BaseApiController
{
    public function __construct(private ActivityLogger $activityLogger) {}

    public function index(Request $request): JsonResponse
    {
        $locations = AssetLocation::query()
            ->where('organization_id', $this->organizationId())
            ->orderBy('name')
            ->paginate($request->integer('per_page', 15));

        return $this->json($locations);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ]);

        $location = AssetLocation::create([
            ...$validated,
            'organization_id' => $this->organizationId(),
        ]);

        $this->activityLogger->log(
            $request->user(),
            $this->organizationId(),
            'asset_location.created',
            $location,
            "Created asset location {$location->name}",
        );

        return $this->json($location, 201);
    }

    public function update(Request $request, AssetLocation $assetLocation): JsonResponse
    {
        $this->ensureOrgLocation($assetLocation);

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ]);

        $assetLocation->update($validated);

        $this->activityLogger->log(
            $request->user(),
            $this->organizationId(),
            'asset_location.updated',
            $assetLocation,
            "Updated asset location {$assetLocation->name}",
        );

        return $this->json($assetLocation->fresh());
    }

    private function ensureOrgLocation(AssetLocation $location): void
    {
        abort_unless($location->organization_id === $this->organizationId(), 404);
    }
}
