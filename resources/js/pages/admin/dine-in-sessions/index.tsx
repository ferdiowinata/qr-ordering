import { Head, router } from "@inertiajs/react";
import { useState } from "react";
import {
    CalendarDays,
    ChevronDown,
    ChevronRight,
    CreditCard,
    ReceiptText,
    Wallet,
} from "lucide-react";

// Menentukan metode pembayaran yang didukung sistem.
type PaymentMethod = "cash" | "qris";

// Menentukan status pesanan dalam sesi.
type OrderStatus = "pending" | "processing" | "ready" | "served" | "cancelled";

// Menyimpan detail setiap item pesanan.
type SessionItem = {
    id: number;
    name: string;
    quantity: number;
    unit_price: string | number;
    line_total: string | number;
    notes: string | null;
};

// Menyimpan informasi setiap pesanan dalam sesi.
type SessionOrder = {
    id: number;
    order_number: string;
    customer_name: string | null;
    status: OrderStatus;
    total: string | number;
    created_at: string | null;
    items: SessionItem[];
};

// Menyimpan informasi meja dan sesi dine-in.
type DineInSession = {
    id: number;
    session_code: string;
    status: string;
    payment_status: string;
    opened_at: string | null;
    orders_count: number;
    payable_total: string | number;
    table: {
        name: string;
        code: string;
    };
    orders: SessionOrder[];
};

// Menentukan struktur link pagination Laravel.
type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

// Menentukan struktur hasil pagination sesi.
type PaginatedSessions = {
    data: DineInSession[];
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
    total: number;
    links: PaginationLink[];
};

// Menentukan properti yang diterima halaman dari Inertia.
type Props = {
    sessions: PaginatedSessions;
};

// Mengatur label dan warna untuk setiap status pesanan.
const orderStatusStyles: Record<OrderStatus, string> = {
    pending:
        "bg-amber-50 text-amber-800 ring-1 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-900",
    processing:
        "bg-blue-50 text-blue-800 ring-1 ring-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:ring-blue-900",
    ready: "bg-violet-50 text-violet-800 ring-1 ring-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:ring-violet-900",
    served: "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900",
    cancelled:
        "bg-red-50 text-red-800 ring-1 ring-red-200 dark:bg-red-950/40 dark:text-red-300 dark:ring-red-900",
};

// Mengubah nominal menjadi format mata uang Rupiah.
function formatRupiah(value: string | number): string {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(Number(value));
}

// Mengubah status pesanan menjadi label Bahasa Indonesia.
function getOrderStatusLabel(status: OrderStatus): string {
    const labels: Record<OrderStatus, string> = {
        pending: "Menunggu",
        processing: "Diproses",
        ready: "Siap disajikan",
        served: "Disajikan",
        cancelled: "Dibatalkan",
    };

    return labels[status];
}

// Mengubah label pagination Laravel menjadi simbol yang mudah dibaca.
function formatPaginationLabel(label: string): string {
    return label.replace(/&laquo;/g, "«").replace(/&raquo;/g, "»");
}

export default function Index({ sessions }: Props) {
    // Menyimpan sesi yang sedang dibuka detailnya.
    const [expandedSession, setExpandedSession] = useState<number | null>(null);

    // Menyimpan pilihan metode pembayaran untuk setiap sesi.
    const [paymentMethods, setPaymentMethods] = useState<
        Record<number, PaymentMethod>
    >({});

    // Menyimpan ID sesi yang sedang diproses pembayarannya.
    const [payingSessionId, setPayingSessionId] = useState<number | null>(null);

    // Menyimpan pesan kesalahan pembayaran per sesi.
    const [paymentErrors, setPaymentErrors] = useState<Record<number, string>>(
        {},
    );

    // Menghitung total tagihan dari sesi yang sedang tampil pada halaman.
    const visiblePayableTotal = sessions.data.reduce(
        (total, session) => total + Number(session.payable_total || 0),
        0,
    );

    /**
     * Mengonfirmasi pembayaran untuk satu sesi dine-in.
     * Seluruh pesanan dalam sesi dibayar sekaligus.
     */
    function confirmPayment(session: DineInSession) {
        // Mencegah permintaan pembayaran berulang pada sesi yang sama.
        if (payingSessionId !== null) {
            return;
        }

        // Menolak pembayaran jika tidak ada pesanan yang dapat ditagihkan.
        if (session.orders_count <= 0 || Number(session.payable_total) <= 0) {
            setPaymentErrors((current) => ({
                ...current,
                [session.id]: "Tidak ada pesanan yang dapat dibayar.",
            }));

            return;
        }

        // Meminta konfirmasi sebelum pembayaran dikirim ke server.
        const confirmed = window.confirm(
            `Konfirmasi pembayaran meja ${session.table.name} sebesar ${formatRupiah(session.payable_total)}?`,
        );

        if (!confirmed) {
            return;
        }

        // Mengambil metode pembayaran yang dipilih.
        const paymentMethod = paymentMethods[session.id] ?? "cash";

        // Menghapus pesan kesalahan sebelumnya.
        setPaymentErrors((current) => {
            const next = { ...current };
            delete next[session.id];
            return next;
        });

        // Mengirim permintaan konfirmasi pembayaran ke Laravel.
        router.post(
            `/admin/dine-in-sessions/${session.id}/confirm-payment`,
            {
                payment_method: paymentMethod,
            },
            {
                preserveScroll: true,

                // Menandai sesi sebagai sedang diproses.
                onStart: () => {
                    setPayingSessionId(session.id);
                },

                // Membersihkan status ketika permintaan selesai.
                onFinish: () => {
                    setPayingSessionId(null);
                },

                // Menampilkan kesalahan validasi dari backend.
                onError: (errors) => {
                    setPaymentErrors((current) => ({
                        ...current,
                        [session.id]:
                            errors.payment ??
                            "Pembayaran gagal diproses. Silakan coba kembali.",
                    }));
                },
            },
        );
    }

    /**
     * Membuka atau menutup rincian pesanan dalam satu sesi.
     */
    function toggleSessionDetails(sessionId: number) {
        setExpandedSession((current) =>
            current === sessionId ? null : sessionId,
        );
    }

    /**
     * Mengirim navigasi pagination ke halaman sesi berikutnya.
     */
    function visitPage(url: string | null) {
        if (!url) {
            return;
        }

        router.visit(url, {
            preserveScroll: true,
            preserveState: true,
        });
    }

    return (
        <>
            <Head title="Sesi Dine-in | Rasa Kita" />

            <main className="flex min-w-0 flex-1 flex-col gap-6 bg-[#F6F8F5] p-4 text-[#1B2D25] md:p-7 dark:bg-background dark:text-foreground">
                {/* Header halaman pengelolaan pembayaran. */}
                <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <div className="flex items-center gap-2 text-sm font-semibold text-[#718078] dark:text-muted-foreground">
                            <CreditCard size={17} />
                            Operasional restoran
                        </div>

                        <h1 className="mt-2 text-3xl font-black tracking-tight">
                            Sesi Dine-in
                        </h1>

                        <p className="mt-2 text-sm text-[#758078] dark:text-muted-foreground">
                            Kelola tagihan dan konfirmasi pembayaran pelanggan
                            berdasarkan sesi meja.
                        </p>
                    </div>
                </header>

                {/* Menampilkan ringkasan jumlah sesi dan tagihan. */}
                <section className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-[#E3E9E2] bg-white p-5 shadow-sm dark:border-border dark:bg-card">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-[#718078] dark:text-muted-foreground">
                                Total sesi aktif
                            </p>

                            <div className="rounded-xl bg-[#E8F1EC] p-2 text-[#19483D] dark:bg-emerald-950/40 dark:text-emerald-300">
                                <ReceiptText size={19} />
                            </div>
                        </div>

                        <p className="mt-3 text-2xl font-black">
                            {sessions.total} sesi
                        </p>
                    </div>

                    <div className="rounded-2xl border border-[#E3E9E2] bg-white p-5 shadow-sm dark:border-border dark:bg-card">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-[#718078] dark:text-muted-foreground">
                                Total tagihan halaman ini
                            </p>

                            <div className="rounded-xl bg-amber-50 p-2 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                                <Wallet size={19} />
                            </div>
                        </div>

                        <p className="mt-3 text-2xl font-black">
                            {formatRupiah(visiblePayableTotal)}
                        </p>
                    </div>
                </section>

                {/* Menampilkan seluruh sesi yang menunggu pembayaran. */}
                <section className="overflow-hidden rounded-2xl border border-[#E3E9E2] bg-white shadow-sm dark:border-border dark:bg-card">
                    <div className="flex items-center justify-between gap-3 border-b border-[#E9EEE8] p-5 dark:border-border">
                        <div>
                            <h2 className="font-black">Daftar Sesi Aktif</h2>

                            <p className="mt-1 text-xs text-[#849087] dark:text-muted-foreground">
                                Pilih sesi untuk melihat pesanan dan
                                menyelesaikan pembayaran.
                            </p>
                        </div>

                        <CalendarDays size={20} className="text-[#718078]" />
                    </div>

                    {/* Tampilan ketika belum ada sesi aktif. */}
                    {sessions.data.length === 0 ? (
                        <div className="px-5 py-16 text-center">
                            <ReceiptText
                                size={38}
                                className="mx-auto text-[#9AA59D]"
                            />

                            <h3 className="mt-4 font-bold">
                                Belum ada sesi aktif
                            </h3>

                            <p className="mt-2 text-sm text-[#849087] dark:text-muted-foreground">
                                Sesi dine-in akan muncul setelah pelanggan
                                mengirimkan pesanan pertama.
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-[#EEF1EC] dark:divide-border">
                            {sessions.data.map((session) => {
                                const expanded = expandedSession === session.id;

                                const paymentMethod =
                                    paymentMethods[session.id] ?? "cash";

                                const canPay =
                                    session.orders_count > 0 &&
                                    Number(session.payable_total) > 0;

                                const isProcessing =
                                    payingSessionId === session.id;

                                return (
                                    <article
                                        key={session.id}
                                        className="p-5 md:p-6"
                                    >
                                        {/* Informasi utama sesi dan meja. */}
                                        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h3 className="text-lg font-black">
                                                        {session.table.name}
                                                    </h3>

                                                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900">
                                                        Aktif
                                                    </span>
                                                </div>

                                                <p className="mt-1 text-sm text-[#849087] dark:text-muted-foreground">
                                                    Kode meja:{" "}
                                                    <strong>
                                                        {session.table.code}
                                                    </strong>
                                                </p>

                                                <p className="mt-2 break-all text-xs text-[#849087] dark:text-muted-foreground">
                                                    Kode sesi:{" "}
                                                    {session.session_code}
                                                </p>

                                                <p className="mt-1 text-xs text-[#849087] dark:text-muted-foreground">
                                                    Dimulai:{" "}
                                                    {session.opened_at ?? "—"}
                                                </p>

                                                <p className="mt-1 text-xs text-[#849087] dark:text-muted-foreground">
                                                    {session.orders_count}{" "}
                                                    pesanan yang dihitung dalam
                                                    tagihan
                                                </p>
                                            </div>

                                            {/* Ringkasan tagihan dan aksi pembayaran. */}
                                            <div className="w-full rounded-xl border border-[#E3E9E2] bg-[#FAFBF9] p-4 lg:max-w-sm dark:border-border dark:bg-muted/20">
                                                <p className="text-xs font-semibold text-[#849087] dark:text-muted-foreground">
                                                    Total tagihan sesi
                                                </p>

                                                <p className="mt-1 text-2xl font-black text-[#19483D] dark:text-emerald-300">
                                                    {formatRupiah(
                                                        session.payable_total,
                                                    )}
                                                </p>

                                                <div className="mt-4 space-y-3">
                                                    <label className="block">
                                                        <span className="mb-1.5 block text-xs font-semibold text-[#718078] dark:text-muted-foreground">
                                                            Metode pembayaran
                                                        </span>

                                                        <select
                                                            value={
                                                                paymentMethod
                                                            }
                                                            disabled={
                                                                payingSessionId !==
                                                                null
                                                            }
                                                            onChange={(
                                                                event,
                                                            ) => {
                                                                setPaymentMethods(
                                                                    (
                                                                        current,
                                                                    ) => ({
                                                                        ...current,
                                                                        [session.id]:
                                                                            event
                                                                                .target
                                                                                .value as PaymentMethod,
                                                                    }),
                                                                );
                                                            }}
                                                            className="h-10 w-full rounded-lg border border-[#DDE4DC] bg-white px-3 text-sm outline-none focus:border-[#668C75] dark:border-border dark:bg-background"
                                                        >
                                                            <option value="cash">
                                                                Tunai (Cash)
                                                            </option>

                                                            <option value="qris">
                                                                QRIS
                                                            </option>
                                                        </select>
                                                    </label>

                                                    <button
                                                        type="button"
                                                        disabled={
                                                            payingSessionId !==
                                                                null || !canPay
                                                        }
                                                        onClick={() =>
                                                            confirmPayment(
                                                                session,
                                                            )
                                                        }
                                                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#19483D] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#215A4A] disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        <CreditCard size={16} />

                                                        {isProcessing
                                                            ? "Memproses pembayaran..."
                                                            : "Konfirmasi pembayaran"}
                                                    </button>

                                                    {!canPay && (
                                                        <p className="text-xs text-amber-700 dark:text-amber-300">
                                                            Belum ada pesanan
                                                            yang dapat
                                                            ditagihkan.
                                                        </p>
                                                    )}

                                                    {/* Menampilkan kesalahan pembayaran dari backend. */}
                                                    {paymentErrors[
                                                        session.id
                                                    ] && (
                                                        <p
                                                            role="alert"
                                                            className="text-xs font-medium text-red-600"
                                                        >
                                                            {
                                                                paymentErrors[
                                                                    session.id
                                                                ]
                                                            }
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Tombol untuk membuka rincian seluruh pesanan. */}
                                        <div className="mt-5 border-t border-[#EEF1EC] pt-4 dark:border-border">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    toggleSessionDetails(
                                                        session.id,
                                                    )
                                                }
                                                aria-expanded={expanded}
                                                className="flex w-full items-center justify-between gap-3 text-left text-sm font-bold text-[#19483D] hover:text-[#286653] dark:text-emerald-300"
                                            >
                                                <span>
                                                    Lihat rincian pesanan (
                                                    {session.orders.length})
                                                </span>

                                                {expanded ? (
                                                    <ChevronDown size={18} />
                                                ) : (
                                                    <ChevronRight size={18} />
                                                )}
                                            </button>

                                            {/* Menampilkan detail pesanan dan item. */}
                                            {expanded && (
                                                <div className="mt-5 space-y-4">
                                                    {session.orders.map(
                                                        (order) => (
                                                            <div
                                                                key={order.id}
                                                                className="rounded-xl border border-[#E3E9E2] p-4 dark:border-border"
                                                            >
                                                                <div className="flex flex-wrap items-start justify-between gap-3">
                                                                    <div>
                                                                        <p className="text-sm font-black">
                                                                            {
                                                                                order.order_number
                                                                            }
                                                                        </p>

                                                                        <p className="mt-1 text-xs text-[#849087] dark:text-muted-foreground">
                                                                            {order.customer_name ||
                                                                                "Pelanggan"}{" "}
                                                                            ·{" "}
                                                                            {order.created_at ??
                                                                                "—"}
                                                                        </p>
                                                                    </div>

                                                                    <span
                                                                        className={`rounded-full px-3 py-1 text-xs font-bold ${orderStatusStyles[order.status]}`}
                                                                    >
                                                                        {getOrderStatusLabel(
                                                                            order.status,
                                                                        )}
                                                                    </span>
                                                                </div>

                                                                <div className="mt-4 divide-y divide-[#EEF1EC] dark:divide-border">
                                                                    {order.items.map(
                                                                        (
                                                                            item,
                                                                        ) => (
                                                                            <div
                                                                                key={
                                                                                    item.id
                                                                                }
                                                                                className="flex flex-wrap justify-between gap-3 py-3 first:pt-0 last:pb-0"
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

                                                                {/* Pesanan dibatalkan tetap ditampilkan tetapi tidak ditagihkan. */}
                                                                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#EEF1EC] pt-3 dark:border-border">
                                                                    {order.status ===
                                                                    "cancelled" ? (
                                                                        <span className="text-xs font-semibold text-red-600">
                                                                            Tidak
                                                                            ditagihkan
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-xs text-[#849087] dark:text-muted-foreground">
                                                                            Total
                                                                            pesanan
                                                                        </span>
                                                                    )}

                                                                    <span
                                                                        className={`text-sm font-black ${
                                                                            order.status ===
                                                                            "cancelled"
                                                                                ? "text-[#849087] line-through"
                                                                                : ""
                                                                        }`}
                                                                    >
                                                                        {formatRupiah(
                                                                            order.total,
                                                                        )}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ),
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}

                    {/* Navigasi halaman sesi. */}
                    {sessions.last_page > 1 && (
                        <div className="flex flex-col justify-between gap-4 border-t border-[#E9EEE8] p-4 sm:flex-row sm:items-center dark:border-border">
                            <p className="text-xs text-[#849087] dark:text-muted-foreground">
                                Menampilkan {sessions.from ?? 0}–
                                {sessions.to ?? 0} dari {sessions.total} sesi
                            </p>

                            <div className="flex flex-wrap items-center gap-1">
                                {sessions.links.map((link, index) => (
                                    <button
                                        key={`${link.label}-${index}`}
                                        type="button"
                                        disabled={!link.url}
                                        onClick={() => visitPage(link.url)}
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
