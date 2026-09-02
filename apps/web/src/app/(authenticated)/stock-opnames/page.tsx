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
import { useStockOpnames } from "@/hooks/use-stock-opname";
import type { StockOpname } from "@/types/stock-opname";

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
  const { isAuthenticated } = useAuth();
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
        <span className="text-foreground">{row.warehouse.name}</span>
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
      header: "Items",
      cell: (row) => (
        <span className="text-foreground">{row.items.length}</span>
      ),
    },
    {
      key: "createdBy",
      header: "Created By",
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
