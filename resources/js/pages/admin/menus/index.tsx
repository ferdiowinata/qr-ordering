import { Head, router, useForm } from "@inertiajs/react";
import { Fragment, useEffect, useState, type FormEvent } from "react";
import {
    ImagePlus,
    Menu as MenuIcon,
    Pencil,
    Plus,
    Search,
    Trash2,
    Upload,
    X,
} from "lucide-react";

type Category = {
    id: number;
    name: string;
    is_active: boolean;
};

type MenuItem = {
    id: number;
    category_id: number;
    category_name: string;
    name: string;
    slug: string;
    description: string | null;
    price: string | number;
    image_url: string | null;
    is_available: boolean;
    sort_order: number;
    order_items_count: number;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type PaginatedMenus = {
    data: MenuItem[];
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
    total: number;
    links: PaginationLink[];
};

type Props = {
    menus: PaginatedMenus;
    categories: Category[];
    filters: {
        search: string;
        category_id: string | number | null;
        availability: string;
    };
};

type MenuFormData = {
    category_id: number;
    name: string;
    description: string;
    price: string;
    image: File | null;
    remove_image: boolean;
    is_available: boolean;
    sort_order: number;
};

const initialForm: MenuFormData = {
    category_id: 0,
    name: "",
    description: "",
    price: "",
    image: null,
    remove_image: false,
    is_available: true,
    sort_order: 0,
};

// Mengubah angka menjadi format mata uang Rupiah.
function formatRupiah(value: string | number) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(Number(value));
}

// Mengubah label pagination menjadi bahasa Indonesia.
function paginationLabel(label: string) {
    return label
        .replace(/&laquo;/g, "«")
        .replace(/&raquo;/g, "»")
        .replace("Previous", "Sebelumnya")
        .replace("Next", "Selanjutnya");
}

export default function MenuIndex({ menus, categories, filters }: Props) {
    const [editing, setEditing] = useState<MenuItem | null>(null);
    const [search, setSearch] = useState(filters.search);
    const [categoryId, setCategoryId] = useState(
        filters.category_id ? String(filters.category_id) : "",
    );
    const [availability, setAvailability] = useState(filters.availability);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [notice, setNotice] = useState("");
    const [actionError, setActionError] = useState("");

    const form = useForm<MenuFormData>(initialForm);

    // Membuat preview sementara ketika admin memilih gambar baru.
    useEffect(() => {
        if (!form.data.image) {
            return;
        }

        const previewUrl = URL.createObjectURL(form.data.image);
        setImagePreview(previewUrl);

        return () => {
            URL.revokeObjectURL(previewUrl);
        };
    }, [form.data.image]);

    // Mengembalikan formulir ke kondisi awal.
    function resetForm() {
        form.reset();
        form.clearErrors();
        setEditing(null);
        setImagePreview(null);
    }

    // Mengisi formulir dengan data menu yang akan diedit.
    function startEditing(menu: MenuItem) {
        setEditing(menu);
        setNotice("");
        setActionError("");
        form.clearErrors();

        form.setData({
            category_id: menu.category_id,
            name: menu.name,
            description: menu.description ?? "",
            price: String(menu.price),
            image: null,
            remove_image: false,
            is_available: menu.is_available,
            sort_order: menu.sort_order,
        });

        setImagePreview(menu.image_url);
    }

    // Mengirim data menu baru atau perubahan menu melalui Inertia.
    function submitMenu(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (form.data.category_id === 0) {
            form.setError("category_id", "Silakan pilih kategori menu.");
            return;
        }

        setNotice("");
        setActionError("");

        // Laravel menggunakan method spoofing agar upload multipart
        // tetap dapat diproses melalui endpoint PUT.
        form.transform((data) => ({
            ...data,
            ...(editing ? { _method: "put" } : {}),
        }));

        form.post(editing ? `/admin/menus/${editing.id}` : "/admin/menus", {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setNotice(
                    editing
                        ? "Menu berhasil diperbarui."
                        : "Menu berhasil ditambahkan.",
                );
                resetForm();
            },
        });
    }

    // Menghapus menu setelah admin memberikan konfirmasi.
    function deleteMenu(menu: MenuItem) {
        const confirmed = window.confirm(
            `Apakah kamu yakin ingin menghapus menu "${menu.name}"?`,
        );

        if (!confirmed) {
            return;
        }

        setNotice("");
        setActionError("");

        router.delete(`/admin/menus/${menu.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setNotice("Menu berhasil dihapus.");

                if (editing?.id === menu.id) {
                    resetForm();
                }
            },
            onError: () => {
                setActionError("Menu gagal dihapus. Silakan coba kembali.");
            },
        });
    }

    // Menerapkan pencarian dan filter ke halaman daftar menu.
    function applyFilters(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        router.get(
            "/admin/menus",
            {
                search: search || undefined,
                category_id: categoryId || undefined,
                availability: availability || undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    }

    // Menghapus seluruh filter pencarian.
    function resetFilters() {
        setSearch("");
        setCategoryId("");
        setAvailability("");

        router.get(
            "/admin/menus",
            {},
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    }

    return (
        <>
            <Head title="Manajemen Menu | Rasa Kita" />

            <main className="flex min-w-0 flex-1 flex-col gap-6 bg-[#F6F8F5] p-4 text-[#1B2D25] md:p-7 dark:bg-background dark:text-foreground">
                {/* Header halaman */}
                <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <div className="flex items-center gap-2 text-sm font-semibold text-[#718078] dark:text-muted-foreground">
                            <MenuIcon size={17} />
                            Pengelolaan restoran
                        </div>

                        <h1 className="mt-2 text-3xl font-black tracking-tight">
                            Manajemen Menu
                        </h1>

                        <p className="mt-2 text-sm text-[#758078] dark:text-muted-foreground">
                            Tambahkan, ubah, dan kelola menu restoran.
                        </p>
                    </div>

                    <div className="rounded-xl border border-[#E3E9E2] bg-white px-4 py-3 dark:border-border dark:bg-card">
                        <p className="text-xs text-[#849087] dark:text-muted-foreground">
                            Total menu
                        </p>
                        <p className="mt-1 text-xl font-black">
                            {menus.total} menu
                        </p>
                    </div>
                </header>

                {/* Notifikasi berhasil atau gagal */}
                {(notice || actionError) && (
                    <div
                        role="status"
                        className={`rounded-xl border px-4 py-3 text-sm ${
                            actionError
                                ? "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
                                : "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300"
                        }`}
                    >
                        {actionError || notice}
                    </div>
                )}

                {/* Form tambah dan edit menu */}
                <section className="rounded-2xl border border-[#E3E9E2] bg-white p-5 shadow-sm dark:border-border dark:bg-card">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF2EB] text-[#285A43] dark:bg-emerald-950/50 dark:text-emerald-300">
                            {editing ? (
                                <Pencil size={20} />
                            ) : (
                                <Plus size={20} />
                            )}
                        </div>

                        <div>
                            <h2 className="font-black">
                                {editing ? "Edit Menu" : "Tambah Menu Baru"}
                            </h2>
                            <p className="mt-1 text-xs text-[#849087] dark:text-muted-foreground">
                                Lengkapi informasi menu restoran.
                            </p>
                        </div>
                    </div>

                    <form onSubmit={submitMenu} className="mt-6">
                        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <label className="block sm:col-span-2">
                                    <span className="mb-1.5 block text-sm font-semibold">
                                        Nama menu
                                    </span>
                                    <input
                                        required
                                        maxLength={150}
                                        value={form.data.name}
                                        onChange={(event) =>
                                            form.setData(
                                                "name",
                                                event.target.value,
                                            )
                                        }
                                        placeholder="Contoh: Nasi Goreng Spesial"
                                        className="h-11 w-full rounded-lg border border-[#DDE4DC] bg-white px-3 text-sm outline-none focus:border-[#668C75] focus:ring-2 focus:ring-[#668C75]/15 dark:border-border dark:bg-background"
                                    />
                                    {form.errors.name && (
                                        <p className="mt-1 text-xs text-red-600">
                                            {form.errors.name}
                                        </p>
                                    )}
                                </label>

                                <label className="block">
                                    <span className="mb-1.5 block text-sm font-semibold">
                                        Kategori
                                    </span>
                                    <select
                                        required
                                        value={form.data.category_id || ""}
                                        onChange={(event) =>
                                            form.setData(
                                                "category_id",
                                                Number(event.target.value),
                                            )
                                        }
                                        className="h-11 w-full rounded-lg border border-[#DDE4DC] bg-white px-3 text-sm dark:border-border dark:bg-background"
                                    >
                                        <option value="">Pilih kategori</option>

                                        {categories.map((category) => (
                                            <option
                                                key={category.id}
                                                value={category.id}
                                            >
                                                {category.name}
                                                {!category.is_active
                                                    ? " (Nonaktif)"
                                                    : ""}
                                            </option>
                                        ))}
                                    </select>
                                    {form.errors.category_id && (
                                        <p className="mt-1 text-xs text-red-600">
                                            {form.errors.category_id}
                                        </p>
                                    )}
                                </label>

                                <label className="block">
                                    <span className="mb-1.5 block text-sm font-semibold">
                                        Harga (Rp)
                                    </span>
                                    <input
                                        required
                                        type="number"
                                        min="0.01"
                                        step="0.01"
                                        value={form.data.price}
                                        onChange={(event) =>
                                            form.setData(
                                                "price",
                                                event.target.value,
                                            )
                                        }
                                        placeholder="28000"
                                        className="h-11 w-full rounded-lg border border-[#DDE4DC] bg-white px-3 text-sm dark:border-border dark:bg-background"
                                    />
                                    {form.errors.price && (
                                        <p className="mt-1 text-xs text-red-600">
                                            {form.errors.price}
                                        </p>
                                    )}
                                </label>

                                <label className="block sm:col-span-2">
                                    <span className="mb-1.5 block text-sm font-semibold">
                                        Deskripsi
                                    </span>
                                    <textarea
                                        rows={3}
                                        maxLength={1000}
                                        value={form.data.description}
                                        onChange={(event) =>
                                            form.setData(
                                                "description",
                                                event.target.value,
                                            )
                                        }
                                        placeholder="Deskripsi singkat menu..."
                                        className="w-full resize-y rounded-lg border border-[#DDE4DC] bg-white px-3 py-2.5 text-sm dark:border-border dark:bg-background"
                                    />
                                    {form.errors.description && (
                                        <p className="mt-1 text-xs text-red-600">
                                            {form.errors.description}
                                        </p>
                                    )}
                                </label>

                                <label className="block">
                                    <span className="mb-1.5 block text-sm font-semibold">
                                        Urutan tampilan
                                    </span>
                                    <input
                                        type="number"
                                        min={0}
                                        max={9999}
                                        required
                                        value={form.data.sort_order}
                                        onChange={(event) =>
                                            form.setData(
                                                "sort_order",
                                                Number(event.target.value),
                                            )
                                        }
                                        className="h-11 w-full rounded-lg border border-[#DDE4DC] bg-white px-3 text-sm dark:border-border dark:bg-background"
                                    />
                                    {form.errors.sort_order && (
                                        <p className="mt-1 text-xs text-red-600">
                                            {form.errors.sort_order}
                                        </p>
                                    )}
                                </label>

                                <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-[#E3E9E2] p-3 dark:border-border">
                                    <div>
                                        <span className="block text-sm font-bold">
                                            Menu tersedia
                                        </span>
                                        <span className="mt-1 block text-xs text-[#849087] dark:text-muted-foreground">
                                            Pelanggan dapat memesan menu ini.
                                        </span>
                                    </div>

                                    <input
                                        type="checkbox"
                                        checked={form.data.is_available}
                                        onChange={(event) =>
                                            form.setData(
                                                "is_available",
                                                event.target.checked,
                                            )
                                        }
                                        className="h-4 w-4 accent-[#19483D]"
                                    />
                                </label>
                            </div>

                            {/* Upload dan preview gambar */}
                            <div>
                                <p className="mb-1.5 text-sm font-semibold">
                                    Gambar menu
                                </p>

                                <label className="flex min-h-52 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-[#DDE4DC] bg-[#F8FAF7] text-center transition hover:border-[#668C75] dark:border-border dark:bg-muted/20">
                                    {!form.data.remove_image &&
                                    (imagePreview || editing?.image_url) ? (
                                        <img
                                            src={
                                                imagePreview ??
                                                editing?.image_url ??
                                                undefined
                                            }
                                            alt="Preview menu"
                                            className="h-52 w-full object-cover"
                                        />
                                    ) : (
                                        <div className="p-6">
                                            {form.data.image ? (
                                                <ImagePlus
                                                    size={32}
                                                    className="mx-auto text-[#668C75]"
                                                />
                                            ) : (
                                                <Upload
                                                    size={32}
                                                    className="mx-auto text-[#849087]"
                                                />
                                            )}
                                            <p className="mt-3 text-sm font-bold">
                                                Pilih gambar menu
                                            </p>
                                            <p className="mt-1 text-xs text-[#849087]">
                                                JPG, PNG, WebP · Maksimal 2 MB
                                            </p>
                                        </div>
                                    )}

                                    <input
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        className="sr-only"
                                        onChange={(event) => {
                                            const file =
                                                event.target.files?.[0] ?? null;

                                            form.setData((data) => ({
                                                ...data,
                                                image: file,
                                                remove_image: false,
                                            }));
                                        }}
                                    />
                                </label>

                                {form.errors.image && (
                                    <p className="mt-1 text-xs text-red-600">
                                        {form.errors.image}
                                    </p>
                                )}

                                {editing?.image_url && (
                                    <label className="mt-3 flex items-center gap-2 text-xs text-[#718078] dark:text-muted-foreground">
                                        <input
                                            type="checkbox"
                                            checked={form.data.remove_image}
                                            onChange={(event) =>
                                                form.setData(
                                                    "remove_image",
                                                    event.target.checked,
                                                )
                                            }
                                            className="h-4 w-4 accent-[#19483D]"
                                        />
                                        Hapus gambar saat ini
                                    </label>
                                )}
                            </div>
                        </div>

                        <div className="mt-6 flex flex-wrap gap-2 border-t border-[#EEF1EC] pt-5 dark:border-border">
                            <button
                                type="submit"
                                disabled={form.processing}
                                className="inline-flex items-center gap-2 rounded-lg bg-[#19483D] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#215A4A] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {editing ? (
                                    <Pencil size={16} />
                                ) : (
                                    <Plus size={16} />
                                )}
                                {form.processing
                                    ? "Menyimpan..."
                                    : editing
                                      ? "Simpan Perubahan"
                                      : "Tambah Menu"}
                            </button>

                            {editing && (
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="inline-flex items-center gap-2 rounded-lg border border-[#DDE4DC] px-4 py-2.5 text-sm font-semibold hover:bg-[#F6F8F5] dark:border-border dark:hover:bg-muted"
                                >
                                    <X size={16} />
                                    Batal
                                </button>
                            )}
                        </div>
                    </form>
                </section>

                {/* Pencarian dan filter daftar menu */}
                <form
                    onSubmit={applyFilters}
                    className="rounded-2xl border border-[#E3E9E2] bg-white p-4 shadow-sm md:p-5 dark:border-border dark:bg-card"
                >
                    <div className="mb-4 flex items-center gap-2">
                        <Search size={18} />
                        <h2 className="font-bold">Cari dan filter menu</h2>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Cari nama menu..."
                            className="h-10 rounded-lg border border-[#DDE4DC] bg-white px-3 text-sm dark:border-border dark:bg-background"
                        />

                        <select
                            value={categoryId}
                            onChange={(event) =>
                                setCategoryId(event.target.value)
                            }
                            className="h-10 rounded-lg border border-[#DDE4DC] bg-white px-3 text-sm dark:border-border dark:bg-background"
                        >
                            <option value="">Semua kategori</option>
                            {categories.map((category) => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>

                        <select
                            value={availability}
                            onChange={(event) =>
                                setAvailability(event.target.value)
                            }
                            className="h-10 rounded-lg border border-[#DDE4DC] bg-white px-3 text-sm dark:border-border dark:bg-background"
                        >
                            <option value="">Semua ketersediaan</option>
                            <option value="available">Tersedia</option>
                            <option value="unavailable">Tidak tersedia</option>
                        </select>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                        <button
                            type="submit"
                            className="rounded-lg bg-[#19483D] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#215A4A]"
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

                {/* Daftar menu dari database */}
                <section className="overflow-hidden rounded-2xl border border-[#E3E9E2] bg-white shadow-sm dark:border-border dark:bg-card">
                    <div className="border-b border-[#E9EEE8] p-5 dark:border-border">
                        <h2 className="font-black">Daftar Menu</h2>
                        <p className="mt-1 text-xs text-[#849087] dark:text-muted-foreground">
                            Menampilkan {menus.data.length} menu pada halaman
                            ini.
                        </p>
                    </div>

                    {menus.data.length === 0 ? (
                        <div className="px-5 py-14 text-center">
                            <MenuIcon
                                size={34}
                                className="mx-auto text-[#9AA59D]"
                            />
                            <p className="mt-4 font-bold">
                                Menu tidak ditemukan
                            </p>
                            <p className="mt-2 text-sm text-[#849087] dark:text-muted-foreground">
                                Tambahkan menu baru atau ubah filter pencarian.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-[#F8FAF7] text-xs font-bold text-[#718078] dark:bg-muted/40 dark:text-muted-foreground">
                                        <th className="px-5 py-4">Menu</th>
                                        <th className="px-4 py-4">Kategori</th>
                                        <th className="px-4 py-4">Harga</th>
                                        <th className="px-4 py-4">Status</th>
                                        <th className="px-4 py-4">Dipesan</th>
                                        <th className="px-5 py-4 text-right">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-[#EEF1EC] dark:divide-border">
                                    {menus.data.map((menu) => (
                                        <Fragment key={menu.id}>
                                            <tr className="hover:bg-[#FAFBF9] dark:hover:bg-muted/20">
                                                <td className="min-w-64 px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[#F1F5EF] dark:bg-muted">
                                                            {menu.image_url ? (
                                                                <img
                                                                    src={
                                                                        menu.image_url
                                                                    }
                                                                    alt={
                                                                        menu.name
                                                                    }
                                                                    className="h-full w-full object-cover"
                                                                />
                                                            ) : (
                                                                <ImagePlus
                                                                    size={22}
                                                                    className="m-auto mt-4 text-[#849087]"
                                                                />
                                                            )}
                                                        </div>

                                                        <div className="min-w-0">
                                                            <p className="font-bold">
                                                                {menu.name}
                                                            </p>
                                                            <p className="mt-1 line-clamp-2 text-xs text-[#849087] dark:text-muted-foreground">
                                                                {menu.description ||
                                                                    "Tidak ada deskripsi"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-4 py-4 text-sm">
                                                    {menu.category_name}
                                                </td>

                                                <td className="whitespace-nowrap px-4 py-4 text-sm font-bold">
                                                    {formatRupiah(menu.price)}
                                                </td>

                                                <td className="px-4 py-4">
                                                    <span
                                                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                                                            menu.is_available
                                                                ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                                                                : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                                                        }`}
                                                    >
                                                        {menu.is_available
                                                            ? "Tersedia"
                                                            : "Tidak tersedia"}
                                                    </span>
                                                </td>

                                                <td className="px-4 py-4 text-sm">
                                                    {menu.order_items_count}
                                                </td>

                                                <td className="px-5 py-4">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                startEditing(
                                                                    menu,
                                                                )
                                                            }
                                                            aria-label={`Edit ${menu.name}`}
                                                            className="rounded-lg border border-[#DDE4DC] p-2 hover:bg-[#F1F5EF] dark:border-border dark:hover:bg-muted"
                                                        >
                                                            <Pencil size={15} />
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                deleteMenu(menu)
                                                            }
                                                            aria-label={`Hapus ${menu.name}`}
                                                            className="rounded-lg border border-red-200 p-2 text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/30"
                                                        >
                                                            <Trash2 size={15} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        </Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Navigasi halaman */}
                    {menus.last_page > 1 && (
                        <div className="flex flex-col justify-between gap-4 border-t border-[#E9EEE8] p-4 sm:flex-row sm:items-center dark:border-border">
                            <p className="text-xs text-[#849087] dark:text-muted-foreground">
                                Menampilkan {menus.from ?? 0}–{menus.to ?? 0}{" "}
                                dari {menus.total} menu
                            </p>

                            <div className="flex flex-wrap gap-1">
                                {menus.links.map((link, index) => (
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
                                        className={`rounded-lg px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40 ${
                                            link.active
                                                ? "bg-[#19483D] font-bold text-white"
                                                : "border border-[#DDE4DC] hover:bg-[#F6F8F5] dark:border-border dark:hover:bg-muted"
                                        }`}
                                    >
                                        {paginationLabel(link.label)}
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
