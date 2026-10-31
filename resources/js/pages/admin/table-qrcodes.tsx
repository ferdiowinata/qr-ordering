import { Head } from "@inertiajs/react";
import { QRCodeSVG } from "qrcode.react";

type RestaurantTable = {
    id: number;
    name: string;
    code: string;
    is_active: boolean;
    url: string;
};

type Props = {
    tables: RestaurantTable[];
};

function downloadQr(table: RestaurantTable) {
    const container = document.getElementById(`qr-${table.id}`);
    const originalSvg = container?.querySelector("svg");

    if (!originalSvg) {
        return;
    }

    const svg = originalSvg.cloneNode(true) as SVGSVGElement;
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");

    const svgText = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });

    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = objectUrl;
    link.download = `qr-${table.code.toLowerCase()}.svg`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    window.setTimeout(() => {
        URL.revokeObjectURL(objectUrl);
    }, 1000);
}

export default function TableQrCodes({ tables }: Props) {
    const activeTables = tables.filter((table) => table.is_active);

    return (
        <>
            <Head title="QR Code Meja | Rasa Kita" />

            <main className="min-h-screen bg-[#F8F7F2] px-4 py-8 text-[#24352F] sm:px-6 lg:px-8">
                <div className="mx-auto max-w-6xl">
                    <header className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#D66A3A]">
                                Rasa Kita · Pengelolaan
                            </p>

                            <h1 className="mt-2 text-3xl font-black tracking-tight">
                                QR Code Meja
                            </h1>

                            <p className="mt-2 text-sm leading-6 text-[#777E74]">
                                Setiap meja memiliki kode unik untuk membuka
                                menu pemesanan.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => window.print()}
                            disabled={activeTables.length === 0}
                            className="rounded-full bg-[#19483D] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#286653] disabled:opacity-50 print:hidden"
                        >
                            Cetak semua QR
                        </button>
                    </header>

                    <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div className="rounded-2xl border border-[#E5E4DB] bg-white p-5">
                            <p className="text-sm text-[#777E74]">Total meja</p>
                            <p className="mt-2 text-3xl font-black">
                                {tables.length}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-[#E5E4DB] bg-white p-5">
                            <p className="text-sm text-[#777E74]">Meja aktif</p>
                            <p className="mt-2 text-3xl font-black text-emerald-700">
                                {activeTables.length}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-[#E5E4DB] bg-white p-5">
                            <p className="text-sm text-[#777E74]">
                                QR siap dicetak
                            </p>
                            <p className="mt-2 text-3xl font-black">
                                {activeTables.length}
                            </p>
                        </div>
                    </section>

                    {tables.length === 0 ? (
                        <section className="rounded-3xl border border-dashed border-[#D9D8CC] bg-white p-10 text-center">
                            <div className="text-4xl">🪑</div>
                            <h2 className="mt-4 text-lg font-bold">
                                Belum ada meja
                            </h2>
                            <p className="mt-2 text-sm text-[#777E74]">
                                Tambahkan meja ke database untuk menghasilkan QR
                                Code.
                            </p>
                        </section>
                    ) : (
                        <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 print:grid-cols-3">
                            {tables.map((table) => (
                                <article
                                    key={table.id}
                                    className="break-inside-avoid rounded-3xl border border-[#E5E4DB] bg-white p-5 text-center shadow-sm print:rounded-xl print:border-black print:p-3 print:shadow-none"
                                >
                                    <div className="flex items-start justify-between gap-3 text-left print:justify-center">
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-widest text-[#8B9186] print:text-black">
                                                KODE MEJA
                                            </p>

                                            <h2 className="mt-1 text-xl font-black">
                                                {table.name}
                                            </h2>

                                            <p className="mt-1 text-sm text-[#777E74] print:text-black">
                                                {table.code}
                                            </p>
                                        </div>

                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-bold print:hidden ${
                                                table.is_active
                                                    ? "bg-emerald-50 text-emerald-700"
                                                    : "bg-red-50 text-red-700"
                                            }`}
                                        >
                                            {table.is_active
                                                ? "Aktif"
                                                : "Nonaktif"}
                                        </span>
                                    </div>

                                    <div className="mx-auto my-5 flex min-h-[236px] items-center justify-center">
                                        {table.is_active ? (
                                            <div
                                                id={`qr-${table.id}`}
                                                className="max-w-full"
                                            >
                                                <QRCodeSVG
                                                    value={table.url}
                                                    size={220}
                                                    level="H"
                                                    marginSize={2}
                                                    bgColor="#FFFFFF"
                                                    fgColor="#19483D"
                                                />
                                            </div>
                                        ) : (
                                            <p className="rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700 print:text-black">
                                                QR dinonaktifkan
                                            </p>
                                        )}
                                    </div>

                                    <p className="text-sm font-bold">
                                        Scan untuk melihat menu
                                    </p>

                                    <p className="mt-2 break-all text-xs leading-5 text-[#8B9186] print:hidden">
                                        {table.is_active
                                            ? table.url
                                            : "Meja ini tidak menerima akses QR."}
                                    </p>

                                    {table.is_active && (
                                        <button
                                            type="button"
                                            onClick={() => downloadQr(table)}
                                            className="mt-5 w-full rounded-full border border-[#DCDDD3] px-4 py-3 text-sm font-bold transition hover:bg-[#F3F2EC] print:hidden"
                                        >
                                            Unduh QR · SVG
                                        </button>
                                    )}
                                </article>
                            ))}
                        </section>
                    )}

                    <p className="mt-8 text-center text-xs leading-5 text-[#8B9186] print:hidden">
                        QR Code hanya mengidentifikasi meja. Pesanan baru dibuat
                        ketika pelanggan mengirimkan keranjang mereka.
                    </p>
                </div>
            </main>
        </>
    );
}
