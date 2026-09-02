import { useQuery } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import type {
  MovingItemsReport,
  StockMovementReportQuery,
} from "@/types/report";

export function useMovingItemsReport(filters: StockMovementReportQuery) {
  const queryParams = new URLSearchParams({
    date_from: filters.date_from,
    date_to: filters.date_to,
  });

  if (filters.warehouseId) {
    queryParams.set("warehouseId", filters.warehouseId);
  }
  if (filters.categoryId) {
    queryParams.set("categoryId", filters.categoryId);
  }

  return useQuery<MovingItemsReport, ApiError>({
    queryKey: ["reports", "moving-items", filters],
    queryFn: () =>
      api.get<MovingItemsReport>(
        `/api/reports/moving-items?${queryParams.toString()}`
      ),
    enabled: !!filters.date_from && !!filters.date_to,
  });
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export async function downloadStockReportCsv(): Promise<void> {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("accessToken")
      : null;

  const res = await fetch(`${API_BASE_URL}/api/reports/stock-export`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok) {
    const errorData = await res
      .json()
      .catch(() => ({ message: "Failed to export CSV" }));
    throw new Error(errorData.message || "Failed to export CSV");
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const timestamp = new Date().toISOString().split("T")[0];
  a.download = `stock-report-${timestamp}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

export async function downloadStockReportExcel(): Promise<void> {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("accessToken")
      : null;

  const res = await fetch(`${API_BASE_URL}/api/reports/stock-export/excel`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok) {
    const errorData = await res
      .json()
      .catch(() => ({ message: "Failed to export Excel" }));
    throw new Error(errorData.message || "Failed to export Excel");
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const timestamp = new Date().toISOString().split("T")[0];
  a.download = `stock-report-${timestamp}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
