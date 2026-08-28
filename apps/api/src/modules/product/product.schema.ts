import { z } from "zod";

export const createProductSchema = z.object({
  sku: z.string().min(1, "SKU is required"),
  name: z.string().min(1, "Product name is required"),
  categoryId: z.string().uuid("Invalid category ID"),
  unit: z.string().min(1, "Unit is required"),
  reorderPoint: z.number().int().min(0).default(0),
});

export const updateProductSchema = z.object({
  sku: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  categoryId: z.string().uuid("Invalid category ID").optional(),
  unit: z.string().min(1).optional(),
  reorderPoint: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
