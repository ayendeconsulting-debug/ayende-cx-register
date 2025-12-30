import express from "express";
import {
  getCurrentTerms,
  getAllActiveTerms,
  getTermsById,
  getBusinessAcceptances,
  recordAcceptance,
  checkTermsAcceptance,
} from "../controllers/termsController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// Public routes (for registration flow)
router.get("/current", getCurrentTerms);
router.get("/all", getAllActiveTerms);
router.get("/:id", getTermsById);
router.get("/check/:businessId", checkTermsAcceptance);
router.post("/accept", recordAcceptance);

// Protected routes
router.get(
  "/business/:businessId/acceptances",
  authenticate,
  getBusinessAcceptances
);

export default router;
