import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import type { Warehouse, CreateWarehouseInput, UpdateWarehouseInput } from "@/types/warehouse";

interface WarehousesResponse {
  warehouses: Warehouse[];
}

interface WarehouseResponse {
  message: string;
  warehouse: Warehouse;
}

export function useWarehouses() {
  return useQuery<Warehouse[], ApiError>({
    queryKey: ["warehouses"],
    queryFn: () => api.get<WarehousesResponse>("/api/warehouses").then((res) => res.warehouses),
  });
}

export function useCreateWarehouse() {
  const queryClient = useQueryClient();
  return useMutation<WarehouseResponse, ApiError, CreateWarehouseInput>({
    mutationFn: (data) => api.post<WarehouseResponse>("/api/warehouses", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
    },
  });
}

export function useUpdateWarehouse() {
  const queryClient = useQueryClient();
  return useMutation<WarehouseResponse, ApiError, { id: string; data: UpdateWarehouseInput }>({
    mutationFn: ({ id, data }) => api.put<WarehouseResponse>(`/api/warehouses/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
    },
  });
}

export function useDeleteWarehouse() {
  const queryClient = useQueryClient();
  return useMutation<{ message: string }, ApiError, string>({
    mutationFn: (id) => api.delete<{ message: string }>(`/api/warehouses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
    },
  });
}
