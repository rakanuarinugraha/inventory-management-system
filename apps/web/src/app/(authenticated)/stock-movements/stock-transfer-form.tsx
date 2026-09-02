"use client";

import { useState } from "react";
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
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { useProducts } from "@/hooks/use-products";
import { useWarehouses } from "@/hooks/use-warehouses";
import { useCurrentStock, useTransferStock } from "@/hooks/use-stock-movements";
import { ApiError } from "@/lib/api";

export function StockTransferForm() {
  const { data: products = [], isLoading: isLoadingProducts } =
    useProducts("active");
  const { data: warehouses = [] } = useWarehouses("active");

  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [sourceWarehouseId, setSourceWarehouseId] = useState<string>("");
  const [destWarehouseId, setDestWarehouseId] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const { data: sourceStockData } = useCurrentStock(
    selectedProductId || null,
    sourceWarehouseId || null
  );

  const transferStock = useTransferStock();

  const sourceStock = sourceStockData?.currentStock ?? 0;
  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const qtyNum = parseInt(quantity, 10) || 0;
  const isInsufficientStock = qtyNum > 0 && qtyNum > sourceStock;

  function validate(): boolean {
    const errors: Record<string, string> = {};
    if (!selectedProductId) errors.productId = "Select a product.";
    if (!sourceWarehouseId) errors.sourceWarehouseId = "Select a source warehouse.";
    if (!destWarehouseId) errors.destWarehouseId = "Select a destination warehouse.";
    if (sourceWarehouseId && destWarehouseId && sourceWarehouseId === destWarehouseId) {
      errors.destWarehouseId = "Source and destination warehouses must be different.";
    }
    const qty = parseInt(quantity, 10);
    if (!quantity || isNaN(qty) || qty < 1) {
      errors.quantity = "Enter a quantity of at least 1.";
    } else if (qty > sourceStock) {
      errors.quantity = `Insufficient stock. Available: ${sourceStock}.`;
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;

    try {
      await transferStock.mutateAsync({
        productId: selectedProductId,
        sourceWarehouseId,
        destinationWarehouseId: destWarehouseId,
        quantity: parseInt(quantity, 10),
        note: note.trim() || undefined,
      });

      toast.success("Stock transferred successfully.");
      setQuantity("");
      setNote("");
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Failed to transfer stock.";
      toast.error(message);
    }
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div className="space-y-2">
        <Label>Product</Label>
        <Select
          value={selectedProductId}
          onValueChange={(val) => {
            setSelectedProductId(val ?? "");
            setFieldErrors((prev) => {
              const next = { ...prev };
              delete next.productId;
              return next;
            });
          }}
          items={products.map((p) => ({ value: p.id, label: `${p.name} (${p.sku})` }))}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a product" />
          </SelectTrigger>
          <SelectContent>
            {isLoadingProducts ? (
              <SelectItem value="_loading" disabled>
                Loading...
              </SelectItem>
            ) : products.length === 0 ? (
              <SelectItem value="_empty" disabled>
                No active products
              </SelectItem>
            ) : (
              products.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name} ({p.sku})
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        {fieldErrors.productId && (
          <p className="text-xs text-destructive">{fieldErrors.productId}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Source Warehouse</Label>
        <Select
          value={sourceWarehouseId}
          onValueChange={(val) => {
            const newSource = val ?? "";
            setSourceWarehouseId(newSource);
            if (destWarehouseId === newSource) {
              setDestWarehouseId("");
            }
            setFieldErrors((prev) => {
              const next = { ...prev };
              delete next.sourceWarehouseId;
              delete next.destWarehouseId;
              return next;
            });
          }}
          items={warehouses.map((wh) => ({ value: wh.id, label: wh.name }))}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select source warehouse" />
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
        {fieldErrors.sourceWarehouseId && (
          <p className="text-xs text-destructive">{fieldErrors.sourceWarehouseId}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Destination Warehouse</Label>
        <Select
          value={destWarehouseId}
          onValueChange={(val) => {
            setDestWarehouseId(val ?? "");
            setFieldErrors((prev) => {
              const next = { ...prev };
              delete next.destWarehouseId;
              return next;
            });
          }}
          items={warehouses.filter((wh) => wh.id !== sourceWarehouseId).map((wh) => ({ value: wh.id, label: wh.name }))}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select destination warehouse" />
          </SelectTrigger>
          <SelectContent>
            {warehouses.filter((wh) => wh.id !== sourceWarehouseId).length === 0 ? (
              <SelectItem value="_empty" disabled>
                No other warehouses
              </SelectItem>
            ) : (
              warehouses
                .filter((wh) => wh.id !== sourceWarehouseId)
                .map((wh) => (
                  <SelectItem key={wh.id} value={wh.id}>
                    {wh.name}
                  </SelectItem>
                ))
            )}
          </SelectContent>
        </Select>
        {fieldErrors.destWarehouseId && (
          <p className="text-xs text-destructive">{fieldErrors.destWarehouseId}</p>
        )}
      </div>

      {selectedProductId && sourceWarehouseId && (
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Available stock at source
              </span>
              <span className="text-sm font-medium text-foreground">
                {sourceStock} {selectedProduct?.unit ?? "units"}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        <Label htmlFor="transfer-qty">Quantity</Label>
        <Input
          id="transfer-qty"
          type="number"
          min={1}
          value={quantity}
          onChange={(e) => {
            setQuantity(e.target.value);
            setFieldErrors((prev) => {
              const next = { ...prev };
              delete next.quantity;
              return next;
            });
          }}
          placeholder="0"
          disabled={!selectedProductId || !sourceWarehouseId || !destWarehouseId}
        />
        {fieldErrors.quantity && (
          <p className="text-xs text-destructive">{fieldErrors.quantity}</p>
        )}
      </div>

      {isInsufficientStock && !fieldErrors.quantity && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
          <p className="text-sm text-destructive">
            Insufficient stock. Only {sourceStock} {selectedProduct?.unit ?? "units"} available
            at the source warehouse.
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="transfer-note">Note (optional)</Label>
        <Input
          id="transfer-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Reason for transfer..."
          disabled={!selectedProductId || !sourceWarehouseId || !destWarehouseId}
        />
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={
            transferStock.isPending ||
            !selectedProductId ||
            !sourceWarehouseId ||
            !destWarehouseId ||
            !quantity
          }
        >
          {transferStock.isPending ? "Processing..." : "Transfer Stock"}
        </Button>
      </div>
    </div>
  );
}
