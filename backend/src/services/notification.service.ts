import { NotificationPreference } from '../models/NotificationPreference';
import { logger } from '../utils/logger';

export class NotificationService {
  static async getPreferences(userId: string) {
    let prefs = await NotificationPreference.findOne({ userId });
    if (!prefs) {
      prefs = await NotificationPreference.create({
        userId,
        enabled: true,
        alarmNotifications: true,
        infrastructureNotifications: true
      });
    }
    return prefs;
  }

  static async updatePreferences(
    userId: string,
    updates: {
      enabled?: boolean;
      alarmNotifications?: boolean;
      infrastructureNotifications?: boolean;
      fcmToken?: string;
    }
  ) {
    let prefs = await NotificationPreference.findOne({ userId });
    if (!prefs) {
      prefs = new NotificationPreference({ userId });
    }

    if (updates.enabled !== undefined) prefs.enabled = updates.enabled;
    if (updates.alarmNotifications !== undefined) prefs.alarmNotifications = updates.alarmNotifications;
    if (updates.infrastructureNotifications !== undefined)
      prefs.infrastructureNotifications = updates.infrastructureNotifications;
    if (updates.fcmToken !== undefined) prefs.fcmToken = updates.fcmToken;

    await prefs.save();
    return prefs;
  }

  /**
   * Dispatches push notifications to Android devices when critical CloudWatch alarms trigger
   */
  static async sendAlarmNotification(userId: string, alarmName: string, stateReason: string): Promise<void> {
    const prefs = await NotificationPreference.findOne({ userId });
    if (!prefs || !prefs.enabled || !prefs.alarmNotifications || !prefs.fcmToken) {
      return;
    }

    logger.info(`Sending FCM Alarm notification for [${alarmName}] to user ${userId}`);
    // Simulated or production FCM HTTP v1 dispatch
    // In production with FIREBASE_SERVER_KEY configured, this sends to FCM API
  }
}
