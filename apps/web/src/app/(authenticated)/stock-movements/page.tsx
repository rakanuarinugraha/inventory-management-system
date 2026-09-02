"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { StockInForm } from "./stock-in-form";
import { StockOutForm } from "./stock-out-form";
import { Button } from "@/components/ui/button";
import { Package, PackageMinus } from "lucide-react";

type Tab = "stock-in" | "stock-out";

export default function StockMovementsPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) router.replace("/login");
  }, [isAuthenticated, router]);

  const [activeTab, setActiveTab] = useState<Tab>("stock-in");

  if (!isAuthenticated) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stock Movements"
        description="Record incoming and outgoing stock."
      />

      <div className="flex gap-2">
        <Button
          variant={activeTab === "stock-in" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab("stock-in")}
          className="gap-1.5"
        >
          <Package className="size-4" />
          Stock In
        </Button>
        <Button
          variant={activeTab === "stock-out" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab("stock-out")}
          className="gap-1.5"
        >
          <PackageMinus className="size-4" />
          Stock Out
        </Button>
      </div>

      {activeTab === "stock-in" && <StockInForm />}
      {activeTab === "stock-out" && <StockOutForm />}
    </div>
  );
}
