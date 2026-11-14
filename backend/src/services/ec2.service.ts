import {
  DescribeInstancesCommand,
  DescribeInstanceStatusCommand,
  Instance
} from '@aws-sdk/client-ec2';
import { AWSClientFactory } from '../aws/clientFactory';
import { IAWSConnection } from '../models/AWSConnection';
import { logger } from '../utils/logger';

export interface FormattedEC2Instance {
  id: string;
  name: string;
  type: string;
  state: string;
  region: string;
  availabilityZone: string;
  privateIp?: string;
  publicIp?: string;
  launchTime?: Date;
  platform?: string;
  monitoringState?: string;
  systemStatus?: string;
  instanceStatus?: string;
  tags: Record<string, string>;
}

export class EC2Service {
  /**
   * Fetches EC2 instances across a specified region (or defaults to connection defaultRegion)
   */
  static async getInstances(
    connection: IAWSConnection,
    region: string,
    filters?: { state?: string; search?: string }
  ): Promise<{ instances: FormattedEC2Instance[]; total: number; running: number; stopped: number }> {
    const ec2 = await AWSClientFactory.getEC2Client(connection, region);

    const command = new DescribeInstancesCommand({});
    const response = await ec2.send(command);

    const instances: FormattedEC2Instance[] = [];

    if (response.Reservations) {
      for (const res of response.Reservations) {
        if (res.Instances) {
          for (const inst of res.Instances) {
            const formatted = this.formatInstance(inst, region);
            instances.push(formatted);
          }
        }
      }
    }

    // Filter in memory for responsiveness
    let filtered = instances;
    if (filters?.state && filters.state.toLowerCase() !== 'all') {
      filtered = filtered.filter((i) => i.state.toLowerCase() === filters.state?.toLowerCase());
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter((i) => i.name.toLowerCase().includes(q) || i.id.toLowerCase().includes(q));
    }

    const running = instances.filter((i) => i.state.toLowerCase() === 'running').length;
    const stopped = instances.filter((i) => i.state.toLowerCase() === 'stopped').length;

    return {
      instances: filtered,
      total: instances.length,
      running,
      stopped
    };
  }

  /**
   * Fetches single instance details including system/instance status checks
   */
  static async getInstanceDetails(
    connection: IAWSConnection,
    instanceId: string,
    region: string
  ): Promise<FormattedEC2Instance> {
    const ec2 = await AWSClientFactory.getEC2Client(connection, region);

    const command = new DescribeInstancesCommand({
      InstanceIds: [instanceId]
    });
    const response = await ec2.send(command);

    const instance = response.Reservations?.[0]?.Instances?.[0];
    if (!instance) {
      const error: any = new Error(`Instance ${instanceId} not found in region ${region}.`);
      error.statusCode = 404;
      throw error;
    }

    const formatted = this.formatInstance(instance, region);

    // Fetch live status checks
    try {
      const statusCmd = new DescribeInstanceStatusCommand({
        InstanceIds: [instanceId],
        IncludeAllInstances: true
      });
      const statusRes = await ec2.send(statusCmd);
      const statusItem = statusRes.InstanceStatuses?.[0];
      if (statusItem) {
        formatted.systemStatus = statusItem.SystemStatus?.Status;
        formatted.instanceStatus = statusItem.InstanceStatus?.Status;
      }
    } catch (err: any) {
      logger.warn(`Could not fetch instance status checks for ${instanceId}: ${err.message}`);
    }

    return formatted;
  }

  private static formatInstance(inst: Instance, region: string): FormattedEC2Instance {
    const tagMap: Record<string, string> = {};
    if (inst.Tags) {
      for (const t of inst.Tags) {
        if (t.Key && t.Value) tagMap[t.Key] = t.Value;
      }
    }

    const name = tagMap['Name'] || inst.InstanceId || 'Unnamed Instance';

    return {
      id: inst.InstanceId || '',
      name,
      type: inst.InstanceType || 'unknown',
      state: inst.State?.Name || 'unknown',
      region,
      availabilityZone: inst.Placement?.AvailabilityZone || region,
      privateIp: inst.PrivateIpAddress,
      publicIp: inst.PublicIpAddress,
      launchTime: inst.LaunchTime,
      platform: inst.PlatformDetails || inst.Platform || 'Linux/UNIX',
      monitoringState: inst.Monitoring?.State,
      tags: tagMap
    };
  }
}
