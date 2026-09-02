import type { StockMovement } from "./stock-movement";

export interface DashboardSummary {
  totalInventoryValue: number;
  lowStockItemCount: number;
  recentMovements: StockMovement[];
  cachedAt: string;
}
