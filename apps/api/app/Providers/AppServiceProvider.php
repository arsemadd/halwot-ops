<?php

namespace App\Providers;

use App\Models\AssetCheckout;
use App\Models\ProgramBudget;
use App\Models\ProgramDocument;
use App\Models\ProgramTask;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Route::bind('checkout', fn (string $value) => AssetCheckout::findOrFail($value));
        Route::bind('budget', fn (string $value) => ProgramBudget::findOrFail($value));
        Route::bind('task', fn (string $value) => ProgramTask::findOrFail($value));
        Route::bind('document', fn (string $value) => ProgramDocument::findOrFail($value));
    }
}
