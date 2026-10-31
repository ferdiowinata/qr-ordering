<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class RestaurantTable extends Model
{
    protected $fillable = [
        'name',
        'code',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

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

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }
}