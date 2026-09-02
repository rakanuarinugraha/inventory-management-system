import type { Product } from "./product";
import type { Warehouse } from "./warehouse";

export type OpnameStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface StockOpnameItem {
  id: string;
  opnameId: string;
  productId: string;
  systemQty: number;
  actualQty: number;
  variance: number;
  createdAt: string;
  product: Product;
}

export interface StockOpname {
  id: string;
  warehouseId: string;
  status: OpnameStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  warehouse: Warehouse;
  items: StockOpnameItem[];
  creator: { id: string; name: string };
}

export interface CreateOpnameInput {
  warehouseId: string;
  items: { productId: string; actualQty: number }[];
}

export interface ApproveOpnameInput {
  status: "APPROVED" | "REJECTED";
}
