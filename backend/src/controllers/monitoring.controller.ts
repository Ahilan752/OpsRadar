import { Request, Response, NextFunction } from 'express';
import { EC2Service } from '../services/ec2.service';
import { CloudWatchService } from '../services/cloudwatch.service';
import { BillingService } from '../services/billing.service';
import { sendSuccess } from '../utils/apiResponse';

export class MonitoringController {
  // EC2 Instances
  static async getInstances(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const region = (req.query.region as string) || req.awsConnection!.defaultRegion;
      const state = req.query.state as string;
      const search = req.query.search as string;

      const result = await EC2Service.getInstances(req.awsConnection!, region, { state, search });
      sendSuccess(res, result, 'EC2 instances retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async getInstanceDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const region = (req.query.region as string) || req.awsConnection!.defaultRegion;
      const instanceId = req.params.instanceId;

      const instance = await EC2Service.getInstanceDetails(req.awsConnection!, instanceId, region);
      sendSuccess(res, instance, 'Instance details retrieved');
    } catch (error) {
      next(error);
    }
  }

  // CloudWatch Metrics
  static async getMetrics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const region = (req.query.region as string) || req.awsConnection!.defaultRegion;
      const instanceId = req.query.instanceId as string;
      const timeRange = (req.query.timeRange as string) || '1h';
      const metricQuery = req.query.metrics as string;

      if (!instanceId) {
        res.status(400).json({ success: false, message: 'instanceId query parameter is required' });
        return;
      }

      const metricNames = metricQuery
        ? metricQuery.split(',')
        : ['CPUUtilization', 'NetworkIn', 'NetworkOut', 'DiskReadBytes', 'DiskWriteBytes', 'StatusCheckFailed'];

      const metrics = await CloudWatchService.getMetricData(
        req.awsConnection!,
        region,
        instanceId,
        metricNames,
        timeRange
      );
      sendSuccess(res, metrics, 'CloudWatch metrics retrieved');
    } catch (error) {
      next(error);
    }
  }

  // CloudWatch Alarms
  static async getAlarms(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const region = (req.query.region as string) || req.awsConnection!.defaultRegion;
      const state = req.query.state as any;
      const search = req.query.search as string;

      const result = await CloudWatchService.getAlarms(req.awsConnection!, region, { state, search });
      sendSuccess(res, result, 'CloudWatch alarms retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async getAlarmHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const region = (req.query.region as string) || req.awsConnection!.defaultRegion;
      const alarmName = req.params.alarmName;

      const history = await CloudWatchService.getAlarmHistory(req.awsConnection!, region, alarmName);
      sendSuccess(res, { history }, 'Alarm history retrieved');
    } catch (error) {
      next(error);
    }
  }

  // Billing
  static async getBillingSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const summary = await BillingService.getCostSummary(req.awsConnection!);
      sendSuccess(res, summary, 'AWS billing summary retrieved');
    } catch (error) {
      next(error);
    }
  }
}

