import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import type { Supplier, CreateSupplierInput, UpdateSupplierInput } from "@/types/supplier";

interface SuppliersResponse {
  suppliers: Supplier[];
}

interface SupplierResponse {
  message: string;
  supplier: Supplier;
}

export function useSuppliers() {
  return useQuery<Supplier[], ApiError>({
    queryKey: ["suppliers"],
    queryFn: () => api.get<SuppliersResponse>("/api/suppliers").then((res) => res.suppliers),
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

export function useDeleteSupplier() {
  const queryClient = useQueryClient();
  return useMutation<{ message: string }, ApiError, string>({
    mutationFn: (id) => api.delete<{ message: string }>(`/api/suppliers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
    },
  });
}
