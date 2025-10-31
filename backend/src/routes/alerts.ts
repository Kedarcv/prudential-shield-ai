import { Router, Request, Response } from 'express';
import { catchAsync, ValidationError, NotFoundError } from '../middleware/errorHandler';
import { RiskAlert } from '../models/Risk';
import { requirePermission, AuthRequest } from '../middleware/auth';
import moment from 'moment';

const router = Router();

/**
 * GET /api/alerts
 * Get alerts with filtering and pagination
 */
router.get('/',
  requirePermission('view_alerts'),
  catchAsync(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const severity = req.query.severity as string;
    const status = req.query.status as string;
    const riskCategory = req.query.riskCategory as string;
    const alertType = req.query.alertType as string;
    const entityId = req.query.entityId as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    const filter: any = {};
    if (severity) filter.severity = severity;
    if (status) filter.status = status;
    if (riskCategory) filter.riskCategory = riskCategory;
    if (alertType) filter.alertType = alertType;
    if (entityId) filter.entityId = entityId;

    if (startDate || endDate) {
      filter.triggeredAt = {};
      if (startDate) filter.triggeredAt.$gte = new Date(startDate);
      if (endDate) filter.triggeredAt.$lte = new Date(endDate);
    }

    const [alerts, totalCount] = await Promise.all([
      RiskAlert.find(filter)
        .sort({ triggeredAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit)
        .lean(),
      RiskAlert.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        alerts,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          hasNext: page * limit < totalCount,
          hasPrev: page > 1
        },
        filters: {
          severity,
          status,
          riskCategory,
          alertType,
          entityId,
          startDate,
          endDate
        }
      }
    });
  })
);

/**
 * GET /api/alerts/:id
 * Get specific alert
 */
router.get('/:id',
  requirePermission('view_alerts'),
  catchAsync(async (req: Request, res: Response) => {
    const alert = await RiskAlert.findById(req.params.id);
    
    if (!alert) {
      throw new NotFoundError('Alert');
    }

    res.json({
      success: true,
      data: alert
    });
  })
);

/**
 * POST /api/alerts
 * Create new alert
 */
router.post('/',
  requirePermission('create_alerts'),
  catchAsync(async (req: AuthRequest, res: Response) => {
    const {
      alertType,
      riskCategory,
      severity,
      title,
      description,
      entityId,
      entityType,
      thresholdValue,
      actualValue,
      actions = []
    } = req.body;

    if (!alertType || !riskCategory || !severity || !title || 
        !description || !entityId || !entityType) {
      throw new ValidationError('Required fields: alertType, riskCategory, severity, title, description, entityId, entityType');
    }

    const alert = new RiskAlert({
      alertType,
      riskCategory,
      severity,
      title,
      description,
      entityId,
      entityType,
      thresholdValue,
      actualValue,
      triggeredAt: new Date(),
      status: 'active',
      actions
    });

    await alert.save();

    res.status(201).json({
      success: true,
      data: alert
    });
  })
);

/**
 * PUT /api/alerts/:id/acknowledge
 * Acknowledge an alert
 */
router.put('/:id/acknowledge',
  requirePermission('manage_alerts'),
  catchAsync(async (req: AuthRequest, res: Response) => {
    const alert = await RiskAlert.findByIdAndUpdate(
      req.params.id,
      {
        status: 'acknowledged',
        acknowledgedAt: new Date(),
        acknowledgedBy: req.user?.id
      },
      { new: true }
    );

    if (!alert) {
      throw new NotFoundError('Alert');
    }

    res.json({
      success: true,
      data: alert,
      message: 'Alert acknowledged successfully'
    });
  })
);

/**
 * PUT /api/alerts/:id/resolve
 * Resolve an alert
 */
router.put('/:id/resolve',
  requirePermission('manage_alerts'),
  catchAsync(async (req: AuthRequest, res: Response) => {
    const { resolution, additionalActions } = req.body;

    const updateData: any = {
      status: 'resolved',
      resolvedAt: new Date(),
      acknowledgedBy: req.user?.id
    };

    if (additionalActions && Array.isArray(additionalActions)) {
      const alert = await RiskAlert.findById(req.params.id);
      if (alert) {
        updateData.actions = [...(alert.actions || []), ...additionalActions];
      }
    }

    const alert = await RiskAlert.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!alert) {
      throw new NotFoundError('Alert');
    }

    res.json({
      success: true,
      data: alert,
      message: 'Alert resolved successfully'
    });
  })
);

/**
 * PUT /api/alerts/:id/dismiss
 * Dismiss an alert
 */
router.put('/:id/dismiss',
  requirePermission('manage_alerts'),
  catchAsync(async (req: AuthRequest, res: Response) => {
    const { reason } = req.body;

    // First find the existing alert
    const existingAlert = await RiskAlert.findById(req.params.id);
    if (!existingAlert) {
      throw new NotFoundError('Alert');
    }

    const alert = await RiskAlert.findByIdAndUpdate(
      req.params.id,
      {
        status: 'dismissed',
        resolvedAt: new Date(),
        acknowledgedBy: req.user?.id,
        ...(reason && { 
          actions: [...(existingAlert.actions || []), `Dismissed: ${reason}`] 
        })
      },
      { new: true }
    );

    if (!alert) {
      throw new NotFoundError('Alert');
    }

    res.json({
      success: true,
      data: alert,
      message: 'Alert dismissed successfully'
    });
  })
);

/**
 * GET /api/alerts/summary/dashboard
 * Get alert summary for dashboard
 */
router.get('/summary/dashboard',
  requirePermission('view_alerts'),
  catchAsync(async (req: Request, res: Response) => {
    const timeframe = req.query.timeframe as string || '24h';
    
    let startDate: Date;
    switch (timeframe) {
      case '1h':
        startDate = moment().subtract(1, 'hour').toDate();
        break;
      case '24h':
        startDate = moment().subtract(24, 'hours').toDate();
        break;
      case '7d':
        startDate = moment().subtract(7, 'days').toDate();
        break;
      case '30d':
        startDate = moment().subtract(30, 'days').toDate();
        break;
      default:
        startDate = moment().subtract(24, 'hours').toDate();
    }

    const [
      totalActive,
      criticalActive,
      highActive,
      mediumActive,
      lowActive,
      totalInPeriod,
      recentAlerts,
      alertsByCategory,
      alertsByType
    ] = await Promise.all([
      RiskAlert.countDocuments({ status: 'active' }),
      RiskAlert.countDocuments({ status: 'active', severity: 'critical' }),
      RiskAlert.countDocuments({ status: 'active', severity: 'high' }),
      RiskAlert.countDocuments({ status: 'active', severity: 'medium' }),
      RiskAlert.countDocuments({ status: 'active', severity: 'low' }),
      RiskAlert.countDocuments({ triggeredAt: { $gte: startDate } }),
      RiskAlert.find({ status: 'active' })
        .sort({ triggeredAt: -1 })
        .limit(10)
        .select('title severity riskCategory triggeredAt entityId'),
      RiskAlert.aggregate([
        { $match: { status: 'active' } },
        { $group: { _id: '$riskCategory', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      RiskAlert.aggregate([
        { $match: { status: 'active' } },
        { $group: { _id: '$alertType', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        summary: {
          totalActive,
          totalInPeriod,
          bySeverity: {
            critical: criticalActive,
            high: highActive,
            medium: mediumActive,
            low: lowActive
          }
        },
        recentAlerts,
        distributions: {
          byCategory: alertsByCategory,
          byType: alertsByType
        },
        timeframe,
        generatedAt: new Date()
      }
    });
  })
);

/**
 * GET /api/alerts/trends
 * Get alert trends for analytics
 */
router.get('/trends',
  requirePermission('view_alerts'),
  catchAsync(async (req: Request, res: Response) => {
    const days = parseInt(req.query.days as string) || 30;
    const startDate = moment().subtract(days, 'days').toDate();

    const trendData = await RiskAlert.aggregate([
      {
        $match: {
          triggeredAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$triggeredAt' } },
            severity: '$severity'
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.date': 1 }
      }
    ]);

    // Get resolution trends
    const resolutionData = await RiskAlert.aggregate([
      {
        $match: {
          resolvedAt: { $gte: startDate, $exists: true }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$resolvedAt' } },
            status: '$status'
          },
          count: { $sum: 1 },
          avgResolutionTime: {
            $avg: {
              $subtract: ['$resolvedAt', '$triggeredAt']
            }
          }
        }
      },
      {
        $sort: { '_id.date': 1 }
      }
    ]);

    // Get category trends
    const categoryTrends = await RiskAlert.aggregate([
      {
        $match: {
          triggeredAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$triggeredAt' } },
            category: '$riskCategory'
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.date': 1 }
      }
    ]);

    res.json({
      success: true,
      data: {
        alertTrends: trendData,
        resolutionTrends: resolutionData,
        categoryTrends: categoryTrends,
        period: {
          days,
          startDate,
          endDate: new Date()
        }
      }
    });
  })
);

/**
 * POST /api/alerts/bulk/acknowledge
 * Bulk acknowledge multiple alerts
 */
router.post('/bulk/acknowledge',
  requirePermission('manage_alerts'),
  catchAsync(async (req: AuthRequest, res: Response) => {
    const { alertIds } = req.body;

    if (!alertIds || !Array.isArray(alertIds) || alertIds.length === 0) {
      throw new ValidationError('alertIds array is required');
    }

    const result = await RiskAlert.updateMany(
      {
        _id: { $in: alertIds },
        status: 'active'
      },
      {
        status: 'acknowledged',
        acknowledgedAt: new Date(),
        acknowledgedBy: req.user?.id
      }
    );

    res.json({
      success: true,
      data: {
        modifiedCount: result.modifiedCount,
        matchedCount: result.matchedCount
      },
      message: `${result.modifiedCount} alerts acknowledged successfully`
    });
  })
);

/**
 * POST /api/alerts/bulk/resolve
 * Bulk resolve multiple alerts
 */
router.post('/bulk/resolve',
  requirePermission('manage_alerts'),
  catchAsync(async (req: AuthRequest, res: Response) => {
    const { alertIds, resolution } = req.body;

    if (!alertIds || !Array.isArray(alertIds) || alertIds.length === 0) {
      throw new ValidationError('alertIds array is required');
    }

    const updateData: any = {
      status: 'resolved',
      resolvedAt: new Date(),
      acknowledgedBy: req.user?.id
    };

    if (resolution) {
      // Add resolution to all alerts
      const alerts = await RiskAlert.find({ _id: { $in: alertIds } });
      for (const alert of alerts) {
        await RiskAlert.findByIdAndUpdate(alert._id, {
          ...updateData,
          actions: [...(alert.actions || []), resolution]
        });
      }
    } else {
      await RiskAlert.updateMany(
        {
          _id: { $in: alertIds },
          status: { $in: ['active', 'acknowledged'] }
        },
        updateData
      );
    }

    res.json({
      success: true,
      message: `${alertIds.length} alerts resolved successfully`
    });
  })
);

/**
 * DELETE /api/alerts/:id
 * Delete an alert (admin only)
 */
router.delete('/:id',
  requirePermission('delete_alerts'),
  catchAsync(async (req: Request, res: Response) => {
    const alert = await RiskAlert.findByIdAndDelete(req.params.id);

    if (!alert) {
      throw new NotFoundError('Alert');
    }

    res.json({
      success: true,
      message: 'Alert deleted successfully'
    });
  })
);

/**
 * GET /api/alerts/export
 * Export alerts to CSV
 */
router.get('/export',
  requirePermission('export_data'),
  catchAsync(async (req: Request, res: Response) => {
    const format = req.query.format as string || 'json';
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    const filter: any = {};
    if (startDate || endDate) {
      filter.triggeredAt = {};
      if (startDate) filter.triggeredAt.$gte = new Date(startDate);
      if (endDate) filter.triggeredAt.$lte = new Date(endDate);
    }

    const alerts = await RiskAlert.find(filter)
      .sort({ triggeredAt: -1 })
      .lean();

    if (format === 'csv') {
      // Convert to CSV format
      const csvHeaders = [
        'ID', 'Alert Type', 'Risk Category', 'Severity', 'Title', 
        'Description', 'Entity ID', 'Entity Type', 'Status',
        'Triggered At', 'Acknowledged At', 'Resolved At'
      ];

      const csvRows = alerts.map(alert => [
        alert._id,
        alert.alertType,
        alert.riskCategory,
        alert.severity,
        alert.title,
        alert.description,
        alert.entityId,
        alert.entityType,
        alert.status,
        alert.triggeredAt,
        alert.acknowledgedAt || '',
        alert.resolvedAt || ''
      ]);

      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="risk-alerts-export.csv"');
      res.send(csvContent);
    } else {
      res.json({
        success: true,
        data: {
          alerts,
          exportedAt: new Date(),
          totalCount: alerts.length,
          filters: { startDate, endDate }
        }
      });
    }
  })
);

export default router;