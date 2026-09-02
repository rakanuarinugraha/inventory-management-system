import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import type {
  PurchaseOrder,
  CreatePurchaseOrderInput,
} from "@/types/purchase-order";
import type { Product } from "@/types/product";

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

export function useCreatePurchaseOrder() {
  const queryClient = useQueryClient();
  return useMutation<
    { message: string; purchaseOrder: PurchaseOrder },
    ApiError,
    CreatePurchaseOrderInput
  >({
    mutationFn: (data) => api.post("/api/purchase-orders", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useTransitionPOStatus() {
  const queryClient = useQueryClient();
  return useMutation<
    { message: string; purchaseOrder: PurchaseOrder },
    ApiError,
    { id: string; status: "SUBMITTED" | "CANCELLED" }
  >({
    mutationFn: ({ id, status }) =>
      api.patch(`/api/purchase-orders/${id}/status`, { status }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-orders", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useSuggestedReorder() {
  return useQuery<Array<Product & { currentStock: number }>, ApiError>({
    queryKey: ["products", "suggested-reorder"],
    queryFn: () =>
      api
        .get<{ products: Array<Product & { currentStock: number }> }>(
          "/api/products/suggested-reorder"
        )
        .then((res) => res.products),
  });
}

export { useStockIn as useReceiveStockIn } from "./use-stock-movements";


