<?php

use App\Http\Controllers\Api\V1\ActivityLogController;
use App\Http\Controllers\Api\V1\AssetCheckoutController;
use App\Http\Controllers\Api\V1\AssetController;
use App\Http\Controllers\Api\V1\AssetLocationController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\DashboardController;
use App\Http\Controllers\Api\V1\ExpenseController;
use App\Http\Controllers\Api\V1\FollowUpController;
use App\Http\Controllers\Api\V1\HouseholdController;
use App\Http\Controllers\Api\V1\MinistryController;
use App\Http\Controllers\Api\V1\NotificationController;
use App\Http\Controllers\Api\V1\OrganizationController;
use App\Http\Controllers\Api\V1\PersonController;
use App\Http\Controllers\Api\V1\ProgramBudgetController;
use App\Http\Controllers\Api\V1\ProgramController;
use App\Http\Controllers\Api\V1\ProgramDocumentController;
use App\Http\Controllers\Api\V1\ProgramTaskController;
use App\Http\Controllers\Api\V1\RoleController;
use App\Http\Controllers\Api\V1\ServingController;
use App\Http\Controllers\Api\V1\UserController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->prefix('v1')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);

    Route::get('/dashboard', [DashboardController::class, 'index']);

    Route::post('/people/check-duplicates', [PersonController::class, 'checkDuplicates']);
    Route::post('/people/{person}/archive', [PersonController::class, 'archive']);
    Route::apiResource('people', PersonController::class)->except(['destroy']);

    Route::post('/households/{household}/members', [HouseholdController::class, 'addMember']);
    Route::delete('/households/{household}/members/{person}', [HouseholdController::class, 'removeMember']);
    Route::apiResource('households', HouseholdController::class)->except(['destroy']);

    Route::apiResource('follow-ups', FollowUpController::class)->except(['destroy']);

    Route::post('/ministries/{ministry}/memberships', [MinistryController::class, 'addMembership']);
    Route::patch('/ministries/{ministry}/memberships/{ministryMembership}', [MinistryController::class, 'updateMembership']);
    Route::delete('/ministries/{ministry}/memberships/{ministryMembership}', [MinistryController::class, 'removeMembership']);
    Route::apiResource('ministries', MinistryController::class)->except(['destroy']);

    Route::get('/serving', [ServingController::class, 'index']);

    Route::post('/programs/{program}/assignments', [ProgramController::class, 'addAssignment']);
    Route::patch('/programs/{program}/assignments/{programAssignment}', [ProgramController::class, 'updateAssignment']);
    Route::delete('/programs/{program}/assignments/{programAssignment}', [ProgramController::class, 'removeAssignment']);
    Route::get('/programs/{program}/attendance', [ProgramController::class, 'listAttendance']);
    Route::post('/programs/{program}/attendance', [ProgramController::class, 'upsertAttendance']);
    Route::apiResource('programs/{program}/budgets', ProgramBudgetController::class)->except(['show']);
    Route::apiResource('programs/{program}/tasks', ProgramTaskController::class)->except(['show']);
    Route::apiResource('programs/{program}/documents', ProgramDocumentController::class)->except(['show']);
    Route::apiResource('programs', ProgramController::class)->except(['destroy']);

    Route::apiResource('asset-locations', AssetLocationController::class)->only(['index', 'store', 'update']);
    Route::apiResource('assets', AssetController::class)->except(['destroy']);
    Route::apiResource('checkouts', AssetCheckoutController::class)->only(['index', 'store']);
    Route::patch('/checkouts/{checkout}/approve', [AssetCheckoutController::class, 'approve']);
    Route::patch('/checkouts/{checkout}/checkout', [AssetCheckoutController::class, 'checkout']);
    Route::patch('/checkouts/{checkout}/return', [AssetCheckoutController::class, 'returnAsset']);
    Route::patch('/checkouts/{checkout}/cancel', [AssetCheckoutController::class, 'cancel']);

    Route::apiResource('expenses', ExpenseController::class)->except(['destroy']);
    Route::patch('/expenses/{expense}/submit', [ExpenseController::class, 'submit']);
    Route::patch('/expenses/{expense}/approve', [ExpenseController::class, 'approve']);
    Route::patch('/expenses/{expense}/reject', [ExpenseController::class, 'reject']);
    Route::patch('/expenses/{expense}/mark-paid', [ExpenseController::class, 'markPaid']);
    Route::patch('/expenses/{expense}/reconcile', [ExpenseController::class, 'reconcile']);

    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::patch('/notifications/mark-all-read', [NotificationController::class, 'markAllRead']);
    Route::patch('/notifications/{notification}/read', [NotificationController::class, 'markRead']);

    Route::get('/activity-logs', [ActivityLogController::class, 'index']);

    Route::get('/organization', [OrganizationController::class, 'show']);
    Route::patch('/organization', [OrganizationController::class, 'update']);

    Route::get('/users', [UserController::class, 'index']);
    Route::get('/roles', [RoleController::class, 'index']);
});
