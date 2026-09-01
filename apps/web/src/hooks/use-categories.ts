import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import type { Category, CreateCategoryInput, UpdateCategoryInput } from "@/types/category";

interface CategoriesResponse {
  categories: Category[];
}

interface CategoryResponse {
  message: string;
  category: Category;
}

export function useCategories() {
  return useQuery<Category[], ApiError>({
    queryKey: ["categories"],
    queryFn: () => api.get<CategoriesResponse>("/api/categories").then((res) => res.categories),
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation<CategoryResponse, ApiError, CreateCategoryInput>({
    mutationFn: (data) => api.post<CategoryResponse>("/api/categories", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation<CategoryResponse, ApiError, { id: string; data: UpdateCategoryInput }>({
    mutationFn: ({ id, data }) => api.put<CategoryResponse>(`/api/categories/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation<{ message: string }, ApiError, string>({
    mutationFn: (id) => api.delete<{ message: string }>(`/api/categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}
