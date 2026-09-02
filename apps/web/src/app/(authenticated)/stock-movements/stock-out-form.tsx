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
import { useCurrentStock, useStockOut } from "@/hooks/use-stock-movements";

export function StockOutForm() {
  const { data: products = [], isLoading: isLoadingProducts } =
    useProducts("active");
  const { data: warehouses = [] } = useWarehouses("active");

  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const { data: stockData } = useCurrentStock(
    selectedProductId || null,
    selectedWarehouseId || null
  );

  const stockOut = useStockOut();

  const currentStock = stockData?.currentStock ?? 0;
  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const reorderPoint = selectedProduct?.reorderPoint ?? 0;
  const qtyNum = parseInt(quantity, 10) || 0;
  const resultingStock = currentStock - qtyNum;
  const showLowStockWarning =
    qtyNum > 0 && resultingStock >= 0 && resultingStock < reorderPoint;
  const isInsufficientStock = qtyNum > 0 && qtyNum > currentStock;

  function validate(): boolean {
    const errors: Record<string, string> = {};
    if (!selectedProductId) errors.productId = "Select a product.";
    if (!selectedWarehouseId) errors.warehouseId = "Select a warehouse.";
    const qty = parseInt(quantity, 10);
    if (!quantity || isNaN(qty) || qty < 1) {
      errors.quantity = "Enter a quantity of at least 1.";
    } else if (qty > currentStock) {
      errors.quantity = `Insufficient stock. Available: ${currentStock}.`;
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;

    const result = await stockOut.mutateAsync({
      productId: selectedProductId,
      warehouseId: selectedWarehouseId,
      quantity: parseInt(quantity, 10),
      note: note.trim() || undefined,
    });

    if (result.warning) {
      toast.warning(result.warning, { duration: 6000 });
    } else {
      toast.success("Stock out recorded successfully.");
    }

    setQuantity("");
    setNote("");
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
        <Label>Warehouse</Label>
        <Select
          value={selectedWarehouseId}
          onValueChange={(val) => {
            setSelectedWarehouseId(val ?? "");
            setFieldErrors((prev) => {
              const next = { ...prev };
              delete next.warehouseId;
              return next;
            });
          }}
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
        {fieldErrors.warehouseId && (
          <p className="text-xs text-destructive">{fieldErrors.warehouseId}</p>
        )}
      </div>

      {selectedProductId && selectedWarehouseId && (
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Current stock
              </span>
              <span className="text-sm font-medium text-foreground">
                {currentStock} {selectedProduct?.unit ?? "units"}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        <Label htmlFor="stock-out-qty">Quantity</Label>
        <Input
          id="stock-out-qty"
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
          disabled={!selectedProductId || !selectedWarehouseId}
        />
        {fieldErrors.quantity && (
          <p className="text-xs text-destructive">{fieldErrors.quantity}</p>
        )}
      </div>

      {isInsufficientStock && !fieldErrors.quantity && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
          <p className="text-sm text-destructive">
            Insufficient stock. Only {currentStock} {selectedProduct?.unit ?? "units"} available
            in this warehouse.
          </p>
        </div>
      )}

      {showLowStockWarning && (
        <div className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning/5 p-3">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
          <p className="text-sm text-warning">
            Low stock warning: resulting stock ({resultingStock}) will be below
            the reorder point ({reorderPoint}).
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="stock-out-note">Note (optional)</Label>
        <Input
          id="stock-out-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Reason for stock out..."
          disabled={!selectedProductId || !selectedWarehouseId}
        />
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={
            stockOut.isPending ||
            !selectedProductId ||
            !selectedWarehouseId ||
            !quantity
          }
        >
          {stockOut.isPending ? "Processing..." : "Record Stock Out"}
        </Button>
      </div>
    </div>
  );
}
