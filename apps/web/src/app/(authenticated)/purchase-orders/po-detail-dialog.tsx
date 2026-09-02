"use client";

import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import type { PurchaseOrder } from "@/types/purchase-order";
import {
  Send,
  XCircle,
  PackageCheck,
  Building2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  User,
} from "lucide-react";

interface PODetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  po: PurchaseOrder | null;
  onTransitionStatus: (status: "SUBMITTED" | "CANCELLED") => void;
  isTransitioning?: boolean;
  userRole?: string;
}

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

export function PODetailDialog({
  open,
  onOpenChange,
  po,
  onTransitionStatus,
  isTransitioning = false,
  userRole,
}: PODetailDialogProps) {
  if (!po) return null;

  const canManage = userRole === "ADMIN" || userRole === "MANAGER";
  const isDraft = po.status === "DRAFT";
  const isSubmitted = po.status === "SUBMITTED";
  const isPartiallyReceived = po.status === "PARTIALLY_RECEIVED";
  const canCancel = (isDraft || isSubmitted || isPartiallyReceived) && canManage;

  const totalAmount = po.items.reduce((sum, item) => {
    return sum + item.qtyOrdered * Number(item.unitPrice);
  }, 0);

  const totalOrderedQty = po.items.reduce((sum, i) => sum + i.qtyOrdered, 0);
  const totalReceivedQty = po.items.reduce((sum, i) => sum + i.qtyReceived, 0);
  const overallProgress =
    totalOrderedQty > 0
      ? Math.min(Math.round((totalReceivedQty / totalOrderedQty) * 100), 100)
      : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pr-8">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <DialogTitle className="text-xl">
                Purchase Order PO-{po.id.slice(0, 8).toUpperCase()}
              </DialogTitle>
              <DialogDescription>
                Created on {new Date(po.createdAt).toLocaleDateString()} by{" "}
                {po.creator?.name ?? "Staff"}
              </DialogDescription>
            </div>
            <StatusBadge
              label={poStatusLabel(po.status)}
              variant={poStatusVariant(po.status)}
            />
          </div>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Supplier Info & Order Metadata */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="bg-card/50">
              <CardContent className="p-4 space-y-2.5 text-sm">
                <div className="flex items-center gap-2 font-medium text-foreground">
                  <Building2 className="size-4 text-muted-foreground" />
                  <span>{po.supplier.name}</span>
                </div>
                {po.supplier.contactEmail && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="size-3.5" />
                    <span>{po.supplier.contactEmail}</span>
                  </div>
                )}
                {po.supplier.contactPhone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="size-3.5" />
                    <span>{po.supplier.contactPhone}</span>
                  </div>
                )}
                {po.supplier.address && (
                  <div className="flex items-start gap-2 text-muted-foreground">
                    <MapPin className="size-3.5 mt-0.5 shrink-0" />
                    <span>{po.supplier.address}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-card/50">
              <CardContent className="p-4 space-y-2.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="size-3.5" /> Last Updated:
                  </span>
                  <span className="text-foreground">
                    {new Date(po.updatedAt).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <User className="size-3.5" /> Ordered By:
                  </span>
                  <span className="text-foreground font-medium">
                    {po.creator?.name ?? "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-border">
                  <span className="text-muted-foreground">Receipt Progress:</span>
                  <span className="text-foreground font-medium">
                    {totalReceivedQty} / {totalOrderedQty} items ({overallProgress}%)
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Line Items Receiving Table */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-foreground">
              Order Items ({po.items.length})
            </h4>

            <div className="rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="px-3 py-2 text-left text-muted-foreground font-medium">
                      Product
                    </th>
                    <th className="px-3 py-2 text-right text-muted-foreground font-medium">
                      Unit Price
                    </th>
                    <th className="px-3 py-2 text-right text-muted-foreground font-medium">
                      Ordered
                    </th>
                    <th className="px-3 py-2 text-right text-muted-foreground font-medium">
                      Received
                    </th>
                    <th className="px-3 py-2 text-right text-muted-foreground font-medium">
                      Status
                    </th>
                    <th className="px-3 py-2 text-right text-muted-foreground font-medium">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {po.items.map((item) => {
                    const price = Number(item.unitPrice);
                    const subtotal = item.qtyOrdered * price;
                    const isItemComplete = item.qtyReceived >= item.qtyOrdered;

                    return (
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
                        <td className="px-3 py-2 text-right text-foreground">
                          ${price.toFixed(2)}
                        </td>
                        <td className="px-3 py-2 text-right text-foreground">
                          {item.qtyOrdered}
                        </td>
                        <td className="px-3 py-2 text-right text-foreground font-medium">
                          {item.qtyReceived}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {isItemComplete ? (
                            <span className="text-xs text-success font-medium">
                              Completed
                            </span>
                          ) : item.qtyReceived > 0 ? (
                            <span className="text-xs text-warning font-medium">
                              Partial ({item.qtyOrdered - item.qtyReceived} left)
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right font-medium text-foreground">
                          ${subtotal.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Grand Total Value Card */}
          <Card className="bg-card/50">
            <CardContent className="flex items-center justify-between p-4">
              <span className="text-sm text-muted-foreground">
                Total Order Value:
              </span>
              <span className="text-xl font-bold text-foreground">
                ${totalAmount.toFixed(2)}
              </span>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-between gap-2">
          <div>
            {canCancel && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => onTransitionStatus("CANCELLED")}
                disabled={isTransitioning}
                className="gap-1.5"
              >
                <XCircle className="size-4" />
                Cancel Order
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>

            {isDraft && canManage && (
              <Button
                type="button"
                onClick={() => onTransitionStatus("SUBMITTED")}
                disabled={isTransitioning}
                className="gap-1.5"
              >
                <Send className="size-4" />
                {isTransitioning ? "Submitting..." : "Submit to Supplier"}
              </Button>
            )}

            {(isSubmitted || isPartiallyReceived) && (
              <Link href="/stock-movements">
                <Button type="button" className="gap-1.5">
                  <PackageCheck className="size-4" />
                  Receive Goods
                </Button>
              </Link>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
