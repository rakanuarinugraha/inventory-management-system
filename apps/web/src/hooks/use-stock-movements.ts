import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import type {
  StockMovement,
  StockInInput,
  StockOutInput,
  TransferInput,
} from "@/types/stock-movement";

interface StockInResponse {
  message: string;
  movement: StockMovement;
}

interface StockOutResponse {
  message: string;
  movement: StockMovement;
  warning: string | null;
}

interface TransferResponse {
  message: string;
  movements: {
    transferOut: StockMovement;
    transferIn: StockMovement;
  };
}

interface CurrentStockResponse {
  productId: string;
  warehouseId: string;
  currentStock: number;
}

export interface MovementHistoryFilters {
  productId?: string;
  date_from?: string;
  date_to?: string;
  warehouseId?: string;
  type?: string;
  createdBy?: string;
  page?: number;
  limit?: number;
}

interface MovementHistoryResponse {
  data: StockMovement[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
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

export function useStockIn() {
  const queryClient = useQueryClient();
  return useMutation<StockInResponse, ApiError, StockInInput>({
    mutationFn: (data) => api.post("/api/stock-movements/stock-in", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-movements"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["current-stock"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useStockOut() {
  const queryClient = useQueryClient();
  return useMutation<StockOutResponse, ApiError, StockOutInput>({
    mutationFn: (data) => api.post("/api/stock-movements/stock-out", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-movements"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["current-stock"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useMovementHistory(filters: MovementHistoryFilters) {
  const params = new URLSearchParams();
  if (filters.productId) params.set("productId", filters.productId);
  if (filters.date_from) params.set("date_from", filters.date_from);
  if (filters.date_to) params.set("date_to", filters.date_to);
  if (filters.warehouseId) params.set("warehouseId", filters.warehouseId);
  if (filters.type) params.set("type", filters.type);
  if (filters.createdBy) params.set("createdBy", filters.createdBy);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));

  const queryString = params.toString();

  return useQuery<MovementHistoryResponse, ApiError>({
    queryKey: ["stock-movements", "history", filters],
    queryFn: () =>
      api
        .get<MovementHistoryResponse>(`/api/stock-movements${queryString ? `?${queryString}` : ""}`)
        .then((res) => res),
  });
}

export function useTransferStock() {
  const queryClient = useQueryClient();
  return useMutation<TransferResponse, ApiError, TransferInput>({
    mutationFn: (data) => api.post("/api/stock-movements/transfer", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-movements"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["current-stock"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
