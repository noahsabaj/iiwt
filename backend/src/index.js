import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

// Import routes
import newsRoutes from './routes/news.js';
import osintRoutes from './routes/osint.js';
import authRoutes from './routes/auth.js';

// Import middleware
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

// Global rate limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', globalLimiter);

// API-specific rate limiting
const apiLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 100, // Match NewsAPI free tier limit
  message: 'Daily API limit exceeded. Please try again tomorrow.',
  skipSuccessfulRequests: false,
});

// Routes
app.use('/api/news', apiLimiter, newsRoutes);
app.use('/api/osint', apiLimiter, osintRoutes);
app.use('/api/auth', authRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Security check
  if (!process.env.NEWS_API_KEY) {
    console.warn('WARNING: NEWS_API_KEY not set');
  }
  if (!process.env.JWT_SECRET) {
    console.warn('WARNING: JWT_SECRET not set - authentication will not work');
  }
});