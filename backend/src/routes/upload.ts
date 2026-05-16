import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { uploadBuffer } from '../lib/s3';

const router = Router();
router.use(authMiddleware);

// Upload base64 image
router.post('/image', async (req: AuthRequest, res) => {
  const { base64, folder } = req.body;
  if (!base64 || typeof base64 !== 'string') {
    res.status(400).json({ error: 'base64 required' });
    return;
  }
  try {
    const match = base64.match(/^data:(.+);base64,(.+)$/);
    if (!match) {
      res.status(400).json({ error: 'Invalid base64 format' });
      return;
    }
    const contentType = match[1];
    const buffer = Buffer.from(match[2], 'base64');
    const ext = contentType.split('/')[1] || 'png';
    const key = `${folder || 'uploads'}/${req.user!.id}/${Date.now()}.${ext}`;
    const url = await uploadBuffer(key, buffer, contentType);
    res.json({ url, key });
  } catch (e: any) {
    console.error('Upload error:', e.message);
    res.status(500).json({ error: 'Upload failed' });
  }
});

export { router as uploadRouter };
