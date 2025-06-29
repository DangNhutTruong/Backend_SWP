import express from 'express';
import {
  createCommunityPost,
  getCommunityPosts,
  getCommunityPost,
  updateCommunityPost,
  deleteCommunityPost,
  toggleCommunityPostLike,
  addComment,
  getPostComments,
  updateComment,
  deleteComment
} from '../controllers/communityController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/posts', getCommunityPosts);
router.get('/posts/:id', getCommunityPost);
router.get('/posts/:id/comments', getPostComments);

// Protected routes
router.use(protect);

// Post routes
router.post('/posts', createCommunityPost);
router.put('/posts/:id', updateCommunityPost);
router.delete('/posts/:id', deleteCommunityPost);
router.post('/posts/:id/like', toggleCommunityPostLike);

// Comment routes
router.post('/posts/:id/comments', addComment);
router.put('/comments/:commentId', updateComment);
router.delete('/comments/:commentId', deleteComment);

export default router;
