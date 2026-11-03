<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    // Menentukan kolom pesanan yang dapat diisi secara mass assignment.
    protected $fillable = [
        'order_number',
        'submission_key',
        'restaurant_table_id',
        'dine_in_session_id',
        'table_code_snapshot',
        'customer_name',
        'notes',
        'status',
        'subtotal',
        'total',
    ];

    // Mengatur format nilai nominal pesanan.
    protected $casts = [
        'subtotal' => 'decimal:2',
        'total' => 'decimal:2',
    ];

    // Menghubungkan pesanan dengan meja asalnya.
    public function restaurantTable(): BelongsTo
    {
        return $this->belongsTo(RestaurantTable::class);
    }

    // Menghubungkan pesanan dengan sesi dine-in.
    public function dineInSession(): BelongsTo
    {
        return $this->belongsTo(DineInSession::class);
    }

    // Mengambil seluruh detail item dalam pesanan.
    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }
}