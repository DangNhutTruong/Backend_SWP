import express from 'express';
import newsController from '../controllers/newsController.js';

const router = express.Router();

/**
 * News Routes
 * Routes for fetching real news articles from RSS feeds
 */

/**
 * @route GET /api/news/smoking
 * @desc Get smoking-related news articles
 * @access Public
 * @param {number} [limit=10] - Number of articles to return
 */
router.get('/smoking', newsController.getSmokingNews);

/**
 * @route GET /api/news/health
 * @desc Get health-related news articles  
 * @access Public
 * @param {number} [limit=10] - Number of articles to return
 */
router.get('/health', newsController.getHealthNews);

/**
 * @route GET /api/news/search
 * @desc Search news articles by keyword
 * @access Public
 * @param {string} q - Search keyword (required)
 * @param {number} [limit=10] - Number of articles to return
 */
router.get('/search', newsController.searchNews);

export default router;
