import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import type { Product, CreateProductInput, UpdateProductInput } from "@/types/product";

export type ProductStatusFilter = "active" | "inactive" | "all";

interface ProductsResponse {
  products: Product[];
}

interface ProductResponse {
  message: string;
  product: Product;
}

export function useProducts(status: ProductStatusFilter = "active") {
  return useQuery<Product[], ApiError>({
    queryKey: ["products", status],
    queryFn: () =>
      api.get<ProductsResponse>(`/api/products?status=${status}`).then((res) => res.products),
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation<ProductResponse, ApiError, CreateProductInput>({
    mutationFn: (data) => api.post<ProductResponse>("/api/products", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation<ProductResponse, ApiError, { id: string; data: UpdateProductInput }>({
    mutationFn: ({ id, data }) => api.put<ProductResponse>(`/api/products/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useDeactivateProduct() {
  const queryClient = useQueryClient();
  return useMutation<{ message: string }, ApiError, string>({
    mutationFn: (id) => api.patch<{ message: string }>(`/api/products/${id}/deactivate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useReactivateProduct() {
  const queryClient = useQueryClient();
  return useMutation<ProductResponse, ApiError, string>({
    mutationFn: (id) => api.patch<ProductResponse>(`/api/products/${id}/reactivate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}
