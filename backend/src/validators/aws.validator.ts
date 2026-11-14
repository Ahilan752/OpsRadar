import { z } from 'zod';

export const initiateConnectionSchema = z.object({
  accountName: z.string().min(1, 'Account name is required').max(100),
  defaultRegion: z.string().default('us-east-1')
});

export const completeConnectionSchema = z
  .object({
    connectionId: z.string().min(1, 'Connection ID is required'),
    accountId: z.string().regex(/^\d{12}$/, 'AWS Account ID must be exactly 12 numeric digits'),
    roleArn: z
      .string()
      .regex(
        /^arn:aws:iam::\d{12}:role\/[\w+=,.@-]{1,64}$/,
        'Role ARN must be a valid IAM role ARN (e.g. arn:aws:iam::123456789012:role/OpsRadarReadOnly)'
      ),
    defaultRegion: z.string().min(1).default('us-east-1')
  })
  .refine(
    (data) => {
      // Validate that the accountId in the roleArn matches the provided accountId
      const arnParts = data.roleArn.split(':');
      const arnAccountId = arnParts[4];
      return arnAccountId === data.accountId;
    },
    {
      message: 'AWS Account ID does not match the account ID inside the Role ARN.',
      path: ['roleArn']
    }
  );

export const validateRoleArnSchema = z.object({
  accountId: z.string().regex(/^\d{12}$/, 'AWS Account ID must be 12 digits'),
  roleArn: z.string().regex(/^arn:aws:iam::\d{12}:role\/[\w+=,.@-]{1,64}$/, 'Invalid IAM Role ARN format'),
  externalId: z.string().min(1, 'External ID is required')
});

