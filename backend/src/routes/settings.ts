import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { catchAsync } from '../middleware/errorHandler';
import { cache } from '../config/redis';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const router = Router();

// Default system settings
const defaultSettings = {
  general: {
    organizationName: 'Prudential Financial Services',
    timezone: 'UTC',
    dateFormat: 'MM/DD/YYYY',
    currency: 'USD',
    language: 'en',
    enableAuditLog: true,
    sessionTimeout: 1440
  },
  risk: {
    var95Threshold: 1000000,
    capitalAdequacyThreshold: 12,
    liquidityCoverageThreshold: 100,
    leverageRatioThreshold: 3,
    enableRealTimeMonitoring: true,
    updateInterval: 30,
    alertDuplication: 60,
    significantPriceChange: 5
  },
  security: {
    enforcePasswordPolicy: true,
    minPasswordLength: 8,
    requireMFA: true,
    maxLoginAttempts: 5,
    lockoutDuration: 30,
    enableIPWhitelist: false,
    ipAddresses: '',
    apiRateLimit: 100
  },
  notifications: {
    enableEmailNotifications: true,
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUser: '',
    enableSlackIntegration: false,
    slackWebhook: '',
    criticalAlertEmail: true,
    highAlertEmail: true,
    mediumAlertEmail: false,
    lowAlertEmail: false
  }
};

/**
 * GET /api/settings
 * Get all system settings
 */
router.get('/', catchAsync(async (req: AuthRequest, res: Response) => {
  const cacheKey = 'system_settings';
  let settings = await cache.get(cacheKey);
  
  if (!settings) {
    // Try to load from file system or database
    settings = await loadSettingsFromStorage();
    
    if (!settings) {
      settings = defaultSettings;
    }
    
    // Cache for 1 hour
    await cache.set(cacheKey, settings, 3600);
  }
  
  res.json({
    success: true,
    data: settings
  });
}));

/**
 * PUT /api/settings/:section
 * Update specific settings section
 */
router.put('/:section', catchAsync(async (req: AuthRequest, res: Response) => {
  const section = req.params.section;
  const newSettings = req.body;
  
  // Validate section
  if (!['general', 'risk', 'security', 'notifications'].includes(section)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid settings section'
    });
  }
  
  // Get current settings
  const cacheKey = 'system_settings';
  let currentSettings = await cache.get(cacheKey) || defaultSettings;
  
  // Update the specific section
  currentSettings[section] = { ...currentSettings[section], ...newSettings };
  
  // Save to storage
  await saveSettingsToStorage(currentSettings);
  
  // Update cache
  await cache.set(cacheKey, currentSettings, 3600);
  
  res.json({
    success: true,
    data: currentSettings,
    message: `${section} settings updated successfully`
  });
}));

/**
 * GET /api/settings/system-info
 * Get system information and health metrics
 */
router.get('/system-info', catchAsync(async (req: AuthRequest, res: Response) => {
  const systemInfo = {
    uptime: formatUptime(process.uptime()),
    version: process.env.npm_package_version || '2.1.0',
    nodeVersion: process.version,
    platform: os.platform(),
    arch: os.arch(),
    memory: {
      total: Math.round(os.totalmem() / 1024 / 1024),
      free: Math.round(os.freemem() / 1024 / 1024),
      used: Math.round((os.totalmem() - os.freemem()) / 1024 / 1024)
    },
    loadAverage: os.loadavg(),
    cpuCount: os.cpus().length,
    hostname: os.hostname(),
    environment: process.env.NODE_ENV || 'development',
    database: 'MongoDB',
    redis: 'Redis',
    timestamp: new Date().toISOString()
  };
  
  res.json({
    success: true,
    data: systemInfo
  });
}));

/**
 * POST /api/settings/backup
 * Create configuration backup
 */
router.post('/backup', catchAsync(async (req: AuthRequest, res: Response) => {
  const settings = await cache.get('system_settings') || defaultSettings;
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupData = {
    timestamp: new Date().toISOString(),
    version: '2.1.0',
    settings
  };
  
  // In production, save to secure backup location
  const backupPath = path.join(process.cwd(), 'backups', `settings-backup-${timestamp}.json`);
  
  try {
    await fs.mkdir(path.dirname(backupPath), { recursive: true });
    await fs.writeFile(backupPath, JSON.stringify(backupData, null, 2));
    
    res.json({
      success: true,
      data: {
        backupPath,
        timestamp: backupData.timestamp
      },
      message: 'Configuration backup created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create backup'
    });
  }
}));

/**
 * POST /api/settings/restore
 * Restore configuration from backup
 */
router.post('/restore', catchAsync(async (req: AuthRequest, res: Response) => {
  const { backupData } = req.body;
  
  if (!backupData || !backupData.settings) {
    return res.status(400).json({
      success: false,
      error: 'Invalid backup data'
    });
  }
  
  // Validate backup data structure
  const requiredSections = ['general', 'risk', 'security', 'notifications'];
  const hasAllSections = requiredSections.every(section => 
    backupData.settings[section]
  );
  
  if (!hasAllSections) {
    return res.status(400).json({
      success: false,
      error: 'Backup data missing required sections'
    });
  }
  
  // Save restored settings
  await saveSettingsToStorage(backupData.settings);
  await cache.set('system_settings', backupData.settings, 3600);
  
  res.json({
    success: true,
    data: backupData.settings,
    message: 'Configuration restored successfully'
  });
}));

// Helper functions
async function loadSettingsFromStorage(): Promise<any> {
  try {
    const settingsPath = path.join(process.cwd(), 'config', 'system-settings.json');
    const settingsFile = await fs.readFile(settingsPath, 'utf8');
    return JSON.parse(settingsFile);
  } catch (error) {
    console.log('Settings file not found, using defaults');
    return null;
  }
}

async function saveSettingsToStorage(settings: any): Promise<void> {
  try {
    const configDir = path.join(process.cwd(), 'config');
    const settingsPath = path.join(configDir, 'system-settings.json');
    
    await fs.mkdir(configDir, { recursive: true });
    await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2));
  } catch (error) {
    console.error('Failed to save settings:', error);
    throw error;
  }
}

function formatUptime(uptimeSeconds: number): string {
  const days = Math.floor(uptimeSeconds / 86400);
  const hours = Math.floor((uptimeSeconds % 86400) / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  
  return `${days} days, ${hours} hours, ${minutes} minutes`;
}

export default router;