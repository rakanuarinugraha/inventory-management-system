import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import type { StockMovement } from "@/types/stock-movement";

interface StockOutResponse {
  message: string;
  movement: StockMovement;
  warning: string | null;
}

interface CurrentStockResponse {
  productId: string;
  warehouseId: string;
  currentStock: number;
}

export function useCurrentStock(productId: string | null, warehouseId: string | null) {
  return useQuery<CurrentStockResponse, ApiError>({
    queryKey: ["current-stock", productId, warehouseId],
    queryFn: () =>
      api
        .get<CurrentStockResponse>(
          `/api/stock-movements/current-stock?productId=${productId}&warehouseId=${warehouseId}`
        )
        .then((res) => res),
    enabled: !!productId && !!warehouseId,
  });
}

export function useStockOut() {
  const queryClient = useQueryClient();
  return useMutation<StockOutResponse, ApiError, {
    productId: string;
    warehouseId: string;
    quantity: number;
    note?: string;
  }>({
    mutationFn: (data) => api.post("/api/stock-movements/stock-out", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-movements"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["current-stock"] });
    },
  });
}
