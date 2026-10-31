<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    protected $fillable = [
        'order_number',
        'submission_key',
        'restaurant_table_id',
        'table_code_snapshot',
        'customer_name',
        'notes',
        'status',
        'subtotal',
        'total',
    ];

    protected $casts = [
        'subtotal' => 'decimal:2',
        'total' => 'decimal:2',
    ];

    public function restaurantTable(): BelongsTo
    {
        return $this->belongsTo(RestaurantTable::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }
}