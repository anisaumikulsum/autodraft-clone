import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import dotenv from 'dotenv';
import { join } from 'path';
import { authRouter } from './routes/auth';
import { projectsRouter } from './routes/projects';
import { generationRouter } from './routes/generation';
import { billingRouter } from './routes/billing';
import { webhooksRouter } from './routes/webhooks';
import { uploadRouter } from './routes/upload';
import { customMotionsRouter } from './routes/customMotions';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet());
app.use(cors({ origin: [process.env.FRONTEND_URL || 'http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003'], credentials: true }));

// Stripe webhook needs raw body
app.use('/api/billing/webhook', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '10mb' }));

// Rate limiting
const rateLimiter = new RateLimiterMemory({
  keyPrefix: 'api_limit',
  points: 100,
  duration: 60,
});

app.use(async (req, res, next) => {
  try {
    const key = req.ip || 'unknown';
    await rateLimiter.consume(key);
    next();
  } catch {
    res.status(429).json({ error: 'Too many requests' });
  }
});

app.use('/api/auth', authRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/generation', generationRouter);
app.use('/api/billing', billingRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/custom-motions', customMotionsRouter);
app.use('/webhooks', webhooksRouter);

app.get('/health', (_req, res) => res.json({ ok: true }));

// Serve rendered videos
app.use('/renders', express.static(join(__dirname, '../public/renders')));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
