import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { requireRole, requirePermission, auditLog } from '../middleware/auth';

const router = Router();

/**
 * GET /api/users
 * Get all users with pagination and filtering
 */
router.get('/', 
  requirePermission('view_users'),
  auditLog('view_users'),
  UserController.getUsers
);

/**
 * GET /api/users/stats
 * Get user statistics
 */
router.get('/stats',
  requireRole('admin'),
  auditLog('view_user_stats'),
  UserController.getUserStats
);

/**
 * GET /api/users/:id
 * Get user by ID
 */
router.get('/:id',
  requirePermission('view_users'),
  auditLog('view_user'),
  UserController.getUserById
);

/**
 * POST /api/users
 * Create new user
 */
router.post('/',
  requirePermission('manage_users'),
  auditLog('create_user'),
  UserController.createUser
);

/**
 * PUT /api/users/:id
 * Update user
 */
router.put('/:id',
  requirePermission('manage_users'),
  auditLog('update_user'),
  UserController.updateUser
);

/**
 * PATCH /api/users/:id/status
 * Update user status (active/inactive)
 */
router.patch('/:id/status',
  requirePermission('manage_users'),
  auditLog('update_user_status'),
  UserController.updateUserStatus
);

/**
 * DELETE /api/users/:id
 * Delete user (soft delete)
 */
router.delete('/:id',
  requireRole('admin'),
  auditLog('delete_user'),
  UserController.deleteUser
);

/**
 * POST /api/users/:id/reset-password
 * Reset user password (admin only)
 */
router.post('/:id/reset-password',
  requireRole('admin'),
  auditLog('reset_user_password'),
  UserController.resetPassword
);

export default router;