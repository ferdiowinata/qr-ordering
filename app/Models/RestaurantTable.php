<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Str;

class RestaurantTable extends Model
{
    // Menentukan kolom yang dapat diisi melalui mass assignment.
    protected $fillable = [
        'name',
        'code',
        'is_active',
    ];

    // Mengatur tipe data atribut meja.
    protected $casts = [
        'is_active' => 'boolean',
        'session_version' => 'integer',
    ];

    // Menghasilkan token QR unik ketika meja baru dibuat.
    protected static function booted(): void
    {
        static::creating(function (self $table): void {
            if (empty($table->qr_token)) {
                do {
                    $token = Str::random(48);
                } while (
                    self::where('qr_token', $token)->exists()
                );

                $table->qr_token = $token;
            }
        });
    }

    // Mengambil seluruh riwayat pesanan dari meja ini.
    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    // Mengambil seluruh riwayat sesi dine-in dari meja ini.
    public function sessions(): HasMany
    {
        return $this->hasMany(DineInSession::class);
    }

    // Mengambil sesi yang saat ini berstatus active.
    public function activeSession(): HasOne
    {
        return $this->hasOne(DineInSession::class)
            ->where('status', 'active');
    }
}