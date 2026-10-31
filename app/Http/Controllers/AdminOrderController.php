<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AdminOrderController extends Controller
{
    private const STATUSES = [
        'pending',
        'processing',
        'ready',
        'served',
        'cancelled',
    ];

    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', Rule::in(self::STATUSES)],
            'date_from' => ['nullable', 'date'],
            'date_to' => [
                'nullable',
                'date',
                'after_or_equal:date_from',
            ],
        ]);

        $search = trim((string) ($filters['search'] ?? ''));
        $status = $filters['status'] ?? '';
        $dateFrom = $filters['date_from'] ?? '';
        $dateTo = $filters['date_to'] ?? '';

        $orders = Order::query()
            ->with([
                'restaurantTable:id,name,code',
                'items:id,order_id,menu_name_snapshot,quantity,unit_price,line_total,notes',
            ])
            ->withCount('items')
            ->when($search !== '', function (Builder $query) use ($search) {
                $query->where(function (Builder $query) use ($search) {
                    $query
                        ->where('order_number', 'like', "%{$search}%")
                        ->orWhere(
                            'table_code_snapshot',
                            'like',
                            "%{$search}%"
                        )
                        ->orWhere(
                            'customer_name',
                            'like',
                            "%{$search}%"
                        );
                });
            })
            ->when(
                $status !== '',
                fn (Builder $query) => $query->where('status', $status)
            )
            ->when(
                $dateFrom !== '',
                fn (Builder $query) => $query->whereDate(
                    'created_at',
                    '>=',
                    $dateFrom
                )
            )
            ->when(
                $dateTo !== '',
                fn (Builder $query) => $query->whereDate(
                    'created_at',
                    '<=',
                    $dateTo
                )
            )
            ->latest()
            ->paginate(10)
            ->withQueryString();

        $orders->through(function (Order $order): array {
            return [
                'id' => $order->id,
                'order_number' => $order->order_number,
                'table_name' => $order->restaurantTable?->name
                    ?? $order->table_code_snapshot,
                'table_code' => $order->table_code_snapshot,
                'customer_name' => $order->customer_name,
                'status' => $order->status,
                'items_count' => $order->items_count,
                'subtotal' => $order->subtotal,
                'total' => $order->total,
                'notes' => $order->notes,
                'created_at' => $order->created_at?->format('d/m/Y H:i'),
                'items' => $order->items->map(fn ($item) => [
                    'id' => $item->id,
                    'name' => $item->menu_name_snapshot,
                    'quantity' => $item->quantity,
                    'unit_price' => $item->unit_price,
                    'line_total' => $item->line_total,
                    'notes' => $item->notes,
                ])->values(),
            ];
        });

        return Inertia::render('admin/orders/index', [
            'orders' => $orders,
            'filters' => [
                'search' => $search,
                'status' => $status,
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
            ],
        ]);
    }

    public function update(Request $request, Order $order): RedirectResponse
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in(self::STATUSES)],
        ]);

        $order->update([
            'status' => $validated['status'],
        ]);

        return back()->with(
            'success',
            'Status pesanan berhasil diperbarui.'
        );
    }
}
