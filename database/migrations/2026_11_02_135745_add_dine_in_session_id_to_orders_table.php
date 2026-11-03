<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // Menambahkan relasi sesi dine-in pada tabel pesanan.
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            // Menghubungkan pesanan dengan sesi dine-in.
            // Nullable digunakan agar pesanan lama tetap aman.
            // Sesi yang sudah memiliki pesanan tidak boleh dihapus.
            $table->foreignId('dine_in_session_id')
                ->nullable()
                ->constrained('dine_in_sessions')
                ->restrictOnDelete();
        });
    }

    // Menghapus relasi sesi jika migration dibatalkan.
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropForeign(['dine_in_session_id']);
            $table->dropColumn('dine_in_session_id');
        });
    }
};