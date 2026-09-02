import type { Supplier } from "./supplier";
import type { Product } from "./product";

export type POStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "PARTIALLY_RECEIVED"
  | "COMPLETED"
  | "CANCELLED";

export interface PurchaseOrderItem {
  id: string;
  poId: string;
  productId: string;
  qtyOrdered: number;
  qtyReceived: number;
  unitPrice: number;
  createdAt: string;
  updatedAt: string;
  product: Product;
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  status: POStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  supplier: Supplier;
  items: PurchaseOrderItem[];
  creator: { id: string; name: string };
}

export interface CreatePurchaseOrderItemInput {
  productId: string;
  qtyOrdered: number;
  unitPrice: number;
}

export interface CreatePurchaseOrderInput {
  supplierId: string;
  items: CreatePurchaseOrderItemInput[];
}

export interface TransitionPOStatusInput {
  status: "SUBMITTED" | "CANCELLED";
}

