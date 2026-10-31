<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();

            $table->string('order_number', 32)->unique();

            $table->foreignId('restaurant_table_id')
                ->constrained('restaurant_tables')
                ->restrictOnDelete();

            // Salinan kode meja pada saat pesanan dibuat.
            $table->string('table_code_snapshot', 30);

            $table->string('customer_name', 100)->nullable();
            $table->text('notes')->nullable();

            $table->string('status', 30)
                ->default('pending')
                ->index();

            $table->decimal('subtotal', 12, 2)->default(0);
            $table->decimal('total', 12, 2)->default(0);

            $table->timestamps();

            $table->index(['restaurant_table_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};