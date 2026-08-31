import { z } from "zod";

export const stockMovementReportQuerySchema = z.object({
  date_from: z.string().min(1, "date_from is required"),
  date_to: z.string().min(1, "date_to is required"),
  warehouseId: z.string().uuid("Invalid warehouse ID").optional(),
  categoryId: z.string().uuid("Invalid category ID").optional(),
});

export type StockMovementReportQuery = z.infer<
  typeof stockMovementReportQuerySchema
>;
