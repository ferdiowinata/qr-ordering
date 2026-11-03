import { createInertiaApp } from "@inertiajs/react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { initializeTheme } from "@/hooks/use-appearance";
import AppLayout from "@/layouts/app-layout";
import AuthLayout from "@/layouts/auth-layout";
import SettingsLayout from "@/layouts/settings/layout";

const appName = import.meta.env.VITE_APP_NAME || "Laravel";

void createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    // Menentukan layout berdasarkan jenis halaman Inertia.
    layout: (name) => {
        switch (true) {
            // Halaman publik tidak menggunakan layout admin.
            case name === "welcome":
                return null;

            // Seluruh halaman pelanggan tidak menggunakan sidebar admin.
            case name.startsWith("ordering/"):
                return null;

            // Halaman autentikasi menggunakan layout khusus.
            case name.startsWith("auth/"):
                return AuthLayout;

            // Halaman pengaturan menggunakan layout admin dan settings.
            case name.startsWith("settings/"):
                return [AppLayout, SettingsLayout];

            // Halaman admin lainnya menggunakan layout utama.
            default:
                return AppLayout;
        }
    },
    strictMode: true,
    withApp(app) {
        return (
            <TooltipProvider delayDuration={0}>
                {app}
                <Toaster />
            </TooltipProvider>
        );
    },
    progress: {
        color: "#4B5563",
    },
});

// This will set light / dark mode on load...
initializeTheme();
