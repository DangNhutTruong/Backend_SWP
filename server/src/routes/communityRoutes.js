import express from 'express';
import { 
    getAllPosts, 
    getPostById, 
    createPost, 
    updatePost, 
    deletePost, 
    getCurrentUserPosts 
} from '../controllers/communityController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * Community Posts Routes
 */

// Public routes
router.get('/posts', getAllPosts);           // GET /api/community/posts
router.get('/posts/:id', getPostById);       // GET /api/community/posts/:id

// Protected routes (require authentication)
router.post('/posts', requireAuth, createPost);              // POST /api/community/posts
router.put('/posts/:id', requireAuth, updatePost);           // PUT /api/community/posts/:id
router.delete('/posts/:id', requireAuth, deletePost);        // DELETE /api/community/posts/:id
router.get('/my-posts', requireAuth, getCurrentUserPosts);   // GET /api/community/my-posts

export default router;
