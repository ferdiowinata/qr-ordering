<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // Membuat tabel untuk menyimpan riwayat sesi dine-in.
    public function up(): void
    {
        Schema::create('dine_in_sessions', function (Blueprint $table) {
            $table->id();

            // Menghubungkan sesi dengan meja restoran.
            $table->foreignId('restaurant_table_id')
                ->constrained('restaurant_tables')
                ->restrictOnDelete();

            // Kode unik untuk mengidentifikasi setiap sesi.
            $table->uuid('session_code')->unique();

            // Status aktivitas sesi.
            $table->string('status', 20)
                ->default('active')
                ->index();

            // Status pembayaran sesi.
            $table->string('payment_status', 20)
                ->default('unpaid')
                ->index();

            // Metode pembayaran, misalnya cash atau qris.
            $table->string('payment_method', 20)->nullable();

            // Waktu sesi dimulai.
            $table->timestamp('opened_at')->useCurrent();

            // Waktu pembayaran berhasil dikonfirmasi.
            $table->timestamp('paid_at')->nullable();

            // Waktu sesi resmi ditutup.
            $table->timestamp('closed_at')->nullable();

            $table->timestamps();

            // Mempermudah pencarian sesi berdasarkan meja dan status.
            $table->index(['restaurant_table_id', 'status']);
        });
    }

    // Menghapus tabel sesi jika migration dibatalkan.
    public function down(): void
    {
        Schema::dropIfExists('dine_in_sessions');
    }
};