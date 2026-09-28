<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('giving_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignId('person_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('recorded_by_user_id')->constrained('users')->cascadeOnDelete();
            $table->string('type');
            $table->decimal('amount', 12, 2);
            $table->string('currency')->default('ETB');
            $table->date('given_on');
            $table->string('method')->default('cash');
            $table->string('fund')->nullable();
            $table->boolean('is_anonymous')->default(false);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['organization_id', 'given_on']);
            $table->index(['organization_id', 'type']);
            $table->index(['organization_id', 'person_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('giving_records');
    }
};
