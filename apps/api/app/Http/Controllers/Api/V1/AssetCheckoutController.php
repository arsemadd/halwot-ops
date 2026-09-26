<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\Asset;
use App\Models\AssetCheckout;
use App\Models\Program;
use App\Services\ActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class AssetCheckoutController extends BaseApiController
{
    public function __construct(private ActivityLogger $activityLogger) {}

    public function index(Request $request): JsonResponse
    {
        $query = AssetCheckout::query()
            ->where('organization_id', $this->organizationId())
            ->with(['asset', 'requestedBy', 'approvedBy', 'program']);

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        $checkouts = $query->orderByDesc('created_at')->paginate($request->integer('per_page', 15));

        return $this->json($checkouts);
    }

    public function store(Request $request): JsonResponse
    {
        $orgId = $this->organizationId();

        $validated = $request->validate([
            'asset_id' => ['required', 'exists:assets,id'],
            'program_id' => ['nullable', 'exists:programs,id'],
            'purpose' => ['nullable', 'string', 'max:255'],
            'expected_return_at' => ['nullable', 'date'],
        ]);

        $asset = Asset::findOrFail($validated['asset_id']);
        abort_unless($asset->organization_id === $orgId, 404);
        abort_unless($asset->status === 'available', 422, 'Asset is not available for checkout.');

        if (! empty($validated['program_id'])) {
            $program = Program::findOrFail($validated['program_id']);
            abort_unless($program->organization_id === $orgId, 404);
        }

        $checkout = AssetCheckout::create([
            'organization_id' => $orgId,
            'asset_id' => $asset->id,
            'requested_by_user_id' => $request->user()->id,
            'program_id' => $validated['program_id'] ?? null,
            'purpose' => $validated['purpose'] ?? null,
            'expected_return_at' => $validated['expected_return_at'] ?? null,
            'status' => 'requested',
        ]);

        $this->activityLogger->log(
            $request->user(),
            $orgId,
            'asset_checkout.requested',
            $checkout,
            "Requested checkout for asset {$asset->code}",
        );

        return $this->json($checkout->load(['asset', 'requestedBy', 'program']), 201);
    }

    public function approve(Request $request, AssetCheckout $checkout): JsonResponse
    {
        $this->ensureOrgCheckout($checkout);
        abort_unless($checkout->status === 'requested', 422, 'Only requested checkouts can be approved.');

        $checkout->update([
            'status' => 'approved',
            'approved_by_user_id' => $request->user()->id,
        ]);

        $checkout->asset->update(['status' => 'reserved']);

        $this->activityLogger->log(
            $request->user(),
            $this->organizationId(),
            'asset_checkout.approved',
            $checkout,
            "Approved checkout for asset {$checkout->asset->code}",
        );

        return $this->json($checkout->fresh()->load(['asset', 'requestedBy', 'approvedBy', 'program']));
    }

    public function checkout(Request $request, AssetCheckout $checkout): JsonResponse
    {
        $this->ensureOrgCheckout($checkout);
        abort_unless(in_array($checkout->status, ['approved', 'requested'], true), 422, 'Checkout cannot be performed in current status.');

        $checkout->update([
            'status' => 'checked_out',
            'checked_out_at' => Carbon::now(),
            'approved_by_user_id' => $checkout->approved_by_user_id ?? $request->user()->id,
        ]);

        $checkout->asset->update(['status' => 'checked_out']);

        $this->activityLogger->log(
            $request->user(),
            $this->organizationId(),
            'asset_checkout.checked_out',
            $checkout,
            "Checked out asset {$checkout->asset->code}",
        );

        return $this->json($checkout->fresh()->load(['asset', 'requestedBy', 'approvedBy', 'program']));
    }

    public function returnAsset(Request $request, AssetCheckout $checkout): JsonResponse
    {
        $this->ensureOrgCheckout($checkout);
        abort_unless($checkout->status === 'checked_out', 422, 'Only checked-out items can be returned.');

        $validated = $request->validate([
            'return_condition' => ['required', 'in:excellent,good,fair,poor'],
            'return_notes' => ['nullable', 'string'],
        ]);

        $checkout->update([
            'status' => 'returned',
            'returned_at' => Carbon::now(),
            'return_condition' => $validated['return_condition'],
            'return_notes' => $validated['return_notes'] ?? null,
        ]);

        $checkout->asset->update([
            'status' => 'available',
            'condition' => $validated['return_condition'],
        ]);

        $this->activityLogger->log(
            $request->user(),
            $this->organizationId(),
            'asset_checkout.returned',
            $checkout,
            "Returned asset {$checkout->asset->code}",
        );

        return $this->json($checkout->fresh()->load(['asset', 'requestedBy', 'approvedBy', 'program']));
    }

    public function cancel(Request $request, AssetCheckout $checkout): JsonResponse
    {
        $this->ensureOrgCheckout($checkout);
        abort_unless(in_array($checkout->status, ['requested', 'approved'], true), 422, 'Checkout cannot be cancelled in current status.');

        $previousAssetStatus = $checkout->status === 'approved' ? 'available' : null;

        $checkout->update(['status' => 'cancelled']);

        if ($previousAssetStatus !== null) {
            $checkout->asset->update(['status' => $previousAssetStatus]);
        }

        $this->activityLogger->log(
            $request->user(),
            $this->organizationId(),
            'asset_checkout.cancelled',
            $checkout,
            "Cancelled checkout for asset {$checkout->asset->code}",
        );

        return $this->json($checkout->fresh()->load(['asset', 'requestedBy', 'approvedBy', 'program']));
    }

    private function ensureOrgCheckout(AssetCheckout $checkout): void
    {
        abort_unless($checkout->organization_id === $this->organizationId(), 404);
    }
}
