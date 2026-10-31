// Memastikan modul Inertia Core dikenali sebagai modul yang akan diperluas.
import "@inertiajs/core";

// Mengambil tipe Auth dari definisi tipe proyek.
import type { Auth } from "./auth";

// Menambahkan deklarasi tipe untuk seluruh shared props Inertia.
declare module "@inertiajs/core" {
    export interface InertiaConfig {
        sharedPageProps: {
            auth: Auth;
            name: string;
            sidebarOpen: boolean;
        };
    }
}
