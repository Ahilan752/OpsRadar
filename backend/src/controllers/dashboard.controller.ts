import { Request, Response, NextFunction } from 'express';
import { AWSConnection } from '../models/AWSConnection';
import { EC2Service } from '../services/ec2.service';
import { CloudWatchService } from '../services/cloudwatch.service';
import { BillingService } from '../services/billing.service';
import { sendSuccess } from '../utils/apiResponse';
import { logger } from '../utils/logger';

export class DashboardController {
  static async getOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const connection = req.awsConnection!;
      const region = (req.query.region as string) || connection.defaultRegion || 'us-east-1';

      // 1. Total connected AWS accounts for this user
      const totalAccounts = await AWSConnection.countDocuments({ userId, connectionStatus: 'CONNECTED' });

      // 2. EC2 status in parallel with Alarms & Cost
      const [ec2Data, alarmsData, billingData] = await Promise.allSettled([
        EC2Service.getInstances(connection, region),
        CloudWatchService.getAlarms(connection, region),
        BillingService.getCostSummary(connection)
      ]);

      const ec2 =
        ec2Data.status === 'fulfilled'
          ? ec2Data.value
          : { total: 0, running: 0, stopped: 0, instances: [] };

      const alarms =
        alarmsData.status === 'fulfilled'
          ? alarmsData.value
          : { total: 0, inAlarm: 0, ok: 0, alarms: [] };

      const billing =
        billingData.status === 'fulfilled'
          ? billingData.value
          : { currentMonthToDate: 0, lastMonthTotal: 0, currency: 'USD', dailyCosts: [], serviceBreakdown: [], reportingDelayNotice: '' };

      if (billingData.status === 'rejected') {
        logger.warn(`Billing data unavailable for dashboard: ${billingData.reason?.message}`);
      }

      sendSuccess(
        res,
        {
          account: {
            id: connection._id,
            accountName: connection.accountName,
            accountId: connection.accountId,
            selectedRegion: region
          },
          summary: {
            totalAccounts,
            totalInstances: ec2.total,
            runningInstances: ec2.running,
            stoppedInstances: ec2.stopped,
            activeAlarms: alarms.inAlarm,
            monthToDateCost: billing.currentMonthToDate,
            currency: billing.currency
          },
          recentInstances: ec2.instances.slice(0, 5),
          triggeredAlarms: alarms.alarms.filter((a) => a.stateValue === 'ALARM').slice(0, 5),
          spendingTrend: billing.dailyCosts.slice(-7)
        },
        'Dashboard overview retrieved'
      );
    } catch (error) {
      next(error);
    }
  }
}
