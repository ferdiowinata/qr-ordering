import inertia from "@inertiajs/vite";
import { wayfinder } from "@laravel/vite-plugin-wayfinder";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import laravel from "laravel-vite-plugin";
import { bunny } from "laravel-vite-plugin/fonts";
import { defineConfig, loadEnv } from "vite";

// Membaca konfigurasi lokal dari file .env.
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), "");

    // Menggunakan IPv4 laptop sebagai alamat server Vite.
    const devServerHost = env.DEV_SERVER_HOST || "127.0.0.1";

    return {
        plugins: [
            laravel({
                input: ["resources/css/app.css", "resources/js/app.tsx"],
                refresh: true,
                fonts: [
                    bunny("Instrument Sans", {
                        weights: [400, 500, 600],
                    }),
                ],
            }),
            inertia(),
            react(),
            babel({
                presets: [reactCompilerPreset()],
            }),
            tailwindcss(),
            wayfinder({
                formVariants: true,
            }),
        ],

        server: {
            // Membatasi Vite agar mendengarkan IPv4 laptop yang ditentukan.
            host: devServerHost,

            // Mempertahankan port Vite agar URL aset tidak berubah.
            port: 5173,
            strictPort: true,

            // Mengarahkan koneksi HMR ke IPv4 laptop, bukan IPv6 localhost.
            hmr: {
                host: devServerHost,
            },

            // Mengizinkan aplikasi Laravel lokal dan perangkat HP mengakses Vite.
            cors: {
                origin: [
                    "http://localhost:8000",
                    "http://127.0.0.1:8000",
                    "http://[::1]:8000",
                    `http://${devServerHost}:8000`,
                ],
            },

            // Mengabaikan folder yang tidak perlu dipantau oleh Vite.
            watch: {
                ignored: [
                    "**/.agents/**",
                    "**/.claude/**",
                    "**/.cursor/**",
                    "**/.junie/**",
                    "**/vendor/**",
                ],
            },
        },
    };
});
