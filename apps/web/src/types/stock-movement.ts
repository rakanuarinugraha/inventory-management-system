import type { Product } from "./product";
import type { Warehouse } from "./warehouse";

export type MovementType =
  | "IN"
  | "OUT"
  | "TRANSFER_IN"
  | "TRANSFER_OUT"
  | "ADJUSTMENT_IN"
  | "ADJUSTMENT_OUT";

export interface StockMovement {
  id: string;
  productId: string;
  warehouseId: string;
  type: MovementType;
  quantity: number;
  referenceType: string | null;
  referenceId: string | null;
  note: string | null;
  createdBy: string;
  createdAt: string;
  product: Product;
  warehouse: Warehouse;
  creator: { id: string; name: string };
}

export interface StockInInput {
  poId: string;
  productId: string;
  warehouseId: string;
  quantity: number;
  note?: string;
}

export interface StockOutInput {
  productId: string;
  warehouseId: string;
  quantity: number;
  note?: string;
}

export interface TransferInput {
  productId: string;
  sourceWarehouseId: string;
  destinationWarehouseId: string;
  quantity: number;
  note?: string;
}

