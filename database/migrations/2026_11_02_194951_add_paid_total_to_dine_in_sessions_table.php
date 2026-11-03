<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // Menambahkan snapshot total pembayaran pada sesi dine-in.
    public function up(): void
    {
        Schema::table('dine_in_sessions', function (Blueprint $table) {
            // Menyimpan total pembayaran ketika sesi dikonfirmasi lunas.
            // Nilai awal 0 karena sesi baru belum melakukan pembayaran.
            $table->decimal('paid_total', 12, 2)->default(0);
        });
    }

    // Menghapus kolom total pembayaran jika migration dibatalkan.
    public function down(): void
    {
        Schema::table('dine_in_sessions', function (Blueprint $table) {
            $table->dropColumn('paid_total');
        });
    }
};