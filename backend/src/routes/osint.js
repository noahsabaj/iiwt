import express from 'express';
import axios from 'axios';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// ReliefWeb API proxy
router.get('/reliefweb/reports', optionalAuth, async (req, res, next) => {
  try {
    const response = await axios.get('https://api.reliefweb.int/v1/reports', {
      params: req.query,
      headers: {
        'Accept': 'application/json'
      }
    });
    
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

// NASA FIRMS proxy
router.get('/firms/*', optionalAuth, async (req, res, next) => {
  try {
    const path = req.params[0];
    const response = await axios.get(`https://firms.modaps.eosdis.nasa.gov/api/${path}`, {
      params: {
        ...req.query,
        MAP_KEY: process.env.NASA_FIRMS_KEY
      }
    });
    
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

// GDELT proxy (no auth required for GDELT)
router.get('/gdelt/*', optionalAuth, async (req, res, next) => {
  try {
    const path = req.params[0];
    const response = await axios.get(`https://api.gdeltproject.org/api/v2/${path}`, {
      params: req.query
    });
    
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

// ACLED proxy
router.get('/acled/data', optionalAuth, async (req, res, next) => {
  try {
    const response = await axios.get('https://api.acleddata.com/acled/read', {
      params: {
        ...req.query,
        key: process.env.ACLED_KEY,
        email: process.env.ACLED_EMAIL
      }
    });
    
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

export default router;