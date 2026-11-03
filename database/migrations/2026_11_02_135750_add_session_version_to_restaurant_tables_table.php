<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // Menambahkan penanda versi sesi pada setiap meja.
    public function up(): void
    {
        Schema::table('restaurant_tables', function (Blueprint $table) {
            // Versi awal setiap meja dimulai dari angka 1.
            $table->unsignedInteger('session_version')
                ->default(1);
        });
    }

    // Menghapus kolom versi sesi jika migration dibatalkan.
    public function down(): void
    {
        Schema::table('restaurant_tables', function (Blueprint $table) {
            $table->dropColumn('session_version');
        });
    }
};