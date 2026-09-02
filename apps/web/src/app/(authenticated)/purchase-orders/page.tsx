"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  usePurchaseOrders,
  useTransitionPOStatus,
} from "@/hooks/use-purchase-orders";
import type { PurchaseOrder, POStatus } from "@/types/purchase-order";
import { CreatePODialog } from "./create-po-dialog";
import { PODetailDialog } from "./po-detail-dialog";
import {
  Eye,
  Send,
  XCircle,
  Search,
} from "lucide-react";
import { ApiError } from "@/lib/api";

type StatusFilterValue = "ALL" | POStatus;

const STATUS_FILTERS: { value: StatusFilterValue; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "DRAFT", label: "Draft" },
  { value: "SUBMITTED", label: "Submitted" },
  { value: "PARTIALLY_RECEIVED", label: "Partially Received" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

function poStatusLabel(status: string) {
  const map: Record<string, string> = {
    DRAFT: "Draft",
    SUBMITTED: "Submitted",
    PARTIALLY_RECEIVED: "Partially Received",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
  };
  return map[status] ?? status;
}

function poStatusVariant(
  status: string
): "default" | "secondary" | "destructive" | "success" | "warning" | "outline" {
  const map: Record<
    string,
    "default" | "secondary" | "destructive" | "success" | "warning" | "outline"
  > = {
    DRAFT: "outline",
    SUBMITTED: "default",
    PARTIALLY_RECEIVED: "warning",
    COMPLETED: "success",
    CANCELLED: "destructive",
  };
  return map[status] ?? "default";
}

export default function PurchaseOrdersPage() {
  const { isAuthenticated, user: currentUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) router.replace("/login");
  }, [isAuthenticated, router]);

  const { data: purchaseOrders = [], isLoading } = usePurchaseOrders();
  const transitionStatus = useTransitionPOStatus();

  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  // Confirm dialog state for actions
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [targetPO, setTargetPO] = useState<PurchaseOrder | null>(null);
  const [targetAction, setTargetAction] = useState<"SUBMITTED" | "CANCELLED">(
    "SUBMITTED"
  );

  const canManage =
    currentUser?.role === "ADMIN" || currentUser?.role === "MANAGER";

  // Filtered and searched POs
  const filteredPOs = useMemo(() => {
    return purchaseOrders.filter((po) => {
      if (statusFilter !== "ALL" && po.status !== statusFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const poNum = `po-${po.id.slice(0, 8)}`.toLowerCase();
        const supplierName = po.supplier.name.toLowerCase();
        return poNum.includes(q) || supplierName.includes(q);
      }
      return true;
    });
  }, [purchaseOrders, statusFilter, searchQuery]);

  function handleViewDetail(po: PurchaseOrder) {
    setSelectedPO(po);
    setDetailDialogOpen(true);
  }

  function handlePromptAction(
    po: PurchaseOrder,
    action: "SUBMITTED" | "CANCELLED"
  ) {
    setTargetPO(po);
    setTargetAction(action);
    setConfirmOpen(true);
  }

  async function handleConfirmAction() {
    if (!targetPO) return;

    try {
      await transitionStatus.mutateAsync({
        id: targetPO.id,
        status: targetAction,
      });

      toast.success(
        `Purchase order PO-${targetPO.id.slice(0, 8).toUpperCase()} ${
          targetAction === "SUBMITTED" ? "submitted to supplier" : "cancelled"
        }.`
      );

      // Update detail modal view if open
      if (selectedPO?.id === targetPO.id) {
        setSelectedPO((prev) =>
          prev ? { ...prev, status: targetAction } : null
        );
      }

      setConfirmOpen(false);
      setTargetPO(null);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : `Failed to ${targetAction.toLowerCase()} purchase order.`;
      toast.error(message);
    }
  }

  if (!isAuthenticated) return null;

  const columns: DataTableColumn<PurchaseOrder & Record<string, unknown>>[] = [
    {
      key: "id",
      header: "PO Number",
      cell: (row) => (
        <div>
          <button
            onClick={() => handleViewDetail(row as PurchaseOrder)}
            className="font-medium text-foreground hover:text-primary hover:underline transition-colors text-left"
          >
            PO-{row.id.slice(0, 8).toUpperCase()}
          </button>
          <div className="text-xs text-muted-foreground">
            {new Date(row.createdAt).toLocaleDateString()}
          </div>
        </div>
      ),
    },
    {
      key: "supplier",
      header: "Supplier",
      cell: (row) => (
        <span className="font-medium text-foreground">{row.supplier.name}</span>
      ),
    },
    {
      key: "items",
      header: "Items",
      cell: (row) => {
        const totalOrdered = row.items.reduce((sum, i) => sum + i.qtyOrdered, 0);
        const totalReceived = row.items.reduce((sum, i) => sum + i.qtyReceived, 0);
        return (
          <div className="text-sm">
            <span className="text-foreground">
              {row.items.length} line item{row.items.length > 1 ? "s" : ""}
            </span>
            <div className="text-xs text-muted-foreground">
              {totalReceived}/{totalOrdered} received
            </div>
          </div>
        );
      },
    },
    {
      key: "totalAmount",
      header: "Total Cost",
      cell: (row) => {
        const total = row.items.reduce(
          (sum, item) => sum + item.qtyOrdered * Number(item.unitPrice),
          0
        );
        return (
          <span className="font-medium text-foreground">
            ${total.toFixed(2)}
          </span>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => (
        <StatusBadge
          label={poStatusLabel(row.status)}
          variant={poStatusVariant(row.status)}
        />
      ),
    },
    {
      key: "creator",
      header: "Created By",
      cell: (row) => (
        <span className="text-sm text-muted-foreground">
          {row.creator?.name ?? "—"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      cell: (row) => {
        const po = row as PurchaseOrder;
        const isDraft = po.status === "DRAFT";
        const canCancel =
          (isDraft ||
            po.status === "SUBMITTED" ||
            po.status === "PARTIALLY_RECEIVED") &&
          canManage;

        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleViewDetail(po)}
              title="View Details"
              className="h-8 w-8 p-0"
            >
              <Eye className="size-4" />
            </Button>

            {isDraft && canManage && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handlePromptAction(po, "SUBMITTED")}
                title="Submit Order"
                className="h-8 w-8 p-0 text-primary hover:text-primary"
              >
                <Send className="size-4" />
              </Button>
            )}

            {canCancel && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handlePromptAction(po, "CANCELLED")}
                title="Cancel Order"
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              >
                <XCircle className="size-4" />
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
        title="Purchase Orders"
        description="Track supplier orders and restocking replenishment."
        actionLabel={canManage ? "Create Purchase Order" : undefined}
        onAction={canManage ? () => setCreateDialogOpen(true) : undefined}
      />

      {/* Status Tabs and Search Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5 rounded-lg border border-border bg-card p-1">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                statusFilter === f.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by supplier or PO #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 text-sm h-9"
          />
        </div>
      </div>

      {/* Orders Table */}
      <DataTable
        columns={columns}
        data={filteredPOs as (PurchaseOrder & Record<string, unknown>)[]}
        isLoading={isLoading}
        emptyMessage="No purchase orders found."
      />

      {/* Create PO Dialog */}
      <CreatePODialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      {/* PO Detail Dialog */}
      <PODetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        po={selectedPO}
        onTransitionStatus={(action) => {
          if (selectedPO) {
            handlePromptAction(selectedPO, action);
          }
        }}
        isTransitioning={transitionStatus.isPending}
        userRole={currentUser?.role}
      />

      {/* Confirm Status Transition Dialog */}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={
          targetAction === "SUBMITTED"
            ? "Submit Purchase Order"
            : "Cancel Purchase Order"
        }
        description={
          targetAction === "SUBMITTED"
            ? `Submit PO-${targetPO?.id.slice(0, 8).toUpperCase()} to ${
                targetPO?.supplier.name
              }? Once submitted, goods can be received in the warehouse.`
            : `Are you sure you want to cancel PO-${targetPO?.id
                .slice(0, 8)
                .toUpperCase()}? This action cannot be undone.`
        }
        confirmLabel={
          targetAction === "SUBMITTED" ? "Submit Order" : "Cancel Order"
        }
        variant={targetAction === "SUBMITTED" ? "default" : "destructive"}
        onConfirm={handleConfirmAction}
        isSubmitting={transitionStatus.isPending}
      />
    </div>
  );
}
