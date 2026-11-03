import { Link } from "@inertiajs/react";
import {
    ClipboardList,
    CreditCard,
    LayoutGrid,
    QrCode,
    Tags,
    UtensilsCrossed,
} from "lucide-react";
import AppLogo from "@/components/app-logo";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";
import { dashboard } from "@/routes";
import type { NavItem } from "@/types";

// Mengatur daftar navigasi utama pada sidebar admin.
const mainNavItems: NavItem[] = [
    {
        title: "Dashboard",
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: "Meja & QR Code",
        href: "/admin/table-qr",
        icon: QrCode,
    },
    {
        title: "Pesanan",
        href: "/admin/orders",
        icon: ClipboardList,
    },
    {
        title: "Sesi Dine-in",
        href: "/admin/dine-in-sessions",
        icon: CreditCard,
    },
    {
        title: "Kategori Menu",
        href: "/admin/categories",
        icon: Tags,
    },
    {
        title: "Manajemen Menu",
        href: "/admin/menus",
        icon: UtensilsCrossed,
    },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
