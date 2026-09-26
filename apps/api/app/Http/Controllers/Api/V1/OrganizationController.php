<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\Organization;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrganizationController extends BaseApiController
{
    public function show(): JsonResponse
    {
        $organization = Organization::findOrFail($this->organizationId());

        return $this->json($organization);
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string'],
            'settings' => ['nullable', 'array'],
        ]);

        $organization = Organization::findOrFail($this->organizationId());
        $organization->update($validated);

        return $this->json($organization->fresh());
    }
}
