<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\AProjectController;
use App\Http\Controllers\TodoController;
use Illuminate\Support\Facades\Route;

Route::group([
    'middleware' => 'api',
    'prefix' => 'auth',
], function ($router) {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::group(['middleware' => ['auth.api']], function () {
        Route::get('/project', [AProjectController::class, 'show']);
        Route::put('/project', [AProjectController::class, 'create']);
        Route::delete('/project/{project}', [AProjectController::class, 'destroy']);
        Route::post('/proxytodo', [TodoController::class, 'show']);
        Route::post('/todo', [TodoController::class, 'update']);
        Route::get('/habits', [TodoController::class, 'habits']);
    });
});
