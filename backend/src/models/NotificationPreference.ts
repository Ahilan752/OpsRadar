import mongoose, { Document, Schema, Types } from 'mongoose';

export interface INotificationPreference extends Document {
  userId: Types.ObjectId;
  awsConnectionId?: Types.ObjectId;
  enabled: boolean;
  alarmNotifications: boolean;
  infrastructureNotifications: boolean;
  fcmToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationPreferenceSchema = new Schema<INotificationPreference>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    awsConnectionId: {
      type: Schema.Types.ObjectId,
      ref: 'AWSConnection',
      default: null
    },
    enabled: {
      type: Boolean,
      default: true
    },
    alarmNotifications: {
      type: Boolean,
      default: true
    },
    infrastructureNotifications: {
      type: Boolean,
      default: true
    },
    fcmToken: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

export const NotificationPreference = mongoose.model<INotificationPreference>(
  'NotificationPreference',
  NotificationPreferenceSchema
);
