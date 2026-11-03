<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CustomerMenuController;
use App\Http\Controllers\CustomerOrderController;
use App\Http\Controllers\TableQrCodeController;
use App\Http\Controllers\AdminDashboardController;
use App\Http\Controllers\AdminOrderController;
use App\Http\Controllers\AdminMenuCategoryController;
use App\Http\Controllers\AdminMenuController;
use App\Http\Controllers\AdminDineInSessionController;

# Halaman utama.
Route::inertia('/', 'welcome')->name('home');

# Halaman menu pelanggan melalui QR meja.
Route::get('/m/{token}', [CustomerMenuController::class, 'show'])
    ->where('token', '[A-Za-z0-9]+')
    ->name('customer.menu');

# Checkout pesanan pelanggan.
Route::post('/m/{token}/orders', [
    CustomerOrderController::class,
    'store',
])
    ->where('token', '[A-Za-z0-9]+')
    ->name('customer.order.store');

# Halaman konfirmasi pesanan pelanggan.
Route::get('/m/{token}/orders/{orderNumber}', [
    CustomerOrderController::class,
    'show',
])
    ->where('token', '[A-Za-z0-9]+')
    ->where('orderNumber', '[A-Za-z0-9\\-]+')
    ->name('customer.order.show');

# Melindungi seluruh fitur administrasi.
Route::middleware(['auth', 'verified'])->group(function () {

    # Dashboard admin.
    Route::get('/dashboard', [
        AdminDashboardController::class,
        'index',
    ])->name('dashboard');

    # Manajemen pesanan.
    Route::get('/admin/orders', [
        AdminOrderController::class,
        'index',
    ])->name('admin.orders.index');

    Route::patch('/admin/orders/{order}/status', [
        AdminOrderController::class,
        'update',
    ])->name('admin.orders.status.update');

    #Menampilkan daftar sesi dine-in yang masih aktif.
    Route::get('/admin/dine-in-sessions', [
        AdminDineInSessionController::class,
        'index',
    ])->name('admin.dine-in-sessions.index');

    // Mengonfirmasi pembayaran dan menutup sesi dine-in.
    Route::post('/admin/dine-in-sessions/{session}/confirm-payment', [
        AdminDineInSessionController::class,
        'confirmPayment',
    ])->name('admin.dine-in-sessions.confirm-payment');

    # Manajemen kategori menu.
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

    # Manajemen menu.
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
});

# Halaman QR Code meja.
# Pada local dapat diakses tanpa login untuk keperluan pengembangan.
if (app()->environment('local')) {
    Route::get('/admin/table-qr', [
        TableQrCodeController::class,
        'index',
    ])->name('admin.table-qr.index');
} else {
    # Pada hosting, halaman QR Code wajib menggunakan autentikasi.
    Route::middleware(['auth', 'verified'])->group(function () {
        Route::get('/admin/table-qr', [
            TableQrCodeController::class,
            'index',
        ])->name('admin.table-qr.index');
    });
}

# Memuat route pengaturan akun.
require __DIR__ . '/settings.php';