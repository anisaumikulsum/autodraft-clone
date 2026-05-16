import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { renderQueue } from '../lib/queue';

const router = Router();

// AI Worker webhook
router.post('/ai', async (req, res) => {
  const { type, status, characterId, sceneId, projectId, url, scenes, error } = req.body;
  try {
    if (type === 'character_generate' && status === 'done' && characterId) {
      const spriteSet = req.body.spriteSet || null;
      await prisma.character.update({
        where: { id: characterId },
        data: { faceImageUrl: url, fullBodyUrl: url, spriteSet },
      });
    }
    if (type === 'background_generate' && status === 'done' && sceneId) {
      await prisma.scene.update({
        where: { id: sceneId },
        data: { backgroundUrl: url },
      });
    }
    if (type === 'voice_generate' && status === 'done' && sceneId) {
      await prisma.scene.update({
        where: { id: sceneId },
        data: { voiceUrl: url },
      });
    }
    if (type === 'script_breakdown' && status === 'done' && projectId && Array.isArray(scenes)) {
      const existing = await prisma.scene.findMany({ where: { projectId }, orderBy: { sceneNumber: 'asc' } });
      const startNum = existing.length + 1;
      for (let i = 0; i < scenes.length; i++) {
        const s = scenes[i];
        await prisma.scene.create({
          data: {
            projectId,
            sceneNumber: startNum + i,
            setting: s.setting || 'bedroom_day',
            description: s.description || null,
            mood: s.mood || 'neutral',
            dialogText: s.dialogText || null,
            durationSec: s.durationSec || 5,
            layers: s.characters?.map((name: string, idx: number) => ({
              id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
              type: 'character',
              refId: name,
              x: 100 + idx * 200,
              y: 200,
              scale: 1,
              zIndex: 10 + idx,
            })) || [],
          },
        });
      }
      await prisma.project.update({
        where: { id: projectId },
        data: { status: 'draft', totalScenes: { increment: scenes.length } },
      });
    }
    if (status === 'failed') {
      console.error(`AI job ${type} failed:`, error);
    }
    res.json({ ok: true });
  } catch (e) {
    console.error('Webhook error:', e);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Render Engine webhook
router.post('/render', async (req, res) => {
  const { type, status, projectId, url, error } = req.body;
  try {
    if (type === 'render_video' && projectId) {
      const project = await prisma.project.findUnique({ where: { id: projectId } });
      if (!project) {
        console.warn(`Render webhook: project ${projectId} not found`);
        res.json({ ok: true, warning: 'Project not found' });
        return;
      }
      await prisma.project.update({
        where: { id: projectId },
        data: {
          status: status === 'done' ? 'done' : 'failed',
          exportUrl: status === 'done' ? url : null,
        },
      });
    }
    res.json({ ok: true });
  } catch (e) {
    console.error('Render webhook error:', e);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

export { router as webhooksRouter };
