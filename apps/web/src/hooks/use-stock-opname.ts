import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import type {
  StockOpname,
  CreateOpnameInput,
  ApproveOpnameInput,
} from "@/types/stock-opname";

interface StockOpnamesResponse {
  opnames: StockOpname[];
}

interface StockOpnameResponse {
  opname: StockOpname;
}

interface CreateOpnameResponse {
  message: string;
  opname: StockOpname;
}

export function useStockOpnames() {
  return useQuery<StockOpname[], ApiError>({
    queryKey: ["stock-opnames"],
    queryFn: () =>
      api
        .get<StockOpnamesResponse>("/api/stock-opnames")
        .then((res) => res.opnames),
  });
}

export function useStockOpname(id: string) {
  return useQuery<StockOpname, ApiError>({
    queryKey: ["stock-opname", id],
    queryFn: () =>
      api
        .get<StockOpnameResponse>(`/api/stock-opnames/${id}`)
        .then((res) => res.opname),
    enabled: !!id,
  });
}

export function useCreateOpname() {
  const queryClient = useQueryClient();
  return useMutation<CreateOpnameResponse, ApiError, CreateOpnameInput>({
    mutationFn: (data) =>
      api.post<CreateOpnameResponse>("/api/stock-opnames", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-opnames"] });
    },
  });
}

export function useApproveOpname() {
  const queryClient = useQueryClient();
  return useMutation<
    { message: string; opname: StockOpname },
    ApiError,
    { id: string; data: ApproveOpnameInput }
  >({
    mutationFn: ({ id, data }) =>
      api.patch<{ message: string; opname: StockOpname }>(
        `/api/stock-opnames/${id}/status`,
        data
      ),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ["stock-opnames"] });
      queryClient.invalidateQueries({
        queryKey: ["stock-opname", variables.id],
      });
      queryClient.invalidateQueries({ queryKey: ["current-stock"] });
    },
  });
}
