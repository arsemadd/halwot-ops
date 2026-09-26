<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('program_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('program_id')->constrained()->cascadeOnDelete();
            $table->foreignId('person_id')->constrained('people')->cascadeOnDelete();
            $table->string('role');
            $table->string('confirmation_status')->default('pending');
            $table->timestamps();

            $table->unique(['program_id', 'person_id', 'role']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('program_assignments');
    }
};
