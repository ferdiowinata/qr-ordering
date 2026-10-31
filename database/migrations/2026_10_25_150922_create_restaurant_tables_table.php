<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('restaurant_tables', function (Blueprint $table) {
            $table->id();

            $table->string('name', 100);
            $table->string('code', 30)->unique();

            // Token unik yang digunakan pada URL QR Code.
            $table->string('qr_token', 64)->unique();

            $table->boolean('is_active')->default(true);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('restaurant_tables');
    }
};