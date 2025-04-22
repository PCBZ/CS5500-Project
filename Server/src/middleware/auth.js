import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const protect = async (req, res, next) => {
  try {
    let token;

    // get token from Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // check if token exists
    if (!token) {
      return res.status(401).json({ 
        success: false,
        error: {
          code: 'AUTH_001',
          message: 'Authentication token is missing',
          details: 'Please provide a valid Bearer token in the Authorization header'
        }
      });
    }

    try {
      // verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');

      try {
        // get user info
        const user = await prisma.user.findUnique({
          where: { id: parseInt(decoded.userId) }
        });

        if (!user) {
          return res.status(401).json({ 
            success: false,
            error: {
              code: 'AUTH_002',
              message: 'User not found',
              details: 'The user associated with this token no longer exists'
            }
          });
        }

        // add user info to request object
        req.user = {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        };

        next();
      } catch (dbError) {
        console.error('Database error:', dbError);
        return res.status(500).json({ 
          success: false,
          error: {
            code: 'DB_001',
            message: 'Database connection error',
            details: 'Failed to connect to the database while verifying user'
          }
        });
      }
    } catch (error) {
      return res.status(401).json({ 
        success: false,
        error: {
          code: 'AUTH_003',
          message: 'Invalid token',
          details: 'The provided token is invalid or has expired'
        }
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ 
      success: false,
      error: {
        code: 'AUTH_004',
        message: 'Internal server error',
        details: 'An unexpected error occurred during authentication'
      }
    });
  }
}; 