<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\Asset;
use App\Models\AssetLocation;
use App\Models\Ministry;
use App\Services\ActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AssetController extends BaseApiController
{
    public function __construct(private ActivityLogger $activityLogger) {}

    public function index(Request $request): JsonResponse
    {
        $query = Asset::query()
            ->where('organization_id', $this->organizationId())
            ->with(['location', 'custodianMinistry']);

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('category')) {
            $query->where('category', $request->string('category'));
        }

        if ($request->filled('q')) {
            $search = $request->string('q');
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%");
            });
        }

        $assets = $query->orderBy('code')->paginate($request->integer('per_page', 15));

        return $this->json($assets);
    }

    public function store(Request $request): JsonResponse
    {
        $orgId = $this->organizationId();

        $validated = $request->validate([
            'code' => [
                'required',
                'string',
                'max:50',
                Rule::unique('assets', 'code')->where('organization_id', $orgId),
            ],
            'name' => ['required', 'string', 'max:255'],
            'category' => ['required', 'in:camera,microphone,speaker,projector,laptop,furniture,instrument,vehicle,other'],
            'brand' => ['nullable', 'string', 'max:255'],
            'model' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', 'in:available,reserved,checked_out,in_use,returned,inspection,maintenance,retired'],
            'condition' => ['nullable', 'in:excellent,good,fair,poor'],
            'location_id' => ['nullable', 'exists:asset_locations,id'],
            'custodian_ministry_id' => ['nullable', 'exists:ministries,id'],
            'purchase_date' => ['nullable', 'date'],
            'purchase_value' => ['nullable', 'numeric', 'min:0'],
            'currency' => ['nullable', 'string', 'max:3'],
            'notes' => ['nullable', 'string'],
        ]);

        $this->ensureOrgLocation($validated['location_id'] ?? null);
        $this->ensureOrgMinistry($validated['custodian_ministry_id'] ?? null);

        $asset = Asset::create([
            ...$validated,
            'organization_id' => $orgId,
            'status' => $validated['status'] ?? 'available',
            'condition' => $validated['condition'] ?? 'good',
            'currency' => $validated['currency'] ?? 'ETB',
        ]);

        $this->activityLogger->log(
            $request->user(),
            $orgId,
            'asset.created',
            $asset,
            "Created asset {$asset->code}",
        );

        return $this->json($asset->load(['location', 'custodianMinistry']), 201);
    }

    public function show(Asset $asset): JsonResponse
    {
        $this->ensureOrgAsset($asset);

        return $this->json($asset->load(['location', 'custodianMinistry', 'checkouts.requestedBy']));
    }

    public function update(Request $request, Asset $asset): JsonResponse
    {
        $this->ensureOrgAsset($asset);

        $orgId = $this->organizationId();

        $validated = $request->validate([
            'code' => [
                'sometimes',
                'string',
                'max:50',
                Rule::unique('assets', 'code')->where('organization_id', $orgId)->ignore($asset->id),
            ],
            'name' => ['sometimes', 'string', 'max:255'],
            'category' => ['sometimes', 'in:camera,microphone,speaker,projector,laptop,furniture,instrument,vehicle,other'],
            'brand' => ['nullable', 'string', 'max:255'],
            'model' => ['nullable', 'string', 'max:255'],
            'status' => ['sometimes', 'in:available,reserved,checked_out,in_use,returned,inspection,maintenance,retired'],
            'condition' => ['sometimes', 'in:excellent,good,fair,poor'],
            'location_id' => ['nullable', 'exists:asset_locations,id'],
            'custodian_ministry_id' => ['nullable', 'exists:ministries,id'],
            'purchase_date' => ['nullable', 'date'],
            'purchase_value' => ['nullable', 'numeric', 'min:0'],
            'currency' => ['nullable', 'string', 'max:3'],
            'notes' => ['nullable', 'string'],
        ]);

        $this->ensureOrgLocation($validated['location_id'] ?? null);
        $this->ensureOrgMinistry($validated['custodian_ministry_id'] ?? null);

        $asset->update($validated);

        $this->activityLogger->log(
            $request->user(),
            $orgId,
            'asset.updated',
            $asset,
            "Updated asset {$asset->code}",
        );

        return $this->json($asset->fresh()->load(['location', 'custodianMinistry']));
    }

    private function ensureOrgAsset(Asset $asset): void
    {
        abort_unless($asset->organization_id === $this->organizationId(), 404);
    }

    private function ensureOrgLocation(?int $locationId): void
    {
        if ($locationId === null) {
            return;
        }

        $location = AssetLocation::findOrFail($locationId);
        abort_unless($location->organization_id === $this->organizationId(), 404);
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
