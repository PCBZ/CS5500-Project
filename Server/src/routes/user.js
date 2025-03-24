import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { protect } from '../middleware/auth.js';

/**
 * @module UserAPI
 * @category Routes
 */

const router = express.Router();
const prisma = new PrismaClient();

/**
 * Get user details by ID
 * 
 * @name GET /api/user/:id
 * @function
 * @memberof module:UserAPI
 * @param {number} req.params.id - User ID
 * @param {string} req.headers.authorization - Bearer token for authentication
 * @returns {object} 200 - User details
 * @returns {Error} 400 - Invalid user ID format
 * @returns {Error} 401 - Unauthorized access
 * @returns {Error} 404 - User not found
 * @returns {Error} 500 - Server error
 * 
 * @example Request Example:
 * GET /api/user/123
 * Authorization: Bearer <token>
 * 
 * @example Success Response:
 * {
 *   "id": 123,
 *   "name": "John Doe",
 *   "email": "john@example.com",
 *   "role": "pmm"
 * }
 */
router.get('/:id', protect, async (req, res) => {
  try {
    let userId;
    try {
      userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid user ID format' });
      }
    } catch (error) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * User login
 * 
 * @name POST /api/user/login
 * @function
 * @memberof module:UserAPI
 * @param {object} req.body - Request body
 * @param {string} req.body.email - User email
 * @param {string} req.body.password - User password
 * @returns {object} 200 - Login successful
 * @returns {Error} 400 - Missing credentials or invalid credentials
 * @returns {Error} 500 - Server error
 * 
 * @example Request Example:
 * POST /api/user/login
 * {
 *   "email": "john@example.com",
 *   "password": "password123"
 * }
 * 
 * @example Success Response:
 * {
 *   "message": "Login successful",
 *   "token": "jwt_token_here",
 *   "user": {
 *     "id": 123,
 *     "name": "John Doe",
 *     "email": "john@example.com",
 *     "role": "pmm"
 *   }
 * }
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    console.log('Login attempt for email:', email);

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        role: true
      }
    });

    if (!user) {
      console.log('User not found for email:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      console.log('Invalid password for email:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || 'your_jwt_secret_key',
      { expiresIn: '24h' }
    );

    const userWithoutPassword = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    res.json({
      message: 'Login successful',
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Error during login - Full error:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

/**
 * Register new user
 * 
 * @name POST /api/user/register
 * @function
 * @memberof module:UserAPI
 * @param {object} req.body - Request body
 * @param {string} req.body.name - User full name
 * @param {string} req.body.email - User email
 * @param {string} req.body.password - User password
 * @param {string} req.body.role - User role (pmm, smm, or vmm)
 * @returns {object} 201 - User created
 * @returns {Error} 400 - Missing fields, invalid role, or user already exists
 * @returns {Error} 500 - Server error
 * 
 * @example Request Example:
 * POST /api/user/register
 * {
 *   "name": "John Doe",
 *   "email": "john@example.com",
 *   "password": "password123",
 *   "role": "pmm"
 * }
 * 
 * @example Success Response:
 * {
 *   "message": "User registered successfully.",
 *   "user": {
 *     "id": 123,
 *     "name": "John Doe",
 *     "email": "john@example.com",
 *     "role": "pmm"
 *   }
 * }
 */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate required fields
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Validate role
    const validRoles = ['pmm', 'smm', 'vmm'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });

    res.status(201).json({
      message: 'User registered successfully.',
      user
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * User logout
 * 
 * @name POST /api/user/logout
 * @function
 * @memberof module:UserAPI
 * @param {string} req.headers.authorization - Bearer token for authentication
 * @returns {object} 200 - Logout successful
 * @returns {Error} 401 - Unauthorized access
 * @returns {Error} 500 - Server error
 * 
 * @example Request Example:
 * POST /api/user/logout
 * Authorization: Bearer <token>
 * 
 * @example Success Response:
 * {
 *   "message": "Logout successful."
 * }
 */
router.post('/logout', protect, (req, res) => {
  try {
    // In a stateless JWT setup, we don't need to do anything server-side
    // The client should remove the token
    res.json({ message: 'Logout successful.' });
  } catch (error) {
    console.error('Error during logout:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router; 