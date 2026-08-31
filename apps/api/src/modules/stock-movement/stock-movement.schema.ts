import { z } from "zod";

export const stockInSchema = z.object({
  poId: z.string().uuid("Invalid purchase order ID"),
  productId: z.string().uuid("Invalid product ID"),
  warehouseId: z.string().uuid("Invalid warehouse ID"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  note: z.string().optional(),
});

export type StockInInput = z.infer<typeof stockInSchema>;

export const stockOutSchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
  warehouseId: z.string().uuid("Invalid warehouse ID"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  note: z.string().optional(),
});

export type StockOutInput = z.infer<typeof stockOutSchema>;

export const transferSchema = z
  .object({
    productId: z.string().uuid("Invalid product ID"),
    sourceWarehouseId: z.string().uuid("Invalid source warehouse ID"),
    destinationWarehouseId: z.string().uuid("Invalid destination warehouse ID"),
    quantity: z.number().int().min(1, "Quantity must be at least 1"),
    note: z.string().optional(),
  })
  .refine((data) => data.sourceWarehouseId !== data.destinationWarehouseId, {
    message: "Source and destination warehouses must be different",
  });

export type TransferInput = z.infer<typeof transferSchema>;

export const movementHistoryQuerySchema = z.object({
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
  warehouseId: z.string().uuid("Invalid warehouse ID").optional(),
  type: z
    .enum([
      "IN",
      "OUT",
      "TRANSFER_IN",
      "TRANSFER_OUT",
      "ADJUSTMENT_IN",
      "ADJUSTMENT_OUT",
    ])
    .optional(),
  createdBy: z.string().uuid("Invalid user ID").optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type MovementHistoryQuery = z.infer<typeof movementHistoryQuerySchema>;
