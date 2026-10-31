import { Head, router, useForm } from "@inertiajs/react";
import { useState, type FormEvent } from "react";
import {
    Check,
    FolderOpen,
    Pencil,
    Plus,
    Save,
    Tags,
    Trash2,
    X,
} from "lucide-react";

type Category = {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    sort_order: number;
    is_active: boolean;
    menu_items_count: number;
};

type Props = {
    categories: Category[];
};

type CategoryForm = {
    name: string;
    description: string;
    sort_order: number;
    is_active: boolean;
};

const initialForm: CategoryForm = {
    name: "",
    description: "",
    sort_order: 0,
    is_active: true,
};

export default function CategoryIndex({ categories }: Props) {
    const [editing, setEditing] = useState<Category | null>(null);
    const [notice, setNotice] = useState("");
    const [actionError, setActionError] = useState("");

    const form = useForm<CategoryForm>(initialForm);

    function resetForm() {
        form.reset();
        form.clearErrors();
        setEditing(null);
    }

    function startEditing(category: Category) {
        setEditing(category);
        setNotice("");
        setActionError("");
        form.clearErrors();

        form.setData({
            name: category.name,
            description: category.description ?? "",
            sort_order: category.sort_order,
            is_active: category.is_active,
        });
    }

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setNotice("");
        setActionError("");

        const options = {
            preserveScroll: true,
            onSuccess: () => {
                setNotice(
                    editing
                        ? "Kategori berhasil diperbarui."
                        : "Kategori berhasil ditambahkan.",
                );
                resetForm();
            },
        };

        if (editing) {
            form.put(`/admin/categories/${editing.id}`, options);
        } else {
            form.post("/admin/categories", options);
        }
    }

    function deleteCategory(category: Category) {
        if (category.menu_items_count > 0) {
            setActionError(
                "Kategori masih memiliki menu dan tidak dapat dihapus.",
            );
            return;
        }

        if (
            !window.confirm(
                `Apakah kamu yakin ingin menghapus kategori "${category.name}"?`,
            )
        ) {
            return;
        }

        setNotice("");
        setActionError("");

        router.delete(`/admin/categories/${category.id}`, {
            preserveScroll: true,
            onSuccess: () => setNotice("Kategori berhasil dihapus."),
            onError: (errors) => {
                setActionError(
                    errors.category ??
                        "Kategori gagal dihapus. Periksa kembali data terkait.",
                );
            },
        });
    }

    return (
        <>
            <Head title="Kategori Menu | Rasa Kita" />

            <main className="flex min-w-0 flex-1 flex-col gap-6 bg-[#F6F8F5] p-4 text-[#1B2D25] md:p-7 dark:bg-background dark:text-foreground">
                <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <div className="flex items-center gap-2 text-sm font-semibold text-[#718078] dark:text-muted-foreground">
                            <Tags size={17} />
                            Pengelolaan menu
                        </div>

                        <h1 className="mt-2 text-3xl font-black tracking-tight">
                            Kategori Menu
                        </h1>

                        <p className="mt-2 text-sm text-[#758078] dark:text-muted-foreground">
                            Kelompokkan menu agar pelanggan mudah menemukan
                            makanan dan minuman.
                        </p>
                    </div>

                    <div className="flex items-center gap-3 rounded-xl border border-[#E3E9E2] bg-white px-4 py-3 dark:border-border dark:bg-card">
                        <FolderOpen size={20} className="text-[#19483D]" />
                        <div>
                            <p className="text-xs text-[#849087] dark:text-muted-foreground">
                                Total kategori
                            </p>
                            <p className="text-xl font-black">
                                {categories.length}
                            </p>
                        </div>
                    </div>
                </header>

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

                <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(320px,0.8fr)_minmax(0,1.2fr)]">
                    <section className="h-fit rounded-2xl border border-[#E3E9E2] bg-white p-5 shadow-sm dark:border-border dark:bg-card">
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
                                    {editing
                                        ? "Edit Kategori"
                                        : "Tambah Kategori"}
                                </h2>
                                <p className="mt-1 text-xs text-[#849087] dark:text-muted-foreground">
                                    Slug akan dibuat otomatis.
                                </p>
                            </div>
                        </div>

                        <form onSubmit={submit} className="mt-6 space-y-5">
                            <label className="block">
                                <span className="mb-1.5 block text-sm font-semibold">
                                    Nama kategori
                                </span>
                                <input
                                    required
                                    maxLength={100}
                                    value={form.data.name}
                                    onChange={(event) =>
                                        form.setData("name", event.target.value)
                                    }
                                    placeholder="Contoh: Makanan Utama"
                                    className="h-11 w-full rounded-lg border border-[#DDE4DC] bg-white px-3 text-sm outline-none focus:border-[#668C75] focus:ring-2 focus:ring-[#668C75]/15 dark:border-border dark:bg-background"
                                />
                                {form.errors.name && (
                                    <span className="mt-1 block text-xs text-red-600">
                                        {form.errors.name}
                                    </span>
                                )}
                            </label>

                            <label className="block">
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
                                    placeholder="Deskripsi singkat kategori (opsional)"
                                    className="w-full resize-y rounded-lg border border-[#DDE4DC] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#668C75] focus:ring-2 focus:ring-[#668C75]/15 dark:border-border dark:bg-background"
                                />
                                {form.errors.description && (
                                    <span className="mt-1 block text-xs text-red-600">
                                        {form.errors.description}
                                    </span>
                                )}
                            </label>

                            <label className="block">
                                <span className="mb-1.5 block text-sm font-semibold">
                                    Urutan tampilan
                                </span>
                                <input
                                    required
                                    type="number"
                                    min={0}
                                    max={9999}
                                    value={form.data.sort_order}
                                    onChange={(event) =>
                                        form.setData(
                                            "sort_order",
                                            Number(event.target.value),
                                        )
                                    }
                                    className="h-11 w-full rounded-lg border border-[#DDE4DC] bg-white px-3 text-sm outline-none focus:border-[#668C75] dark:border-border dark:bg-background"
                                />
                                {form.errors.sort_order && (
                                    <span className="mt-1 block text-xs text-red-600">
                                        {form.errors.sort_order}
                                    </span>
                                )}
                            </label>

                            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-[#E3E9E2] p-3 dark:border-border">
                                <div>
                                    <span className="block text-sm font-bold">
                                        Kategori aktif
                                    </span>
                                    <span className="mt-1 block text-xs text-[#849087] dark:text-muted-foreground">
                                        Kategori dapat ditampilkan pada menu
                                        pelanggan.
                                    </span>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={form.data.is_active}
                                    onChange={(event) =>
                                        form.setData(
                                            "is_active",
                                            event.target.checked,
                                        )
                                    }
                                    className="h-4 w-4 accent-[#19483D]"
                                />
                            </label>
                            {form.errors.is_active && (
                                <p className="text-xs text-red-600">
                                    {form.errors.is_active}
                                </p>
                            )}

                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="submit"
                                    disabled={form.processing}
                                    className="inline-flex items-center gap-2 rounded-lg bg-[#19483D] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#215A4A] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {editing ? (
                                        <Save size={16} />
                                    ) : (
                                        <Plus size={16} />
                                    )}
                                    {form.processing
                                        ? "Menyimpan..."
                                        : editing
                                          ? "Simpan Perubahan"
                                          : "Tambah Kategori"}
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

                    <section className="min-w-0 overflow-hidden rounded-2xl border border-[#E3E9E2] bg-white shadow-sm dark:border-border dark:bg-card">
                        <div className="border-b border-[#E9EEE8] p-5 dark:border-border">
                            <h2 className="font-black">Daftar Kategori</h2>
                            <p className="mt-1 text-xs text-[#849087] dark:text-muted-foreground">
                                Urutan kategori mengikuti nomor tampilan.
                            </p>
                        </div>

                        {categories.length === 0 ? (
                            <div className="px-5 py-14 text-center">
                                <Tags
                                    size={32}
                                    className="mx-auto text-[#9AA59D]"
                                />
                                <p className="mt-4 font-bold">
                                    Belum ada kategori
                                </p>
                                <p className="mt-1 text-sm text-[#849087] dark:text-muted-foreground">
                                    Tambahkan kategori pertama melalui formulir.
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-[#EEF1EC] dark:divide-border">
                                {categories.map((category) => (
                                    <article
                                        key={category.id}
                                        className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between"
                                    >
                                        <div className="flex min-w-0 items-start gap-3">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F1F5EF] text-[#53705B] dark:bg-muted dark:text-emerald-300">
                                                <Tags size={19} />
                                            </div>

                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h3 className="font-bold">
                                                        {category.name}
                                                    </h3>
                                                    <span
                                                        className={`rounded-full px-2 py-1 text-[10px] font-bold ${
                                                            category.is_active
                                                                ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                                                                : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                                                        }`}
                                                    >
                                                        {category.is_active
                                                            ? "Aktif"
                                                            : "Nonaktif"}
                                                    </span>
                                                </div>

                                                <p className="mt-1 break-all text-xs text-[#849087] dark:text-muted-foreground">
                                                    {category.slug}
                                                </p>

                                                {category.description && (
                                                    <p className="mt-2 text-sm text-[#718078] dark:text-muted-foreground">
                                                        {category.description}
                                                    </p>
                                                )}

                                                <p className="mt-2 text-xs text-[#849087] dark:text-muted-foreground">
                                                    {category.menu_items_count}{" "}
                                                    menu · Urutan{" "}
                                                    {category.sort_order}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex shrink-0 gap-2">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    startEditing(category)
                                                }
                                                aria-label={`Edit ${category.name}`}
                                                className="inline-flex items-center gap-1.5 rounded-lg border border-[#DDE4DC] px-3 py-2 text-xs font-bold hover:bg-[#F6F8F5] dark:border-border dark:hover:bg-muted"
                                            >
                                                <Pencil size={14} />
                                                Edit
                                            </button>

                                            <button
                                                type="button"
                                                disabled={
                                                    category.menu_items_count >
                                                    0
                                                }
                                                title={
                                                    category.menu_items_count >
                                                    0
                                                        ? "Kategori masih memiliki menu."
                                                        : "Hapus kategori"
                                                }
                                                onClick={() =>
                                                    deleteCategory(category)
                                                }
                                                aria-label={`Hapus ${category.name}`}
                                                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/30"
                                            >
                                                <Trash2 size={14} />
                                                Hapus
                                            </button>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </main>
        </>
    );
}
