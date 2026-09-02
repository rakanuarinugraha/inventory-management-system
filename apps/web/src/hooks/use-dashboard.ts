import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import type { DashboardSummary } from "@/types/dashboard";

export function useDashboardSummary(enabled = true) {
  return useQuery<DashboardSummary, ApiError>({
    queryKey: ["dashboard", "summary"],
    queryFn: () => api.get<DashboardSummary>("/api/dashboard/summary"),
    enabled,
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useRefreshDashboard() {
  const queryClient = useQueryClient();
  return useMutation<DashboardSummary, ApiError>({
    mutationFn: () => api.post<DashboardSummary>("/api/dashboard/refresh"),
    onSuccess: (data) => {
      queryClient.setQueryData(["dashboard", "summary"], data);
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
