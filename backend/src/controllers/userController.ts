import { Request, Response } from 'express';
import { User } from '../models/User';
import { catchAsync, ValidationError, NotFoundError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

export class UserController {
  /**
   * Get all users with pagination and filtering
   */
  public static getUsers = catchAsync(async (req: AuthRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const role = req.query.role as string;
    const department = req.query.department as string;
    const search = req.query.search as string;

    const filter: any = {};
    if (role) filter.role = role;
    if (department) filter.department = department;
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const [users, totalCount] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit)
        .lean(),
      User.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          hasNext: page * limit < totalCount,
          hasPrev: page > 1
        }
      }
    });
  });

  /**
   * Get user by ID
   */
  public static getUserById = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.params.id;

    const user = await User.findById(userId).select('-password');
    if (!user) {
      throw new NotFoundError('User');
    }

    res.json({
      success: true,
      data: user
    });
  });

  /**
   * Create new user
   */
  public static createUser = catchAsync(async (req: AuthRequest, res: Response) => {
    const {
      email,
      password,
      firstName,
      lastName,
      role,
      department,
      permissions = []
    } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !role || !department) {
      throw new ValidationError('All required fields must be provided');
    }

    if (password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters long');
    }

    // Check if email already exists
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

    // Remove password from response
    const userResponse = user.toObject();
    delete (userResponse as any).password;

    res.status(201).json({
      success: true,
      data: userResponse,
      message: 'User created successfully'
    });
  });

  /**
   * Update user
   */
  public static updateUser = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.params.id;
    const {
      firstName,
      lastName,
      role,
      department,
      permissions,
      isActive
    } = req.body;

    const updateData: any = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (role) updateData.role = role;
    if (department) updateData.department = department;
    if (permissions) updateData.permissions = permissions;
    if (typeof isActive === 'boolean') updateData.isActive = isActive;

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      throw new NotFoundError('User');
    }

    res.json({
      success: true,
      data: user,
      message: 'User updated successfully'
    });
  });

  /**
   * Update user status (active/inactive)
   */
  public static updateUserStatus = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.params.id;
    const { status } = req.body;

    if (!['active', 'inactive'].includes(status)) {
      throw new ValidationError('Status must be either "active" or "inactive"');
    }

    // Don't allow users to deactivate themselves
    if (userId === req.user?.id && status === 'inactive') {
      throw new ValidationError('You cannot deactivate your own account');
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { isActive: status === 'active' },
      { new: true }
    ).select('-password');

    if (!user) {
      throw new NotFoundError('User');
    }

    res.json({
      success: true,
      data: user,
      message: `User ${status === 'active' ? 'activated' : 'deactivated'} successfully`
    });
  });

  /**
   * Delete user (soft delete by setting isActive to false)
   */
  public static deleteUser = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.params.id;

    // Don't allow users to delete themselves
    if (userId === req.user?.id) {
      throw new ValidationError('You cannot delete your own account');
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { isActive: false },
      { new: true }
    ).select('-password');

    if (!user) {
      throw new NotFoundError('User');
    }

    res.json({
      success: true,
      data: user,
      message: 'User deactivated successfully'
    });
  });

  /**
   * Reset user password (admin only)
   */
  public static resetPassword = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.params.id;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      throw new ValidationError('New password must be at least 8 characters long');
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  });

  /**
   * Get user statistics
   */
  public static getUserStats = catchAsync(async (req: AuthRequest, res: Response) => {
    const stats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          activeUsers: { $sum: { $cond: ['$isActive', 1, 0] } },
          inactiveUsers: { $sum: { $cond: ['$isActive', 0, 1] } }
        }
      }
    ]);

    const roleStats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    const departmentStats = await User.aggregate([
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        overview: stats[0] || { totalUsers: 0, activeUsers: 0, inactiveUsers: 0 },
        roleDistribution: roleStats,
        departmentDistribution: departmentStats
      }
    });
  });
}