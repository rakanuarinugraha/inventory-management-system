import { Request, Response, NextFunction } from "express";
import { PurchaseOrderService } from "./purchase-order.service";
import {
  createPurchaseOrderSchema,
  transitionPOStatusSchema,
} from "./purchase-order.schema";

const service = new PurchaseOrderService();

export class PurchaseOrderController {
  static async getAll(_req: Request, res: Response, next: NextFunction) {
    try {
      const purchaseOrders = await service.getAll();
      res.json({ purchaseOrders });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const purchaseOrder = await service.getById(id);
      res.json({ purchaseOrder });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createPurchaseOrderSchema.parse(req.body);
      const createdBy = req.user!.userId;
      const purchaseOrder = await service.create(data, createdBy);
      res
        .status(201)
        .json({ message: "Purchase order created successfully", purchaseOrder });
    } catch (error) {
      next(error);
    }
  }

  static async transitionStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const data = transitionPOStatusSchema.parse(req.body);
      const purchaseOrder = await service.transitionStatus(id, data);
      res.json({
        message: `Purchase order ${data.status.toLowerCase()} successfully`,
        purchaseOrder,
      });
    } catch (error) {
      next(error);
    }
  }
}
