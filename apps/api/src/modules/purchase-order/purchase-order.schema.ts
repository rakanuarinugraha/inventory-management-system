import { z } from "zod";

const poItemSchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
  qtyOrdered: z.number().int().min(1, "Quantity must be at least 1"),
  unitPrice: z.number().min(0, "Unit price must be non-negative"),
});

export const createPurchaseOrderSchema = z.object({
  supplierId: z.string().uuid("Invalid supplier ID"),
  items: z.array(poItemSchema).min(1, "At least one item is required"),
});

export type CreatePurchaseOrderInput = z.infer<
  typeof createPurchaseOrderSchema
>;

export const transitionPOStatusSchema = z.object({
  status: z.enum(["SUBMITTED", "CANCELLED"]),
});

export type TransitionPOStatusInput = z.infer<typeof transitionPOStatusSchema>;
