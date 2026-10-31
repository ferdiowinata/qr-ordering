<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CustomerMenuController;
use App\Http\Controllers\CustomerOrderController;
use App\Http\Controllers\TableQrCodeController;
use App\Http\Controllers\AdminDashboardController;
use App\Http\Controllers\AdminOrderController;
use App\Http\Controllers\AdminMenuCategoryController;
use App\Http\Controllers\AdminMenuController;

Route::inertia('/', 'welcome')->name('home');

Route::get('/m/{token}', [CustomerMenuController::class, 'show'])
    ->where('token', '[A-Za-z0-9]+')
    ->name('customer.menu');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', [
        AdminDashboardController::class,
        'index',
    ])->name('dashboard');
});

Route::post('/m/{token}/orders', [
    CustomerOrderController::class,
    'store',
])
    ->where('token', '[A-Za-z0-9]+')
    ->name('customer.order.store');

Route::get('/m/{token}/orders/{orderNumber}', [
    CustomerOrderController::class,
    'show',
])
    ->where('token', '[A-Za-z0-9]+')
    ->where('orderNumber', '[A-Za-z0-9\-]+')
    ->name('customer.order.show');

if (app()->environment('local')) {
    // Khusus pengembangan localhost: tidak perlu login.
    Route::get('/admin/table-qr', [
        TableQrCodeController::class,
        'index',
    ])->name('admin.table-qr.index');
} else {
    // Pada hosting: halaman pengelolaan wajib login.
    Route::middleware('auth')->group(function () {
        Route::get('/admin/table-qr', [
            TableQrCodeController::class,
            'index',
        ])->name('admin.table-qr.index');
    });
}

Route::get('/admin/orders', [AdminOrderController::class, 'index'])
    ->name('admin.orders.index');

Route::patch('/admin/orders/{order}/status', [
    AdminOrderController::class,
    'update',
])->name('admin.orders.status.update');

Route::get('/admin/categories', [
    AdminMenuCategoryController::class,
    'index',
])->name('admin.categories.index');

Route::post('/admin/categories', [
    AdminMenuCategoryController::class,
    'store',
])->name('admin.categories.store');

Route::put('/admin/categories/{menuCategory}', [
    AdminMenuCategoryController::class,
    'update',
])->name('admin.categories.update');

Route::delete('/admin/categories/{menuCategory}', [
    AdminMenuCategoryController::class,
    'destroy',
])->name('admin.categories.destroy');

Route::get('/admin/menus', [
    AdminMenuController::class,
    'index',
])->name('admin.menus.index');

Route::post('/admin/menus', [
    AdminMenuController::class,
    'store',
])->name('admin.menus.store');

Route::put('/admin/menus/{menuItem}', [
    AdminMenuController::class,
    'update',
])->name('admin.menus.update');

Route::delete('/admin/menus/{menuItem}', [
    AdminMenuController::class,
    'destroy',
])->name('admin.menus.destroy');
require __DIR__.'/settings.php';