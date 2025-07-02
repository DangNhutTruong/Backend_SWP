import express from 'express';
import {
  getAllPackages,
  getPackageById,
  purchasePackage,
  getCurrentUserPackage,
  getUserPackageHistory
} from '../controllers/packageController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', getAllPackages);
router.get('/:id', getPackageById);

// Protected routes
router.use(authenticate);
router.post('/purchase', purchasePackage);
router.get('/user/current', getCurrentUserPackage);
router.get('/user/history', getUserPackageHistory);

export default router;
