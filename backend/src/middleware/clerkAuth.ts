import { Request, Response, NextFunction } from 'express';
import { createClerkClient } from '@clerk/clerk-sdk-node';

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });

// Extend Express Request type to include auth
/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        sessionId: string;
      };
    }
  }
}
/* eslint-enable @typescript-eslint/no-namespace */

export const requireClerkAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get the auth token from the Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No authorization token provided' });
      return;
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    try {
      // Verify the JWT token with Clerk
      const jwtPayload = await clerk.verifyToken(token);
      
      if (!jwtPayload || !jwtPayload.sub) {
        res.status(401).json({ error: 'Invalid token' });
        return;
      }
      
      // Add user info to request
      req.auth = {
        userId: jwtPayload.sub,
        sessionId: jwtPayload.sid || ''
      };
      
      next();
    } catch (error) {
      console.error('Clerk verification error:', error);
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication error' });
    return;
  }
};

// Optional: Middleware that allows requests with or without auth
export const optionalClerkAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      try {
        const jwtPayload = await clerk.verifyToken(token);
        
        if (jwtPayload && jwtPayload.sub) {
          req.auth = {
            userId: jwtPayload.sub,
            sessionId: jwtPayload.sid || ''
          };
        }
      } catch (error) {
        // Ignore verification errors for optional auth
        console.debug('Optional auth verification failed:', error);
      }
    }
    
    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next();
  }
};
