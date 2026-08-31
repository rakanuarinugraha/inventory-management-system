import { ReportRepository } from "./report.repository";
import { StockMovementReportQuery } from "./report.schema";

interface ProductMovementItem {
  productId: string;
  productName: string;
  productSku: string;
  categoryName: string;
  totalQuantityOut: number;
  movementCount: number;
  classification: "FAST" | "MEDIUM" | "SLOW";
}

interface MovingItemsReport {
  period: { from: string; to: string };
  summary: {
    totalProducts: number;
    fastMovingCount: number;
    mediumMovingCount: number;
    slowMovingCount: number;
  };
  items: ProductMovementItem[];
}

export class ReportService {
  private repo = new ReportRepository();

  async getMovingItemsReport(
    filters: StockMovementReportQuery
  ): Promise<MovingItemsReport> {
    const movements = await this.repo.getOutboundMovements(filters);

    if (movements.length === 0) {
      return {
        period: { from: filters.date_from, to: filters.date_to },
        summary: {
          totalProducts: 0,
          fastMovingCount: 0,
          mediumMovingCount: 0,
          slowMovingCount: 0,
        },
        items: [],
      };
    }

    // Sort by totalQuantityOut descending to determine percentiles
    const sorted = [...movements].sort(
      (a, b) => b.totalQuantityOut - a.totalQuantityOut
    );

    const total = sorted.length;
    const p75Index = Math.ceil(total * 0.25);
    const p25Index = Math.ceil(total * 0.75);

    const fastThreshold = sorted[p75Index - 1]?.totalQuantityOut ?? 0;
    const slowThreshold = sorted[p25Index - 1]?.totalQuantityOut ?? 0;

    const items: ProductMovementItem[] = sorted.map((m) => ({
      ...m,
      classification:
        m.totalQuantityOut >= fastThreshold && fastThreshold > 0
          ? "FAST"
          : m.totalQuantityOut <= slowThreshold
            ? "SLOW"
            : "MEDIUM",
    }));

    const fastMovingCount = items.filter(
      (i) => i.classification === "FAST"
    ).length;
    const mediumMovingCount = items.filter(
      (i) => i.classification === "MEDIUM"
    ).length;
    const slowMovingCount = items.filter(
      (i) => i.classification === "SLOW"
    ).length;

    return {
      period: { from: filters.date_from, to: filters.date_to },
      summary: {
        totalProducts: total,
        fastMovingCount,
        mediumMovingCount,
        slowMovingCount,
      },
      items,
    };
  }

  async getStockExportCsv(): Promise<string> {
    const rows = await this.repo.getStockExportData();

    const headers = [
      "SKU",
      "Product Name",
      "Category",
      "Warehouse",
      "Current Stock",
      "Unit",
      "Reorder Point",
    ];

    const escapeCsv = (value: string | number): string => {
      const str = String(value);
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csvRows = [
      headers.join(","),
      ...rows.map((row) =>
        [
          escapeCsv(row.sku),
          escapeCsv(row.productName),
          escapeCsv(row.category),
          escapeCsv(row.warehouse),
          row.currentStock,
          escapeCsv(row.unit),
          row.reorderPoint,
        ].join(",")
      ),
    ];

    return csvRows.join("\n");
  }
}
