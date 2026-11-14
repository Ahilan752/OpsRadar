import { DescribeRegionsCommand } from '@aws-sdk/client-ec2';
import { AWSConnection, IAWSConnection } from '../models/AWSConnection';
import { generateExternalId } from '../utils/crypto';
import { config } from '../config/environment';
import { AWSClientFactory } from '../aws/clientFactory';
import { logger } from '../utils/logger';

export class AWSConnectionService {
  /**
   * Step 1: User requests to connect an AWS account.
   * Generates a unique external ID and returns the exact IAM Trust Policy and Instructions.
   */
  static async initiateConnection(userId: string, accountName: string, defaultRegion = 'us-east-1') {
    const externalId = generateExternalId();

    const connection = await AWSConnection.create({
      userId,
      accountName,
      accountId: '000000000000', // Placeholder until user provides their Account ID & Role ARN
      roleArn: 'pending',
      externalId,
      defaultRegion,
      connectionStatus: 'PENDING'
    });

    const trustPolicy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: {
            AWS: config.aws.backendRoleArn
          },
          Action: 'sts:AssumeRole',
          Condition: {
            StringEquals: {
              'sts:ExternalId': externalId
            }
          }
        }
      ]
    };

    const permissionsPolicy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Action: [
            'ec2:DescribeInstances',
            'ec2:DescribeRegions',
            'ec2:DescribeTags',
            'ec2:DescribeInstanceStatus',
            'cloudwatch:DescribeAlarms',
            'cloudwatch:DescribeAlarmHistory',
            'cloudwatch:GetMetricData',
            'cloudwatch:GetMetricStatistics',
            'cloudwatch:ListMetrics',
            'ce:GetCostAndUsage',
            'ce:GetCostForecast',
            'ce:GetDimensionValues'
          ],
          Resource: '*'
        }
      ]
    };

    return {
      connectionId: connection._id,
      accountName,
      externalId,
      backendPrincipalArn: config.aws.backendRoleArn,
      backendAccountId: config.aws.backendAccountId,
      suggestedRoleName: 'OpsRadarReadOnlyRole',
      trustPolicyJson: JSON.stringify(trustPolicy, null, 2),
      permissionsPolicyJson: JSON.stringify(permissionsPolicy, null, 2),
      cloudFormationTemplateUrl: '/cloudformation/OpsRadarReadOnlyRole.template.yaml'
    };
  }

  /**
   * Step 2: Validate the Role ARN and complete connection via STS AssumeRole
   */
  static async completeConnection(
    userId: string,
    connectionId: string,
    accountId: string,
    roleArn: string,
    defaultRegion = 'us-east-1'
  ): Promise<IAWSConnection> {
    const connection = await AWSConnection.findOne({ _id: connectionId, userId });
    if (!connection) {
      const error: any = new Error('Connection request not found.');
      error.statusCode = 404;
      throw error;
    }

    try {
      // Validate by attempting to assume the role
      await AWSClientFactory.getAssumedCredentials(roleArn, connection.externalId);

      connection.accountId = accountId;
      connection.roleArn = roleArn;
      connection.defaultRegion = defaultRegion;
      connection.connectionStatus = 'CONNECTED';
      connection.lastValidatedAt = new Date();
      connection.lastErrorMessage = undefined;
      await connection.save();

      logger.info(`AWS Connection successfully established for account ${accountId}`);
      return connection;
    } catch (err: any) {
      connection.connectionStatus = 'ERROR';
      connection.lastErrorMessage = err.message || 'Failed to assume IAM role';
      await connection.save();

      const error: any = new Error(
        `Unable to connect to AWS IAM role. Verify that the Role ARN, External ID, and trust policy match. Error: ${err.message}`
      );
      error.statusCode = 400;
      error.isOperational = true;
      throw error;
    }
  }

  static async listConnections(userId: string): Promise<IAWSConnection[]> {
    return AWSConnection.find({ userId }).sort({ createdAt: -1 });
  }

  static async getConnection(userId: string, connectionId: string): Promise<IAWSConnection> {
    const connection = await AWSConnection.findOne({ _id: connectionId, userId });
    if (!connection) {
      const error: any = new Error('AWS connection not found.');
      error.statusCode = 404;
      throw error;
    }
    return connection;
  }

  static async deleteConnection(userId: string, connectionId: string): Promise<void> {
    const result = await AWSConnection.deleteOne({ _id: connectionId, userId });
    if (result.deletedCount === 0) {
      const error: any = new Error('AWS connection not found.');
      error.statusCode = 404;
      throw error;
    }
  }

  static async getRegions(connection: IAWSConnection): Promise<string[]> {
    try {
      const ec2 = await AWSClientFactory.getEC2Client(connection, 'us-east-1');
      const response = await ec2.send(new DescribeRegionsCommand({ AllRegions: false }));
      return (response.Regions?.map((r) => r.RegionName!).filter(Boolean) || [
        'us-east-1',
        'us-east-2',
        'us-west-1',
        'us-west-2',
        'eu-west-1',
        'eu-central-1',
        'ap-southeast-1',
        'ap-northeast-1',
        'ap-south-1'
      ]).sort();
    } catch (err: any) {
      logger.warn(`Failed to describe regions, returning default region set: ${err.message}`);
      return [
        'us-east-1',
        'us-east-2',
        'us-west-1',
        'us-west-2',
        'eu-west-1',
        'eu-central-1',
        'ap-southeast-1',
        'ap-northeast-1',
        'ap-south-1'
      ];
    }
  }
}
