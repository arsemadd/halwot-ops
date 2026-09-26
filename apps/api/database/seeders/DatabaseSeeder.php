<?php

namespace Database\Seeders;

use App\Models\AppNotification;
use App\Models\Asset;
use App\Models\AssetCheckout;
use App\Models\AssetLocation;
use App\Models\AttendanceRecord;
use App\Models\Expense;
use App\Models\FollowUp;
use App\Models\Household;
use App\Models\Ministry;
use App\Models\MinistryMembership;
use App\Models\Organization;
use App\Models\Person;
use App\Models\Program;
use App\Models\ProgramAssignment;
use App\Models\ProgramBudget;
use App\Models\ProgramDocument;
use App\Models\ProgramTask;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            'people.view',
            'people.create',
            'people.edit',
            'people.archive',
            'people.view_sensitive',
            'follow_up.view',
            'follow_up.create',
            'follow_up.edit',
            'follow_up.view_notes',
            'ministries.view',
            'ministries.create',
            'ministries.edit',
            'programs.view',
            'programs.create',
            'programs.edit',
            'attendance.view',
            'attendance.edit',
            'users.view',
            'users.manage',
            'roles.view',
            'settings.manage',
            'activity.view',
            'assets.view',
            'assets.create',
            'assets.edit',
            'assets.checkout',
            'expenses.view',
            'expenses.create',
            'expenses.approve',
            'expenses.pay',
            'programs.manage_ops',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        $superAdmin = Role::firstOrCreate(['name' => 'Super Admin', 'guard_name' => 'web']);
        $superAdmin->syncPermissions(Permission::all());

        $churchAdmin = Role::firstOrCreate(['name' => 'Church Admin', 'guard_name' => 'web']);
        $churchAdmin->syncPermissions(
            Permission::where('name', '!=', 'roles.view')->pluck('name'),
        );

        $ministryLeader = Role::firstOrCreate(['name' => 'Ministry Leader', 'guard_name' => 'web']);
        $ministryLeader->syncPermissions([
            'people.view',
            'ministries.view',
            'ministries.edit',
            'programs.view',
            'programs.edit',
            'attendance.view',
            'attendance.edit',
        ]);

        $member = Role::firstOrCreate(['name' => 'Member', 'guard_name' => 'web']);
        $member->syncPermissions([
            'people.view',
            'ministries.view',
            'programs.view',
        ]);

        $assetManager = Role::firstOrCreate(['name' => 'Media/Asset Manager', 'guard_name' => 'web']);
        $assetManager->syncPermissions([
            'assets.view',
            'assets.create',
            'assets.edit',
            'assets.checkout',
            'programs.view',
            'programs.manage_ops',
        ]);

        $finance = Role::firstOrCreate(['name' => 'Finance', 'guard_name' => 'web']);
        $finance->syncPermissions([
            'expenses.view',
            'expenses.create',
            'expenses.approve',
            'expenses.pay',
            'programs.view',
        ]);

        $organization = Organization::create([
            'name' => 'Halwot Emmanuel Church',
            'slug' => 'halwot-emmanuel-church',
            'email' => 'info@halwot.local',
            'phone' => '+251-911-000-000',
            'address' => 'Addis Ababa, Ethiopia',
            'settings' => [
                'timezone' => 'Africa/Addis_Ababa',
                'locale' => 'en',
            ],
        ]);

        $admin = User::create([
            'organization_id' => $organization->id,
            'name' => 'Halwot Admin',
            'email' => 'admin@halwot.local',
            'password' => Hash::make('password'),
        ]);
        $admin->assignRole('Super Admin');

        $ministries = [
            ['name' => 'Media', 'slug' => 'media'],
            ['name' => 'Worship', 'slug' => 'worship'],
            ['name' => 'Youth', 'slug' => 'youth'],
            ['name' => 'Children', 'slug' => 'children'],
            ['name' => 'Welcome', 'slug' => 'welcome'],
            ['name' => 'Ushering', 'slug' => 'ushering'],
            ['name' => 'Prayer', 'slug' => 'prayer'],
            ['name' => 'Administration', 'slug' => 'administration'],
        ];

        $ministryModels = collect($ministries)->map(fn (array $ministry) => Ministry::create([
            ...$ministry,
            'organization_id' => $organization->id,
            'description' => "{$ministry['name']} ministry at Halwot Emmanuel Church",
            'is_active' => true,
        ]));

        $household = Household::create([
            'organization_id' => $organization->id,
            'name' => 'Bekele Family',
            'address' => 'Bole, Addis Ababa',
            'phone' => '+251-911-111-111',
            'emergency_contact' => 'Sara Bekele',
        ]);

        $people = [
            Person::create([
                'organization_id' => $organization->id,
                'household_id' => $household->id,
                'full_name' => 'Daniel Bekele',
                'preferred_name' => 'Daniel',
                'gender' => 'male',
                'phone' => '+251-911-111-111',
                'email' => 'daniel@example.com',
                'membership_status' => 'member',
                'membership_date' => now()->subYears(2)->toDateString(),
                'first_contact_date' => now()->subYears(3)->toDateString(),
            ]),
            Person::create([
                'organization_id' => $organization->id,
                'household_id' => $household->id,
                'full_name' => 'Sara Bekele',
                'preferred_name' => 'Sara',
                'gender' => 'female',
                'phone' => '+251-911-222-222',
                'email' => 'sara@example.com',
                'membership_status' => 'member',
                'membership_date' => now()->subYears(2)->toDateString(),
            ]),
            Person::create([
                'organization_id' => $organization->id,
                'full_name' => 'Meron Tadesse',
                'preferred_name' => 'Meron',
                'gender' => 'female',
                'phone' => '+251-911-333-333',
                'email' => 'meron@example.com',
                'membership_status' => 'new',
                'first_contact_date' => now()->subDays(10)->toDateString(),
            ]),
        ];

        $household->members()->attach([
            $people[0]->id => ['role' => 'head'],
            $people[1]->id => ['role' => 'spouse'],
        ]);

        FollowUp::create([
            'organization_id' => $organization->id,
            'person_id' => $people[2]->id,
            'owner_user_id' => $admin->id,
            'status' => 'open',
            'last_contact_at' => now()->subDays(3),
            'next_action_at' => now()->subDay(),
            'notes' => 'Schedule a welcome visit and connect with a small group.',
        ]);

        MinistryMembership::create([
            'ministry_id' => $ministryModels->firstWhere('slug', 'worship')->id,
            'person_id' => $people[0]->id,
            'role' => 'Worship Leader',
            'availability' => 'Sundays',
            'status' => 'active',
        ]);

        MinistryMembership::create([
            'ministry_id' => $ministryModels->firstWhere('slug', 'welcome')->id,
            'person_id' => $people[1]->id,
            'role' => 'Greeter',
            'availability' => 'Sundays',
            'status' => 'active',
        ]);

        $program = Program::create([
            'organization_id' => $organization->id,
            'ministry_id' => $ministryModels->firstWhere('slug', 'worship')->id,
            'title' => 'Sunday Worship Service',
            'description' => 'Weekly worship gathering',
            'starts_at' => now()->next('Sunday')->setTime(10, 0),
            'location' => 'Main Sanctuary',
            'leader_person_id' => $people[0]->id,
            'status' => 'scheduled',
        ]);

        ProgramAssignment::create([
            'program_id' => $program->id,
            'person_id' => $people[0]->id,
            'role' => 'Lead Vocal',
            'confirmation_status' => 'confirmed',
        ]);

        ProgramAssignment::create([
            'program_id' => $program->id,
            'person_id' => $people[1]->id,
            'role' => 'Greeter',
            'confirmation_status' => 'confirmed',
        ]);

        AttendanceRecord::create([
            'program_id' => $program->id,
            'person_id' => $people[0]->id,
            'status' => 'present',
        ]);

        AttendanceRecord::create([
            'program_id' => $program->id,
            'person_id' => $people[1]->id,
            'status' => 'present',
        ]);

        AttendanceRecord::create([
            'program_id' => $program->id,
            'person_id' => $people[2]->id,
            'status' => 'visitor',
            'notes' => 'First-time visitor',
        ]);

        $mediaMinistry = $ministryModels->firstWhere('slug', 'media');

        $locations = [
            AssetLocation::create([
                'organization_id' => $organization->id,
                'name' => 'Media Room',
                'description' => 'Primary media equipment storage',
            ]),
            AssetLocation::create([
                'organization_id' => $organization->id,
                'name' => 'Sanctuary',
                'description' => 'Main worship sanctuary',
            ]),
            AssetLocation::create([
                'organization_id' => $organization->id,
                'name' => 'Office',
                'description' => 'Church administration office',
            ]),
        ];

        $camera = Asset::create([
            'organization_id' => $organization->id,
            'code' => 'CAM-001',
            'name' => 'Sony Camera',
            'category' => 'camera',
            'brand' => 'Sony',
            'model' => 'FX3',
            'status' => 'available',
            'condition' => 'excellent',
            'location_id' => $locations[0]->id,
            'custodian_ministry_id' => $mediaMinistry->id,
            'purchase_date' => now()->subYears(2)->toDateString(),
            'purchase_value' => 85000.00,
            'currency' => 'ETB',
        ]);

        $mic = Asset::create([
            'organization_id' => $organization->id,
            'code' => 'MIC-001',
            'name' => 'Wireless Mic',
            'category' => 'microphone',
            'brand' => 'Shure',
            'model' => 'BLX288',
            'status' => 'available',
            'condition' => 'good',
            'location_id' => $locations[0]->id,
            'custodian_ministry_id' => $mediaMinistry->id,
        ]);

        Asset::create([
            'organization_id' => $organization->id,
            'code' => 'TRP-001',
            'name' => 'Tripod',
            'category' => 'other',
            'brand' => 'Manfrotto',
            'status' => 'available',
            'condition' => 'good',
            'location_id' => $locations[0]->id,
            'custodian_ministry_id' => $mediaMinistry->id,
        ]);

        AssetCheckout::create([
            'organization_id' => $organization->id,
            'asset_id' => $mic->id,
            'requested_by_user_id' => $admin->id,
            'program_id' => $program->id,
            'status' => 'requested',
            'purpose' => 'Sunday worship service recording',
            'expected_return_at' => $program->starts_at?->copy()->addHours(4),
        ]);

        Expense::create([
            'organization_id' => $organization->id,
            'category' => 'media',
            'program_id' => $program->id,
            'ministry_id' => $mediaMinistry->id,
            'amount' => 2500.00,
            'currency' => 'ETB',
            'description' => 'Replacement XLR cables for sound booth',
            'status' => 'draft',
            'requested_by_user_id' => $admin->id,
        ]);

        Expense::create([
            'organization_id' => $organization->id,
            'category' => 'worship',
            'program_id' => $program->id,
            'ministry_id' => $ministryModels->firstWhere('slug', 'worship')->id,
            'amount' => 5000.00,
            'currency' => 'ETB',
            'description' => 'Worship team refreshments for Sunday service',
            'status' => 'submitted',
            'requested_by_user_id' => $admin->id,
            'submitted_at' => now()->subDay(),
        ]);

        ProgramBudget::create([
            'program_id' => $program->id,
            'category' => 'refreshments',
            'amount' => 5000.00,
            'notes' => 'Team refreshments and hospitality',
        ]);

        ProgramTask::create([
            'program_id' => $program->id,
            'title' => 'Prepare song list',
            'description' => 'Finalize worship set list and distribute to team',
            'assignee_person_id' => $people[0]->id,
            'status' => 'in_progress',
            'due_at' => $program->starts_at?->copy()->subDays(2),
        ]);

        ProgramTask::create([
            'program_id' => $program->id,
            'title' => 'Test audio equipment',
            'description' => 'Sound check all mics and monitors before service',
            'assignee_person_id' => $people[1]->id,
            'status' => 'todo',
            'due_at' => $program->starts_at?->copy()->subHours(2),
        ]);

        ProgramDocument::create([
            'program_id' => $program->id,
            'title' => 'Service Order of Worship',
            'description' => 'Run sheet for Sunday worship service',
            'file_path' => 'documents/sunday-worship-order.pdf',
            'uploaded_by_user_id' => $admin->id,
        ]);

        AppNotification::create([
            'organization_id' => $organization->id,
            'user_id' => $admin->id,
            'title' => 'Follow-up overdue',
            'body' => 'Hanna Guest has an overdue follow-up action.',
            'link' => '/people/follow-ups',
        ]);

        AppNotification::create([
            'organization_id' => $organization->id,
            'user_id' => null,
            'title' => 'Asset checkout requested',
            'body' => 'MIC-001 Wireless Mic was requested for Sunday Worship Service.',
            'link' => '/operations/checkouts',
        ]);

        AppNotification::create([
            'organization_id' => $organization->id,
            'user_id' => $admin->id,
            'title' => 'Expense awaiting approval',
            'body' => 'Worship refreshments expense (ETB 5,000) was submitted.',
            'link' => '/operations/expenses',
            'read_at' => null,
        ]);
    }
}
