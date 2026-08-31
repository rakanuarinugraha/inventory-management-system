"use client";

import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">Total Products</p>
          <p className="mt-2 text-2xl font-semibold text-card-foreground">--</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">Low Stock Items</p>
          <p className="mt-2 text-2xl font-semibold text-card-foreground">--</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">Warehouses</p>
          <p className="mt-2 text-2xl font-semibold text-card-foreground">--</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">Pending Orders</p>
          <p className="mt-2 text-2xl font-semibold text-card-foreground">--</p>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        Dashboard data will be connected in a future session.
      </p>
    </div>
  );
}
