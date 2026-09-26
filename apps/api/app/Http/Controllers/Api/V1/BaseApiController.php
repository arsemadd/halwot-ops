<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;

abstract class BaseApiController extends Controller
{
    protected function organizationId(): int
    {
        /** @var User $user */
        $user = auth()->user();

        return (int) $user->organization_id;
    }

    protected function json(mixed $data, int $status = 200): JsonResponse
    {
        return response()->json(['data' => $data], $status);
    }
}
