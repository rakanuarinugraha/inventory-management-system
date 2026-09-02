import type { Category } from "./category";

export interface Product {
  id: string;
  sku: string;
  name: string;
  categoryId: string;
  unit: string;
  reorderPoint: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  category: Category;
}

export interface CreateProductInput {
  sku: string;
  name: string;
  categoryId: string;
  unit: string;
  reorderPoint?: number;
}

export interface UpdateProductInput {
  sku?: string;
  name?: string;
  categoryId?: string;
  unit?: string;
  reorderPoint?: number;
  isActive?: boolean;
}
