<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $users = User::query()
            ->where('organization_id', $this->organizationId())
            ->with('roles')
            ->orderBy('name')
            ->paginate($request->integer('per_page', 15));

        $users->getCollection()->transform(function (User $user) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'roles' => $user->roles->pluck('name')->values()->all(),
            ];
        });

        return $this->json($users);
    }
}
