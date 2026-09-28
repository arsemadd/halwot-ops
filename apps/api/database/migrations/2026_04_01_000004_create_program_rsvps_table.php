<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('program_rsvps', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignId('program_id')->constrained()->cascadeOnDelete();
            $table->foreignId('person_id')->constrained()->cascadeOnDelete();
            $table->string('status')->default('attending');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['program_id', 'person_id']);
            $table->index(['organization_id', 'person_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('program_rsvps');
    }
};
