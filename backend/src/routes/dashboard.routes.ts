import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { authenticate, requireAWSConnection } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(requireAWSConnection);

router.get('/overview', DashboardController.getOverview);

export default router;

