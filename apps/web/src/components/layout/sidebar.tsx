"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import {
  LayoutDashboard,
  Package,
  Tags,
  Warehouse,
  Truck,
  ArrowLeftRight,
  ClipboardCheck,
  ShoppingCart,
  BarChart3,
  Box,
  Users,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Products", href: "/products", icon: Package },
  { label: "Categories", href: "/categories", icon: Tags },
  { label: "Warehouses", href: "/warehouses", icon: Warehouse },
  { label: "Suppliers", href: "/suppliers", icon: Truck },
  { label: "Stock Movements", href: "/stock-movements", icon: ArrowLeftRight },
  { label: "Stock Opname", href: "/stock-opnames", icon: ClipboardCheck },
  { label: "Purchase Orders", href: "/purchase-orders", icon: ShoppingCart },
  { label: "Reports", href: "/reports", icon: BarChart3 },
  { label: "Users", href: "/users", icon: Users, adminOnly: true },
];

interface SidebarProps {
  isCollapsed?: boolean;
}

export function Sidebar({ isCollapsed = false }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const visibleItems = navItems.filter(
    (item) => !("adminOnly" in item && item.adminOnly) || user?.role === "ADMIN"
  );

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground",
        "h-screen sticky top-0",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <div className={cn("flex items-center gap-2 border-b border-sidebar-border px-4 py-4", isCollapsed && "justify-center px-2")}>
        <Box className="size-6 shrink-0 text-sidebar-primary" />
        {!isCollapsed && (
          <span className="text-lg font-semibold tracking-tight">IMS</span>
        )}
      </div>
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <ul className="flex flex-col gap-0.5">
          {visibleItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isCollapsed && "justify-center px-2",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-primary"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  )}
                >
                  <item.icon className={cn("size-4 shrink-0", isActive && "text-sidebar-primary")} />
                  {!isCollapsed && <span>{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
