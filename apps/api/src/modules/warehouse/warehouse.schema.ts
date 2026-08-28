import { z } from "zod";

export const createWarehouseSchema = z.object({
  name: z.string().min(1, "Warehouse name is required"),
  address: z.string().min(1, "Address is required"),
});

export const updateWarehouseSchema = z.object({
  name: z.string().min(1).optional(),
  address: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
});

export type CreateWarehouseInput = z.infer<typeof createWarehouseSchema>;
export type UpdateWarehouseInput = z.infer<typeof updateWarehouseSchema>;
