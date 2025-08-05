import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { requireClerkAuth } from '../middleware/clerkAuth';

const router = Router();

// All routes require Clerk authentication
router.use(requireClerkAuth);

// Response management
router.get('/responses', adminController.getResponses);
router.get('/responses/:responseId', adminController.getResponseDetail);
router.get('/export', adminController.exportResponses);

// Analytics
router.get('/analytics/summary', adminController.getAnalyticsSummary);

export default router;