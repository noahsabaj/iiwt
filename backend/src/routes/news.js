import express from 'express';
import axios from 'axios';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// NewsAPI base URL
const NEWS_API_BASE = 'https://newsapi.org/v2';

// Cache implementation
const cache = new Map();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

// Helper to check cache
const getCached = (key) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
};

// Helper to set cache
const setCache = (key, data) => {
  cache.set(key, { data, timestamp: Date.now() });
};

// Proxy for top headlines
router.get('/top-headlines', optionalAuth, async (req, res, next) => {
  try {
    const cacheKey = `headlines:${JSON.stringify(req.query)}`;
    const cached = getCached(cacheKey);
    
    if (cached) {
      return res.json(cached);
    }

    const response = await axios.get(`${NEWS_API_BASE}/top-headlines`, {
      params: {
        ...req.query,
        apiKey: process.env.NEWS_API_KEY
      }
    });

    setCache(cacheKey, response.data);
    res.json(response.data);
  } catch (error) {
    if (error.response?.status === 426) {
      return res.status(429).json({
        error: {
          message: 'API rate limit exceeded',
          status: 429
        }
      });
    }
    next(error);
  }
});

// Proxy for everything endpoint
router.get('/everything', optionalAuth, async (req, res, next) => {
  try {
    const cacheKey = `everything:${JSON.stringify(req.query)}`;
    const cached = getCached(cacheKey);
    
    if (cached) {
      return res.json(cached);
    }

    const response = await axios.get(`${NEWS_API_BASE}/everything`, {
      params: {
        ...req.query,
        apiKey: process.env.NEWS_API_KEY
      }
    });

    setCache(cacheKey, response.data);
    res.json(response.data);
  } catch (error) {
    if (error.response?.status === 426) {
      return res.status(429).json({
        error: {
          message: 'API rate limit exceeded',
          status: 429
        }
      });
    }
    next(error);
  }
});

// Proxy for sources
router.get('/sources', optionalAuth, async (req, res, next) => {
  try {
    const cacheKey = `sources:${JSON.stringify(req.query)}`;
    const cached = getCached(cacheKey);
    
    if (cached) {
      return res.json(cached);
    }

    const response = await axios.get(`${NEWS_API_BASE}/sources`, {
      params: {
        ...req.query,
        apiKey: process.env.NEWS_API_KEY
      }
    });

    setCache(cacheKey, response.data);
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

export default router;