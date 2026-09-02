import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import type { Warehouse, CreateWarehouseInput, UpdateWarehouseInput } from "@/types/warehouse";

export type WarehouseStatusFilter = "active" | "inactive" | "all";

interface WarehousesResponse {
  warehouses: Warehouse[];
}

interface WarehouseResponse {
  message: string;
  warehouse: Warehouse;
}

export function useWarehouses(status: WarehouseStatusFilter = "active") {
  return useQuery<Warehouse[], ApiError>({
    queryKey: ["warehouses", status],
    queryFn: () =>
      api.get<WarehousesResponse>(`/api/warehouses?status=${status}`).then((res) => res.warehouses),
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

export function useDeactivateWarehouse() {
  const queryClient = useQueryClient();
  return useMutation<WarehouseResponse, ApiError, string>({
    mutationFn: (id) => api.patch<WarehouseResponse>(`/api/warehouses/${id}/deactivate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
    },
  });
}

export function useReactivateWarehouse() {
  const queryClient = useQueryClient();
  return useMutation<WarehouseResponse, ApiError, string>({
    mutationFn: (id) => api.patch<WarehouseResponse>(`/api/warehouses/${id}/reactivate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
    },
  });
}
