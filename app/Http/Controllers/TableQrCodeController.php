<?php

namespace App\Http\Controllers;

use App\Models\RestaurantTable;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TableQrCodeController extends Controller
{
    public function index(Request $request): Response
    {
        $baseUrl = $request->getSchemeAndHttpHost();

        $tables = RestaurantTable::query()
            ->orderBy('code')
            ->get()
            ->map(function (RestaurantTable $table) use ($baseUrl) {
                return [
                    'id' => $table->id,
                    'name' => $table->name,
                    'code' => $table->code,
                    'is_active' => $table->is_active,
                    'url' => $baseUrl . '/m/' . $table->qr_token,
                ];
            })
            ->values();

        return Inertia::render('admin/table-qrcodes', [
            'tables' => $tables,
        ]);
    }
}