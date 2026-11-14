import { Router } from 'express';
import { MonitoringController } from '../controllers/monitoring.controller';
import { authenticate, requireAWSConnection } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(requireAWSConnection);

// EC2 Infrastructure
router.get('/ec2/instances', MonitoringController.getInstances);
router.get('/ec2/instances/:instanceId', MonitoringController.getInstanceDetails);

// CloudWatch Metrics & Alarms
router.get('/cloudwatch/metrics', MonitoringController.getMetrics);
router.get('/cloudwatch/alarms', MonitoringController.getAlarms);
router.get('/cloudwatch/alarms/:alarmName/history', MonitoringController.getAlarmHistory);

// Billing
router.get('/billing/summary', MonitoringController.getBillingSummary);

export default router;
