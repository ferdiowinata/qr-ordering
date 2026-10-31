import { Head } from "@inertiajs/react";
import {
    Armchair,
    ArrowRight,
    ArrowUpRight,
    CalendarDays,
    CheckCircle2,
    ChevronRight,
    Clock3,
    QrCode,
    ShoppingBag,
    Sparkles,
    UtensilsCrossed,
    XCircle,
} from "lucide-react";

type RecentOrder = {
    id: number;
    order_number: string;
    table_name: string;
    status: string;
    total: string | number;
    created_at: string | null;
};

type PopularMenu = {
    name: string;
    quantity_ordered: number;
};

type Props = {
    stats: {
        ordersToday: number;
        pendingOrders: number;
        availableMenus: number;
        activeTables: number;
        totalTables: number;
    };
    recentOrders: RecentOrder[];
    popularMenus: PopularMenu[];
};

const formatNumber = (value: number) =>
    new Intl.NumberFormat("id-ID").format(value);

const formatRupiah = (value: string | number) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(Number(value));

const todayLabel = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
}).format(new Date());

function getStatus(status: string) {
    const statuses: Record<
        string,
        { label: string; className: string; dotClass: string }
    > = {
        pending: {
            label: "Menunggu",
            className:
                "bg-amber-50 text-amber-800 ring-1 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-900",
            dotClass: "bg-amber-500",
        },
        processing: {
            label: "Diproses",
            className:
                "bg-blue-50 text-blue-800 ring-1 ring-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:ring-blue-900",
            dotClass: "bg-blue-500",
        },
        ready: {
            label: "Siap diantar",
            className:
                "bg-violet-50 text-violet-800 ring-1 ring-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:ring-violet-900",
            dotClass: "bg-violet-500",
        },
        served: {
            label: "Selesai disajikan",
            className:
                "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900",
            dotClass: "bg-emerald-500",
        },
        cancelled: {
            label: "Dibatalkan",
            className:
                "bg-red-50 text-red-800 ring-1 ring-red-200 dark:bg-red-950/40 dark:text-red-300 dark:ring-red-900",
            dotClass: "bg-red-500",
        },
    };

    return (
        statuses[status] ?? {
            label: status,
            className:
                "bg-gray-100 text-gray-700 ring-1 ring-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-700",
            dotClass: "bg-gray-500",
        }
    );
}

export default function Dashboard({
    stats,
    recentOrders,
    popularMenus,
}: Props) {
    const metrics = [
        {
            title: "Pesanan Hari Ini",
            value: formatNumber(stats.ordersToday),
            description: "Pesanan masuk hari ini",
            icon: ShoppingBag,
            accent: "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300",
            iconBg: "bg-emerald-100 dark:bg-emerald-900/50",
            decoration: "bg-emerald-500",
        },
        {
            title: "Menunggu Konfirmasi",
            value: formatNumber(stats.pendingOrders),
            description: "Perlu ditinjau oleh staf",
            icon: Clock3,
            accent: "bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300",
            iconBg: "bg-amber-100 dark:bg-amber-900/50",
            decoration: "bg-amber-500",
        },
        {
            title: "Menu Tersedia",
            value: formatNumber(stats.availableMenus),
            description: "Menu pada kategori aktif",
            icon: UtensilsCrossed,
            accent: "bg-sky-50 text-sky-800 dark:bg-sky-950/50 dark:text-sky-300",
            iconBg: "bg-sky-100 dark:bg-sky-900/50",
            decoration: "bg-sky-500",
        },
        {
            title: "Meja Aktif",
            value: `${stats.activeTables}/${stats.totalTables}`,
            description: "QR Code yang aktif",
            icon: Armchair,
            accent: "bg-violet-50 text-violet-800 dark:bg-violet-950/50 dark:text-violet-300",
            iconBg: "bg-violet-100 dark:bg-violet-900/50",
            decoration: "bg-violet-500",
        },
    ];

    const maxQuantity = Math.max(
        1,
        ...popularMenus.map((item) => item.quantity_ordered),
    );

    return (
        <>
            <Head title="Dashboard Admin | Rasa Kita" />

            <main className="flex min-w-0 flex-1 flex-col gap-6 bg-[#F6F8F5] p-4 text-[#1B2D25] md:gap-7 md:p-7 xl:p-8 dark:bg-background dark:text-foreground">
                {/* Header */}
                <header className="flex flex-col justify-between gap-5 xl:flex-row xl:items-center">
                    <div>
                        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-[0.13em] text-emerald-800 shadow-sm dark:border-emerald-900 dark:bg-card dark:text-emerald-300">
                            <Sparkles size={14} />
                            Restaurant management
                        </div>

                        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                            Dashboard
                            <span className="text-[#D66A3A]">.</span>
                        </h1>

                        <p className="mt-2 max-w-xl text-sm leading-6 text-[#758078] dark:text-muted-foreground">
                            Pantau aktivitas pemesanan dan operasional restoran
                            dalam satu tempat.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="flex items-center gap-3 rounded-2xl border border-[#E3E9E2] bg-white px-4 py-3 shadow-sm dark:border-border dark:bg-card">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F1F5EF] text-[#476753] dark:bg-muted dark:text-emerald-300">
                                <CalendarDays size={19} />
                            </div>

                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-[#8B948D]">
                                    Hari ini
                                </p>
                                <p className="mt-1 text-sm font-semibold">
                                    {todayLabel}
                                </p>
                            </div>
                        </div>

                        <a
                            href="/admin/table-qr"
                            className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-[#19483D] px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#19483D]/15 transition hover:-translate-y-0.5 hover:bg-[#215A4A] active:translate-y-0"
                        >
                            <QrCode size={18} />
                            Kelola QR Meja
                            <ArrowUpRight
                                size={16}
                                className="transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                            />
                        </a>
                    </div>
                </header>

                <section>
                    <div className="mb-4 flex items-end justify-between gap-3">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#8A958D]">
                                Sekilas bisnis
                            </p>
                            <h2 className="mt-1 text-lg font-black tracking-tight">
                                Statistik utama
                            </h2>
                        </div>

                        <span className="hidden text-xs text-[#8A958D] sm:block">
                            Berdasarkan data database
                        </span>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
                        {metrics.map((metric) => {
                            const Icon = metric.icon;

                            return (
                                <article
                                    key={metric.title}
                                    className="group relative overflow-hidden rounded-2xl border border-[#E3E9E2] bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md dark:border-border dark:bg-card"
                                >
                                    <div
                                        className={`absolute inset-x-0 top-0 h-1 ${metric.decoration} opacity-0 transition group-hover:opacity-100`}
                                    />

                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-[#758078] dark:text-muted-foreground">
                                                {metric.title}
                                            </p>

                                            <p className="mt-4 text-3xl font-black tracking-tight tabular-nums">
                                                {metric.value}
                                            </p>
                                        </div>

                                        <div
                                            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${metric.iconBg} ${metric.accent.split(" ").slice(0, 2).join(" ")}`}
                                        >
                                            <Icon size={22} strokeWidth={1.8} />
                                        </div>
                                    </div>

                                    <div className="mt-4 flex items-center gap-2 border-t border-[#EEF1EC] pt-3 dark:border-border">
                                        <span className="h-1.5 w-1.5 rounded-full bg-[#91A398]" />
                                        <p className="text-xs text-[#849087] dark:text-muted-foreground">
                                            {metric.description}
                                        </p>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                </section>

                {/* Main dashboard content */}
                <section className="grid min-w-0 grid-cols-1 gap-6 2xl:grid-cols-[minmax(0,1.6fr)_minmax(310px,0.8fr)]">
                    {/* Recent orders */}
                    <article className="min-w-0 overflow-hidden rounded-2xl border border-[#E3E9E2] bg-white shadow-sm dark:border-border dark:bg-card">
                        <div className="flex flex-col justify-between gap-3 border-b border-[#E9EEE8] p-5 sm:flex-row sm:items-center dark:border-border">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF2EB] text-[#285A43] dark:bg-emerald-950/50 dark:text-emerald-300">
                                    <ShoppingBag size={20} />
                                </div>

                                <div>
                                    <h2 className="font-black tracking-tight">
                                        Pesanan terbaru
                                    </h2>
                                    <p className="mt-1 text-xs text-[#849087] dark:text-muted-foreground">
                                        Aktivitas transaksi terakhir
                                    </p>
                                </div>
                            </div>

                            <span className="w-fit rounded-full bg-[#F1F4F0] px-3 py-1.5 text-xs font-bold text-[#52675A] dark:bg-muted dark:text-muted-foreground">
                                {recentOrders.length} data
                            </span>
                        </div>

                        {recentOrders.length === 0 ? (
                            <div className="flex flex-col items-center px-5 py-14 text-center">
                                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F1F5EF] text-[#738676] dark:bg-muted dark:text-muted-foreground">
                                    <ShoppingBag size={28} />
                                </div>

                                <h3 className="mt-5 font-bold">
                                    Belum ada pesanan
                                </h3>

                                <p className="mt-2 max-w-xs text-sm leading-6 text-[#849087] dark:text-muted-foreground">
                                    Pesanan yang dikirim pelanggan akan muncul
                                    di bagian ini.
                                </p>

                                <a
                                    href="/admin/table-qr"
                                    className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#286653] hover:underline dark:text-emerald-300"
                                >
                                    Lihat QR meja
                                    <ArrowRight size={15} />
                                </a>
                            </div>
                        ) : (
                            <>
                                {/* Mobile list */}
                                <div className="divide-y divide-[#EEF1EC] md:hidden dark:divide-border">
                                    {recentOrders.map((order) => {
                                        const status = getStatus(order.status);

                                        return (
                                            <div
                                                key={order.id}
                                                className="space-y-3 p-4"
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <p className="break-all text-sm font-bold">
                                                            {order.order_number}
                                                        </p>
                                                        <p className="mt-1 text-xs text-[#849087] dark:text-muted-foreground">
                                                            {order.created_at ??
                                                                "Waktu tidak tersedia"}
                                                        </p>
                                                    </div>

                                                    <span
                                                        className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${status.className}`}
                                                    >
                                                        <span
                                                            className={`h-1.5 w-1.5 rounded-full ${status.dotClass}`}
                                                        />
                                                        {status.label}
                                                    </span>
                                                </div>

                                                <div className="flex items-center justify-between gap-3">
                                                    <span className="rounded-lg bg-[#F3F5F1] px-2.5 py-1.5 text-xs font-semibold dark:bg-muted">
                                                        {order.table_name}
                                                    </span>

                                                    <span className="text-sm font-black">
                                                        {formatRupiah(
                                                            order.total,
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Desktop table */}
                                <div className="hidden overflow-x-auto md:block">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-[#F8FAF7] text-[10px] font-bold uppercase tracking-[0.12em] text-[#879289] dark:bg-muted/40">
                                                <th className="px-5 py-4">
                                                    Pesanan
                                                </th>
                                                <th className="px-4 py-4">
                                                    Meja
                                                </th>
                                                <th className="px-4 py-4">
                                                    Status
                                                </th>
                                                <th className="px-5 py-4 text-right">
                                                    Total
                                                </th>
                                            </tr>
                                        </thead>

                                        <tbody className="divide-y divide-[#EEF1EC] dark:divide-border">
                                            {recentOrders.map((order) => {
                                                const status = getStatus(
                                                    order.status,
                                                );

                                                return (
                                                    <tr
                                                        key={order.id}
                                                        className="transition hover:bg-[#FAFBF9] dark:hover:bg-muted/30"
                                                    >
                                                        <td className="px-5 py-4">
                                                            <p className="text-sm font-bold">
                                                                {
                                                                    order.order_number
                                                                }
                                                            </p>

                                                            <p className="mt-1 text-xs text-[#849087] dark:text-muted-foreground">
                                                                {order.created_at ??
                                                                    "—"}
                                                            </p>
                                                        </td>

                                                        <td className="px-4 py-4">
                                                            <span className="inline-flex items-center gap-2 text-sm font-semibold">
                                                                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F1F5EF] text-[#53705B] dark:bg-muted dark:text-emerald-300">
                                                                    <Armchair
                                                                        size={
                                                                            15
                                                                        }
                                                                    />
                                                                </span>
                                                                {
                                                                    order.table_name
                                                                }
                                                            </span>
                                                        </td>

                                                        <td className="px-4 py-4">
                                                            <span
                                                                className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1.5 text-[11px] font-bold ${status.className}`}
                                                            >
                                                                <span
                                                                    className={`h-1.5 w-1.5 rounded-full ${status.dotClass}`}
                                                                />
                                                                {status.label}
                                                            </span>
                                                        </td>

                                                        <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-black">
                                                            {formatRupiah(
                                                                order.total,
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </article>

                    {/* Right column */}
                    <div className="flex min-w-0 flex-col gap-6">
                        {/* Popular menu */}
                        <article className="rounded-2xl border border-[#E3E9E2] bg-white p-5 shadow-sm dark:border-border dark:bg-card">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F8EDE2] text-[#B76B39] dark:bg-orange-950/40 dark:text-orange-300">
                                    <UtensilsCrossed size={20} />
                                </div>

                                <div>
                                    <h2 className="font-black tracking-tight">
                                        Menu terlaris
                                    </h2>
                                    <p className="mt-1 text-xs text-[#849087] dark:text-muted-foreground">
                                        Berdasarkan jumlah item dipesan
                                    </p>
                                </div>
                            </div>

                            {popularMenus.length === 0 ? (
                                <div className="mt-6 rounded-xl border border-dashed border-[#DDE4DC] px-4 py-8 text-center dark:border-border">
                                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#F3F5F1] text-[#819085] dark:bg-muted">
                                        <UtensilsCrossed size={22} />
                                    </div>

                                    <p className="mt-3 text-sm font-bold">
                                        Belum ada data menu
                                    </p>

                                    <p className="mt-1 text-xs leading-5 text-[#849087] dark:text-muted-foreground">
                                        Menu terlaris akan terlihat setelah ada
                                        pesanan pelanggan.
                                    </p>
                                </div>
                            ) : (
                                <div className="mt-6 space-y-5">
                                    {popularMenus.map((item, index) => (
                                        <div key={item.name}>
                                            <div className="mb-2.5 flex items-center gap-3">
                                                <span
                                                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-black ${
                                                        index === 0
                                                            ? "bg-[#19483D] text-white"
                                                            : "bg-[#F1F4F0] text-[#627267] dark:bg-muted dark:text-muted-foreground"
                                                    }`}
                                                >
                                                    {String(index + 1).padStart(
                                                        2,
                                                        "0",
                                                    )}
                                                </span>

                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-bold">
                                                        {item.name}
                                                    </p>
                                                    <p className="mt-0.5 text-xs text-[#879289] dark:text-muted-foreground">
                                                        {formatNumber(
                                                            item.quantity_ordered,
                                                        )}{" "}
                                                        item dipesan
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="ml-11 h-2 overflow-hidden rounded-full bg-[#EDF1EB] dark:bg-muted">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${
                                                        index === 0
                                                            ? "bg-[#19483D]"
                                                            : "bg-[#9DB7A1]"
                                                    }`}
                                                    style={{
                                                        width: `${(item.quantity_ordered / maxQuantity) * 100}%`,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <p className="mt-5 border-t border-[#EEF1EC] pt-4 text-[11px] leading-5 text-[#879289] dark:border-border dark:text-muted-foreground">
                                Peringkat dihitung dari seluruh rincian pesanan
                                yang tersimpan, termasuk transaksi demo.
                            </p>
                        </article>
                    </div>
                </section>

                {/* Footer */}
                <footer className="flex flex-col justify-between gap-2 border-t border-[#E3E9E2] pt-5 text-xs text-[#879289] sm:flex-row sm:items-center dark:border-border dark:text-muted-foreground">
                    <p>
                        <span className="font-bold text-[#52675A] dark:text-foreground">
                            Rasa Kita
                        </span>{" "}
                        · Restaurant Ordering System
                    </p>
                    <p>Data ditampilkan dari transaksi yang tersimpan.</p>
                </footer>
            </main>
        </>
    );
}
