<?php

namespace App\Http\Controllers;

use App\Models\MenuItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\RestaurantTable;
use Inertia\Inertia;
use Inertia\Response;

class AdminDashboardController extends Controller
{
    public function index(): Response
    {
        $today = now()->toDateString();

        // Statistik pesanan hari ini.
        $ordersToday = Order::query()
            ->whereDate('created_at', $today)
            ->count();

        // Pesanan yang belum diproses.
        $pendingOrders = Order::query()
            ->where('status', 'pending')
            ->count();

        // Menu tersedia dari kategori yang aktif.
        $availableMenus = MenuItem::query()
            ->where('is_available', true)
            ->whereHas('category', function ($query) {
                $query->where('is_active', true);
            })
            ->count();

        // Meja yang QR Code-nya masih aktif.
        $activeTables = RestaurantTable::query()
            ->where('is_active', true)
            ->count();

        $totalTables = RestaurantTable::count();

        // Delapan pesanan terbaru.
        $recentOrders = Order::query()
            ->with('restaurantTable:id,name,code')
            ->latest()
            ->limit(8)
            ->get()
            ->map(function (Order $order) {
                return [
                    'id' => $order->id,
                    'order_number' => $order->order_number,
                    'table_name' => $order->restaurantTable?->name
                        ?? $order->table_code_snapshot,
                    'status' => $order->status,
                    'total' => $order->total,
                    'created_at' => $order->created_at
                        ?->format('d M Y, H:i'),
                ];
            })
            ->values();

        // Lima menu dengan jumlah pemesanan terbanyak.
        $popularMenus = OrderItem::query()
            ->selectRaw(
                'menu_name_snapshot as name, SUM(quantity) as quantity_ordered'
            )
            ->groupBy('menu_name_snapshot')
            ->orderByDesc('quantity_ordered')
            ->limit(5)
            ->get()
            ->map(function ($item) {
                return [
                    'name' => $item->name,
                    'quantity_ordered' => (int) $item->quantity_ordered,
                ];
            })
            ->values();

        return Inertia::render('dashboard', [
            'stats' => [
                'ordersToday' => $ordersToday,
                'pendingOrders' => $pendingOrders,
                'availableMenus' => $availableMenus,
                'activeTables' => $activeTables,
                'totalTables' => $totalTables,
            ],

            'recentOrders' => $recentOrders,
            'popularMenus' => $popularMenus,
        ]);
    }
}