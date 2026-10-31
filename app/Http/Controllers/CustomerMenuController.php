<?php

namespace App\Http\Controllers;

use App\Models\MenuCategory;
use App\Models\MenuItem;
use App\Models\RestaurantTable;
use Inertia\Inertia;
use Inertia\Response;

class CustomerMenuController extends Controller
{
    public function show(string $token): Response
    {
        // Cari meja berdasarkan token QR yang valid dan aktif.
        $table = RestaurantTable::query()
            ->where('qr_token', $token)
            ->where('is_active', true)
            ->firstOrFail();

        // Ambil kategori aktif beserta menu yang tersedia.
        $categories = MenuCategory::query()
            ->where('is_active', true)
            ->with([
                'menuItems' => function ($query) {
                    $query
                        ->where('is_available', true)
                        ->orderBy('sort_order')
                        ->orderBy('name');
                },
            ])
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->map(function (MenuCategory $category) {
                return [
                    'id' => $category->id,
                    'name' => $category->name,
                    'slug' => $category->slug,

                    'items' => $category->menuItems
                        ->map(function (MenuItem $item) {
                            return [
                                'id' => $item->id,
                                'name' => $item->name,
                                'slug' => $item->slug,
                                'description' => $item->description,
                                'price' => $item->price,
                                'image_path' => $item->image_path,
                            ];
                        })
                        ->values(),
                ];
            })
            ->values();

        return Inertia::render('ordering/menu', [
        'token' => $table->qr_token,

        'table' => [
            'name' => $table->name,
            'code' => $table->code,
        ],

        'categories' => $categories,
    ]);
    }
}