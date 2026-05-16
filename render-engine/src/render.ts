import { Worker } from 'bullmq';
import { Redis } from 'ioredis';
import axios from 'axios';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { createCanvas, loadImage } from 'canvas';
import ffmpeg from 'fluent-ffmpeg';
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { tmpdir } from 'os';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import {
  getPuppetTemplate, getMotionPreset, computeBoneAngles,
  textToVisemes, getVisemeAtTime, isEyeOpenAtTime,
  type FaceExpression,
} from './puppetTemplates.js';
import { renderPuppetToPng } from './puppetSvgRenderer.js';
import { svgPathProperties } from 'svg-path-properties';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', { maxRetriesPerRequest: null });

const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || 'minioadmin',
    secretAccessKey: process.env.S3_SECRET_KEY || 'minioadmin',
  },
  forcePathStyle: true,
});

const BUCKET = process.env.S3_BUCKET || 'autodraft-assets';
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http://localhost:4000/webhooks/render';

async function uploadToS3(key: string, buffer: Buffer, contentType: string) {
  await s3.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: buffer, ContentType: contentType }));
  const endpoint = process.env.S3_ENDPOINT || 'http://localhost:9000';
  return `${endpoint}/${BUCKET}/${key}`;
}

async function webhook(payload: any) {
  try {
    await axios.post(WEBHOOK_URL, payload, { timeout: 10000 });
  } catch (e) {
    console.error('Webhook failed:', (e as any).message);
  }
}

function expressionFromPreset(presetId: string): FaceExpression {
  switch (presetId) {
    case 'm_talk': return 'neutral';
    case 'm_eating': return 'a';
    case 'm_happy': case 'm_laugh': case 'm_waving': return 'smile';
    case 'm_sad': case 'm_cry': return 'frown';
    case 'm_angry': return 'angry';
    case 'm_shocked': return 'surprise';
    default: return 'neutral';
  }
}

const motionToSpriteKey: Record<string, string> = {
  m_idle: 'idle',
  m_walk: 'walk_1',
  m_sit: 'sit',
  m_talk: 'talk',
  m_angry: 'angry',
  m_cry: 'sad',
  m_laugh: 'happy',
  m_shocked: 'idle',
  m_happy: 'happy',
  m_sad: 'sad',
  m_sleep: 'sit',
  m_eating: 'idle',
  m_waving: 'happy',
  m_running: 'walk_1',
};

function getPathPosition(pathData: string, progress: number): { x: number; y: number } {
  try {
    const props = new svgPathProperties(pathData);
    const len = props.getTotalLength();
    const p = props.getPointAtLength(Math.max(0, Math.min(1, progress)) * len);
    return { x: p.x, y: p.y };
  } catch {
    return { x: 0, y: 0 };
  }
}

async function composeFrame(
  scene: any,
  characters: any[],
  width: number,
  height: number,
  elapsedMs: number,
  customMotions: any[] = [],
): Promise<Buffer> {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Background
  if (scene.backgroundUrl) {
    try {
      const bgImg = await loadImage(scene.backgroundUrl);
      ctx.drawImage(bgImg, 0, 0, width, height);
    } catch {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, width, height);
    }
  } else {
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, width, height);
  }

  // Apply camera transform to everything (background is already drawn fixed)
  const camera = scene.camera || {};
  const panX = camera.panX || 0;
  const panY = camera.panY || 0;
  const zoom = camera.zoom || 1;
  const rotation = camera.rotation || 0;
  const cx = width / 2;
  const cy = height / 2;
  ctx.save();
  ctx.translate(cx + panX, cy + panY);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.scale(zoom);
  ctx.translate(-cx, -cy);

  // Characters — animated puppet frames
  const charLayers = scene.layers?.filter((l: any) => l.type === 'character') || [];
  for (const layer of charLayers) {
    const ch = characters.find((c: any) => c.id === layer.refId || c.character?.id === layer.refId);
    if (!ch) continue;
    const templateId = ch.bodyTemplateId || ch.character?.bodyTemplateId;
    const puppet = getPuppetTemplate(templateId);
    if (!puppet) continue;

    const motionId = layer.motionPresetId || '';
    const preset = getMotionPreset(motionId, customMotions);

    // Path-following: interpolate position if pathData exists
    const durSec = scene.durationSec || 1;
    const progress = Math.min(1, Math.max(0, elapsedMs / (durSec * 1000)));
    let drawX = layer.x;
    let drawY = layer.y;
    if (layer.pathData) {
      const pos = getPathPosition(layer.pathData, progress);
      drawX = pos.x;
      drawY = pos.y;
    }
    const scale = layer.scale || 1;
    const sizeW = 120 * scale;
    const sizeH = 210 * scale;

    // Sprite mode: use pre-generated AI sprite if available
    const spriteSet = ch.spriteSet || ch.character?.spriteSet;
    const spriteKey = motionToSpriteKey[motionId];
    const spriteUrl = spriteSet?.[spriteKey];

    try {
      if (spriteUrl) {
        const spriteImg = await loadImage(spriteUrl);
        ctx.drawImage(spriteImg, drawX, drawY, sizeW, sizeH);
      } else {
        const colors = { ...puppet.defaultColors, ...(ch.customColors || ch.character?.customColors || {}) };
        const angles = preset ? computeBoneAngles(preset, elapsedMs, true) : {};
        let expression: FaceExpression = expressionFromPreset(motionId);
        if (motionId === 'm_talk' && scene.dialogText) {
          const visemes = textToVisemes(scene.dialogText);
          expression = getVisemeAtTime(visemes, scene.durationSec || 1, elapsedMs, true);
        }
        const eyeOpen = isEyeOpenAtTime(layer.id, elapsedMs);
        const puppetPng = renderPuppetToPng(puppet, colors, angles, expression, eyeOpen, 120, 210);
        const puppetImg = await loadImage(puppetPng);
        ctx.drawImage(puppetImg, drawX, drawY, sizeW, sizeH);
      }

      // Name label
      const name = ch.name || ch.character?.name || '';
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(drawX, drawY + sizeH + 4, sizeW, 22);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(name, drawX + sizeW / 2, drawY + sizeH + 18);
    } catch (e) {
      console.error('Failed to draw character:', e);
    }
  }

  // Subtitle
  if (scene.dialogText) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, height - 80, width, 80);
    ctx.fillStyle = '#fff';
    ctx.font = '22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(scene.dialogText, width / 2, height - 30);
  }

  ctx.restore();
  return canvas.toBuffer('image/png');
}

async function renderProject(job: any) {
  const { projectId, userId, projectData } = job.data;
  const tmpDir = join(tmpdir(), `render-${projectId}-${Date.now()}`);
  mkdirSync(tmpDir, { recursive: true });

  try {
    let scenes: any[] = [];
    let characters: any[] = [];

    let customMotions: any[] = [];
    if (projectData) {
      scenes = projectData.scenes || [];
      characters = projectData.characters || [];
      customMotions = projectData.customMotions || [];
    } else {
      const apiUrl = process.env.API_URL || 'http://backend:4000';
      const projectRes = await axios.get(`${apiUrl}/api/projects/${projectId}`, {
        headers: { 'x-internal': '1' },
      }).catch(() => ({ data: null }));
      const project = projectRes.data;
      if (!project) {
        await webhook({ type: 'render_video', projectId, userId, status: 'failed', error: 'Project not found' });
        return;
      }
      scenes = project.scenes || [];
      characters = project.characters?.map((pc: any) => pc.character || pc) || [];
    }

    const width = 1280;
    const height = 720;
    const fps = 24; // render output fps

    // Generate all frames for all scenes (sequential naming for image2)
    let globalFrameIdx = 0;
    for (let si = 0; si < scenes.length; si++) {
      const scene = scenes[si];
      const durSec = scene.durationSec || 5;
      const frameCount = Math.max(1, Math.round(durSec * fps));
      for (let fi = 0; fi < frameCount; fi++) {
        const elapsedMs = (fi / fps) * 1000;
        const buf = await composeFrame(scene, characters, width, height, elapsedMs, customMotions);
        const framePath = join(tmpDir, `frame_${String(globalFrameIdx++).padStart(5, '0')}.png`);
        writeFileSync(framePath, buf);
      }
    }

    // Build video from sequential PNG frames using image2 demuxer
    const videoOnlyPath = join(tmpDir, 'video_only.mp4');

    await new Promise<void>((resolve, reject) => {
      ffmpeg()
        .input(join(tmpDir, 'frame_%05d.png'))
        .inputOptions(['-framerate', String(fps), '-start_number', '0'])
        .outputOptions([
          '-pix_fmt', 'yuv420p',
          '-c:v', 'libx264',
          '-preset', 'fast',
          '-crf', '23',
          '-movflags', '+faststart',
        ])
        .on('end', () => resolve())
        .on('error', reject)
        .save(videoOnlyPath);
    });

    // Build combined audio track from scene voiceovers
    const audioSegments: string[] = [];
    let hasAudio = false;
    for (let si = 0; si < scenes.length; si++) {
      const scene = scenes[si];
      const durSec = scene.durationSec || 5;
      if (scene.voiceUrl) {
        try {
          const voicePath = join(tmpDir, `voice_${si}.mp3`);
          const resp = await axios.get(scene.voiceUrl, { responseType: 'arraybuffer', timeout: 30000 });
          writeFileSync(voicePath, Buffer.from(resp.data));
          audioSegments.push(voicePath);
          hasAudio = true;
        } catch (e) {
          console.error(`Failed to download voice for scene ${si}:`, (e as any).message);
          // fallback to silence
        }
      }
      if (!hasAudio || audioSegments.length <= si) {
        // Generate silence for exact scene duration
        const silentPath = join(tmpDir, `silent_${si}.mp3`);
        await new Promise<void>((resolve, reject) => {
          ffmpeg()
            .input('anullsrc=r=44100:cl=mono')
            .inputOptions(['-f', 'lavfi'])
            .audioCodec('libmp3lame')
            .audioBitrate('96k')
            .duration(durSec)
            .on('end', () => resolve())
            .on('error', reject)
            .save(silentPath);
        });
        audioSegments.push(silentPath);
      }
    }

    const outputPath = join(tmpDir, 'output.mp4');

    // Always mux audio: we generated at least silence per scene
    if (audioSegments.length > 0) {
      // Concatenate all audio segments
      const audioListPath = join(tmpDir, 'audio_list.txt');
      const audioListContent = audioSegments.map(f => `file '${f}'`).join('\n');
      writeFileSync(audioListPath, audioListContent);

      const combinedAudioPath = join(tmpDir, 'combined_audio.mp3');
      await new Promise<void>((resolve, reject) => {
        ffmpeg()
          .input(audioListPath)
          .inputOptions(['-f', 'concat', '-safe', '0'])
          .audioCodec('libmp3lame')
          .audioBitrate('128k')
          .on('end', () => resolve())
          .on('error', reject)
          .save(combinedAudioPath);
      });

      // Mux video + audio
      await new Promise<void>((resolve, reject) => {
        ffmpeg()
          .input(videoOnlyPath)
          .input(combinedAudioPath)
          .outputOptions([
            '-c:v', 'copy',
            '-c:a', 'aac',
            '-b:a', '128k',
            '-shortest',
            '-movflags', '+faststart',
          ])
          .on('end', () => resolve())
          .on('error', reject)
          .save(outputPath);
      });
    } else {
      // No audio segments at all — rename video-only to output
      const { renameSync } = await import('fs');
      renameSync(videoOnlyPath, outputPath);
    }

    const videoBuffer = readFileSync(outputPath);
    const s3Key = `renders/${userId}/${projectId}.mp4`;
    const publicUrl = await uploadToS3(s3Key, videoBuffer, 'video/mp4');

    await webhook({ type: 'render_video', projectId, userId, status: 'done', url: publicUrl });

    rmSync(tmpDir, { recursive: true, force: true });
  } catch (e: any) {
    console.error('Render error:', e.message);
    await webhook({ type: 'render_video', projectId, userId, status: 'failed', error: e.message });
    rmSync(tmpDir, { recursive: true, force: true });
  }
}

const worker = new Worker(
  'render',
  async (job) => {
    console.log(`Rendering job ${job.id}: ${job.name}`);
    if (job.name === 'render_video') {
      return renderProject(job);
    }
  },
  { connection: redis, concurrency: 1 }
);

worker.on('completed', (job) => console.log(`Render job ${job.id} completed`));
worker.on('failed', (job, err) => console.error(`Render job ${job?.id} failed:`, err.message));

console.log('Render Engine started');
