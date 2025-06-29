import express from 'express';
import {
  createBlogPost,
  getBlogPosts,
  getBlogPost,
  updateBlogPost,
  deleteBlogPost,
  getPublishedPosts,
  getBlogCategories,
  toggleBlogPostLike
} from '../controllers/blogController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/published', getPublishedPosts);
router.get('/categories', getBlogCategories);
router.get('/public/:identifier', getBlogPost);
router.post('/:id/like', toggleBlogPostLike);

// Protected routes
router.use(protect);

// Admin/Author routes
router.post('/', authorize('admin', 'coach'), createBlogPost);
router.get('/', authorize('admin', 'coach'), getBlogPosts);
router.get('/:identifier', getBlogPost);
router.put('/:id', authorize('admin', 'coach'), updateBlogPost);
router.delete('/:id', authorize('admin', 'coach'), deleteBlogPost);

export default router;
