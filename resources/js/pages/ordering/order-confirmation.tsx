import { Head } from "@inertiajs/react";

type OrderItem = {
    name: string;
    quantity: number;
    unit_price: string | number;
    line_total: string | number;
    notes: string | null;
};

type Props = {
    token: string;
    table: {
        name: string;
        code: string;
    };
    order: {
        order_number: string;
        status: string;
        created_at: string | null;
        subtotal: string | number;
        total: string | number;
        items: OrderItem[];
    };
};

const formatRupiah = (value: string | number) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(Number(value));

export default function OrderConfirmation({ token, table, order }: Props) {
    const statusLabel = order.status === "pending" ? "Menunggu konfirmasi" : order.status;

    return (
        <>
            <Head title={`Pesanan ${order.order_number}`} />

            <main className="min-h-screen bg-[#F8F7F2] px-4 py-8 text-[#24352F] sm:py-12">
                <div className="mx-auto max-w-2xl">
                    <header className="mb-8 text-center">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E86F3B] text-2xl font-black text-white">
                            R
                        </div>

                        <h1 className="mt-3 text-xl font-black">Rasa Kita</h1>
                    </header>

                    <section className="overflow-hidden rounded-3xl border border-[#E5E4DB] bg-white shadow-sm">
                        <div className="border-b border-[#EAE8DF] px-6 py-8 text-center sm:px-10">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-3xl text-emerald-700">
                                ✓
                            </div>

                            <h2 className="mt-4 text-2xl font-black">Pesanan berhasil dikirim!</h2>

                            <p className="mt-2 text-sm leading-6 text-[#777E74]">
                                Pesananmu sudah tersimpan. Simpan nomor pesanan ini sebagai
                                referensi.
                            </p>

                            <div className="mt-6 rounded-2xl bg-[#F8F7F2] p-4">
                                <p className="text-xs font-bold uppercase tracking-widest text-[#8B9186]">
                                    Nomor pesanan
                                </p>

                                <p className="mt-2 break-all text-xl font-black tracking-wide text-[#19483D]">
                                    {order.order_number}
                                </p>

                                <div className="mt-4 flex justify-center">
                                    <span className="rounded-full bg-amber-50 px-4 py-2 text-xs font-bold text-amber-800">
                                        {statusLabel}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-5 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-[#777E74]">
                                <span>
                                    Meja: <strong>{table.name}</strong>
                                </span>

                                {order.created_at && <span>{order.created_at}</span>}
                            </div>
                        </div>

                        <div className="p-6 sm:p-10">
                            <h3 className="text-lg font-black">Rincian pesanan</h3>

                            <div className="mt-4 divide-y divide-[#F0EFE8]">
                                {order.items.map((item, index) => (
                                    <div
                                        key={`${item.name}-${index}`}
                                        className="flex justify-between gap-4 py-4"
                                    >
                                        <div className="min-w-0">
                                            <p className="font-bold">{item.name}</p>

                                            <p className="mt-1 text-sm text-[#777E74]">
                                                {item.quantity} × {formatRupiah(item.unit_price)}
                                            </p>

                                            {item.notes && (
                                                <p className="mt-1 text-xs text-[#777E74]">
                                                    Catatan: {item.notes}
                                                </p>
                                            )}
                                        </div>

                                        <p className="shrink-0 font-bold">
                                            {formatRupiah(item.line_total)}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-4 space-y-3 border-t border-[#E5E4DB] pt-5">
                                <div className="flex justify-between gap-4 text-sm">
                                    <span className="text-[#777E74]">Subtotal</span>

                                    <span className="font-semibold">
                                        {formatRupiah(order.subtotal)}
                                    </span>
                                </div>

                                <div className="flex justify-between gap-4 text-lg">
                                    <span className="font-black">Total pesanan</span>

                                    <span className="font-black text-[#D66A3A]">
                                        {formatRupiah(order.total)}
                                    </span>
                                </div>
                            </div>

                            <p className="mt-5 rounded-xl bg-[#F8F7F2] p-4 text-sm leading-6 text-[#777E74]">
                                Pembayaran dan pemantauan proses dapur belum tersedia. Status di
                                atas menunjukkan status pesanan pada sistem.
                            </p>

                            <a
                                href={`/m/${token}`}
                                className="mt-6 flex w-full items-center justify-center rounded-full bg-[#19483D] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#286653]"
                            >
                                Kembali ke menu
                            </a>
                        </div>
                    </section>

                    <p className="mt-6 text-center text-xs text-[#8B9186]">
                        Rasa Kita · Nikmati hidanganmu, nikmati momennya.
                    </p>
                </div>
            </main>
        </>
    );
}
