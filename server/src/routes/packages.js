import express from 'express';
import {
  getPackages,
  getPackage,
  createPackage,
  updatePackage,
  deletePackage,
  getFeaturedPackages,
  getPopularPackages,
  getPackageCategories,
  comparePackages
} from '../controllers/packageController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', getPackages);
router.get('/featured', getFeaturedPackages);
router.get('/popular', getPopularPackages);
router.get('/categories', getPackageCategories);
router.get('/compare', comparePackages);
router.get('/:id', getPackage);

// Protected routes (Admin only)
router.use(protect);
router.use(authorize('admin'));

router.post('/', createPackage);
router.put('/:id', updatePackage);
router.delete('/:id', deletePackage);

export default router;
