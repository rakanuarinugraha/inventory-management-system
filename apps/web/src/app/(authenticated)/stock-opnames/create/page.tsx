"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useQueries } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
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
import { PageHeader } from "@/components/shared/page-header";
import { useProducts } from "@/hooks/use-products";
import { useWarehouses } from "@/hooks/use-warehouses";
import { useCreateOpname } from "@/hooks/use-stock-opname";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

type Step = "warehouse" | "count";

export default function CreateStockOpnamePage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const createOpname = useCreateOpname();

  const { data: products = [], isLoading: isLoadingProducts } =
    useProducts("active");
  const { data: warehouses = [], isLoading: isLoadingWarehouses } =
    useWarehouses("active");

  const [warehouseId, setWarehouseId] = useState("");
  const [step, setStep] = useState<Step>("warehouse");
  const [actualQtyMap, setActualQtyMap] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isAuthenticated) router.replace("/login");
  }, [isAuthenticated, router]);

  const stockQueries = useQueries({
    queries: products.map((product) => ({
      queryKey: ["current-stock", product.id, warehouseId],
      queryFn: () =>
        api
          .get<{ currentStock: number }>(
            `/api/stock-movements/current-stock?productId=${product.id}&warehouseId=${warehouseId}`
          )
          .then((res) => res.currentStock),
      enabled: step === "count" && !!warehouseId && !!product.id,
    })),
  });

  const stockMap = useMemo(() => {
    const map: Record<string, number> = {};
    products.forEach((product, i) => {
      const result = stockQueries[i];
      if (result?.data !== undefined) {
        map[product.id] = result.data;
      }
    });
    return map;
  }, [products, stockQueries]);

  const isLoadingStock = stockQueries.some((q) => q.isLoading);

  function handleWarehouseSelect(id: string) {
    setWarehouseId(id);
    setActualQtyMap({});
    setStep("count");
  }

  function handleQtyChange(productId: string, value: string) {
    setActualQtyMap((prev) => ({ ...prev, [productId]: value }));
  }

  function validate(): boolean {
    let hasAtLeastOne = false;
    for (const product of products) {
      const val = actualQtyMap[product.id];
      if (val !== undefined && val !== "") {
        hasAtLeastOne = true;
        const num = parseInt(val, 10);
        if (isNaN(num) || num < 0) {
          toast.error(`Invalid quantity for ${product.name}.`);
          return false;
        }
      }
    }
    if (!hasAtLeastOne) {
      toast.error("Enter an actual quantity for at least one product.");
      return false;
    }
    return true;
  }

  async function handleSubmit() {
    if (!validate()) return;

    const items = products
      .filter((p) => {
        const val = actualQtyMap[p.id];
        return val !== undefined && val !== "";
      })
      .map((p) => ({
        productId: p.id,
        actualQty: parseInt(actualQtyMap[p.id], 10),
      }));

    createOpname.mutate(
      { warehouseId, items },
      {
        onSuccess: (result) => {
          toast.success("Stock opname created successfully.");
          router.push(`/stock-opnames/${result.opname.id}`);
        },
        onError: (err) => {
          toast.error(err.message || "Failed to create stock opname.");
        },
      }
    );
  }

  const itemsWithValues = products.filter(
    (p) => actualQtyMap[p.id] !== undefined && actualQtyMap[p.id] !== ""
  );

  const totalVariance = itemsWithValues.reduce((sum, p) => {
    const systemQty = stockMap[p.id] ?? 0;
    const actualQty = parseInt(actualQtyMap[p.id], 10) || 0;
    return sum + (actualQty - systemQty);
  }, 0);

  if (!isAuthenticated) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={() =>
            step === "count" ? setStep("warehouse") : router.push("/stock-opnames")
          }
        >
          <ArrowLeft className="size-4" />
        </Button>
        <PageHeader
          title="New Stock Opname"
          description="Perform a physical count and compare with system quantities."
        />
      </div>

      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span
          className={cn(
            "font-medium",
            step === "warehouse" ? "text-primary" : "text-foreground"
          )}
        >
          1. Select Warehouse
        </span>
        <span>&mdash;</span>
        <span
          className={cn(
            "font-medium",
            step === "count" ? "text-primary" : step === "warehouse" ? "text-muted-foreground" : "text-foreground"
          )}
        >
          2. Count &amp; Submit
        </span>
      </div>

      {step === "warehouse" && (
        <div className="max-w-md space-y-4">
          <div className="space-y-2">
            <Label>Warehouse</Label>
            <Select
              value={warehouseId}
              onValueChange={(val) => {
                if (val) handleWarehouseSelect(val);
              }}
              items={warehouses.map((wh) => ({
                value: wh.id,
                label: wh.name,
              }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a warehouse" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingWarehouses ? (
                  <SelectItem value="_loading" disabled>
                    Loading...
                  </SelectItem>
                ) : warehouses.length === 0 ? (
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
      )}

      {step === "count" && (
        <Card>
          <CardHeader>
            <CardTitle>
              Physical Count — {warehouses.find((w) => w.id === warehouseId)?.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingProducts || isLoadingStock ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-10 animate-pulse rounded bg-muted" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No active products found.
              </p>
            ) : (
              <>
                <div className="rounded-lg border border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="px-3 py-2 text-left text-muted-foreground font-medium">
                          Product
                        </th>
                        <th className="px-3 py-2 text-right text-muted-foreground font-medium">
                          System Qty
                        </th>
                        <th className="px-3 py-2 text-right text-muted-foreground font-medium">
                          Actual Qty
                        </th>
                        <th className="px-3 py-2 text-right text-muted-foreground font-medium">
                          Variance
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((product) => {
                        const systemQty = stockMap[product.id] ?? 0;
                        const actualVal = actualQtyMap[product.id] ?? "";
                        const actualNum =
                          actualVal === "" ? NaN : parseInt(actualVal, 10);
                        const variance = isNaN(actualNum)
                          ? null
                          : actualNum - systemQty;

                        return (
                          <tr
                            key={product.id}
                            className="border-b border-border last:border-0"
                          >
                            <td className="px-3 py-2">
                              <div className="font-medium text-foreground">
                                {product.name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {product.sku}
                              </div>
                            </td>
                            <td className="px-3 py-2 text-right text-foreground">
                              {systemQty}
                            </td>
                            <td className="px-3 py-2 text-right">
                              <Input
                                type="number"
                                min={0}
                                value={actualVal}
                                onChange={(e) =>
                                  handleQtyChange(product.id, e.target.value)
                                }
                                placeholder="—"
                                className="w-20 text-right"
                              />
                            </td>
                            <td className="px-3 py-2 text-right">
                              {variance !== null && (
                                <span
                                  className={cn(
                                    "font-medium",
                                    variance > 0 && "text-success",
                                    variance < 0 && "text-destructive",
                                    variance === 0 && "text-muted-foreground"
                                  )}
                                >
                                  {variance > 0 ? "+" : ""}
                                  {variance}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {itemsWithValues.length > 0 && (
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {itemsWithValues.length} item(s) with counts
                    </span>
                    <span
                      className={cn(
                        "text-sm font-medium",
                        totalVariance > 0 && "text-success",
                        totalVariance < 0 && "text-destructive",
                        totalVariance === 0 && "text-muted-foreground"
                      )}
                    >
                      Total variance:{" "}
                      {totalVariance > 0 ? "+" : ""}
                      {totalVariance}
                    </span>
                  </div>
                )}

                <div className="mt-4 flex justify-end">
                  <Button
                    onClick={handleSubmit}
                    disabled={
                      createOpname.isPending ||
                      isLoadingStock ||
                      itemsWithValues.length === 0
                    }
                  >
                    {createOpname.isPending
                      ? "Creating..."
                      : "Submit for Approval"}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
