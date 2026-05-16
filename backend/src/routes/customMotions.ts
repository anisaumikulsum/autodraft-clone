import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

const createSchema = z.object({
  name: z.string().min(1).max(100),
  boneKeyframes: z.record(z.array(z.object({ frame: z.number(), rotation: z.number() }))),
  durationSec: z.number().min(0.5).max(60).default(2),
  fps: z.number().min(1).max(60).default(8),
  loop: z.boolean().default(true),
});

// List user's custom motions
router.get('/', async (req: AuthRequest, res) => {
  try {
    const motions = await prisma.customMotion.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json(motions);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Failed to fetch custom motions' }); }
});

// Create custom motion
router.post('/', async (req: AuthRequest, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Invalid input' }); return; }
  try {
    const motion = await prisma.customMotion.create({
      data: { ...parsed.data, userId: req.user!.id },
    });
    res.json(motion);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Failed to create custom motion' }); }
});

// Delete custom motion
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    await prisma.customMotion.deleteMany({ where: { id: req.params.id, userId: req.user!.id } });
    res.json({ ok: true });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Failed to delete custom motion' }); }
});

export { router as customMotionsRouter };
