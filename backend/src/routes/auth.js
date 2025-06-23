import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// In-memory user store (replace with database in production)
const users = new Map();

// Validation rules
const registerValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('username').isLength({ min: 3 }).trim().escape()
];

const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
];

// Register endpoint
router.post('/register', registerValidation, async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: { 
        message: 'Validation failed',
        details: errors.array() 
      }
    });
  }

  const { email, password, username } = req.body;

  // Check if user already exists
  if (users.has(email)) {
    return res.status(409).json({ 
      error: { 
        message: 'User already exists' 
      }
    });
  }

  try {
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = {
      id: Date.now().toString(),
      email,
      username,
      password: hashedPassword,
      role: 'user',
      createdAt: new Date().toISOString()
    };

    users.set(email, user);

    // Create token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ 
      error: { 
        message: 'Error creating user' 
      }
    });
  }
});

// Login endpoint
router.post('/login', loginValidation, async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: { 
        message: 'Validation failed',
        details: errors.array() 
      }
    });
  }

  const { email, password } = req.body;

  // Find user
  const user = users.get(email);
  if (!user) {
    return res.status(401).json({ 
      error: { 
        message: 'Invalid credentials' 
      }
    });
  }

  try {
    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ 
        error: { 
          message: 'Invalid credentials' 
        }
      });
    }

    // Create token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ 
      error: { 
        message: 'Error during login' 
      }
    });
  }
});

// Verify token endpoint
router.get('/verify', authenticateToken, (req, res) => {
  res.json({
    valid: true,
    user: req.user
  });
});

// Refresh token endpoint
router.post('/refresh', authenticateToken, (req, res) => {
  const token = jwt.sign(
    { id: req.user.id, email: req.user.email, role: req.user.role },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({ token });
});

export default router;