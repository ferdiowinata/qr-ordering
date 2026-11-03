<?php

namespace App\Http\Controllers;

use App\Models\DineInSession;
use App\Models\RestaurantTable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AdminDineInSessionController extends Controller
{
    /**
     * Menampilkan seluruh sesi dine-in yang masih aktif dan belum dibayar.
     */
    public function index(): Response
    {
        // Mengambil sesi aktif beserta meja, pesanan, dan detail item.
        $sessions = DineInSession::query()
            ->where('status', 'active')
            ->where('payment_status', 'unpaid')
            ->with([
                'restaurantTable:id,name,code',
                'orders' => function ($query) {
                    $query
                        ->with([
                            'items:id,order_id,menu_name_snapshot,quantity,unit_price,line_total,notes',
                        ])
                        ->orderBy('created_at');
                },
            ])
            // Menghitung jumlah pesanan yang tidak dibatalkan.
            ->withCount([
                'orders as orders_count' => function (Builder $query) {
                    $query->where('status', '!=', 'cancelled');
                },
            ])
            // Menghitung total tagihan tanpa pesanan yang dibatalkan.
            ->withSum([
                'orders as payable_total' => function (Builder $query) {
                    $query->where('status', '!=', 'cancelled');
                },
            ], 'total')
            ->orderBy('opened_at')
            ->paginate(10)
            ->withQueryString();

        // Menyiapkan data sesi untuk ditampilkan di halaman admin.
        $sessions->through(function (DineInSession $session): array {
            return [
                'id' => $session->id,
                'session_code' => $session->session_code,
                'status' => $session->status,
                'payment_status' => $session->payment_status,
                'opened_at' => $session->opened_at?->format('d/m/Y H:i'),
                'orders_count' => $session->orders_count,
                'payable_total' => $session->payable_total ?? '0.00',

                'table' => [
                    'name' => $session->restaurantTable?->name ?? 'Meja',
                    'code' => $session->restaurantTable?->code ?? '-',
                ],

                // Menampilkan seluruh pesanan, termasuk yang dibatalkan.
                'orders' => $session->orders->map(function ($order) {
                    return [
                        'id' => $order->id,
                        'order_number' => $order->order_number,
                        'customer_name' => $order->customer_name,
                        'status' => $order->status,
                        'total' => $order->total,
                        'created_at' => $order->created_at?->format('d/m/Y H:i'),

                        'items' => $order->items->map(function ($item) {
                            return [
                                'id' => $item->id,
                                'name' => $item->menu_name_snapshot,
                                'quantity' => $item->quantity,
                                'unit_price' => $item->unit_price,
                                'line_total' => $item->line_total,
                                'notes' => $item->notes,
                            ];
                        })->values(),
                    ];
                })->values(),
            ];
        });

        return Inertia::render('admin/dine-in-sessions/index', [
            'sessions' => $sessions,
        ]);
    }

    /**
     * Mengonfirmasi pembayaran dan menutup sesi dine-in secara atomik.
     */
    public function confirmPayment(
        Request $request,
        DineInSession $session
    ): RedirectResponse {
        // Memvalidasi metode pembayaran yang dipilih kasir.
        $validated = $request->validate([
            'payment_method' => [
                'required',
                Rule::in(['cash', 'qris']),
            ],
        ]);

        // Menjalankan pembayaran dan penutupan dalam satu transaksi database.
        DB::transaction(function () use ($session, $validated) {

            // Mengunci meja agar checkout baru tidak berjalan bersamaan
            // dengan proses penutupan sesi.
            $table = RestaurantTable::query()
                ->whereKey($session->restaurant_table_id)
                ->lockForUpdate()
                ->firstOrFail();

            // Mengunci sesi yang akan dibayar.
            $lockedSession = DineInSession::query()
                ->whereKey($session->id)
                ->lockForUpdate()
                ->firstOrFail();

            // Memastikan sesi masih berhubungan dengan meja yang benar.
            if (
                (int) $lockedSession->restaurant_table_id !==
                (int) $table->id
            ) {
                abort(404);
            }

            // Menolak pembayaran untuk sesi yang sudah ditutup atau lunas.
            if (
                $lockedSession->status !== 'active' ||
                $lockedSession->payment_status !== 'unpaid' ||
                $lockedSession->closed_at !== null
            ) {
                throw ValidationException::withMessages([
                    'payment' => 'Sesi ini sudah ditutup atau sudah dibayar.',
                ]);
            }

            // Mengunci pesanan agar status dan nominalnya tidak berubah
            // selama proses perhitungan pembayaran berlangsung.
            $orders = $lockedSession->orders()
                ->lockForUpdate()
                ->get(['id', 'status', 'total']);

            // Mengabaikan pesanan yang dibatalkan dalam perhitungan tagihan.
            $payableOrders = $orders->where('status', '!=', 'cancelled');

            // Menolak pembayaran apabila sesi tidak memiliki pesanan aktif.
            if ($payableOrders->isEmpty()) {
                throw ValidationException::withMessages([
                    'payment' => 'Tidak ada pesanan yang dapat dibayar dalam sesi ini.',
                ]);
            }

            // Menjumlahkan nominal pesanan dalam satuan sen
            // agar perhitungan desimal tidak bergantung pada float.
            $totalCents = $payableOrders->sum(function ($order) {
                return $this->decimalToCents((string) $order->total);
            });

            // Mengubah nilai sen menjadi format decimal untuk database.
            $paidTotal = sprintf(
                '%d.%02d',
                intdiv($totalCents, 100),
                $totalCents % 100
            );

            // Menggunakan satu waktu yang sama untuk pembayaran dan penutupan.
            $closedAt = now();

            // Menyimpan hasil pembayaran dan menutup sesi.
            $lockedSession->update([
                'payment_status' => 'paid',
                'payment_method' => $validated['payment_method'],
                'paid_total' => $paidTotal,
                'paid_at' => $closedAt,
                'status' => 'closed',
                'closed_at' => $closedAt,
            ]);

            // Menaikkan versi meja agar halaman pelanggan lama kedaluwarsa.
            $table->session_version =
                (int) $table->session_version + 1;

            $table->save();
        }, attempts: 3);

        // Kembali ke daftar sesi dengan notifikasi keberhasilan.
        return back()->with(
            'success',
            'Pembayaran berhasil dikonfirmasi dan sesi dine-in telah ditutup.'
        );
    }

    /**
     * Mengubah nominal decimal menjadi satuan sen untuk penjumlahan akurat.
     */
    private function decimalToCents(string $amount): int
    {
        // Memastikan nilai berasal dari format decimal database yang valid.
        if (!preg_match('/^\d+(?:\.\d{1,2})?$/', $amount)) {
            throw new \UnexpectedValueException(
                'Format nominal pesanan tidak valid.'
            );
        }

        // Memisahkan nilai utama dan dua angka desimal.
        [$whole, $fraction] = array_pad(
            explode('.', $amount, 2),
            2,
            '0'
        );

        $fraction = str_pad($fraction, 2, '0');

        // Menghasilkan nilai integer dalam satuan sen.
        return ((int) $whole * 100) + (int) $fraction;
    }
}