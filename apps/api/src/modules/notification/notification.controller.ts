import { Request, Response, NextFunction } from "express";
import { NotificationService } from "./notification.service";

const service = new NotificationService();

export class NotificationController {
  static async getNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const notifications = await service.getNotificationsByUser(userId);
      res.json(notifications);
    } catch (error) {
      next(error);
    }
  }

  static async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const id = req.params.id as string;
      const notification = await service.markAsRead(id, userId);
      res.json(notification);
    } catch (error) {
      next(error);
    }
  }
}
