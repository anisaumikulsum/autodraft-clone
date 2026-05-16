import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const redis = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', { maxRetriesPerRequest: null });

export const generationQueue = new Queue('generation', { connection: redis });
export const renderQueue = new Queue('render', { connection: redis });

export { redis };
