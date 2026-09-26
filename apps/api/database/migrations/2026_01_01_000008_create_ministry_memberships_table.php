<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ministry_memberships', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ministry_id')->constrained()->cascadeOnDelete();
            $table->foreignId('person_id')->constrained('people')->cascadeOnDelete();
            $table->string('role')->nullable();
            $table->string('availability')->nullable();
            $table->string('status')->default('active');
            $table->timestamps();

            $table->unique(['ministry_id', 'person_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ministry_memberships');
    }
};
