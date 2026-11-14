import {
  GetCostAndUsageCommand,
  GetCostForecastCommand,
  CostExplorerClient
} from '@aws-sdk/client-cost-explorer';
import { AWSClientFactory } from '../aws/clientFactory';
import { IAWSConnection } from '../models/AWSConnection';
import { logger } from '../utils/logger';

export interface CostSummary {
  currentMonthToDate: number;
  lastMonthTotal: number;
  currency: string;
  forecastCost?: number;
  dailyCosts: Array<{ date: string; amount: number }>;
  serviceBreakdown: Array<{ service: string; amount: number; percentage: number }>;
  reportingDelayNotice: string;
}

export class BillingService {
  /**
   * Fetches monthly overview, daily breakdown, and service-level costs
   */
  static async getCostSummary(connection: IAWSConnection): Promise<CostSummary> {
    let ce: CostExplorerClient;
    try {
      ce = await AWSClientFactory.getCostExplorerClient(connection);
    } catch (err: any) {
      throw new Error(`Unable to initialize AWS Cost Explorer client: ${err.message}`);
    }

    const now = new Date();
    const currentYear = now.getUTCFullYear();
    const currentMonth = now.getUTCMonth(); // 0-indexed

    // Format current month start (YYYY-MM-01) and tomorrow's date for Ce interval [Start, End)
    const currentMonthStart = new Date(Date.UTC(currentYear, currentMonth, 1)).toISOString().split('T')[0];
    const tomorrow = new Date(Date.UTC(currentYear, currentMonth, now.getUTCDate() + 1))
      .toISOString()
      .split('T')[0];

    // Format previous month start and end
    const lastMonthStart = new Date(Date.UTC(currentYear, currentMonth - 1, 1)).toISOString().split('T')[0];
    const lastMonthEnd = new Date(Date.UTC(currentYear, currentMonth, 1)).toISOString().split('T')[0];

    let currentMonthToDate = 0;
    let lastMonthTotal = 0;
    let currency = 'USD';
    const dailyCosts: Array<{ date: string; amount: number }> = [];
    const serviceBreakdown: Array<{ service: string; amount: number; percentage: number }> = [];
    let forecastCost: number | undefined;

    try {
      // 1. Current Month Daily Costs & Total
      const currentMonthCmd = new GetCostAndUsageCommand({
        TimePeriod: { Start: currentMonthStart, End: tomorrow },
        Granularity: 'DAILY',
        Metrics: ['UnblendedCost']
      });

      const currentMonthRes = await ce.send(currentMonthCmd);
      if (currentMonthRes.ResultsByTime) {
        for (const item of currentMonthRes.ResultsByTime) {
          const date = item.TimePeriod?.Start || '';
          const cost = parseFloat(item.Total?.UnblendedCost?.Amount || '0');
          currency = item.Total?.UnblendedCost?.Unit || 'USD';
          currentMonthToDate += cost;
          dailyCosts.push({
            date,
            amount: Math.round(cost * 100) / 100
          });
        }
      }

      // 2. Last Month Total Cost
      const lastMonthCmd = new GetCostAndUsageCommand({
        TimePeriod: { Start: lastMonthStart, End: lastMonthEnd },
        Granularity: 'MONTHLY',
        Metrics: ['UnblendedCost']
      });
      const lastMonthRes = await ce.send(lastMonthCmd);
      if (lastMonthRes.ResultsByTime?.[0]?.Total?.UnblendedCost?.Amount) {
        lastMonthTotal = parseFloat(lastMonthRes.ResultsByTime[0].Total.UnblendedCost.Amount);
      }

      // 3. Service Breakdown for Current Month
      const serviceBreakdownCmd = new GetCostAndUsageCommand({
        TimePeriod: { Start: currentMonthStart, End: tomorrow },
        Granularity: 'MONTHLY',
        Metrics: ['UnblendedCost'],
        GroupBy: [{ Type: 'DIMENSION', Key: 'SERVICE' }]
      });

      const serviceRes = await ce.send(serviceBreakdownCmd);
      if (serviceRes.ResultsByTime?.[0]?.Groups) {
        for (const grp of serviceRes.ResultsByTime[0].Groups) {
          const serviceName = grp.Keys?.[0] || 'Other';
          const amount = parseFloat(grp.Metrics?.UnblendedCost?.Amount || '0');
          if (amount > 0.01) {
            serviceBreakdown.push({
              service: serviceName,
              amount: Math.round(amount * 100) / 100,
              percentage: 0 // calculate below
            });
          }
        }
      }

      // Sort services by highest cost
      serviceBreakdown.sort((a, b) => b.amount - a.amount);
      const totalServicesCost = serviceBreakdown.reduce((sum, item) => sum + item.amount, 0);
      if (totalServicesCost > 0) {
        for (const item of serviceBreakdown) {
          item.percentage = Math.round((item.amount / totalServicesCost) * 100);
        }
      }

      // 4. Try Forecast if current date is within the month
      try {
        const lastDayOfMonth = new Date(Date.UTC(currentYear, currentMonth + 1, 0)).toISOString().split('T')[0];
        if (tomorrow < lastDayOfMonth) {
          const forecastCmd = new GetCostForecastCommand({
            TimePeriod: { Start: tomorrow, End: lastDayOfMonth },
            Metric: 'UNBLENDED_COST',
            Granularity: 'MONTHLY'
          });
          const forecastRes = await ce.send(forecastCmd);
          if (forecastRes.Total?.Amount) {
            forecastCost = Math.round((currentMonthToDate + parseFloat(forecastRes.Total.Amount)) * 100) / 100;
          }
        }
      } catch (fErr: any) {
        logger.debug(`Forecast unavailable: ${fErr.message}`);
      }

      return {
        currentMonthToDate: Math.round(currentMonthToDate * 100) / 100,
        lastMonthTotal: Math.round(lastMonthTotal * 100) / 100,
        currency,
        forecastCost,
        dailyCosts,
        serviceBreakdown,
        reportingDelayNotice:
          'AWS Cost Explorer data is updated by AWS once per day and may reflect up to a 24-hour reporting delay.'
      };
    } catch (error: any) {
      if (error.name === 'AccessDeniedException' || error.name === 'AccessDenied') {
        const customErr: any = new Error(
          'AWS Cost Explorer access denied. Please ensure AWS Cost Explorer is enabled in your AWS Billing Console and the IAM role includes ce:GetCostAndUsage permissions.'
        );
        customErr.statusCode = 403;
        customErr.isOperational = true;
        throw customErr;
      }
      logger.error(`Failed to fetch billing data: ${error.message}`);
      throw error;
    }
  }
}
