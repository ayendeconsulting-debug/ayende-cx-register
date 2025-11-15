import express from 'express';
import { checkSubdomainAvailability, registerBusiness } from '../controllers/businessController.js';

const router = express.Router();

// Public routes
router.get('/check-subdomain/:subdomain', checkSubdomainAvailability);
router.post('/register', registerBusiness);

export default router;