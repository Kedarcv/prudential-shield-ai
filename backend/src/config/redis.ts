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

  } catch (error) {
    console.error('Failed to connect to Redis:', error);
    throw error;
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
    await redisClient.setEx(key, expiry, JSON.stringify(value));
  },

  async get(key: string): Promise<any> {
    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
  },

  async del(key: string): Promise<void> {
    await redisClient.del(key);
  },

  async exists(key: string): Promise<boolean> {
    return (await redisClient.exists(key)) === 1;
  },

  async setHash(key: string, field: string, value: any): Promise<void> {
    await redisClient.hSet(key, field, JSON.stringify(value));
  },

  async getHash(key: string, field: string): Promise<any> {
    const value = await redisClient.hGet(key, field);
    return value ? JSON.parse(value) : null;
  }
};