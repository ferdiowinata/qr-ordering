<?php

namespace Database\Seeders;

use App\Models\MenuCategory;
use App\Models\MenuItem;
use App\Models\RestaurantTable;
use Illuminate\Database\Seeder;

class RestaurantDemoSeeder extends Seeder
{
    public function run(): void
    {
        /*
        |--------------------------------------------------------------------------
        | Data Meja
        |--------------------------------------------------------------------------
        */

        foreach (range(1, 5) as $number) {
            $code = 'T' . str_pad((string) $number, 2, '0', STR_PAD_LEFT);

            RestaurantTable::firstOrCreate(
                ['code' => $code],
                [
                    'name' => 'Meja ' . str_pad(
                        (string) $number,
                        2,
                        '0',
                        STR_PAD_LEFT
                    ),
                    'is_active' => true,
                ]
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Kategori Menu
        |--------------------------------------------------------------------------
        */

        $categoryData = [
            [
                'name' => 'Makanan Utama',
                'slug' => 'makanan-utama',
                'description' => 'Pilihan makanan utama restoran.',
                'sort_order' => 1,
            ],
            [
                'name' => 'Minuman',
                'slug' => 'minuman',
                'description' => 'Pilihan minuman dingin dan hangat.',
                'sort_order' => 2,
            ],
            [
                'name' => 'Camilan',
                'slug' => 'camilan',
                'description' => 'Camilan untuk menemani waktu santai.',
                'sort_order' => 3,
            ],
        ];

        $categories = [];

        foreach ($categoryData as $data) {
            $categories[$data['slug']] = MenuCategory::firstOrCreate(
                ['slug' => $data['slug']],
                [
                    'name' => $data['name'],
                    'description' => $data['description'],
                    'sort_order' => $data['sort_order'],
                    'is_active' => true,
                ]
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Data Menu
        |--------------------------------------------------------------------------
        */

        $menuData = [
            [
                'category' => 'makanan-utama',
                'name' => 'Nasi Goreng Spesial',
                'slug' => 'nasi-goreng-spesial',
                'description' => 'Nasi goreng dengan telur dan pelengkap.',
                'price' => 28000,
            ],
            [
                'category' => 'makanan-utama',
                'name' => 'Mie Goreng',
                'slug' => 'mie-goreng',
                'description' => 'Mie goreng dengan sayuran dan telur.',
                'price' => 24000,
            ],
            [
                'category' => 'makanan-utama',
                'name' => 'Ayam Bakar',
                'slug' => 'ayam-bakar',
                'description' => 'Ayam bakar dengan nasi dan sambal.',
                'price' => 32000,
            ],
            [
                'category' => 'minuman',
                'name' => 'Es Teh Manis',
                'slug' => 'es-teh-manis',
                'description' => 'Teh manis dingin yang menyegarkan.',
                'price' => 8000,
            ],
            [
                'category' => 'minuman',
                'name' => 'Kopi Susu',
                'slug' => 'kopi-susu',
                'description' => 'Perpaduan kopi dan susu.',
                'price' => 18000,
            ],
            [
                'category' => 'camilan',
                'name' => 'Kentang Goreng',
                'slug' => 'kentang-goreng',
                'description' => 'Kentang goreng renyah.',
                'price' => 16000,
            ],
        ];

        foreach ($menuData as $data) {
            MenuItem::firstOrCreate(
                ['slug' => $data['slug']],
                [
                    'category_id' => $categories[$data['category']]->id,
                    'name' => $data['name'],
                    'description' => $data['description'],
                    'price' => $data['price'],
                    'is_available' => true,
                    'sort_order' => 0,
                ]
            );
        }
    }
}