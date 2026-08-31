import { NotificationRepository } from "./notification.repository";

class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class NotificationService {
  private repo = new NotificationRepository();

  async getNotificationsByUser(userId: string) {
    return this.repo.findByUserId(userId);
  }

  async markAsRead(id: string, userId: string) {
    const notification = await this.repo.findById(id);
    if (!notification) {
      throw new AppError("Notification not found", 404);
    }
    if (notification.userId !== userId) {
      throw new AppError("Forbidden", 403);
    }
    return this.repo.markAsRead(id);
  }
}
