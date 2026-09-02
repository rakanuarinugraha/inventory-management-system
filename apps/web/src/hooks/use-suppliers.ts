import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import type { Supplier, CreateSupplierInput, UpdateSupplierInput } from "@/types/supplier";

export type SupplierStatusFilter = "active" | "inactive" | "all";

interface SuppliersResponse {
  suppliers: Supplier[];
}

interface SupplierResponse {
  message: string;
  supplier: Supplier;
}

export function useSuppliers(status: SupplierStatusFilter = "active") {
  return useQuery<Supplier[], ApiError>({
    queryKey: ["suppliers", status],
    queryFn: () =>
      api.get<SuppliersResponse>(`/api/suppliers?status=${status}`).then((res) => res.suppliers),
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();
  return useMutation<SupplierResponse, ApiError, CreateSupplierInput>({
    mutationFn: (data) => api.post<SupplierResponse>("/api/suppliers", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
    },
  });
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient();
  return useMutation<SupplierResponse, ApiError, { id: string; data: UpdateSupplierInput }>({
    mutationFn: ({ id, data }) => api.put<SupplierResponse>(`/api/suppliers/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
    },
  });
}

export function useDeactivateSupplier() {
  const queryClient = useQueryClient();
  return useMutation<SupplierResponse, ApiError, string>({
    mutationFn: (id) => api.patch<SupplierResponse>(`/api/suppliers/${id}/deactivate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
    },
  });
}

export function useReactivateSupplier() {
  const queryClient = useQueryClient();
  return useMutation<SupplierResponse, ApiError, string>({
    mutationFn: (id) => api.patch<SupplierResponse>(`/api/suppliers/${id}/reactivate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
    },
  });
}
