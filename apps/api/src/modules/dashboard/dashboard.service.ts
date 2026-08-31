import { DashboardRepository } from "./dashboard.repository";
import redis from "../../lib/redis";

const CACHE_KEY = "dashboard:summary";
const CACHE_TTL_SECONDS = 60;

interface DashboardSummary {
  totalInventoryValue: number;
  lowStockItemCount: number;
  recentMovements: unknown[];
  cachedAt: string;
}

export class DashboardService {
  private repo = new DashboardRepository();

  async getSummary(): Promise<DashboardSummary> {
    const cached = await redis.get(CACHE_KEY);
    if (cached) {
      return JSON.parse(cached) as DashboardSummary;
    }

    const summary = await this.refreshCache();
    return summary;
  }

  async refreshCache(): Promise<DashboardSummary> {
    const [valueResult, lowStockResult, recentMovements] = await Promise.all([
      this.repo.getTotalInventoryValue(),
      this.repo.getLowStockCount(),
      this.repo.getRecentMovements(10),
    ]);

    const summary: DashboardSummary = {
      totalInventoryValue: valueResult.totalValue,
      lowStockItemCount: lowStockResult.lowStockCount,
      recentMovements,
      cachedAt: new Date().toISOString(),
    };

    await redis.set(CACHE_KEY, JSON.stringify(summary), "EX", CACHE_TTL_SECONDS);

    return summary;
  }
}
