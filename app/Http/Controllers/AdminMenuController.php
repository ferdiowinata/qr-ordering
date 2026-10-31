<?php

namespace App\Http\Controllers;

use App\Models\MenuCategory;
use App\Models\MenuItem;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AdminMenuController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'category_id' => [
                'nullable',
                'integer',
                'exists:menu_categories,id',
            ],
            'availability' => [
                'nullable',
                Rule::in(['available', 'unavailable']),
            ],
        ]);

        $search = trim((string) ($filters['search'] ?? ''));
        $categoryId = $filters['category_id'] ?? null;
        $availability = $filters['availability'] ?? '';

        $menus = MenuItem::query()
            ->with('category:id,name')
            ->withCount('orderItems')
            ->when($search !== '', function ($query) use ($search) {
                $query->where('name', 'like', "%{$search}%");
            })
            ->when(
                $categoryId,
                fn ($query) => $query->where('category_id', $categoryId)
            )
            ->when(
                $availability === 'available',
                fn ($query) => $query->where('is_available', true)
            )
            ->when(
                $availability === 'unavailable',
                fn ($query) => $query->where('is_available', false)
            )
            ->orderBy('sort_order')
            ->latest()
            ->paginate(10)
            ->withQueryString();

        $menus->through(fn (MenuItem $menu) => [
            'id' => $menu->id,
            'category_id' => $menu->category_id,
            'category_name' => $menu->category?->name ?? '-',
            'name' => $menu->name,
            'slug' => $menu->slug,
            'description' => $menu->description,
            'price' => $menu->price,
            'image_url' => $menu->image_path
                ? Storage::disk('public')->url($menu->image_path)
                : null,
            'is_available' => $menu->is_available,
            'sort_order' => $menu->sort_order,
            'order_items_count' => $menu->order_items_count,
        ]);

        $categories = MenuCategory::query()
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get(['id', 'name', 'is_active']);

        return Inertia::render('admin/menus/index', [
            'menus' => $menus,
            'categories' => $categories,
            'filters' => [
                'search' => $search,
                'category_id' => $categoryId,
                'availability' => $availability,
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'category_id' => [
                'required',
                'integer',
                'exists:menu_categories,id',
            ],
            'name' => ['required', 'string', 'max:150'],
            'description' => ['nullable', 'string', 'max:1000'],
            'price' => [
                'required',
                'numeric',
                'min:0.01',
                'max:9999999999.99',
            ],
            'image' => [
                'nullable',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:2048',
            ],
            'is_available' => ['required', 'boolean'],
            'sort_order' => [
                'required',
                'integer',
                'min:0',
                'max:9999',
            ],
        ]);

        $imagePath = $request->file('image')
            ?->store('menu-items', 'public');

        MenuItem::create([
            'category_id' => $validated['category_id'],
            'name' => $validated['name'],
            'slug' => $this->makeUniqueSlug($validated['name']),
            'description' => $validated['description'] ?? null,
            'price' => $validated['price'],
            'image_path' => $imagePath,
            'is_available' => $validated['is_available'],
            'sort_order' => $validated['sort_order'],
        ]);

        return to_route('admin.menus.index')
            ->with('success', 'Menu berhasil ditambahkan.');
    }

    public function update(
        Request $request,
        MenuItem $menuItem
    ): RedirectResponse {
        $validated = $request->validate([
            'category_id' => [
                'required',
                'integer',
                'exists:menu_categories,id',
            ],
            'name' => ['required', 'string', 'max:150'],
            'description' => ['nullable', 'string', 'max:1000'],
            'price' => [
                'required',
                'numeric',
                'min:0.01',
                'max:9999999999.99',
            ],
            'image' => [
                'nullable',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:2048',
            ],
            'remove_image' => ['nullable', 'boolean'],
            'is_available' => ['required', 'boolean'],
            'sort_order' => [
                'required',
                'integer',
                'min:0',
                'max:9999',
            ],
        ]);

        $oldImagePath = $menuItem->image_path;
        $newImagePath = $oldImagePath;

        if ($request->hasFile('image')) {
            $newImagePath = $request->file('image')
                ->store('menu-items', 'public');
        } elseif ($request->boolean('remove_image')) {
            $newImagePath = null;
        }

        $menuItem->update([
            'category_id' => $validated['category_id'],
            'name' => $validated['name'],
            'slug' => $this->makeUniqueSlug(
                $validated['name'],
                $menuItem->id
            ),
            'description' => $validated['description'] ?? null,
            'price' => $validated['price'],
            'image_path' => $newImagePath,
            'is_available' => $validated['is_available'],
            'sort_order' => $validated['sort_order'],
        ]);

        if (
            $oldImagePath &&
            $oldImagePath !== $newImagePath
        ) {
            Storage::disk('public')->delete($oldImagePath);
        }

        return to_route('admin.menus.index')
            ->with('success', 'Menu berhasil diperbarui.');
    }

    public function destroy(MenuItem $menuItem): RedirectResponse
    {
        $imagePath = $menuItem->image_path;

        $menuItem->delete();

        if ($imagePath) {
            Storage::disk('public')->delete($imagePath);
        }

        return to_route('admin.menus.index')
            ->with('success', 'Menu berhasil dihapus.');
    }

    private function makeUniqueSlug(
        string $name,
        ?int $ignoreId = null
    ): string {
        $base = Str::slug($name);

        if ($base === '') {
            $base = 'menu';
        }

        $slug = $base;
        $suffix = 2;

        while (
            MenuItem::query()
                ->where('slug', $slug)
                ->when(
                    $ignoreId !== null,
                    fn ($query) => $query->where('id', '!=', $ignoreId)
                )
                ->exists()
        ) {
            $slug = $base . '-' . $suffix;
            $suffix++;
        }

        return $slug;
    }
}
