import { Router } from 'express';
import { AWSConnectionController } from '../controllers/awsConnection.controller';
import { authenticate, requireAWSConnection } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/', AWSConnectionController.initiate);
router.post('/validate', AWSConnectionController.complete);
router.get('/', AWSConnectionController.list);
router.get('/:id', AWSConnectionController.getById);
router.delete('/:id', AWSConnectionController.delete);
router.get('/:id/regions', requireAWSConnection, AWSConnectionController.getRegions);

export default router;

