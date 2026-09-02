import { useQuery } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import type { PurchaseOrder } from "@/types/purchase-order";

interface PurchaseOrdersResponse {
  purchaseOrders: PurchaseOrder[];
}

interface PurchaseOrderResponse {
  purchaseOrder: PurchaseOrder;
}

export function usePurchaseOrders() {
  return useQuery<PurchaseOrder[], ApiError>({
    queryKey: ["purchase-orders"],
    queryFn: () =>
      api
        .get<PurchaseOrdersResponse>("/api/purchase-orders")
        .then((res) => res.purchaseOrders),
  });
}

export function usePurchaseOrder(id: string | null) {
  return useQuery<PurchaseOrder, ApiError>({
    queryKey: ["purchase-orders", id],
    queryFn: () =>
      api
        .get<PurchaseOrderResponse>(`/api/purchase-orders/${id}`)
        .then((res) => res.purchaseOrder),
    enabled: !!id,
  });
}

export { useStockIn as useReceiveStockIn } from "./use-stock-movements";

