export type VelocityClassification = "FAST" | "MEDIUM" | "SLOW";

export interface ProductMovementItem {
  productId: string;
  productName: string;
  productSku: string;
  categoryName: string;
  totalQuantityOut: number;
  movementCount: number;
  classification: VelocityClassification;
}

export interface MovingItemsReport {
  period: { from: string; to: string };
  summary: {
    totalProducts: number;
    fastMovingCount: number;
    mediumMovingCount: number;
    slowMovingCount: number;
  };
  items: ProductMovementItem[];
}

export interface StockMovementReportQuery {
  date_from: string;
  date_to: string;
  warehouseId?: string;
  categoryId?: string;
}
