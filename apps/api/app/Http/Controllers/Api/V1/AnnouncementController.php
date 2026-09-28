<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\Announcement;
use App\Models\AppNotification;
use App\Services\ActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AnnouncementController extends BaseApiController
{
    public function __construct(private ActivityLogger $activityLogger) {}

    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()->can('announcements.view'), 403);

        $orgId = $this->organizationId();
        $user = $request->user();
        $manage = $user->can('announcements.create') || $user->can('announcements.edit');

        $query = Announcement::query()
            ->where('organization_id', $orgId)
            ->with('createdBy:id,name,email')
            ->orderByDesc('published_at')
            ->orderByDesc('created_at');

        if (! $manage) {
            $query->where('status', 'published')
                ->where(function ($q) {
                    $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
                })
                ->where('published_at', '<=', now());

            $audiences = ['all'];
            if ($user->hasAnyRole(['Super Admin', 'Church Admin', 'Ministry Leader', 'Finance', 'Media/Asset Manager'])) {
                $audiences[] = 'staff';
            }
            if ($user->hasRole('Member') || $user->person_id) {
                $audiences[] = 'members';
            }
            $query->whereIn('audience', $audiences);
        } elseif ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        return $this->json($query->paginate($request->integer('per_page', 20)));
    }

    public function store(Request $request): JsonResponse
    {
        abort_unless($request->user()->can('announcements.create'), 403);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:200'],
            'body' => ['required', 'string'],
            'audience' => ['required', 'in:all,staff,members'],
            'status' => ['nullable', 'in:draft,published'],
            'expires_at' => ['nullable', 'date'],
            'publish_now' => ['nullable', 'boolean'],
        ]);

        $status = $validated['status'] ?? 'draft';
        if ($request->boolean('publish_now')) {
            $status = 'published';
        }

        $announcement = Announcement::create([
            'organization_id' => $this->organizationId(),
            'created_by_user_id' => $request->user()->id,
            'title' => $validated['title'],
            'body' => $validated['body'],
            'audience' => $validated['audience'],
            'status' => $status,
            'published_at' => $status === 'published' ? now() : null,
            'expires_at' => $validated['expires_at'] ?? null,
        ]);

        if ($status === 'published') {
            $this->fanOutNotification($announcement);
        }

        $this->activityLogger->log(
            $request->user(),
            $this->organizationId(),
            'announcement.created',
            $announcement,
            "Created announcement: {$announcement->title}",
        );

        return $this->json($announcement->load('createdBy:id,name,email'), 201);
    }

    public function show(Request $request, Announcement $announcement): JsonResponse
    {
        $this->ensureOrg($announcement);
        abort_unless($request->user()->can('announcements.view'), 403);

        return $this->json($announcement->load('createdBy:id,name,email'));
    }

    public function update(Request $request, Announcement $announcement): JsonResponse
    {
        abort_unless($request->user()->can('announcements.edit'), 403);
        $this->ensureOrg($announcement);

        $validated = $request->validate([
            'title' => ['sometimes', 'string', 'max:200'],
            'body' => ['sometimes', 'string'],
            'audience' => ['sometimes', 'in:all,staff,members'],
            'status' => ['sometimes', 'in:draft,published,archived'],
            'expires_at' => ['nullable', 'date'],
        ]);

        $wasPublished = $announcement->status === 'published';
        $willPublish = ($validated['status'] ?? $announcement->status) === 'published';

        if ($willPublish && ! $announcement->published_at) {
            $validated['published_at'] = now();
        }

        $announcement->update($validated);

        if ($willPublish && ! $wasPublished) {
            $this->fanOutNotification($announcement->fresh());
        }

        $this->activityLogger->log(
            $request->user(),
            $this->organizationId(),
            'announcement.updated',
            $announcement,
            "Updated announcement: {$announcement->title}",
        );

        return $this->json($announcement->fresh()->load('createdBy:id,name,email'));
    }

    public function publish(Request $request, Announcement $announcement): JsonResponse
    {
        abort_unless($request->user()->can('announcements.edit'), 403);
        $this->ensureOrg($announcement);
        abort_unless($announcement->status !== 'published', 422, 'Already published.');

        $announcement->update([
            'status' => 'published',
            'published_at' => now(),
        ]);

        $this->fanOutNotification($announcement);

        $this->activityLogger->log(
            $request->user(),
            $this->organizationId(),
            'announcement.published',
            $announcement,
            "Published announcement: {$announcement->title}",
        );

        return $this->json($announcement->fresh()->load('createdBy:id,name,email'));
    }

    private function ensureOrg(Announcement $announcement): void
    {
        abort_unless($announcement->organization_id === $this->organizationId(), 404);
    }

    private function fanOutNotification(Announcement $announcement): void
    {
        AppNotification::create([
            'organization_id' => $announcement->organization_id,
            'user_id' => null,
            'title' => $announcement->title,
            'body' => \Illuminate\Support\Str::limit(strip_tags($announcement->body), 160),
            'link' => '/communications/announcements',
        ]);
    }
}
