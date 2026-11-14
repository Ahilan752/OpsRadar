import {
  CloudWatchClient,
  GetMetricDataCommand,
  DescribeAlarmsCommand,
  DescribeAlarmHistoryCommand,
  MetricDataQuery,
  MetricDataResult,
  MetricAlarm
} from '@aws-sdk/client-cloudwatch';
import { AWSClientFactory } from '../aws/clientFactory';
import { IAWSConnection } from '../models/AWSConnection';
import { logger } from '../utils/logger';

export interface MetricDataPoint {
  timestamp: string;
  value: number;
}

export interface MetricSeries {
  metricName: string;
  unit: string;
  dataPoints: MetricDataPoint[];
  average?: number;
  maximum?: number;
  minimum?: number;
}

export interface FormattedAlarm {
  alarmName: string;
  alarmArn: string;
  stateValue: 'OK' | 'ALARM' | 'INSUFFICIENT_DATA';
  stateReason: string;
  stateUpdatedTimestamp?: Date;
  metricName?: string;
  namespace?: string;
  statistic?: string;
  threshold?: number;
  comparisonOperator?: string;
  evaluationPeriods?: number;
  period?: number;
  dimensions: Array<{ name: string; value: string }>;
}

export class CloudWatchService {
  /**
   * Retrieves CloudWatch time-series metrics for an EC2 instance or custom dimensions
   */
  static async getMetricData(
    connection: IAWSConnection,
    region: string,
    instanceId: string,
    metricNames: string[],
    timeRange = '1h'
  ): Promise<Record<string, MetricSeries>> {
    const cw: CloudWatchClient = await AWSClientFactory.getCloudWatchClient(connection, region);

    const { startTime, endTime, period } = this.calculateTimeWindow(timeRange);

    const queries: MetricDataQuery[] = metricNames.map((metricName, idx) => ({
      Id: `m${idx}`,
      MetricStat: {
        Metric: {
          Namespace: 'AWS/EC2',
          MetricName: metricName,
          Dimensions: [
            {
              Name: 'InstanceId',
              Value: instanceId
            }
          ]
        },
        Period: period,
        Stat: metricName.includes('Failed') ? 'Maximum' : 'Average'
      },
      ReturnData: true
    }));

    // If MemoryUtilization is requested, check CWAgent namespace
    if (metricNames.includes('mem_used_percent') || metricNames.includes('MemoryUtilization')) {
      queries.push({
        Id: `cwagent_mem`,
        MetricStat: {
          Metric: {
            Namespace: 'CWAgent',
            MetricName: 'mem_used_percent',
            Dimensions: [{ Name: 'InstanceId', Value: instanceId }]
          },
          Period: period,
          Stat: 'Average'
        },
        ReturnData: true
      });
    }

    try {
      const command = new GetMetricDataCommand({
        MetricDataQueries: queries,
        StartTime: startTime,
        EndTime: endTime,
        ScanBy: 'TimestampAscending'
      });

      const response = await cw.send(command);
      const result: Record<string, MetricSeries> = {};

      if (response.MetricDataResults) {
        for (let i = 0; i < response.MetricDataResults.length; i++) {
          const metricRes: MetricDataResult = response.MetricDataResults[i];
          const queryId: string = metricRes.Id || '';
          const matchedQuery: MetricDataQuery | undefined = queries.find((q) => q.Id === queryId);
          const metricName: string = matchedQuery?.MetricStat?.Metric?.MetricName || metricRes.Label || `metric_${i}`;

          const timestamps = metricRes.Timestamps || [];
          const values = metricRes.Values || [];

          const dataPoints: MetricDataPoint[] = [];
          let sum = 0;
          let max = Number.NEGATIVE_INFINITY;
          let min = Number.POSITIVE_INFINITY;

          for (let j = 0; j < timestamps.length; j++) {
            const val = values[j];
            dataPoints.push({
              timestamp: timestamps[j].toISOString(),
              value: Math.round(val * 100) / 100
            });
            sum += val;
            if (val > max) max = val;
            if (val < min) min = val;
          }

          result[metricName] = {
            metricName,
            unit: this.getUnitForMetric(metricName),
            dataPoints,
            average: dataPoints.length ? Math.round((sum / dataPoints.length) * 100) / 100 : 0,
            maximum: dataPoints.length ? Math.round(max * 100) / 100 : 0,
            minimum: dataPoints.length ? Math.round(min * 100) / 100 : 0
          };
        }
      }

      return result;
    } catch (error: any) {
      logger.error(`Failed to fetch CloudWatch metric data: ${error.message}`);
      throw error;
    }
  }

  /**
   * Describes CloudWatch Alarms for the account/region
   */
  static async getAlarms(
    connection: IAWSConnection,
    region: string,
    filters?: { state?: 'OK' | 'ALARM' | 'INSUFFICIENT_DATA'; search?: string }
  ): Promise<{ alarms: FormattedAlarm[]; total: number; inAlarm: number; ok: number }> {
    const cw = await AWSClientFactory.getCloudWatchClient(connection, region);

    const command = new DescribeAlarmsCommand({
      StateValue: filters?.state
    });

    const response = await cw.send(command);
    const metricAlarms: MetricAlarm[] = response.MetricAlarms || [];

    let formatted: FormattedAlarm[] = metricAlarms.map((a) => ({
      alarmName: a.AlarmName || 'Unnamed Alarm',
      alarmArn: a.AlarmArn || '',
      stateValue: (a.StateValue as any) || 'INSUFFICIENT_DATA',
      stateReason: a.StateReason || '',
      stateUpdatedTimestamp: a.StateUpdatedTimestamp,
      metricName: a.MetricName,
      namespace: a.Namespace,
      statistic: a.Statistic,
      threshold: a.Threshold,
      comparisonOperator: a.ComparisonOperator,
      evaluationPeriods: a.EvaluationPeriods,
      period: a.Period,
      dimensions: (a.Dimensions || []).map((d) => ({ name: d.Name || '', value: d.Value || '' }))
    }));

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      formatted = formatted.filter((a) => a.alarmName.toLowerCase().includes(q));
    }

    const inAlarm = formatted.filter((a) => a.stateValue === 'ALARM').length;
    const ok = formatted.filter((a) => a.stateValue === 'OK').length;

    return {
      alarms: formatted,
      total: formatted.length,
      inAlarm,
      ok
    };
  }

  /**
   * Describes alarm history for audit and investigation
   */
  static async getAlarmHistory(connection: IAWSConnection, region: string, alarmName: string) {
    const cw = await AWSClientFactory.getCloudWatchClient(connection, region);

    const command = new DescribeAlarmHistoryCommand({
      AlarmName: alarmName,
      MaxRecords: 30
    });

    const response = await cw.send(command);
    return (response.AlarmHistoryItems || []).map((item) => ({
      timestamp: item.Timestamp,
      historyItemType: item.HistoryItemType,
      historySummary: item.HistorySummary,
      historyData: item.HistoryData
    }));
  }

  private static calculateTimeWindow(timeRange: string): { startTime: Date; endTime: Date; period: number } {
    const endTime = new Date();
    let startTime = new Date();
    let period = 300; // 5 minutes default

    switch (timeRange) {
      case '1h':
        startTime = new Date(endTime.getTime() - 60 * 60 * 1000);
        period = 60; // 1 min resolution
        break;
      case '3h':
        startTime = new Date(endTime.getTime() - 3 * 60 * 60 * 1000);
        period = 180; // 3 mins
        break;
      case '6h':
        startTime = new Date(endTime.getTime() - 6 * 60 * 60 * 1000);
        period = 300; // 5 mins
        break;
      case '24h':
        startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000);
        period = 900; // 15 mins
        break;
      case '7d':
        startTime = new Date(endTime.getTime() - 7 * 24 * 60 * 60 * 1000);
        period = 3600; // 1 hour
        break;
      case '30d':
        startTime = new Date(endTime.getTime() - 30 * 24 * 60 * 60 * 1000);
        period = 86400; // 1 day
        break;
      default:
        startTime = new Date(endTime.getTime() - 60 * 60 * 1000);
        period = 60;
    }

    return { startTime, endTime, period };
  }

  private static getUnitForMetric(metricName: string): string {
    if (metricName.includes('Utilization') || metricName.includes('percent')) return '%';
    if (metricName.includes('Bytes')) return 'Bytes';
    if (metricName.includes('Packets')) return 'Count';
    if (metricName.includes('Failed')) return 'Count';
    return '';
  }
}
