<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreCustomerOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Pelanggan boleh mengirim pesanan melalui QR meja.
        return true;
    }

    public function rules(): array
    {
        return [
            'submission_key' => [
                'required',
                'uuid',
            ],

            'customer_name' => [
                'nullable',
                'string',
                'max:100',
            ],

            'notes' => [
                'nullable',
                'string',
                'max:1000',
            ],

            'items' => [
                'required',
                'array',
                'min:1',
                'max:50',
            ],

            'items.*.menu_item_id' => [
                'required',
                'integer',
                'distinct',
                'exists:menu_items,id',
            ],

            'items.*.quantity' => [
                'required',
                'integer',
                'min:1',
                'max:20',
            ],

            'items.*.notes' => [
                'nullable',
                'string',
                'max:500',
            ],
        ];
    }
}