import mongoose, { Document, Schema, Types } from 'mongoose';

export type ConnectionStatus = 'PENDING' | 'CONNECTED' | 'ERROR' | 'DISCONNECTED';

export interface IAWSConnection extends Document {
  userId: Types.ObjectId;
  accountName: string;
  accountId: string;
  roleArn: string;
  externalId: string;
  defaultRegion: string;
  connectionStatus: ConnectionStatus;
  lastErrorMessage?: string;
  lastValidatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AWSConnectionSchema = new Schema<IAWSConnection>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    accountName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    accountId: {
      type: String,
      required: true,
      match: /^\d{12}$/
    },
    roleArn: {
      type: String,
      required: true,
      trim: true
    },
    externalId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    defaultRegion: {
      type: String,
      required: true,
      default: 'us-east-1'
    },
    connectionStatus: {
      type: String,
      enum: ['PENDING', 'CONNECTED', 'ERROR', 'DISCONNECTED'],
      default: 'PENDING',
      index: true
    },
    lastErrorMessage: {
      type: String,
      default: null
    },
    lastValidatedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Compound index to ensure uniqueness of roleArn per user
AWSConnectionSchema.index({ userId: 1, roleArn: 1 }, { unique: true });

export const AWSConnection = mongoose.model<IAWSConnection>('AWSConnection', AWSConnectionSchema);

