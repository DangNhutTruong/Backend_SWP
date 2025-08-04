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
router.get('/smoking', (req, res) => newsController.getSmokingNews(req, res));

/**
 * @route GET /api/news/health
 * @desc Get health-related news articles  
 * @access Public
 * @param {number} [limit=10] - Number of articles to return
 */
router.get('/health', (req, res) => newsController.getHealthNews(req, res));

/**
 * @route GET /api/news/search
 * @desc Search news articles by keyword
 * @access Public
 * @param {string} q - Search keyword (required)
 * @param {number} [limit=10] - Number of articles to return
 */
router.get('/search', (req, res) => newsController.searchNews(req, res));

/**
 * @route GET /api/news/cache/stats
 * @desc Get cache statistics
 * @access Public
 */
router.get('/cache/stats', (req, res) => newsController.getCacheStats(req, res));

/**
 * @route POST /api/news/cache/refresh
 * @desc Force refresh news cache
 * @access Public
 */
router.post('/cache/refresh', (req, res) => newsController.refreshCache(req, res));

/**
 * @route POST /api/news/cache/seed
 * @desc Seed cache with sample articles (for testing)
 * @access Public
 */
router.post('/cache/seed', (req, res) => newsController.seedCache(req, res));

export default router;
