import express from 'express';
import { 
  inviteUser, 
  acceptInvitation, 
  getInvitationDetails,
  getInvitations,
  revokeInvitation,
  resendInvitation
} from '../controllers/invitationController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/accept', acceptInvitation);
router.get('/details/:token', getInvitationDetails);

// Protected routes - require authentication
router.post('/', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), inviteUser);
router.get('/', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), getInvitations);
router.delete('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), revokeInvitation);
router.post('/:id/resend', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), resendInvitation);

export default router;