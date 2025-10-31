import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User, Session } from '../models/User';
import { catchAsync, ValidationError, AuthenticationError } from '../middleware/errorHandler';
import { cache } from '../config/redis';
import { v4 as uuidv4 } from 'uuid';
import moment from 'moment';

const router = Router();

/**
 * POST /api/auth/login
 * User login
 */
router.post('/login', catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    throw new ValidationError('Email and password are required');
  }

  // Find user
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw new AuthenticationError('Invalid credentials');
  }

  // Check if user is active
  if (!user.isActive) {
    throw new AuthenticationError('Account is deactivated');
  }

  // Check if user is locked
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    throw new AuthenticationError('Account is temporarily locked');
  }

  // Verify password
  const isValidPassword = await user.comparePassword(password);
  if (!isValidPassword) {
    // Increment failed login attempts
    user.failedLoginAttempts += 1;
    
    // Lock account after 5 failed attempts
    if (user.failedLoginAttempts >= 5) {
      user.lockedUntil = moment().add(30, 'minutes').toDate();
    }
    
    await user.save();
    throw new AuthenticationError('Invalid credentials');
  }

  // Reset failed login attempts on successful login
  user.failedLoginAttempts = 0;
  user.lockedUntil = undefined;
  user.lastLogin = new Date();
  await user.save();

  // Generate JWT token
  const tokenPayload = {
    userId: user._id,
    email: user.email,
    role: user.role
  };

  const token = jwt.sign(
    tokenPayload,
    process.env.JWT_SECRET || 'fallback-secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );

  // Create session
  const session = new Session({
    userId: user._id.toString(),
    token,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent') || 'Unknown',
    isActive: true,
    expiresAt: moment().add(24, 'hours').toDate()
  });

  await session.save();

  // Cache user data
  const userData = {
    _id: user._id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    permissions: user.permissions,
    department: user.department,
    isActive: user.isActive
  };
  await cache.set(`user:${user._id}`, userData, 3600); // Cache for 1 hour

  res.json({
    success: true,
    data: {
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        permissions: user.permissions,
        department: user.department
      }
    }
  });
}));

/**
 * POST /api/auth/logout
 * User logout
 */
router.post('/logout', catchAsync(async (req: Request, res: Response) => {
  const authHeader = req.header('Authorization');
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    
    // Invalidate session
    await Session.findOneAndUpdate(
      { token },
      { isActive: false }
    );

    // Add token to blacklist
    await cache.set(`blacklist:${token}`, true, 86400); // 24 hours
  }

  res.json({
    success: true,
    message: 'Logged out successfully'
  });
}));

/**
 * POST /api/auth/register
 * Register new user (admin only)
 */
router.post('/register', catchAsync(async (req: Request, res: Response) => {
  const {
    email,
    password,
    firstName,
    lastName,
    role,
    department,
    permissions = []
  } = req.body;

  // Validate input
  if (!email || !password || !firstName || !lastName || !role || !department) {
    throw new ValidationError('All required fields must be provided');
  }

  if (password.length < 8) {
    throw new ValidationError('Password must be at least 8 characters long');
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new ValidationError('User with this email already exists');
  }

  // Create user
  const user = new User({
    email: email.toLowerCase(),
    password,
    firstName,
    lastName,
    role,
    department,
    permissions,
    isActive: true
  });

  await user.save();

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      department: user.department
    }
  });
}));

/**
 * POST /api/auth/forgot-password
 * Request password reset
 */
router.post('/forgot-password', catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    throw new ValidationError('Email is required');
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    // Don't reveal if user exists or not
    return res.json({
      success: true,
      message: 'If the email exists, a password reset link has been sent'
    });
  }

  // Generate reset token
  const resetToken = uuidv4();
  const resetExpires = moment().add(1, 'hour').toDate();

  user.passwordResetToken = resetToken;
  user.passwordResetExpires = resetExpires;
  await user.save();

  // In production, send email with reset link
  console.log(`Password reset token for ${email}: ${resetToken}`);

  res.json({
    success: true,
    message: 'If the email exists, a password reset link has been sent'
  });
}));

/**
 * POST /api/auth/reset-password
 * Reset password with token
 */
router.post('/reset-password', catchAsync(async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    throw new ValidationError('Token and new password are required');
  }

  if (newPassword.length < 8) {
    throw new ValidationError('Password must be at least 8 characters long');
  }

  const user = await User.findOne({
    passwordResetToken: token,
    passwordResetExpires: { $gt: new Date() }
  });

  if (!user) {
    throw new AuthenticationError('Invalid or expired reset token');
  }

  // Update password
  user.password = newPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.failedLoginAttempts = 0;
  user.lockedUntil = undefined;
  await user.save();

  // Invalidate all existing sessions
  await Session.updateMany(
    { userId: user._id.toString() },
    { isActive: false }
  );

  res.json({
    success: true,
    message: 'Password reset successfully'
  });
}));

/**
 * GET /api/auth/profile
 * Get current user profile
 */
router.get('/profile', catchAsync(async (req: Request, res: Response) => {
  const authHeader = req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AuthenticationError('No token provided');
  }

  const token = authHeader.substring(7);
  const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
  
  const user = await User.findById(decoded.userId).select('-password');
  if (!user) {
    throw new AuthenticationError('User not found');
  }

  res.json({
    success: true,
    data: {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      permissions: user.permissions,
      department: user.department,
      lastLogin: user.lastLogin,
      twoFactorEnabled: user.twoFactorEnabled
    }
  });
}));

/**
 * PUT /api/auth/profile
 * Update user profile
 */
router.put('/profile', catchAsync(async (req: Request, res: Response) => {
  const authHeader = req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AuthenticationError('No token provided');
  }

  const token = authHeader.substring(7);
  const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
  
  const { firstName, lastName, department } = req.body;
  
  const user = await User.findByIdAndUpdate(
    decoded.userId,
    {
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
      ...(department && { department })
    },
    { new: true, runValidators: true }
  ).select('-password');

  if (!user) {
    throw new AuthenticationError('User not found');
  }

  // Update cache
  await cache.del(`user:${user._id}`);

  res.json({
    success: true,
    data: {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      permissions: user.permissions,
      department: user.department
    }
  });
}));

/**
 * POST /api/auth/change-password
 * Change user password
 */
router.post('/change-password', catchAsync(async (req: Request, res: Response) => {
  const authHeader = req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AuthenticationError('No token provided');
  }

  const token = authHeader.substring(7);
  const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
  
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new ValidationError('Current password and new password are required');
  }

  if (newPassword.length < 8) {
    throw new ValidationError('New password must be at least 8 characters long');
  }

  const user = await User.findById(decoded.userId);
  if (!user) {
    throw new AuthenticationError('User not found');
  }

  // Verify current password
  const isValidPassword = await user.comparePassword(currentPassword);
  if (!isValidPassword) {
    throw new AuthenticationError('Current password is incorrect');
  }

  // Update password
  user.password = newPassword;
  await user.save();

  // Invalidate all existing sessions except current one
  await Session.updateMany(
    { 
      userId: user._id.toString(),
      token: { $ne: token }
    },
    { isActive: false }
  );

  res.json({
    success: true,
    message: 'Password changed successfully'
  });
}));

export default router;