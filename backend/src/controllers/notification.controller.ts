import { Request, Response, NextFunction } from 'express';
import { NotificationService } from '../services/notification.service';
import { sendSuccess } from '../utils/apiResponse';

export class NotificationController {
  static async getPreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const prefs = await NotificationService.getPreferences(req.user!.userId);
      sendSuccess(res, prefs, 'Notification preferences retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async updatePreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { enabled, alarmNotifications, infrastructureNotifications, fcmToken } = req.body;
      const prefs = await NotificationService.updatePreferences(req.user!.userId, {
        enabled,
        alarmNotifications,
        infrastructureNotifications,
        fcmToken
      });
      sendSuccess(res, prefs, 'Notification preferences updated');
    } catch (error) {
      next(error);
    }
  }
}
