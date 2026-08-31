import { z } from "zod";

const opnameItemSchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
  actualQty: z.number().int().min(0, "Actual quantity must be non-negative"),
});

export const createOpnameSchema = z.object({
  warehouseId: z.string().uuid("Invalid warehouse ID"),
  items: z
    .array(opnameItemSchema)
    .min(1, "At least one item is required")
    .refine(
      (items) => {
        const ids = items.map((i) => i.productId);
        return ids.length === new Set(ids).size;
      },
      { message: "Duplicate products are not allowed" }
    ),
});

export type CreateOpnameInput = z.infer<typeof createOpnameSchema>;

export const approveOpnameSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
});

export type ApproveOpnameInput = z.infer<typeof approveOpnameSchema>;
