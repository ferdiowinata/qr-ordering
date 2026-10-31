<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCustomerOrderRequest;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\RestaurantTable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class CustomerOrderController extends Controller
{
    /**
     * Menyimpan pesanan baru dari pelanggan.
     */
    public function store(
        StoreCustomerOrderRequest $request,
        string $token
    ): RedirectResponse {
        // Pastikan token QR valid dan meja masih aktif.
        $table = RestaurantTable::query()
            ->where('qr_token', $token)
            ->where('is_active', true)
            ->firstOrFail();

        $data = $request->validated();

        // Periksa apakah permintaan dengan kunci yang sama
        // sebelumnya sudah menghasilkan pesanan.
        $existingOrder = Order::query()
            ->where('restaurant_table_id', $table->id)
            ->where('submission_key', $data['submission_key'])
            ->first();

        if ($existingOrder) {
            return redirect()->route('customer.order.show', [
                'token' => $table->qr_token,
                'orderNumber' => $existingOrder->order_number,
            ]);
        }

        // Ambil menu yang tersedia beserta kategori aktifnya.
        // Harga dari browser tidak digunakan sebagai harga final.
        $itemIds = collect($data['items'])
            ->pluck('menu_item_id')
            ->map(fn ($id) => (int) $id)
            ->all();

        $menuItems = MenuItem::query()
            ->whereIn('id', $itemIds)
            ->where('is_available', true)
            ->whereHas('category', function ($query) {
                $query->where('is_active', true);
            })
            ->get()
            ->keyBy('id');

        // Tolak seluruh pesanan jika ada menu yang tidak tersedia.
        if ($menuItems->count() !== count($itemIds)) {
            throw ValidationException::withMessages([
                'items' => 'Ada menu yang sudah tidak tersedia. Silakan periksa keranjang kembali.',
            ]);
        }

        // Simpan pesanan dan seluruh detailnya dalam satu transaksi.
        $order = DB::transaction(function () use (
            $data,
            $table,
            $menuItems
        ) {
            // Buat nomor pesanan yang unik.
            do {
                $orderNumber = 'ORD-'
                    . now()->format('Ymd')
                    . '-'
                    . Str::upper(Str::random(8));
            } while (
                Order::query()
                    ->where('order_number', $orderNumber)
                    ->exists()
            );

            $subtotalCents = 0;
            $orderItems = [];

            foreach ($data['items'] as $requestedItem) {
                $menuItem = $menuItems->get(
                    (int) $requestedItem['menu_item_id']
                );

                $quantity = (int) $requestedItem['quantity'];

                // Gunakan harga dari database.
                $unitPriceCents = (int) round(
                    (float) $menuItem->price * 100
                );

                $lineTotalCents = $unitPriceCents * $quantity;
                $subtotalCents += $lineTotalCents;

                $orderItems[] = [
                    'menu_item_id' => $menuItem->id,
                    'menu_name_snapshot' => $menuItem->name,
                    'unit_price' => number_format(
                        $unitPriceCents / 100,
                        2,
                        '.',
                        ''
                    ),
                    'quantity' => $quantity,
                    'line_total' => number_format(
                        $lineTotalCents / 100,
                        2,
                        '.',
                        ''
                    ),
                    'notes' => $requestedItem['notes'] ?? null,
                ];
            }

            $subtotal = number_format(
                $subtotalCents / 100,
                2,
                '.',
                ''
            );

            $order = Order::create([
                'order_number' => $orderNumber,
                'submission_key' => $data['submission_key'],
                'restaurant_table_id' => $table->id,
                'table_code_snapshot' => $table->code,
                'customer_name' => $data['customer_name'] ?? null,
                'notes' => $data['notes'] ?? null,
                'status' => 'pending',
                'subtotal' => $subtotal,
                'total' => $subtotal,
            ]);

            foreach ($orderItems as $item) {
                $order->items()->create($item);
            }

            return $order;
        }, attempts: 3);

        return redirect()->route('customer.order.show', [
            'token' => $table->qr_token,
            'orderNumber' => $order->order_number,
        ]);
    }

    /**
     * Menampilkan konfirmasi pesanan.
     */
    public function show(
        string $token,
        string $orderNumber
    ): Response {
        $table = RestaurantTable::query()
            ->where('qr_token', $token)
            ->where('is_active', true)
            ->firstOrFail();

        // Pesanan hanya dapat ditemukan melalui meja asalnya.
        $order = Order::query()
            ->with('items')
            ->where('restaurant_table_id', $table->id)
            ->where('order_number', $orderNumber)
            ->firstOrFail();

    return Inertia::render('ordering/order-confirmation', [
    'token' => $table->qr_token,
    'table' => [
        'name' => $table->name,
        'code' => $table->code,
    ],

    'order' => [
        'order_number' => $order->order_number,
        'status' => $order->status,
        'created_at' => $order->created_at?->format('d-m-Y H:i'),
        'subtotal' => $order->subtotal,
        'total' => $order->total,

        'items' => $order->items->map(function ($item) {
            return [
                'name' => $item->menu_name_snapshot,
                'quantity' => $item->quantity,
                'unit_price' => $item->unit_price,
                'line_total' => $item->line_total,
                'notes' => $item->notes,
            ];
        })->values(),
        ],
    ]);
    }
}