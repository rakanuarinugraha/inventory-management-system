"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useSuppliers } from "@/hooks/use-suppliers";
import { useProducts } from "@/hooks/use-products";
import {
  useCreatePurchaseOrder,
  useSuggestedReorder,
} from "@/hooks/use-purchase-orders";
import { ApiError } from "@/lib/api";
import { Plus, Trash2, Sparkles } from "lucide-react";

interface CreatePODialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FormItem {
  id: string;
  productId: string;
  qtyOrdered: string;
  unitPrice: string;
}

export function CreatePODialog({ open, onOpenChange }: CreatePODialogProps) {
  const { data: suppliers = [], isLoading: isLoadingSuppliers } =
    useSuppliers("active");
  const { data: products = [], isLoading: isLoadingProducts } =
    useProducts("active");
  const { data: suggestedProducts = [] } = useSuggestedReorder();
  const createPO = useCreatePurchaseOrder();

  const [supplierId, setSupplierId] = useState<string>("");
  const [items, setItems] = useState<FormItem[]>([
    { id: "1", productId: "", qtyOrdered: "1", unitPrice: "0.00" },
  ]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset state on open
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setSupplierId("");
      setItems([{ id: "1", productId: "", qtyOrdered: "1", unitPrice: "0.00" }]);
      setErrors({});
    }
  }

  function handleAddItem() {
    setItems((prev) => [
      ...prev,
      {
        id: String(Date.now() + Math.random()),
        productId: "",
        qtyOrdered: "1",
        unitPrice: "0.00",
      },
    ]);
  }

  function handleRemoveItem(id: string) {
    if (items.length <= 1) {
      toast.error("A purchase order must have at least one item.");
      return;
    }
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  function handleItemChange(
    id: string,
    field: "productId" | "qtyOrdered" | "unitPrice",
    value: string
  ) {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
    setErrors((prev) => {
      const next = { ...prev };
      delete next[`item-${id}-${field}`];
      delete next.items;
      return next;
    });
  }

  function handleAddSuggestedItems() {
    if (suggestedProducts.length === 0) {
      toast.info("No products currently need restocking.");
      return;
    }

    const existingProductIds = new Set(
      items.filter((i) => i.productId).map((i) => i.productId)
    );

    const newItemsToAdd = suggestedProducts
      .filter((p) => !existingProductIds.has(p.id))
      .map((p) => ({
        id: String(Date.now() + Math.random()),
        productId: p.id,
        qtyOrdered: String(Math.max(p.reorderPoint * 2 - p.currentStock, 1)),
        unitPrice: "0.00",
      }));

    if (newItemsToAdd.length === 0) {
      toast.info("All suggested products are already in the order list.");
      return;
    }

    setItems((prev) => {
      const nonEmpties = prev.filter((i) => i.productId !== "");
      return [...nonEmpties, ...newItemsToAdd];
    });

    toast.success(
      `Added ${newItemsToAdd.length} suggested low-stock product${
        newItemsToAdd.length > 1 ? "s" : ""
      } to the order.`
    );
  }

  const grandTotal = items.reduce((sum, item) => {
    const qty = parseInt(item.qtyOrdered, 10) || 0;
    const price = parseFloat(item.unitPrice) || 0;
    return sum + qty * price;
  }, 0);

  function validate(): boolean {
    const next: Record<string, string> = {};

    if (!supplierId) {
      next.supplierId = "Please select a supplier.";
    }

    if (items.length === 0) {
      next.items = "Add at least one product item.";
    }

    const productSet = new Set<string>();

    for (const item of items) {
      if (!item.productId) {
        next[`item-${item.id}-productId`] = "Select a product";
      } else if (productSet.has(item.productId)) {
        next[`item-${item.id}-productId`] = "Duplicate product in order";
      } else {
        productSet.add(item.productId);
      }

      const qty = parseInt(item.qtyOrdered, 10);
      if (!item.qtyOrdered || isNaN(qty) || qty < 1) {
        next[`item-${item.id}-qtyOrdered`] = "Min 1";
      }

      const price = parseFloat(item.unitPrice);
      if (item.unitPrice === "" || isNaN(price) || price < 0) {
        next[`item-${item.id}-unitPrice`] = "Min $0";
      }
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;

    try {
      await createPO.mutateAsync({
        supplierId,
        items: items.map((item) => ({
          productId: item.productId,
          qtyOrdered: parseInt(item.qtyOrdered, 10),
          unitPrice: parseFloat(item.unitPrice) || 0,
        })),
      });

      toast.success("Purchase order created as Draft.");
      onOpenChange(false);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Failed to create purchase order.";
      toast.error(message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Purchase Order</DialogTitle>
          <DialogDescription>
            Draft a new purchase order to restock inventory from a supplier.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Supplier selector & Suggested reorder button */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Supplier</Label>
              <Select
                value={supplierId}
                onValueChange={(val) => {
                  setSupplierId(val ?? "");
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next.supplierId;
                    return next;
                  });
                }}
                items={suppliers.map((s) => ({ value: s.id, label: s.name }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a supplier" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingSuppliers ? (
                    <SelectItem value="_loading" disabled>
                      Loading suppliers...
                    </SelectItem>
                  ) : suppliers.length === 0 ? (
                    <SelectItem value="_empty" disabled>
                      No active suppliers
                    </SelectItem>
                  ) : (
                    suppliers.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.supplierId && (
                <p className="text-xs text-destructive">{errors.supplierId}</p>
              )}
            </div>

            <div className="flex flex-col justify-end">
              {suggestedProducts.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddSuggestedItems}
                  className="gap-1.5 border-warning/40 text-warning hover:bg-warning/10"
                >
                  <Sparkles className="size-4" />
                  Quick-add {suggestedProducts.length} low-stock suggestion
                  {suggestedProducts.length > 1 ? "s" : ""}
                </Button>
              )}
            </div>
          </div>

          {/* Line Items Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Order Line Items</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddItem}
                className="gap-1 text-xs"
              >
                <Plus className="size-3.5" />
                Add Item
              </Button>
            </div>

            {errors.items && (
              <p className="text-xs text-destructive">{errors.items}</p>
            )}

            <div className="rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="px-3 py-2 text-left text-muted-foreground font-medium w-[45%]">
                      Product
                    </th>
                    <th className="px-3 py-2 text-right text-muted-foreground font-medium w-[18%]">
                      Qty
                    </th>
                    <th className="px-3 py-2 text-right text-muted-foreground font-medium w-[22%]">
                      Unit Price ($)
                    </th>
                    <th className="px-3 py-2 text-right text-muted-foreground font-medium w-[15%]">
                      Subtotal
                    </th>
                    <th className="px-2 py-2 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const lineQty = parseInt(item.qtyOrdered, 10) || 0;
                    const linePrice = parseFloat(item.unitPrice) || 0;
                    const lineSubtotal = lineQty * linePrice;

                    return (
                      <tr
                        key={item.id}
                        className="border-b border-border last:border-0"
                      >
                        <td className="p-2">
                          <Select
                            value={item.productId}
                            onValueChange={(val) =>
                              handleItemChange(item.id, "productId", val ?? "")
                            }
                            items={products.map((p) => ({
                              value: p.id,
                              label: `${p.name} (${p.sku})`,
                            }))}
                          >
                            <SelectTrigger className="w-full text-xs">
                              <SelectValue placeholder="Select product" />
                            </SelectTrigger>
                            <SelectContent>
                              {isLoadingProducts ? (
                                <SelectItem value="_loading" disabled>
                                  Loading...
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
                          {errors[`item-${item.id}-productId`] && (
                            <p className="text-xs text-destructive mt-0.5">
                              {errors[`item-${item.id}-productId`]}
                            </p>
                          )}
                        </td>
                        <td className="p-2 text-right">
                          <Input
                            type="number"
                            min={1}
                            value={item.qtyOrdered}
                            onChange={(e) =>
                              handleItemChange(
                                item.id,
                                "qtyOrdered",
                                e.target.value
                              )
                            }
                            className="text-right text-xs"
                            placeholder="1"
                          />
                          {errors[`item-${item.id}-qtyOrdered`] && (
                            <p className="text-xs text-destructive mt-0.5">
                              {errors[`item-${item.id}-qtyOrdered`]}
                            </p>
                          )}
                        </td>
                        <td className="p-2 text-right">
                          <Input
                            type="number"
                            step="0.01"
                            min={0}
                            value={item.unitPrice}
                            onChange={(e) =>
                              handleItemChange(
                                item.id,
                                "unitPrice",
                                e.target.value
                              )
                            }
                            className="text-right text-xs"
                            placeholder="0.00"
                          />
                          {errors[`item-${item.id}-unitPrice`] && (
                            <p className="text-xs text-destructive mt-0.5">
                              {errors[`item-${item.id}-unitPrice`]}
                            </p>
                          )}
                        </td>
                        <td className="p-2 text-right font-medium text-foreground">
                          ${lineSubtotal.toFixed(2)}
                        </td>
                        <td className="p-2 text-center">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveItem(item.id)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                            disabled={items.length <= 1}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Grand Total Summary Card */}
          <Card className="bg-card/50">
            <CardContent className="flex items-center justify-between p-4">
              <span className="text-sm text-muted-foreground">
                Total Estimated Cost ({items.length} item
                {items.length > 1 ? "s" : ""}):
              </span>
              <span className="text-xl font-bold text-foreground">
                ${grandTotal.toFixed(2)}
              </span>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={createPO.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={createPO.isPending}
          >
            {createPO.isPending ? "Creating Draft..." : "Create Purchase Order"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
