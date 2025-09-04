import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { authenticateAdmin } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';
import { loginSchema } from '../validators/admin.validators';

const router = Router();

// Public routes
router.post(
  '/login',
  validateRequest(loginSchema),
  adminController.login
);

// Protected routes
router.use(authenticateAdmin);

router.post('/logout', adminController.logout);
router.post('/refresh', adminController.refreshToken);

// Response management
router.get('/responses', adminController.getResponses);
router.get('/responses/:responseId', adminController.getResponseDetail);
router.get('/export', adminController.exportResponses);
router.patch('/responses/:responseId/test', adminController.markResponseTest);
router.delete('/responses/:responseId', adminController.deleteResponse);
router.delete('/responses', adminController.deleteResponses);

// Analytics
router.get('/analytics/summary', adminController.getAnalyticsSummary);

export default router;
