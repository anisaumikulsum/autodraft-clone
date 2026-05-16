import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { generationQueue, renderQueue } from '../lib/queue';

const router = Router();
router.use(authMiddleware);

async function deductCredits(userId: string, amount: number, type: string, description?: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.credits < amount) return false;
  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { credits: { decrement: amount } } }),
    prisma.creditTransaction.create({ data: { userId, amount: -amount, type, description } }),
  ]);
  return true;
}

// Script breakdown via AI
router.post('/script-breakdown', async (req: AuthRequest, res) => {
  const { projectId, scriptText } = req.body;
  const cost = 1;
  const ok = await deductCredits(req.user!.id, cost, 'generation', 'Script breakdown');
  if (!ok) { res.status(402).json({ error: 'Insufficient credits' }); return; }

  try {
    const job = await generationQueue.add('script_breakdown', { userId: req.user!.id, projectId, scriptText });
    res.json({ jobId: job.id, status: 'queued' });
  } catch { res.status(500).json({ error: 'Failed to queue script breakdown' }); }
});

// Generate background
router.post('/background', async (req: AuthRequest, res) => {
  const { projectId, sceneId, prompt } = req.body;
  const cost = 3;
  const ok = await deductCredits(req.user!.id, cost, 'generation', 'Generate background');
  if (!ok) { res.status(402).json({ error: 'Insufficient credits' }); return; }

  try {
    const job = await generationQueue.add('background_generate', { userId: req.user!.id, projectId, sceneId, prompt });
    res.json({ jobId: job.id, status: 'queued' });
  } catch { res.status(500).json({ error: 'Failed to queue background generation' }); }
});

// Generate voiceover
router.post('/voice', async (req: AuthRequest, res) => {
  const { projectId, sceneId, text, voiceStyle } = req.body;
  const cost = 2;
  const ok = await deductCredits(req.user!.id, cost, 'generation', 'Generate voiceover');
  if (!ok) { res.status(402).json({ error: 'Insufficient credits' }); return; }

  try {
    const job = await generationQueue.add('voice_generate', { userId: req.user!.id, projectId, sceneId, text, voiceStyle });
    res.json({ jobId: job.id, status: 'queued' });
  } catch { res.status(500).json({ error: 'Failed to queue voice generation' }); }
});

// Render video
router.post('/render', async (req: AuthRequest, res) => {
  const { projectId } = req.body;
  const cost = 10;
  const ok = await deductCredits(req.user!.id, cost, 'generation', 'Render video');
  if (!ok) { res.status(402).json({ error: 'Insufficient credits' }); return; }

  try {
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: req.user!.id },
      include: {
        scenes: { orderBy: { sceneNumber: 'asc' } },
        characters: { include: { character: true } },
      },
    });
    if (!project) { res.status(404).json({ error: 'Project not found' }); return; }

    await prisma.project.update({
      where: { id: projectId },
      data: { status: 'rendering', exportUrl: null },
    });

    const customMotions = await prisma.customMotion.findMany({
      where: { userId: req.user!.id },
    });

    const job = await renderQueue.add('render_video', {
      userId: req.user!.id,
      projectId,
      projectData: {
        scenes: project.scenes,
        characters: project.characters.map((pc: any) => pc.character || pc),
        customMotions,
      },
    });
    res.json({ jobId: job.id, status: 'queued' });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Failed to queue render' }); }
});

export { router as generationRouter };
