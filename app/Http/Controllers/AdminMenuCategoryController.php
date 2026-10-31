<?php

namespace App\Http\Controllers;

use App\Models\MenuCategory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class AdminMenuCategoryController extends Controller
{
    public function index(): Response
    {
        $categories = MenuCategory::query()
            ->withCount('menuItems')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->map(fn (MenuCategory $category) => [
                'id' => $category->id,
                'name' => $category->name,
                'slug' => $category->slug,
                'description' => $category->description,
                'sort_order' => $category->sort_order,
                'is_active' => $category->is_active,
                'menu_items_count' => $category->menu_items_count,
            ]);

        return Inertia::render('admin/categories/index', [
            'categories' => $categories,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:1000'],
            'sort_order' => ['required', 'integer', 'min:0', 'max:9999'],
            'is_active' => ['required', 'boolean'],
        ]);

        MenuCategory::create([
            ...$validated,
            'slug' => $this->makeUniqueSlug($validated['name']),
        ]);

        return to_route('admin.categories.index')
            ->with('success', 'Kategori berhasil ditambahkan.');
    }

    public function update(
        Request $request,
        MenuCategory $menuCategory
    ): RedirectResponse {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:1000'],
            'sort_order' => ['required', 'integer', 'min:0', 'max:9999'],
            'is_active' => ['required', 'boolean'],
        ]);

        $menuCategory->update([
            ...$validated,
            'slug' => $this->makeUniqueSlug(
                $validated['name'],
                $menuCategory->id
            ),
        ]);

        return to_route('admin.categories.index')
            ->with('success', 'Kategori berhasil diperbarui.');
    }

    public function destroy(MenuCategory $menuCategory): RedirectResponse
    {
        if ($menuCategory->menuItems()->exists()) {
            return back()->withErrors([
                'category' => 'Kategori tidak dapat dihapus karena masih memiliki menu. Pindahkan menu ke kategori lain terlebih dahulu.',
            ]);
        }

        $menuCategory->delete();

        return to_route('admin.categories.index')
            ->with('success', 'Kategori berhasil dihapus.');
    }

    private function makeUniqueSlug(
        string $name,
        ?int $ignoreId = null
    ): string {
        $base = Str::slug($name);

        if ($base === '') {
            $base = 'kategori';
        }

        $slug = $base;
        $suffix = 2;

        while (
            MenuCategory::query()
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
