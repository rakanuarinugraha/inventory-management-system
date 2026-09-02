import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import type { Product, CreateProductInput, UpdateProductInput } from "@/types/product";

interface ProductsResponse {
  products: Product[];
}

interface ProductResponse {
  message: string;
  product: Product;
}

export function useProducts() {
  return useQuery<Product[], ApiError>({
    queryKey: ["products"],
    queryFn: () => api.get<ProductsResponse>("/api/products").then((res) => res.products),
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

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation<{ message: string }, ApiError, string>({
    mutationFn: (id) => api.delete<{ message: string }>(`/api/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}
