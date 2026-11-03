import { Head, useForm } from "@inertiajs/react";
import { useEffect, useRef, useState } from "react";

type CartItem = MenuItem & {
    quantity: number;
};

type CartState = {
    items: CartItem[];
    lastActivityAt: number;
};

type CheckoutData = {
    customer_name: string;
    notes: string;
    submission_key: string;
    session_version: number;
    items: {
        menu_item_id: number;
        quantity: number;
        notes: string | null;
    }[];
};

type MenuCategory = {
    id: number;
    name: string;
    slug: string;
    items: MenuItem[];
};

type Props = {
    token: string;
    sessionVersion: number;
    table: {
        name: string;
        code: string;
    };
    categories: MenuCategory[];
};

type MenuItem = {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    price: string | number;
    image_path: string | null;
};

const CART_TTL_MS = 30 * 60 * 1000;
// Membuat UUID v4 menggunakan crypto yang mendukung HTTP jaringan lokal.
function createSubmissionKey(): string {
    // Menghasilkan 16 byte acak secara kriptografis.
    const bytes = new Uint8Array(16);

    window.crypto.getRandomValues(bytes);

    // Menentukan versi UUID menjadi versi 4.
    bytes[6] = (bytes[6] & 0x0f) | 0x40;

    // Mengatur variant UUID sesuai standar.
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    // Mengubah setiap byte menjadi format hexadecimal.
    const hex = Array.from(bytes, (byte) =>
        byte.toString(16).padStart(2, "0"),
    ).join("");

    // Menyusun UUID dengan format 8-4-4-4-12.
    return [
        hex.slice(0, 8),
        hex.slice(8, 12),
        hex.slice(12, 16),
        hex.slice(16, 20),
        hex.slice(20, 32),
    ].join("-");
}

// Membuat kunci penyimpanan keranjang berdasarkan meja dan versi sesi.
const cartStorageKey = (token: string, sessionVersion: number) =>
    `qr-ordering-cart:${token}:v${sessionVersion}`;

// Membaca keranjang yang sesuai dengan versi sesi meja.
function readCart(token: string, sessionVersion: number): CartState {
    const emptyCart = (): CartState => ({
        items: [],
        lastActivityAt: Date.now(),
    });

    if (typeof window === "undefined") {
        return emptyCart();
    }

    // Menggunakan penyimpanan khusus untuk versi sesi saat ini.
    const key = cartStorageKey(token, sessionVersion);

    try {
        const raw = window.sessionStorage.getItem(key);

        if (!raw) {
            return emptyCart();
        }

        const saved = JSON.parse(raw) as CartState;

        if (
            !saved ||
            !Array.isArray(saved.items) ||
            typeof saved.lastActivityAt !== "number" ||
            Date.now() - saved.lastActivityAt >= CART_TTL_MS
        ) {
            window.sessionStorage.removeItem(key);
            return emptyCart();
        }

        return saved;
    } catch {
        window.sessionStorage.removeItem(key);
        return emptyCart();
    }
}

const formatRupiah = (value: string | number) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(Number(value));

function menuEmoji(name: string): string {
    const value = name.toLowerCase();

    if (value.includes("nasi")) return "🍛";
    if (value.includes("mie")) return "🍜";
    if (value.includes("ayam")) return "🍗";
    if (value.includes("teh")) return "🧋";
    if (value.includes("kopi")) return "☕";
    if (value.includes("kentang")) return "🍟";

    return "🍽️";
}

// Menampilkan menu dan mengelola keranjang berdasarkan sesi meja.
export default function MenuPage({
    token,
    table,
    categories,
    sessionVersion,
}: Props) {
    // Mengambil keranjang yang sesuai dengan versi sesi saat halaman dibuka.
    const [cartState, setCartState] = useState<CartState>(() =>
        readCart(token, sessionVersion),
    );

    // Menyimpan keranjang berdasarkan versi sesi meja.
    useEffect(() => {
        const key = cartStorageKey(token, sessionVersion);

        if (cartState.items.length === 0) {
            window.sessionStorage.removeItem(key);
            return;
        }

        window.sessionStorage.setItem(key, JSON.stringify(cartState));
        // Menyimpan perubahan keranjang sesuai versi sesi yang sedang digunakan.
    }, [cartState, token, sessionVersion]);

    const submissionKeyRef = useRef<string | null>(null);

    // Menyiapkan data checkout untuk dikirim ke backend Laravel.
    const checkoutForm = useForm<CheckoutData>({
        customer_name: "",
        notes: "",
        submission_key: "",
        session_version: sessionVersion,
        items: [],
    });

    useEffect(() => {
        submissionKeyRef.current = null;
    }, [cartState.items]);

    useEffect(() => {
        const key = cartStorageKey(token, sessionVersion);

        const intervalId = window.setInterval(() => {
            setCartState((current) => {
                if (
                    current.items.length === 0 ||
                    Date.now() - current.lastActivityAt < CART_TTL_MS
                ) {
                    return current;
                }

                window.sessionStorage.removeItem(key);

                return {
                    items: [],
                    lastActivityAt: Date.now(),
                };
            });
        }, 60_000);

        return () => window.clearInterval(intervalId);
        // Mengikuti identitas meja dan versi sesi pada penyimpanan keranjang.
    }, [token, sessionVersion]);

    const [isCartOpen, setIsCartOpen] = useState(false);

    const [recentlyAddedId, setRecentlyAddedId] = useState<number | null>(null);

    const [cartNotice, setCartNotice] = useState<string | null>(null);

    const [feedbackVersion, setFeedbackVersion] = useState(0);

    const feedbackTimeoutRef = useRef<number | null>(null);

    useEffect(() => {
        return () => {
            if (feedbackTimeoutRef.current !== null) {
                window.clearTimeout(feedbackTimeoutRef.current);
            }
        };
    }, []);

    const totalQuantity = cartState.items.reduce(
        (total, item) => total + item.quantity,
        0,
    );

    const cartTotal = cartState.items.reduce(
        (total, item) => total + Number(item.price) * item.quantity,
        0,
    );

    function updateCart(transform: (items: CartItem[]) => CartItem[]) {
        setCartState((current) => ({
            items: transform(current.items),
            lastActivityAt: Date.now(),
        }));
    }

    function showCartFeedback(message: string, itemId: number | null = null) {
        setCartNotice(message);
        setRecentlyAddedId(itemId);
        setFeedbackVersion((version) => version + 1);

        if (feedbackTimeoutRef.current !== null) {
            window.clearTimeout(feedbackTimeoutRef.current);
        }

        feedbackTimeoutRef.current = window.setTimeout(() => {
            setCartNotice(null);
            setRecentlyAddedId(null);
            feedbackTimeoutRef.current = null;
        }, 1800);
    }

    function addToCart(item: MenuItem) {
        const existing = cartState.items.find(
            (cartItem) => cartItem.id === item.id,
        );

        // Jangan menampilkan notifikasi sukses jika batas tercapai.
        if (existing && existing.quantity >= 20) {
            showCartFeedback(`Maksimal 20 item untuk ${item.name}.`);
            return;
        }

        updateCart((items) => {
            const current = items.find((cartItem) => cartItem.id === item.id);

            if (current) {
                return items.map((cartItem) =>
                    cartItem.id === item.id
                        ? {
                              ...cartItem,
                              quantity: Math.min(20, cartItem.quantity + 1),
                          }
                        : cartItem,
                );
            }

            return [...items, { ...item, quantity: 1 }];
        });

        showCartFeedback(`${item.name} ditambahkan ke keranjang`, item.id);
    }

    function changeQuantity(id: number, change: number) {
        updateCart((items) =>
            items
                .map((item) =>
                    item.id === id
                        ? {
                              ...item,
                              quantity: Math.min(20, item.quantity + change),
                          }
                        : item,
                )
                .filter((item) => item.quantity > 0),
        );
    }

    function clearCart() {
        updateCart(() => []);
    }

    function submitOrder() {
        if (cartState.items.length === 0 || checkoutForm.processing) {
            return;
        }

        // Membuat kunci unik untuk setiap pengiriman pesanan.
        if (!submissionKeyRef.current) {
            submissionKeyRef.current = createSubmissionKey();
        }

        // Menambahkan identitas versi sesi sebelum data dikirim ke Laravel.
        checkoutForm.transform((data) => ({
            ...data,

            // Mempertahankan kunci unik untuk mencegah pesanan duplikat.
            submission_key: submissionKeyRef.current!,

            // Mengirim versi sesi yang digunakan saat halaman dibuka.
            session_version: sessionVersion,

            // Mengirim daftar menu dan jumlah yang dipesan.
            items: cartState.items.map((item) => ({
                menu_item_id: item.id,
                quantity: item.quantity,
                notes: null,
            })),
        }));

        // Kirim pesanan setelah transformasi data selesai diatur.
        checkoutForm.post(`/m/${token}/orders`, {
            preserveScroll: true,

            // Menghapus keranjang dari penyimpanan setelah pesanan berhasil dibuat.
            onSuccess: () => {
                window.sessionStorage.removeItem(
                    cartStorageKey(token, sessionVersion),
                );
            },
        });
    }

    function getItemQuantity(itemId: number): number {
        return (
            cartState.items.find((cartItem) => cartItem.id === itemId)
                ?.quantity ?? 0
        );
    }

    const visibleCategories = categories.filter(
        (category) => category.items.length > 0,
    );

    return (
        <>
            <Head title={`Menu ${table.name} | Rasa Kita`} />

            <main className="min-h-screen bg-[#F8F7F2] text-[#24352F]">
                <header className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
                    <a href="#top" className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E86F3B] text-xl font-black text-white">
                            R
                        </div>

                        <div>
                            <p className="text-lg font-black tracking-tight">
                                Rasa Kita
                            </p>
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8B9186]">
                                Good food, good mood
                            </p>
                        </div>
                    </a>

                    <div className="flex items-center gap-2 rounded-full border border-[#E5E4DB] bg-white px-3 py-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span className="text-sm font-bold">{table.name}</span>
                    </div>
                </header>

                <div
                    id="top"
                    className="mx-auto max-w-6xl px-4 pb-12 sm:px-6 lg:px-8"
                >
                    <section className="relative overflow-hidden rounded-[2rem] bg-[#19483D] px-6 py-9 text-white sm:px-10 sm:py-12">
                        <div className="relative z-10 max-w-xl">
                            <p className="mb-4 inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-[#F9D8B9]">
                                MENU DIGITAL · {table.code}
                            </p>

                            <h1 className="text-3xl font-black leading-tight tracking-tight sm:text-5xl">
                                Ada rasa,
                                <br />
                                ada cerita.
                            </h1>

                            <p className="mt-4 max-w-md text-sm leading-6 text-white/75 sm:text-base">
                                Temukan makanan dan minuman favoritmu. Semua
                                menu tersedia langsung dari meja tempat kamu
                                duduk.
                            </p>

                            <a
                                href="#daftar-menu"
                                className="mt-7 inline-flex items-center rounded-full bg-[#F2B880] px-5 py-3 text-sm font-bold text-[#24352F] transition hover:bg-[#F7C99F]"
                            >
                                Jelajahi menu
                                <span className="ml-2" aria-hidden="true">
                                    ↓
                                </span>
                            </a>
                        </div>

                        <div
                            aria-hidden="true"
                            className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full border-[36px] border-[#F2B880]/20 sm:right-8 sm:top-4 sm:h-72 sm:w-72"
                        />

                        <div
                            aria-hidden="true"
                            className="pointer-events-none absolute -bottom-16 right-16 h-36 w-36 rounded-full bg-[#E86F3B]/70 blur-2xl sm:right-40"
                        />

                        <div
                            aria-hidden="true"
                            className="absolute bottom-6 right-7 hidden rotate-6 rounded-2xl bg-[#F9E6CC] px-5 py-4 text-[#19483D] shadow-xl sm:block"
                        >
                            <div className="text-4xl">🥗</div>
                            <p className="mt-2 text-xs font-black uppercase tracking-widest">
                                Made with care
                            </p>
                        </div>
                    </section>

                    <section id="daftar-menu" className="scroll-mt-6 pt-10">
                        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#D66A3A]">
                                    Fresh from our kitchen
                                </p>
                                <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
                                    Pilih favoritmu
                                </h2>
                                <p className="mt-2 text-sm text-[#777E74]">
                                    Menu pilihan untuk menemani harimu.
                                </p>
                            </div>

                            <span className="text-sm font-medium text-[#777E74]">
                                {visibleCategories.reduce(
                                    (total, category) =>
                                        total + category.items.length,
                                    0,
                                )}{" "}
                                pilihan menu
                            </span>
                        </div>

                        {visibleCategories.length > 0 && (
                            <nav
                                aria-label="Kategori menu"
                                className="mt-6 flex gap-2 overflow-x-auto pb-3"
                            >
                                {visibleCategories.map((category) => (
                                    <a
                                        key={category.id}
                                        href={`#category-${category.slug}`}
                                        className="shrink-0 rounded-full border border-[#E5E4DB] bg-white px-4 py-2.5 text-sm font-bold transition hover:border-[#19483D] hover:bg-[#19483D] hover:text-white"
                                    >
                                        {category.name}
                                    </a>
                                ))}
                            </nav>
                        )}

                        {visibleCategories.length === 0 ? (
                            <div className="mt-8 rounded-3xl border border-dashed border-[#D9D8CC] bg-white p-10 text-center">
                                <div className="text-4xl">🍽️</div>
                                <h3 className="mt-4 text-lg font-bold">
                                    Menu belum tersedia
                                </h3>
                                <p className="mt-2 text-sm text-[#777E74]">
                                    Silakan kunjungi kembali nanti.
                                </p>
                            </div>
                        ) : (
                            <div className="mt-8 space-y-10">
                                {visibleCategories.map((category) => (
                                    <section
                                        key={category.id}
                                        id={`category-${category.slug}`}
                                        className="scroll-mt-6"
                                    >
                                        <div className="mb-4 flex items-center justify-between">
                                            <h3 className="text-xl font-black">
                                                {category.name}
                                            </h3>
                                            <span className="text-xs font-semibold text-[#8B9186]">
                                                {category.items.length} menu
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                            {category.items.map((item) => (
                                                <article
                                                    key={item.id}
                                                    className={`group overflow-hidden rounded-3xl border bg-white transition duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-[#24352F]/5 ${
                                                        recentlyAddedId ===
                                                        item.id
                                                            ? "cart-item-added border-[#19483D] ring-2 ring-[#19483D]/20"
                                                            : "border-[#EAE8DF]"
                                                    }`}
                                                >
                                                    <div className="relative flex h-44 items-center justify-center overflow-hidden bg-gradient-to-br from-[#F8E7D4] via-[#F8F3E7] to-[#DFEAE0]">
                                                        {item.image_path ? (
                                                            <img
                                                                src={`/storage/${item.image_path}`}
                                                                alt={item.name}
                                                                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                                                            />
                                                        ) : (
                                                            <>
                                                                <div className="absolute -right-7 -top-8 h-32 w-32 rounded-full bg-white/50" />
                                                                <div className="absolute -bottom-12 -left-5 h-36 w-36 rounded-full bg-[#E8B58A]/25" />

                                                                <span className="relative text-7xl drop-shadow-sm transition duration-300 group-hover:scale-110">
                                                                    {menuEmoji(
                                                                        item.name,
                                                                    )}
                                                                </span>
                                                            </>
                                                        )}

                                                        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#47725D] shadow-sm">
                                                            Tersedia
                                                        </span>
                                                    </div>

                                                    <div className="p-5">
                                                        <h4 className="text-lg font-extrabold tracking-tight">
                                                            {item.name}
                                                        </h4>

                                                        <p className="mt-2 min-h-10 text-sm leading-5 text-[#777E74]">
                                                            {item.description ||
                                                                "Disajikan dengan bahan pilihan."}
                                                        </p>

                                                        <div className="mt-5 flex items-center justify-between gap-3 border-t border-[#F0EFE8] pt-4">
                                                            <span className="text-base font-black text-[#D66A3A]">
                                                                {formatRupiah(
                                                                    item.price,
                                                                )}
                                                            </span>

                                                            {getItemQuantity(
                                                                item.id,
                                                            ) === 0 ? (
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        addToCart(
                                                                            item,
                                                                        )
                                                                    }
                                                                    className="rounded-full bg-[#19483D] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#286653] active:scale-95"
                                                                >
                                                                    + Tambah
                                                                </button>
                                                            ) : (
                                                                <div className="inline-flex items-center gap-1 rounded-full bg-[#E7F0EC] p-1">
                                                                    <button
                                                                        type="button"
                                                                        aria-label={`Kurangi ${item.name}`}
                                                                        onClick={() =>
                                                                            changeQuantity(
                                                                                item.id,
                                                                                -1,
                                                                            )
                                                                        }
                                                                        className="flex h-9 w-9 items-center justify-center rounded-full text-lg font-bold text-[#19483D] transition hover:bg-white active:scale-90"
                                                                    >
                                                                        −
                                                                    </button>

                                                                    <span
                                                                        aria-live="polite"
                                                                        className="min-w-6 text-center text-sm font-black text-[#19483D]"
                                                                    >
                                                                        {getItemQuantity(
                                                                            item.id,
                                                                        )}
                                                                    </span>

                                                                    <button
                                                                        type="button"
                                                                        aria-label={`Tambah ${item.name}`}
                                                                        disabled={
                                                                            getItemQuantity(
                                                                                item.id,
                                                                            ) >=
                                                                            20
                                                                        }
                                                                        onClick={() =>
                                                                            changeQuantity(
                                                                                item.id,
                                                                                1,
                                                                            )
                                                                        }
                                                                        className="flex h-9 w-9 items-center justify-center rounded-full bg-[#19483D] text-lg font-bold text-white transition hover:bg-[#286653] active:scale-90 disabled:cursor-not-allowed disabled:opacity-40"
                                                                    >
                                                                        +
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </article>
                                            ))}
                                        </div>
                                    </section>
                                ))}
                            </div>
                        )}
                    </section>

                    <footer className="mt-14 border-t border-[#E5E4DB] py-6 text-center text-xs text-[#8B9186]">
                        <p className="font-bold">Rasa Kita</p>
                        <p className="mt-1">
                            Nikmati hidanganmu, nikmati momennya.
                        </p>
                    </footer>
                </div>

                {cartNotice && (
                    <div
                        key={feedbackVersion}
                        role="status"
                        aria-live="polite"
                        className="cart-toast-enter fixed right-4 top-20 z-[60] flex max-w-[calc(100vw-2rem)] items-center gap-3 rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-sm font-semibold text-[#19483D] shadow-xl"
                    >
                        <span
                            className="cart-check-pop flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700"
                            aria-hidden="true"
                        >
                            ✓
                        </span>

                        <span>{cartNotice}</span>
                    </div>
                )}

                {totalQuantity > 0 && (
                    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#E5E4DB] bg-white/95 px-4 py-3 shadow-lg backdrop-blur">
                        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
                            <div>
                                <p className="text-sm font-bold">
                                    {totalQuantity} item dalam keranjang
                                </p>
                                <p className="text-base font-black text-[#D66A3A]">
                                    {formatRupiah(cartTotal)}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setIsCartOpen(true)}
                                className="rounded-full bg-[#19483D] px-5 py-3 text-sm font-bold text-white hover:bg-[#286653]"
                            >
                                Lihat keranjang
                            </button>
                        </div>
                    </div>
                )}

                {isCartOpen && (
                    <div
                        className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
                        onClick={() => setIsCartOpen(false)}
                    >
                        <section
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="cart-title"
                            className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-6"
                            onClick={(event) => event.stopPropagation()}
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-widest text-[#D66A3A]">
                                        Pesanan kamu
                                    </p>
                                    <h2
                                        id="cart-title"
                                        className="mt-1 text-2xl font-black"
                                    >
                                        Keranjang
                                    </h2>
                                    <p className="mt-1 text-sm text-[#777E74]">
                                        {table.name} · {table.code}
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    aria-label="Tutup keranjang"
                                    onClick={() => setIsCartOpen(false)}
                                    className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F3F2EC] text-xl hover:bg-[#E8E7DF]"
                                >
                                    ×
                                </button>
                            </div>

                            {cartState.items.length === 0 ? (
                                <div className="py-10 text-center">
                                    <div className="text-4xl">🛒</div>
                                    <p className="mt-3 font-bold">
                                        Keranjang masih kosong
                                    </p>
                                    <p className="mt-1 text-sm text-[#777E74]">
                                        Tambahkan menu favoritmu terlebih
                                        dahulu.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <div className="mt-6 divide-y divide-[#F0EFE8]">
                                        {cartState.items.map((item) => (
                                            <div
                                                key={item.id}
                                                className="flex items-center justify-between gap-3 py-4"
                                            >
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-bold">
                                                        {item.name}
                                                    </p>

                                                    <p className="mt-1 text-sm text-[#777E74]">
                                                        {formatRupiah(
                                                            item.price,
                                                        )}{" "}
                                                        / item
                                                    </p>

                                                    <p className="mt-1 text-sm font-bold text-[#D66A3A]">
                                                        {formatRupiah(
                                                            Number(item.price) *
                                                                item.quantity,
                                                        )}
                                                    </p>
                                                </div>

                                                <div className="flex shrink-0 items-center gap-3">
                                                    <button
                                                        type="button"
                                                        aria-label={`Kurangi ${item.name}`}
                                                        onClick={() =>
                                                            changeQuantity(
                                                                item.id,
                                                                -1,
                                                            )
                                                        }
                                                        className="flex h-9 w-9 items-center justify-center rounded-full border border-[#DCDDD3] text-lg font-bold hover:bg-[#F3F2EC]"
                                                    >
                                                        −
                                                    </button>

                                                    <span className="w-5 text-center font-bold">
                                                        {item.quantity}
                                                    </span>

                                                    <button
                                                        type="button"
                                                        aria-label={`Tambah ${item.name}`}
                                                        disabled={
                                                            item.quantity >= 20
                                                        }
                                                        onClick={() =>
                                                            changeQuantity(
                                                                item.id,
                                                                1,
                                                            )
                                                        }
                                                        className="flex h-9 w-9 items-center justify-center rounded-full bg-[#19483D] text-lg font-bold text-white hover:bg-[#286653] disabled:cursor-not-allowed disabled:opacity-40"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-2 border-t border-[#E5E4DB] pt-4">
                                        <div className="flex items-center justify-between">
                                            <span className="font-semibold text-[#777E74]">
                                                Subtotal
                                            </span>
                                            <span className="text-xl font-black">
                                                {formatRupiah(cartTotal)}
                                            </span>
                                        </div>

                                        <p className="mt-2 text-xs leading-5 text-[#8B9186]">
                                            Subtotal sementara. Harga akhir akan
                                            divalidasi kembali oleh server saat
                                            pesanan dikirim.
                                        </p>

                                        <div className="mt-5 space-y-4">
                                            <div>
                                                <label
                                                    htmlFor="customer_name"
                                                    className="mb-2 block text-sm font-bold"
                                                >
                                                    Nama pelanggan (opsional)
                                                </label>

                                                <input
                                                    id="customer_name"
                                                    type="text"
                                                    maxLength={100}
                                                    value={
                                                        checkoutForm.data
                                                            .customer_name
                                                    }
                                                    onChange={(event) =>
                                                        checkoutForm.setData(
                                                            "customer_name",
                                                            event.target.value,
                                                        )
                                                    }
                                                    placeholder="Masukkan nama kamu"
                                                    className="w-full rounded-xl border border-[#DCDDD3] px-4 py-3 text-sm outline-none focus:border-[#19483D]"
                                                />

                                                {checkoutForm.errors
                                                    .customer_name && (
                                                    <p className="mt-1 text-sm text-red-600">
                                                        {
                                                            checkoutForm.errors
                                                                .customer_name
                                                        }
                                                    </p>
                                                )}
                                            </div>

                                            <div>
                                                <label
                                                    htmlFor="order_notes"
                                                    className="mb-2 block text-sm font-bold"
                                                >
                                                    Catatan pesanan (opsional)
                                                </label>

                                                <textarea
                                                    id="order_notes"
                                                    maxLength={1000}
                                                    rows={2}
                                                    value={
                                                        checkoutForm.data.notes
                                                    }
                                                    onChange={(event) =>
                                                        checkoutForm.setData(
                                                            "notes",
                                                            event.target.value,
                                                        )
                                                    }
                                                    placeholder="Contoh: sambal dipisah"
                                                    className="w-full resize-none rounded-xl border border-[#DCDDD3] px-4 py-3 text-sm outline-none focus:border-[#19483D]"
                                                />

                                                {checkoutForm.errors.notes && (
                                                    <p className="mt-1 text-sm text-red-600">
                                                        {
                                                            checkoutForm.errors
                                                                .notes
                                                        }
                                                    </p>
                                                )}
                                            </div>

                                            {checkoutForm.errors.items && (
                                                <p className="text-sm text-red-600">
                                                    {checkoutForm.errors.items}
                                                </p>
                                            )}

                                            {/* Menampilkan pemberitahuan ketika versi sesi sudah kedaluwarsa. */}
                                            {checkoutForm.errors
                                                .session_version && (
                                                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                                                    <p className="text-sm font-semibold text-amber-800">
                                                        {
                                                            checkoutForm.errors
                                                                .session_version
                                                        }
                                                    </p>

                                                    {/* Memuat ulang halaman agar mendapatkan versi sesi terbaru. */}
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            window.location.reload()
                                                        }
                                                        className="mt-3 rounded-full bg-[#19483D] px-4 py-2 text-sm font-bold text-white hover:bg-[#286653]"
                                                    >
                                                        Muat ulang menu
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-5 grid grid-cols-2 gap-3">
                                            <button
                                                type="button"
                                                onClick={clearCart}
                                                disabled={
                                                    checkoutForm.processing
                                                }
                                                className="rounded-full border border-[#DCDDD3] px-4 py-3 text-sm font-bold hover:bg-[#F3F2EC] disabled:opacity-50"
                                            >
                                                Kosongkan
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setIsCartOpen(false)
                                                }
                                                disabled={
                                                    checkoutForm.processing
                                                }
                                                className="rounded-full border border-[#DCDDD3] px-4 py-3 text-sm font-bold hover:bg-[#F3F2EC] disabled:opacity-50"
                                            >
                                                Lanjut pilih menu
                                            </button>

                                            <button
                                                type="button"
                                                onClick={submitOrder}
                                                disabled={
                                                    checkoutForm.processing ||
                                                    cartState.items.length === 0
                                                }
                                                className="col-span-2 rounded-full bg-[#19483D] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#286653] disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                {checkoutForm.processing
                                                    ? "Mengirim pesanan..."
                                                    : "Konfirmasi dan kirim pesanan"}
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </section>
                    </div>
                )}
            </main>
        </>
    );
}
