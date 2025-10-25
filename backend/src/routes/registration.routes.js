import express from 'express';
import { 
  registerBusiness, 
  checkAvailability, 
  verifyEmail 
} from '../controllers/registrationController.js';

const router = express.Router();

// Public routes - no authentication required
router.post('/business', registerBusiness);
router.post('/check-availability', checkAvailability);
router.get('/verify-email/:token', verifyEmail);

export default router;