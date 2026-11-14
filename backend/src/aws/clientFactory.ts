import { STSClient, AssumeRoleCommand, Credentials } from '@aws-sdk/client-sts';
import { EC2Client } from '@aws-sdk/client-ec2';
import { CloudWatchClient } from '@aws-sdk/client-cloudwatch';
import { CostExplorerClient } from '@aws-sdk/client-cost-explorer';
import { config } from '../config/environment';
import { logger } from '../utils/logger';
import { IAWSConnection } from '../models/AWSConnection';

interface CachedCredentials {
  credentials: {
    accessKeyId: string;
    secretAccessKey: string;
    sessionToken: string;
  };
  expiresAt: Date;
}

// In-memory cache for assumed role temporary credentials (never persisted to MongoDB or disk)
const credentialsCache = new Map<string, CachedCredentials>();

export class AWSClientFactory {
  private static stsClient = new STSClient({
    region: config.aws.region
  });

  /**
   * Assumes the customer's IAM Role using STS with their unique ExternalId.
   */
  static async getAssumedCredentials(roleArn: string, externalId: string): Promise<Credentials> {
    const cacheKey = `${roleArn}:${externalId}`;
    const cached = credentialsCache.get(cacheKey);

    // If cached credentials exist and have > 60 seconds of validity remaining, reuse them
    if (cached && cached.expiresAt.getTime() - Date.now() > 60_000) {
      return {
        AccessKeyId: cached.credentials.accessKeyId,
        SecretAccessKey: cached.credentials.secretAccessKey,
        SessionToken: cached.credentials.sessionToken,
        Expiration: cached.expiresAt
      };
    }

    logger.info(`Assuming IAM role via STS: ${roleArn}`);

    try {
      const command = new AssumeRoleCommand({
        RoleArn: roleArn,
        RoleSessionName: `OpsRadarSession-${Date.now()}`,
        ExternalId: externalId,
        DurationSeconds: config.aws.stsSessionDurationSeconds
      });

      const response = await this.stsClient.send(command);

      if (!response.Credentials || !response.Credentials.AccessKeyId || !response.Credentials.SecretAccessKey) {
        throw new Error('STS returned empty temporary credentials.');
      }

      // Store in memory cache
      if (response.Credentials.Expiration) {
        credentialsCache.set(cacheKey, {
          credentials: {
            accessKeyId: response.Credentials.AccessKeyId,
            secretAccessKey: response.Credentials.SecretAccessKey,
            sessionToken: response.Credentials.SessionToken || ''
          },
          expiresAt: response.Credentials.Expiration
        });
      }

      return response.Credentials;
    } catch (error: any) {
      logger.error(`STS AssumeRole failed for ${roleArn}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtains an assumed-role authenticated EC2Client for the given AWS connection and region.
   */
  static async getEC2Client(connection: IAWSConnection, region?: string): Promise<EC2Client> {
    const credentials = await this.getAssumedCredentials(connection.roleArn, connection.externalId);
    return new EC2Client({
      region: region || connection.defaultRegion || config.aws.region,
      credentials: {
        accessKeyId: credentials.AccessKeyId!,
        secretAccessKey: credentials.SecretAccessKey!,
        sessionToken: credentials.SessionToken!
      }
    });
  }

  /**
   * Obtains an assumed-role authenticated CloudWatchClient for the given AWS connection and region.
   */
  static async getCloudWatchClient(connection: IAWSConnection, region?: string): Promise<CloudWatchClient> {
    const credentials = await this.getAssumedCredentials(connection.roleArn, connection.externalId);
    return new CloudWatchClient({
      region: region || connection.defaultRegion || config.aws.region,
      credentials: {
        accessKeyId: credentials.AccessKeyId!,
        secretAccessKey: credentials.SecretAccessKey!,
        sessionToken: credentials.SessionToken!
      }
    });
  }

  /**
   * Obtains an assumed-role authenticated CostExplorerClient (global endpoint us-east-1).
   */
  static async getCostExplorerClient(connection: IAWSConnection): Promise<CostExplorerClient> {
    const credentials = await this.getAssumedCredentials(connection.roleArn, connection.externalId);
    return new CostExplorerClient({
      region: 'us-east-1', // Cost Explorer API endpoint is us-east-1
      credentials: {
        accessKeyId: credentials.AccessKeyId!,
        secretAccessKey: credentials.SecretAccessKey!,
        sessionToken: credentials.SessionToken!
      }
    });
  }
}
