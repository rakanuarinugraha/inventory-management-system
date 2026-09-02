"use client";

import { useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { useStockOpnames } from "@/hooks/use-stock-opname";
import type { StockOpname } from "@/types/stock-opname";
import { Eye, ClipboardCheck } from "lucide-react";

function opnameStatusLabel(status: string) {
  const map: Record<string, string> = {
    PENDING: "Pending",
    APPROVED: "Approved",
    REJECTED: "Rejected",
  };
  return map[status] ?? status;
}

function opnameStatusVariant(
  status: string
): "default" | "secondary" | "destructive" | "success" | "warning" | "outline" {
  const map: Record<
    string,
    "default" | "secondary" | "destructive" | "success" | "warning" | "outline"
  > = {
    PENDING: "warning",
    APPROVED: "success",
    REJECTED: "destructive",
  };
  return map[status] ?? "default";
}

export default function StockOpnamesPage() {
  const { isAuthenticated, user: currentUser } = useAuth();
  const router = useRouter();
  const { data: opnames = [], isLoading } = useStockOpnames();

  useEffect(() => {
    if (!isAuthenticated) router.replace("/login");
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;

  const columns: DataTableColumn<StockOpname & Record<string, unknown>>[] = [
    {
      key: "warehouse",
      header: "Warehouse",
      sortable: true,
      cell: (row) => (
        <div>
          <button
            onClick={() => router.push(`/stock-opnames/${row.id}`)}
            className="font-medium text-foreground hover:text-primary hover:underline text-left transition-colors"
          >
            {row.warehouse.name}
          </button>
          <div className="text-[10px] text-muted-foreground">
            ID: {row.id.slice(0, 8).toUpperCase()}
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => (
        <StatusBadge
          label={opnameStatusLabel(row.status)}
          variant={opnameStatusVariant(row.status)}
        />
      ),
    },
    {
      key: "items",
      header: "Items Count",
      cell: (row) => (
        <span className="text-foreground">
          {row.items.length} product{row.items.length > 1 ? "s" : ""}
        </span>
      ),
    },
    {
      key: "createdBy",
      header: "Counted By",
      cell: (row) => (
        <span className="text-foreground">{row.creator.name}</span>
      ),
    },
    {
      key: "createdAt",
      header: "Date",
      sortable: true,
      cell: (row) => (
        <span className="text-muted-foreground">
          {new Date(row.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      cell: (row) => {
        const isPending = row.status === "PENDING";
        const canApprove =
          isPending &&
          (currentUser?.role === "MANAGER" || currentUser?.role === "ADMIN");

        return (
          <div className="flex items-center gap-2">
            {canApprove ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/stock-opnames/${row.id}`)}
                className="h-8 gap-1.5 text-xs text-primary border-primary/30 hover:bg-primary/10"
              >
                <ClipboardCheck className="size-3.5" />
                Review & Approve
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/stock-opnames/${row.id}`)}
                className="h-8 gap-1.5 text-xs"
              >
                <Eye className="size-3.5" />
                View Details
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stock Opname"
        description="Perform physical stock counts and reconcile discrepancies."
        actionLabel="New Opname"
        onAction={() => router.push("/stock-opnames/create")}
      />

      <DataTable
        columns={columns}
        data={opnames as (StockOpname & Record<string, unknown>)[]}
        isLoading={isLoading}
        emptyMessage="No stock opnames found."
      />
    </div>
  );
}
