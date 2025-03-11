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
      return res.status(401).json({ message: 'Not authorized to access this route' });
    }

    try {
      // verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');

      // get user info
      const user = await prisma.user.findUnique({
        where: { id: BigInt(decoded.userId) }
      });

      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      // add user info to request object
      req.user = {
        id: user.id.toString(),
        name: user.name,
        email: user.email,
        role: user.role
      };

      next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized to access this route' });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}; 