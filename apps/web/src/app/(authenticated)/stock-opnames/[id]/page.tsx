"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useStockOpname, useApproveOpname } from "@/hooks/use-stock-opname";
import { cn } from "@/lib/utils";

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

export default function StockOpnameDetailPage() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const { data: opname, isLoading, error } = useStockOpname(id);
  const approveOpname = useApproveOpname();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"APPROVED" | "REJECTED">("APPROVED");

  useEffect(() => {
    if (!isAuthenticated) router.replace("/login");
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-64 animate-pulse rounded-lg border border-border bg-card" />
      </div>
    );
  }

  if (error || !opname) {
    return (
      <div className="space-y-6">
        <PageHeader title="Stock Opname Detail" />
        <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card py-12">
          <p className="text-sm text-muted-foreground">
            {error?.message || "Stock opname not found."}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => router.push("/stock-opnames")}
          >
            Back to list
          </Button>
        </div>
      </div>
    );
  }

  const canApprove =
    opname.status === "PENDING" &&
    (user?.role === "MANAGER" || user?.role === "ADMIN");

  const totalVariance = opname.items.reduce((sum, item) => sum + item.variance, 0);

  function handleApproveClick(action: "APPROVED" | "REJECTED") {
    setConfirmAction(action);
    setConfirmOpen(true);
  }

  function handleConfirmAction() {
    approveOpname.mutate(
      { id, data: { status: confirmAction } },
      {
        onSuccess: () => {
          toast.success(
            `Stock opname ${confirmAction === "APPROVED" ? "approved" : "rejected"} successfully.`
          );
          setConfirmOpen(false);
        },
        onError: (err) => {
          toast.error(err.message || "Failed to update opname status.");
        },
      }
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={() => router.push("/stock-opnames")}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <PageHeader
          title="Stock Opname Detail"
          description={`Warehouse: ${opname.warehouse.name}`}
        />
      </div>

      <div className="flex items-center gap-3">
        <StatusBadge
          label={opnameStatusLabel(opname.status)}
          variant={opnameStatusVariant(opname.status)}
        />
        <span className="text-sm text-muted-foreground">
          Created by {opname.creator.name} on{" "}
          {new Date(opname.createdAt).toLocaleDateString()}
        </span>
      </div>

      {canApprove && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <p className="text-sm font-medium text-foreground">
                Review and take action
              </p>
              <p className="text-xs text-muted-foreground">
                Approving will create adjustment stock movements for all variances.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleApproveClick("REJECTED")}
                disabled={approveOpname.isPending}
                className="gap-1.5"
              >
                <X className="size-4" />
                Reject
              </Button>
              <Button
                size="sm"
                onClick={() => handleApproveClick("APPROVED")}
                disabled={approveOpname.isPending}
                className="gap-1.5"
              >
                <Check className="size-4" />
                Approve
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Variance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-3 py-2 text-left text-muted-foreground font-medium">
                    Product
                  </th>
                  <th className="px-3 py-2 text-center text-muted-foreground font-medium">
                    System Qty
                  </th>
                  <th className="px-3 py-2 text-center text-muted-foreground font-medium">
                    Actual Qty
                  </th>
                  <th className="px-3 py-2 text-center text-muted-foreground font-medium">
                    Variance
                  </th>
                </tr>
              </thead>
              <tbody>
                {opname.items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-3 py-2">
                      <div className="font-medium text-foreground">
                        {item.product.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {item.product.sku}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-center text-foreground">
                      {item.systemQty}
                    </td>
                    <td className="px-3 py-2 text-center text-foreground">
                      {item.actualQty}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span
                        className={cn(
                          "font-medium",
                          item.variance > 0 && "text-success",
                          item.variance < 0 && "text-destructive",
                          item.variance === 0 && "text-muted-foreground"
                        )}
                      >
                        {item.variance > 0 ? "+" : ""}
                        {item.variance}
                      </span>
                    </td>
                  </tr>
                ))}
                {opname.items.length > 1 && (
                  <tr className="border-t border-border bg-muted/30">
                    <td className="px-3 py-2 font-medium text-foreground">
                      Total
                    </td>
                    <td className="px-3 py-2 text-center text-foreground" />
                    <td className="px-3 py-2 text-center text-foreground" />
                    <td className="px-3 py-2 text-center">
                      <span
                        className={cn(
                          "font-medium",
                          totalVariance > 0 && "text-success",
                          totalVariance < 0 && "text-destructive",
                          totalVariance === 0 && "text-muted-foreground"
                        )}
                      >
                        {totalVariance > 0 ? "+" : ""}
                        {totalVariance}
                      </span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={
          confirmAction === "APPROVED" ? "Approve Stock Opname" : "Reject Stock Opname"
        }
        description={
          confirmAction === "APPROVED"
            ? "This will create adjustment stock movements for all variances. Stock levels will be updated. Continue?"
            : "This opname will be rejected and no stock changes will be made. Continue?"
        }
        onConfirm={handleConfirmAction}
        confirmLabel={confirmAction === "APPROVED" ? "Approve" : "Reject"}
        variant={confirmAction === "REJECTED" ? "destructive" : "default"}
        isSubmitting={approveOpname.isPending}
      />
    </div>
  );
}
