"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  usePurchaseOrders,
  useReceiveStockIn,
} from "@/hooks/use-purchase-orders";
import { useWarehouses } from "@/hooks/use-warehouses";
import { ApiError } from "@/lib/api";

const RECEIVABLE_STATUSES = new Set(["DRAFT", "SUBMITTED", "PARTIALLY_RECEIVED"]);

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

function poStatusVariant(status: string): "default" | "secondary" | "destructive" | "success" | "warning" | "outline" {
  const map: Record<string, "default" | "secondary" | "destructive" | "success" | "warning" | "outline"> = {
    DRAFT: "outline",
    SUBMITTED: "default",
    PARTIALLY_RECEIVED: "warning",
    COMPLETED: "success",
    CANCELLED: "destructive",
  };
  return map[status] ?? "default";
}

export function StockInForm() {
  const { data: purchaseOrders = [], isLoading: isLoadingPOs } = usePurchaseOrders();
  const { data: warehouses = [] } = useWarehouses("active");
  const receiveStockIn = useReceiveStockIn();

  const [selectedPoId, setSelectedPoId] = useState<string>("");
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>("");
  const [receiveEntries, setReceiveEntries] = useState<Record<string, number>>({});
  const [itemErrors, setItemErrors] = useState<Record<string, string>>({});

  const selectedPo = useMemo(() => {
    return purchaseOrders.find((po) => po.id === selectedPoId) ?? null;
  }, [purchaseOrders, selectedPoId]);

  const receivableItems = useMemo(() => {
    if (!selectedPo) return [];
    return selectedPo.items.filter(
      (item) => item.qtyReceived < item.qtyOrdered
    );
  }, [selectedPo]);

  function handleSelectPo(poId: string) {
    setSelectedPoId(poId);
    setReceiveEntries({});
    setItemErrors({});
  }

  function handleQtyChange(itemId: string, value: string) {
    const num = parseInt(value, 10);
    setReceiveEntries((prev) => ({
      ...prev,
      [itemId]: isNaN(num) ? 0 : num,
    }));
    setItemErrors((prev) => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
  }

  function validate(): boolean {
    const errors: Record<string, string> = {};
    let hasAtLeastOne = false;

    for (const item of receivableItems) {
      const qty = receiveEntries[item.id] ?? 0;
      if (qty > 0) {
        hasAtLeastOne = true;
        const remaining = item.qtyOrdered - item.qtyReceived;
        if (qty > remaining) {
          errors[item.id] = `Cannot exceed remaining qty of ${remaining}`;
        }
      }
    }

    if (!hasAtLeastOne) {
      toast.error("Enter a quantity for at least one item to receive.");
      return false;
    }

    setItemErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit() {
    if (!validate() || !selectedPo || !selectedWarehouseId) return;

    const itemsToReceive = receivableItems
      .filter((item) => (receiveEntries[item.id] ?? 0) > 0)
      .map((item) => ({
        poId: selectedPo.id,
        productId: item.productId,
        warehouseId: selectedWarehouseId,
        quantity: receiveEntries[item.id] ?? 0,
      }));

    let successCount = 0;
    let failCount = 0;

    const results = await Promise.allSettled(
      itemsToReceive.map((entry) => receiveStockIn.mutateAsync(entry))
    );

    for (const result of results) {
      if (result.status === "fulfilled") {
        successCount++;
      } else {
        failCount++;
      }
    }

    if (failCount === 0) {
      toast.success(
        `Stock received successfully for ${successCount} item${successCount > 1 ? "s" : ""}.`
      );
      setReceiveEntries({});
      setSelectedPoId("");
      setSelectedWarehouseId("");
    } else if (successCount > 0) {
      toast.warning(
        `Received ${successCount} item${successCount > 1 ? "s" : ""}, but ${failCount} failed.`
      );
    } else {
      const err = results[0] as PromiseRejectedResult;
      const message =
        err.reason instanceof ApiError
          ? err.reason.message
          : "Failed to receive stock.";
      toast.error(message);
    }
  }

  const isSubmitting = receiveStockIn.isPending;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Purchase Order</Label>
          <Select
            value={selectedPoId}
            onValueChange={(val) => handleSelectPo(val ?? "")}
            items={purchaseOrders
              .filter((po) => RECEIVABLE_STATUSES.has(po.status))
              .map((po) => ({ value: po.id, label: `PO ${po.id.slice(0, 8)}` }))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a purchase order" />
            </SelectTrigger>
            <SelectContent>
              {isLoadingPOs ? (
                <SelectItem value="_loading" disabled>
                  Loading...
                </SelectItem>
              ) : purchaseOrders.filter((po) => RECEIVABLE_STATUSES.has(po.status)).length === 0 ? (
                <SelectItem value="_empty" disabled>
                  No receivable POs found
                </SelectItem>
              ) : (
                purchaseOrders
                  .filter((po) => RECEIVABLE_STATUSES.has(po.status))
                  .map((po) => (
                    <SelectItem key={po.id} value={po.id}>
                      {po.supplier.name} &mdash; {poStatusLabel(po.status)}
                    </SelectItem>
                  ))
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Receive Into Warehouse</Label>
          <Select
            value={selectedWarehouseId}
            onValueChange={(val) => setSelectedWarehouseId(val ?? "")}
            items={warehouses.map((wh) => ({ value: wh.id, label: wh.name }))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a warehouse" />
            </SelectTrigger>
            <SelectContent>
              {warehouses.length === 0 ? (
                <SelectItem value="_empty" disabled>
                  No active warehouses
                </SelectItem>
              ) : (
                warehouses.map((wh) => (
                  <SelectItem key={wh.id} value={wh.id}>
                    {wh.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedPo && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                PO from {selectedPo.supplier.name}
              </CardTitle>
              <StatusBadge
                label={poStatusLabel(selectedPo.status)}
                variant={poStatusVariant(selectedPo.status)}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-3 py-2 text-left text-muted-foreground font-medium">
                      Product
                    </th>
                    <th className="px-3 py-2 text-right text-muted-foreground font-medium">
                      Ordered
                    </th>
                    <th className="px-3 py-2 text-right text-muted-foreground font-medium">
                      Received
                    </th>
                    <th className="px-3 py-2 text-right text-muted-foreground font-medium">
                      Remaining
                    </th>
                    <th className="px-3 py-2 text-right text-muted-foreground font-medium">
                      Qty to Receive
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {selectedPo.items.map((item) => {
                    const remaining = item.qtyOrdered - item.qtyReceived;
                    const isFullyReceived = remaining <= 0;
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
                          {item.qtyOrdered}
                        </td>
                        <td className="px-3 py-2 text-right text-foreground">
                          {item.qtyReceived}
                        </td>
                        <td className="px-3 py-2 text-right text-foreground">
                          {remaining}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {isFullyReceived ? (
                            <span className="text-xs text-muted-foreground">
                              Fully received
                            </span>
                          ) : (
                            <div className="flex justify-end">
                              <Input
                                type="number"
                                min={0}
                                max={remaining}
                                value={receiveEntries[item.id] ?? ""}
                                onChange={(e) =>
                                  handleQtyChange(item.id, e.target.value)
                                }
                                placeholder="0"
                                className="w-20 text-right"
                                aria-invalid={!!itemErrors[item.id]}
                              />
                            </div>
                          )}
                          {itemErrors[item.id] && (
                            <p className="text-xs text-destructive mt-1 text-right">
                              {itemErrors[item.id]}
                            </p>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedPo && receivableItems.length > 0 && (
        <div className="flex justify-end">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedWarehouseId}
          >
            {isSubmitting ? "Receiving..." : "Receive Stock"}
          </Button>
        </div>
      )}
    </div>
  );
}
