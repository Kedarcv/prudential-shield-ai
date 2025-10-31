import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, Session } from '../models/User';
import { cache } from '../config/redis';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    permissions: string[];
  };
  session?: {
    id: string;
    token: string;
  };
  startTime?: number;
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Access denied. No token provided.' });
      return;
    }

    const token = authHeader.substring(7);
    
    // Check if token is blacklisted
    const blacklisted = await cache.exists(`blacklist:${token}`);
    if (blacklisted) {
      res.status(401).json({ error: 'Token has been revoked' });
      return;
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
    
    // Check if session exists and is active
    const session = await Session.findOne({ 
      token, 
      userId: decoded.userId,
      isActive: true,
      expiresAt: { $gt: new Date() }
    });

    if (!session) {
      res.status(401).json({ error: 'Invalid or expired session' });
      return;
    }

    // Check if user exists and is active
    let user = await cache.get(`user:${decoded.userId}`);
    
    if (!user) {
      user = await User.findById(decoded.userId).select('-password');
      if (!user) {
        res.status(401).json({ error: 'User not found' });
        return;
      }
      
      // Cache user for 15 minutes
      await cache.set(`user:${decoded.userId}`, user, 900);
    }

    if (!user.isActive) {
      res.status(401).json({ error: 'User account is deactivated' });
      return;
    }

    // Check if user is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      res.status(401).json({ 
        error: 'Account is temporarily locked',
        lockedUntil: user.lockedUntil
      });
      return;
    }

    // Attach user and session info to request
    req.user = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      permissions: user.permissions || []
    };

    req.session = {
      id: (session._id as any).toString(),
      token: session.token
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

export const requireRole = (requiredRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!requiredRoles.includes(req.user.role)) {
      res.status(403).json({ 
        error: 'Insufficient permissions',
        required: requiredRoles,
        current: req.user.role
      });
      return;
    }

    next();
  };
};

export const requirePermission = (requiredPermission: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Admin role has all permissions
    if (req.user.role === 'admin') {
      next();
      return;
    }

    if (!req.user.permissions.includes(requiredPermission)) {
      res.status(403).json({ 
        error: 'Permission denied',
        required: requiredPermission
      });
      return;
    }

    next();
  };
};

export const rateLimitByUser = () => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      next();
      return;
    }

    const key = `rateLimit:${req.user.id}:${req.path}`;
    const limit = 100; // requests per hour
    const window = 3600; // 1 hour in seconds

    try {
      const current = await cache.get(key) || 0;
      
      if (current >= limit) {
        res.status(429).json({
          error: 'Rate limit exceeded',
          limit,
          window,
          resetTime: new Date(Date.now() + window * 1000)
        });
        return;
      }

      await cache.set(key, current + 1, window);
      
      // Set response headers
      res.set({
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': (limit - current - 1).toString(),
        'X-RateLimit-Reset': new Date(Date.now() + window * 1000).toISOString()
      });

      next();
    } catch (error) {
      console.error('Rate limit error:', error);
      next(); // Continue on error to not block requests
    }
  };
};

export const auditLog = (action: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    const originalSend = res.send;
    
    res.send = function(body) {
      // Log the action after response is sent
      setImmediate(async () => {
        try {
          const auditEntry = {
            userId: req.user?.id,
            email: req.user?.email,
            action,
            method: req.method,
            path: req.path,
            query: req.query,
            body: req.method === 'GET' ? undefined : req.body,
            statusCode: res.statusCode,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            timestamp: new Date(),
            responseTime: Date.now() - (req.startTime || Date.now())
          };

          await cache.setHash('audit_logs', `${Date.now()}_${req.user?.id}`, auditEntry);
        } catch (error) {
          console.error('Audit log error:', error);
        }
      });

      return originalSend.call(this, body);
    };

    // Add start time for response time calculation
    (req as any).startTime = Date.now();
    
    next();
  };
};