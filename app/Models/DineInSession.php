<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class DineInSession extends Model
{
    // Menentukan kolom yang dapat diisi melalui mass assignment.
    protected $fillable = [
        'restaurant_table_id',
        'session_code',
        'status',
        'payment_status',
        'payment_method',
        'paid_total',
        'opened_at',
        'paid_at',
        'closed_at',
    ];

    // Mengatur tipe data atribut sesi.
    protected $casts = [
        'paid_total' => 'decimal:2',
        'opened_at' => 'datetime',
        'paid_at' => 'datetime',
        'closed_at' => 'datetime',
    ];

    // Menghasilkan UUID otomatis saat sesi baru dibuat.
    protected static function booted(): void
    {
        static::creating(function (self $session): void {
            if (empty($session->session_code)) {
                $session->session_code = (string) Str::uuid();
            }
        });
    }

    // Menghubungkan sesi dengan meja restoran.
    public function restaurantTable(): BelongsTo
    {
        return $this->belongsTo(RestaurantTable::class);
    }

    // Mengambil seluruh pesanan yang termasuk dalam sesi ini.
    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }
}