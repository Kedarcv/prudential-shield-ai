import { createClient } from 'redis';

export const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    reconnectStrategy: (retries) => Math.min(retries * 50, 1000),
  },
});

export async function connectRedis(): Promise<void> {
  try {
    await redisClient.connect();
    console.log('✅ Connected to Redis');

    redisClient.on('error', (error) => {
      console.error('Redis error:', error);
    });

    redisClient.on('reconnecting', () => {
      console.log('Redis reconnecting...');
    });

    redisClient.on('ready', () => {
      console.log('Redis connection ready');
    });

  } catch (error: any) {
    console.warn('⚠️ Redis connection failed, running without cache:', error.message);
    // Don't throw error - allow server to run without Redis
  }
}

export async function disconnectRedis(): Promise<void> {
  try {
    await redisClient.disconnect();
    console.log('Disconnected from Redis');
  } catch (error) {
    console.error('Error disconnecting from Redis:', error);
    throw error;
  }
}

// Cache helper functions
export const cache = {
  async set(key: string, value: any, expiry: number = 3600): Promise<void> {
    try {
      if (redisClient.isReady) {
        await redisClient.setEx(key, expiry, JSON.stringify(value));
      }
    } catch (error) {
      console.warn('Cache set failed:', error);
    }
  },

  async get(key: string): Promise<any> {
    try {
      if (redisClient.isReady) {
        const value = await redisClient.get(key);
        return value ? JSON.parse(value) : null;
      }
    } catch (error) {
      console.warn('Cache get failed:', error);
    }
    return null;
  },

  async del(key: string): Promise<void> {
    try {
      if (redisClient.isReady) {
        await redisClient.del(key);
      }
    } catch (error) {
      console.warn('Cache del failed:', error);
    }
  },

  async exists(key: string): Promise<boolean> {
    try {
      if (redisClient.isReady) {
        return (await redisClient.exists(key)) === 1;
      }
    } catch (error) {
      console.warn('Cache exists failed:', error);
    }
    return false;
  },

  async setHash(key: string, field: string, value: any): Promise<void> {
    try {
      if (redisClient.isReady) {
        await redisClient.hSet(key, field, JSON.stringify(value));
      }
    } catch (error) {
      console.warn('Cache setHash failed:', error);
    }
  },

  async getHash(key: string, field: string): Promise<any> {
    try {
      if (redisClient.isReady) {
        const value = await redisClient.hGet(key, field);
        return value ? JSON.parse(value) : null;
      }
    } catch (error) {
      console.warn('Cache getHash failed:', error);
    }
    return null;
  }
};