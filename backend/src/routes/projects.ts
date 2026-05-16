import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { generationQueue } from '../lib/queue';

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

const projectSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  genre: z.string().default('drama'),
});

// Create project
router.post('/', async (req: AuthRequest, res) => {
  const parsed = projectSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Invalid input' }); return; }
  try {
    const project = await prisma.project.create({
      data: { ...parsed.data, userId: req.user!.id, status: 'draft' },
    });
    res.json(project);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Failed to create project' }); }
});

// List projects
router.get('/', async (req: AuthRequest, res) => {
  try {
    const projects = await prisma.project.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      include: { scenes: { orderBy: { sceneNumber: 'asc' } }, characters: { include: { character: true } } },
    });
    res.json(projects);
  } catch { res.status(500).json({ error: 'Failed to fetch projects' }); }
});

// Get single project
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const project = await prisma.project.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
      include: { scenes: { orderBy: { sceneNumber: 'asc' } }, characters: { include: { character: true } } },
    });
    if (!project) { res.status(404).json({ error: 'Not found' }); return; }
    res.json(project);
  } catch { res.status(500).json({ error: 'Failed to fetch project' }); }
});

// Update project
router.patch('/:id', async (req: AuthRequest, res) => {
  try {
    const project = await prisma.project.updateMany({
      where: { id: req.params.id, userId: req.user!.id },
      data: req.body,
    });
    if (!project.count) { res.status(404).json({ error: 'Not found' }); return; }
    const updated = await prisma.project.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
      include: { scenes: { orderBy: { sceneNumber: 'asc' } }, characters: { include: { character: true } } },
    });
    res.json(updated);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Failed to update project' }); }
});

// Delete project
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    await prisma.project.deleteMany({ where: { id: req.params.id, userId: req.user!.id } });
    res.json({ ok: true });
  } catch { res.status(500).json({ error: 'Failed to delete project' }); }
});

// Upsert scenes
router.put('/:id/scenes', async (req: AuthRequest, res) => {
  const { scenes } = req.body;
  if (!Array.isArray(scenes)) { res.status(400).json({ error: 'scenes must be an array' }); return; }
  try {
    // Delete all existing scenes for this project first, then recreate
    await prisma.scene.deleteMany({ where: { projectId: req.params.id } });
    await prisma.$transaction(
      scenes.map((s: any) => {
        const data = {
          sceneNumber: s.sceneNumber,
          setting: s.setting,
          description: s.description,
          mood: s.mood,
          durationSec: s.durationSec,
          backgroundUrl: s.backgroundUrl,
          layers: s.layers || [],
          dialogText: s.dialogText,
          camera: s.camera || {},
        };
        return prisma.scene.create({ data: { ...data, projectId: req.params.id } });
      })
    );
    // Auto-calculate project metadata
    const totalDuration = scenes.reduce((sum: number, s: any) => sum + (s.durationSec || 0), 0);
    await prisma.project.updateMany({
      where: { id: req.params.id, userId: req.user!.id },
      data: { durationSec: totalDuration, totalScenes: scenes.length },
    });
    const updated = await prisma.project.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
      include: { scenes: { orderBy: { sceneNumber: 'asc' } }, characters: { include: { character: true } } },
    });
    res.json(updated);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Failed to save scenes' }); }
});

// Delete scene
router.delete('/:id/scenes/:sceneId', async (req: AuthRequest, res) => {
  try {
    await prisma.scene.deleteMany({ where: { id: req.params.sceneId, projectId: req.params.id } });
    res.json({ ok: true });
  } catch { res.status(500).json({ error: 'Failed to delete scene' }); }
});

// Generate character (enqueue)
router.post('/:id/characters', async (req: AuthRequest, res) => {
  const { name, bodyTemplateId, prompt } = req.body;
  const cost = 5;
  const ok = await deductCredits(req.user!.id, cost, 'generation', 'Generate character');
  if (!ok) { res.status(402).json({ error: 'Insufficient credits' }); return; }

  try {
    const char = await prisma.character.create({
      data: { name, bodyTemplateId, userId: req.user!.id, projectId: req.params.id, description: prompt },
    });
    await generationQueue.add('character_generate', {
      characterId: char.id,
      userId: req.user!.id,
      prompt,
      bodyTemplateId,
    });
    res.json({ character: char, jobStatus: 'queued' });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Failed to create character' }); }
});

// Create character manually (no AI generation)
router.post('/:id/characters-manual', async (req: AuthRequest, res) => {
  const { name, bodyTemplateId, faceImageUrl } = req.body;
  try {
    const char = await prisma.character.create({
      data: { name, bodyTemplateId, userId: req.user!.id, projectId: req.params.id, faceImageUrl, fullBodyUrl: faceImageUrl },
    });
    await prisma.projectCharacter.create({
      data: { projectId: req.params.id, characterId: char.id },
    });
    res.json(char);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Failed to create character' }); }
});

// Update character (customColors, etc.)
router.patch('/:id/characters/:charId', async (req: AuthRequest, res) => {
  try {
    const project = await prisma.project.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
    });
    if (!project) { res.status(404).json({ error: 'Project not found' }); return; }

    const existing = await prisma.character.findFirst({
      where: { id: req.params.charId, projectId: req.params.id },
    });
    if (!existing) { res.status(404).json({ error: 'Character not found' }); return; }

    const { customColors } = req.body;
    const updated = await prisma.character.update({
      where: { id: req.params.charId },
      data: { customColors: customColors || undefined },
    });
    res.json(updated);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Failed to update character' }); }
});

// Delete character from project
router.delete('/:id/characters/:charId', async (req: AuthRequest, res) => {
  try {
    const project = await prisma.project.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
    });
    if (!project) { res.status(404).json({ error: 'Project not found' }); return; }

    await prisma.$transaction([
      prisma.projectCharacter.deleteMany({
        where: { projectId: req.params.id, characterId: req.params.charId },
      }),
      prisma.character.deleteMany({
        where: { id: req.params.charId, projectId: req.params.id },
      }),
    ]);
    res.json({ ok: true });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Failed to delete character' }); }
});

export { router as projectsRouter };
