<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCustomerOrderRequest;
use App\Models\DineInSession;
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
     * Menyimpan pesanan pelanggan ke dalam sesi dine-in yang aktif.
     */
    public function store(
        StoreCustomerOrderRequest $request,
        string $token
    ): RedirectResponse {
        // Memastikan token QR mengarah ke meja yang aktif.
        $table = RestaurantTable::query()
            ->where('qr_token', $token)
            ->where('is_active', true)
            ->firstOrFail();

        // Mengambil seluruh data yang sudah lolos validasi.
        $data = $request->validated();

        // Memproses checkout dalam satu transaksi database.
        $order = DB::transaction(function () use ($table, $data) {

            // Mengunci baris meja agar checkout bersamaan diproses berurutan.
            $lockedTable = RestaurantTable::query()
                ->whereKey($table->id)
                ->lockForUpdate()
                ->firstOrFail();

            // Memastikan meja belum dinonaktifkan ketika checkout berlangsung.
            if (!$lockedTable->is_active) {
                abort(404);
            }

            // Memeriksa apakah permintaan ini sudah pernah menghasilkan pesanan.
            // Pemeriksaan dilakukan sebelum validasi versi agar retry tetap aman.
            $existingOrder = Order::query()
                ->where('submission_key', $data['submission_key'])
                ->first();

            if ($existingOrder) {
                // Mencegah submission key digunakan untuk meja yang berbeda.
                if (
                    (int) $existingOrder->restaurant_table_id !==
                    (int) $lockedTable->id
                ) {
                    throw ValidationException::withMessages([
                        'submission_key' => 'Kunci pesanan tidak valid untuk meja ini.',
                    ]);
                }

                // Mengembalikan pesanan sebelumnya tanpa membuat duplikat.
                return $existingOrder;
            }

            // Memastikan halaman pelanggan masih menggunakan versi sesi terbaru.
            if (
                (int) $data['session_version'] !==
                (int) $lockedTable->session_version
            ) {
                throw ValidationException::withMessages([
                    'session_version' => 'Sesi meja sudah berakhir. Silakan muat ulang halaman untuk melanjutkan pesanan.',
                ]);
            }

            // Mengumpulkan ID menu yang diminta pelanggan.
            $itemIds = collect($data['items'])
                ->pluck('menu_item_id')
                ->map(fn ($id) => (int) $id)
                ->all();

            // Mengambil menu yang masih tersedia dari database.
            // Harga dari browser tidak digunakan sebagai harga final.
            $menuItems = MenuItem::query()
                ->whereIn('id', $itemIds)
                ->where('is_available', true)
                ->whereHas('category', function ($query) {
                    $query->where('is_active', true);
                })
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            // Menolak pesanan apabila ada menu yang tidak tersedia.
            if ($menuItems->count() !== count($itemIds)) {
                throw ValidationException::withMessages([
                    'items' => 'Ada menu yang sudah tidak tersedia. Silakan periksa keranjang kembali.',
                ]);
            }

            // Mengambil sesi aktif milik meja yang sedang dikunci.
            $session = DineInSession::query()
                ->where('restaurant_table_id', $lockedTable->id)
                ->where('status', 'active')
                ->lockForUpdate()
                ->first();

            // Memastikan sesi aktif belum dibayar atau ditutup.
            if (
                $session &&
                (
                    $session->payment_status !== 'unpaid' ||
                    $session->closed_at !== null
                )
            ) {
                throw ValidationException::withMessages([
                    'session_version' => 'Sesi meja tidak dapat menerima pesanan. Silakan muat ulang halaman.',
                ]);
            }

            // Membuat sesi baru jika meja belum mempunyai sesi aktif.
            if (!$session) {
                $session = DineInSession::create([
                    'restaurant_table_id' => $lockedTable->id,
                    'status' => 'active',
                    'payment_status' => 'unpaid',
                    'opened_at' => now(),
                ]);
            }

            // Menyiapkan nomor pesanan yang unik.
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

            // Menghitung subtotal dan membuat snapshot setiap item.
            foreach ($data['items'] as $requestedItem) {
                $menuItem = $menuItems->get(
                    (int) $requestedItem['menu_item_id']
                );

                $quantity = (int) $requestedItem['quantity'];

                // Menggunakan harga menu dari database.
                $unitPriceCents = (int) round(
                    (float) $menuItem->price * 100
                );

                $lineTotalCents = $unitPriceCents * $quantity;
                $subtotalCents += $lineTotalCents;

                // Menyimpan informasi menu pada saat pesanan dibuat.
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

            // Mengubah subtotal menjadi format desimal untuk database.
            $subtotal = number_format(
                $subtotalCents / 100,
                2,
                '.',
                ''
            );

            // Membuat pesanan dan menghubungkannya dengan sesi aktif.
            $order = Order::create([
                'order_number' => $orderNumber,
                'submission_key' => $data['submission_key'],
                'restaurant_table_id' => $lockedTable->id,
                'dine_in_session_id' => $session->id,
                'table_code_snapshot' => $lockedTable->code,
                'customer_name' => $data['customer_name'] ?? null,
                'notes' => $data['notes'] ?? null,
                'status' => 'pending',
                'subtotal' => $subtotal,
                'total' => $subtotal,
            ]);

            // Menyimpan seluruh detail item ke dalam pesanan.
            foreach ($orderItems as $item) {
                $order->items()->create($item);
            }

            // Mengembalikan pesanan setelah seluruh data berhasil disimpan.
            return $order;

        }, attempts: 3);

        // Mengarahkan pelanggan ke halaman konfirmasi pesanan.
        return redirect()->route('customer.order.show', [
            'token' => $table->qr_token,
            'orderNumber' => $order->order_number,
        ]);
    }

    /**
     * Menampilkan halaman konfirmasi pesanan pelanggan.
     */
    public function show(
        string $token,
        string $orderNumber
    ): Response {
        // Memastikan token QR mengarah ke meja yang aktif.
        $table = RestaurantTable::query()
            ->where('qr_token', $token)
            ->where('is_active', true)
            ->firstOrFail();

        // Mengambil pesanan berdasarkan meja dan nomor pesanan.
        $order = Order::query()
            ->with('items')
            ->where('restaurant_table_id', $table->id)
            ->where('order_number', $orderNumber)
            ->firstOrFail();

        // Mengirim data pesanan ke halaman konfirmasi.
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

                // Menampilkan snapshot detail item yang dipesan.
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