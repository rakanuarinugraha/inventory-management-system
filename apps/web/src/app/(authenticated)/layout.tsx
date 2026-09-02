"use client";

import { useAuth } from "@/contexts/auth-context";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { AuthenticatedLayout } from "@/components/layout/authenticated-layout";

const pageTitles: Record<string, string> = {
  dashboard: "Dashboard",
  products: "Products",
  categories: "Categories",
  warehouses: "Warehouses",
  suppliers: "Suppliers",
  "stock-movements": "Stock Movements",
  "stock-opnames": "Stock Opname",
  "purchase-orders": "Purchase Orders",
  "movement-history": "Movement History",
  reports: "Reports",
  users: "User Management",
};

export default function AuthenticatedRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return <AuthenticatedLayoutWithContent>{children}</AuthenticatedLayoutWithContent>;
}

function AuthenticatedLayoutWithContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const segment = pathname.split("/").filter(Boolean)[0] || "dashboard";
  const title = pageTitles[segment] || "IMS";

  return <AuthenticatedLayout title={title}>{children}</AuthenticatedLayout>;
}
