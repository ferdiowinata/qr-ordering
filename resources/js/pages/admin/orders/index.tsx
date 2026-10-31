import { Head, router } from "@inertiajs/react";
import { useState, type FormEvent } from "react";
import {
    CalendarDays,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ClipboardList,
    Search,
} from "lucide-react";

type OrderStatus = "pending" | "processing" | "ready" | "served" | "cancelled";

type OrderItem = {
    id: number;
    name: string;
    quantity: number;
    unit_price: string | number;
    line_total: string | number;
    notes: string | null;
};

type OrderRow = {
    id: number;
    order_number: string;
    table_name: string;
    table_code: string;
    customer_name: string | null;
    status: OrderStatus;
    items_count: number;
    subtotal: string | number;
    total: string | number;
    notes: string | null;
    created_at: string | null;
    items: OrderItem[];
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type PaginatedOrders = {
    data: OrderRow[];
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
    total: number;
    links: PaginationLink[];
};

type Props = {
    orders: PaginatedOrders;
    filters: {
        search: string;
        status: string;
        date_from: string;
        date_to: string;
    };
};

const statusOptions: {
    value: OrderStatus;
    label: string;
}[] = [
    { value: "pending", label: "Menunggu" },
    { value: "processing", label: "Diproses" },
    { value: "ready", label: "Siap disajikan" },
    { value: "served", label: "Selesai" },
    { value: "cancelled", label: "Dibatalkan" },
];

const statusStyles: Record<OrderStatus, string> = {
    pending:
        "bg-amber-50 text-amber-800 ring-1 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-900",
    processing:
        "bg-blue-50 text-blue-800 ring-1 ring-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:ring-blue-900",
    ready: "bg-violet-50 text-violet-800 ring-1 ring-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:ring-violet-900",
    served: "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900",
    cancelled:
        "bg-red-50 text-red-800 ring-1 ring-red-200 dark:bg-red-950/40 dark:text-red-300 dark:ring-red-900",
};

function formatRupiah(value: string | number) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(Number(value));
}

function formatPaginationLabel(label: string) {
    return label.replace(/&laquo;/g, "«").replace(/&raquo;/g, "»");
}

export default function Index({ orders, filters }: Props) {
    const [search, setSearch] = useState(filters.search);
    const [status, setStatus] = useState(filters.status);
    const [dateFrom, setDateFrom] = useState(filters.date_from);
    const [dateTo, setDateTo] = useState(filters.date_to);
    const [expandedOrder, setExpandedOrder] = useState<number | null>(null);
    const [updatingOrder, setUpdatingOrder] = useState<number | null>(null);

    function applyFilters(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        router.get(
            "/admin/orders",
            {
                search: search || undefined,
                status: status || undefined,
                date_from: dateFrom || undefined,
                date_to: dateTo || undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    }

    function resetFilters() {
        setSearch("");
        setStatus("");
        setDateFrom("");
        setDateTo("");

        router.get(
            "/admin/orders",
            {},
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    }

    function updateStatus(order: OrderRow, nextStatus: string) {
        if (
            nextStatus === order.status ||
            !statusOptions.some((option) => option.value === nextStatus)
        ) {
            return;
        }

        setUpdatingOrder(order.id);

        router.patch(
            `/admin/orders/${order.id}/status`,
            { status: nextStatus },
            {
                preserveScroll: true,
                onFinish: () => setUpdatingOrder(null),
            },
        );
    }

    return (
        <>
            <Head title="Manajemen Pesanan | Rasa Kita" />

            <main className="flex min-w-0 flex-1 flex-col gap-6 bg-[#F6F8F5] p-4 text-[#1B2D25] md:p-7 dark:bg-background dark:text-foreground">
                <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <div className="flex items-center gap-2 text-sm font-semibold text-[#718078] dark:text-muted-foreground">
                            <ClipboardList size={17} />
                            Operasional restoran
                        </div>

                        <h1 className="mt-2 text-3xl font-black tracking-tight">
                            Manajemen Pesanan
                        </h1>

                        <p className="mt-2 text-sm text-[#758078] dark:text-muted-foreground">
                            Pantau pesanan pelanggan dan perbarui statusnya.
                        </p>
                    </div>

                    <div className="rounded-xl border border-[#E3E9E2] bg-white px-4 py-3 dark:border-border dark:bg-card">
                        <p className="text-xs text-[#849087] dark:text-muted-foreground">
                            Total sesuai filter
                        </p>
                        <p className="mt-1 text-xl font-black">
                            {orders.total} pesanan
                        </p>
                    </div>
                </header>

                <form
                    onSubmit={applyFilters}
                    className="rounded-2xl border border-[#E3E9E2] bg-white p-4 shadow-sm md:p-5 dark:border-border dark:bg-card"
                >
                    <div className="mb-4 flex items-center gap-2">
                        <Search size={18} />
                        <h2 className="font-bold">Cari dan filter pesanan</h2>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
                        <label className="flex flex-col gap-1.5 xl:col-span-2">
                            <span className="text-xs font-semibold text-[#718078] dark:text-muted-foreground">
                                Kata kunci
                            </span>
                            <input
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                placeholder="Nomor pesanan, meja, pelanggan..."
                                className="h-10 min-w-0 rounded-lg border border-[#DDE4DC] bg-white px-3 text-sm outline-none focus:border-[#668C75] focus:ring-2 focus:ring-[#668C75]/15 dark:border-border dark:bg-background"
                            />
                        </label>

                        <label className="flex flex-col gap-1.5">
                            <span className="text-xs font-semibold text-[#718078] dark:text-muted-foreground">
                                Status
                            </span>
                            <select
                                value={status}
                                onChange={(event) =>
                                    setStatus(event.target.value)
                                }
                                className="h-10 rounded-lg border border-[#DDE4DC] bg-white px-3 text-sm dark:border-border dark:bg-background"
                            >
                                <option value="">Semua status</option>
                                {statusOptions.map((option) => (
                                    <option
                                        key={option.value}
                                        value={option.value}
                                    >
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className="flex flex-col gap-1.5">
                            <span className="text-xs font-semibold text-[#718078] dark:text-muted-foreground">
                                Dari tanggal
                            </span>
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(event) =>
                                    setDateFrom(event.target.value)
                                }
                                className="h-10 min-w-0 rounded-lg border border-[#DDE4DC] bg-white px-3 text-sm dark:border-border dark:bg-background"
                            />
                        </label>

                        <label className="flex flex-col gap-1.5">
                            <span className="text-xs font-semibold text-[#718078] dark:text-muted-foreground">
                                Sampai tanggal
                            </span>
                            <input
                                type="date"
                                value={dateTo}
                                onChange={(event) =>
                                    setDateTo(event.target.value)
                                }
                                className="h-10 min-w-0 rounded-lg border border-[#DDE4DC] bg-white px-3 text-sm dark:border-border dark:bg-background"
                            />
                        </label>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                        <button
                            type="submit"
                            className="rounded-lg bg-[#19483D] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#215A4A]"
                        >
                            Terapkan Filter
                        </button>

                        <button
                            type="button"
                            onClick={resetFilters}
                            className="rounded-lg border border-[#DDE4DC] px-4 py-2.5 text-sm font-semibold hover:bg-[#F6F8F5] dark:border-border dark:hover:bg-muted"
                        >
                            Reset
                        </button>
                    </div>
                </form>

                <section className="overflow-hidden rounded-2xl border border-[#E3E9E2] bg-white shadow-sm dark:border-border dark:bg-card">
                    <div className="flex items-center justify-between gap-3 border-b border-[#E9EEE8] p-5 dark:border-border">
                        <div>
                            <h2 className="font-black">Daftar Pesanan</h2>
                            <p className="mt-1 text-xs text-[#849087] dark:text-muted-foreground">
                                Perbarui status atau buka rincian pesanan.
                            </p>
                        </div>

                        <CalendarDays size={20} className="text-[#718078]" />
                    </div>

                    {orders.data.length === 0 ? (
                        <div className="px-5 py-14 text-center">
                            <ClipboardList
                                size={34}
                                className="mx-auto text-[#9AA59D]"
                            />
                            <h3 className="mt-4 font-bold">
                                Tidak ada pesanan
                            </h3>
                            <p className="mt-2 text-sm text-[#849087] dark:text-muted-foreground">
                                Coba ubah kata kunci atau filter yang digunakan.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-[#F8FAF7] text-xs font-bold text-[#718078] dark:bg-muted/40 dark:text-muted-foreground">
                                        <th className="px-5 py-4">Pesanan</th>
                                        <th className="px-4 py-4">Meja</th>
                                        <th className="px-4 py-4">Pelanggan</th>
                                        <th className="px-4 py-4">Item</th>
                                        <th className="px-4 py-4 text-right">
                                            Total
                                        </th>
                                        <th className="px-4 py-4">Status</th>
                                        <th className="px-4 py-4">Detail</th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-[#EEF1EC] dark:divide-border">
                                    {orders.data.map((order) => {
                                        const expanded =
                                            expandedOrder === order.id;

                                        return (
                                            <>
                                                <tr
                                                    key={order.id}
                                                    className="align-top hover:bg-[#FAFBF9] dark:hover:bg-muted/20"
                                                >
                                                    <td className="px-5 py-4">
                                                        <p className="text-sm font-bold">
                                                            {order.order_number}
                                                        </p>
                                                        <p className="mt-1 whitespace-nowrap text-xs text-[#849087] dark:text-muted-foreground">
                                                            {order.created_at ??
                                                                "—"}
                                                        </p>
                                                    </td>

                                                    <td className="px-4 py-4 text-sm font-semibold">
                                                        {order.table_name}
                                                    </td>

                                                    <td className="px-4 py-4 text-sm">
                                                        {order.customer_name ||
                                                            "Pelanggan"}
                                                    </td>

                                                    <td className="px-4 py-4 text-sm">
                                                        {order.items_count}
                                                    </td>

                                                    <td className="whitespace-nowrap px-4 py-4 text-right text-sm font-bold">
                                                        {formatRupiah(
                                                            order.total,
                                                        )}
                                                    </td>

                                                    <td className="min-w-44 px-4 py-4">
                                                        <select
                                                            value={order.status}
                                                            disabled={
                                                                updatingOrder ===
                                                                order.id
                                                            }
                                                            onChange={(event) =>
                                                                updateStatus(
                                                                    order,
                                                                    event.target
                                                                        .value,
                                                                )
                                                            }
                                                            className={`w-full rounded-lg border-0 px-2.5 py-2 text-xs font-bold disabled:opacity-50 ${statusStyles[order.status]}`}
                                                        >
                                                            {statusOptions.map(
                                                                (option) => (
                                                                    <option
                                                                        key={
                                                                            option.value
                                                                        }
                                                                        value={
                                                                            option.value
                                                                        }
                                                                    >
                                                                        {
                                                                            option.label
                                                                        }
                                                                    </option>
                                                                ),
                                                            )}
                                                        </select>
                                                    </td>

                                                    <td className="px-4 py-4">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setExpandedOrder(
                                                                    expanded
                                                                        ? null
                                                                        : order.id,
                                                                )
                                                            }
                                                            aria-expanded={
                                                                expanded
                                                            }
                                                            aria-label={`Detail ${order.order_number}`}
                                                            className="rounded-lg border border-[#DDE4DC] p-2 hover:bg-[#F1F5EF] dark:border-border dark:hover:bg-muted"
                                                        >
                                                            <ChevronDown
                                                                size={16}
                                                                className={`transition-transform ${expanded ? "rotate-180" : ""}`}
                                                            />
                                                        </button>
                                                    </td>
                                                </tr>

                                                {expanded && (
                                                    <tr
                                                        key={`${order.id}-detail`}
                                                    >
                                                        <td
                                                            colSpan={7}
                                                            className="bg-[#F8FAF7] px-5 py-5 dark:bg-muted/20"
                                                        >
                                                            <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
                                                                <div>
                                                                    <h3 className="mb-3 text-sm font-black">
                                                                        Rincian
                                                                        item
                                                                    </h3>

                                                                    <div className="space-y-3">
                                                                        {order.items.map(
                                                                            (
                                                                                item,
                                                                            ) => (
                                                                                <div
                                                                                    key={
                                                                                        item.id
                                                                                    }
                                                                                    className="flex flex-wrap items-start justify-between gap-3 border-b border-[#E5EAE3] pb-3 last:border-0 dark:border-border"
                                                                                >
                                                                                    <div>
                                                                                        <p className="text-sm font-semibold">
                                                                                            {
                                                                                                item.name
                                                                                            }{" "}
                                                                                            ×{" "}
                                                                                            {
                                                                                                item.quantity
                                                                                            }
                                                                                        </p>
                                                                                        <p className="mt-1 text-xs text-[#849087] dark:text-muted-foreground">
                                                                                            {formatRupiah(
                                                                                                item.unit_price,
                                                                                            )}{" "}
                                                                                            per
                                                                                            item
                                                                                        </p>
                                                                                        {item.notes && (
                                                                                            <p className="mt-1 text-xs text-[#849087]">
                                                                                                Catatan:{" "}
                                                                                                {
                                                                                                    item.notes
                                                                                                }
                                                                                            </p>
                                                                                        )}
                                                                                    </div>

                                                                                    <p className="text-sm font-bold">
                                                                                        {formatRupiah(
                                                                                            item.line_total,
                                                                                        )}
                                                                                    </p>
                                                                                </div>
                                                                            ),
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                <div className="space-y-3 rounded-xl border border-[#E3E9E2] bg-white p-4 dark:border-border dark:bg-card">
                                                                    <div>
                                                                        <p className="text-xs text-[#849087] dark:text-muted-foreground">
                                                                            Catatan
                                                                            pesanan
                                                                        </p>
                                                                        <p className="mt-1 text-sm">
                                                                            {order.notes ||
                                                                                "Tidak ada catatan"}
                                                                        </p>
                                                                    </div>

                                                                    <div className="flex justify-between border-t border-[#E5EAE3] pt-3 text-sm dark:border-border">
                                                                        <span className="text-[#718078] dark:text-muted-foreground">
                                                                            Subtotal
                                                                        </span>
                                                                        <span className="font-semibold">
                                                                            {formatRupiah(
                                                                                order.subtotal,
                                                                            )}
                                                                        </span>
                                                                    </div>

                                                                    <div className="flex justify-between text-sm">
                                                                        <span className="font-bold">
                                                                            Total
                                                                        </span>
                                                                        <span className="font-black">
                                                                            {formatRupiah(
                                                                                order.total,
                                                                            )}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {orders.last_page > 1 && (
                        <div className="flex flex-col justify-between gap-4 border-t border-[#E9EEE8] p-4 sm:flex-row sm:items-center dark:border-border">
                            <p className="text-xs text-[#849087] dark:text-muted-foreground">
                                Menampilkan {orders.from ?? 0}–{orders.to ?? 0}{" "}
                                dari {orders.total} pesanan
                            </p>

                            <div className="flex flex-wrap items-center gap-1">
                                {orders.links.map((link, index) => (
                                    <button
                                        key={`${link.label}-${index}`}
                                        type="button"
                                        disabled={!link.url}
                                        onClick={() => {
                                            if (link.url) {
                                                router.visit(link.url, {
                                                    preserveScroll: true,
                                                    preserveState: true,
                                                });
                                            }
                                        }}
                                        className={`min-w-9 rounded-lg px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40 ${
                                            link.active
                                                ? "bg-[#19483D] font-bold text-white"
                                                : "border border-[#DDE4DC] hover:bg-[#F6F8F5] dark:border-border dark:hover:bg-muted"
                                        }`}
                                    >
                                        {formatPaginationLabel(link.label)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </section>
            </main>
        </>
    );
}
