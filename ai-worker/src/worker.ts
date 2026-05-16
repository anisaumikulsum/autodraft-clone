import { Worker } from 'bullmq';
import { Redis } from 'ioredis';
import axios from 'axios';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

 dotenv.config();

 const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', { maxRetriesPerRequest: null });

 const s3 = new S3Client({
   endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
   region: 'us-east-1',
   credentials: {
     accessKeyId: process.env.S3_ACCESS_KEY || 'autodraft',
     secretAccessKey: process.env.S3_SECRET_KEY || 'autodraft_pass',
   },
   forcePathStyle: true,
 });

 const BUCKET = process.env.S3_BUCKET || 'autodraft-assets';
 const REPLICATE_TOKEN = process.env.REPLICATE_TOKEN || '';
 const OPENAI_KEY = process.env.OPENAI_KEY || '';
 const ELEVENLABS_KEY = process.env.ELEVENLABS_KEY || '';
 const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http://localhost:4000/webhooks/ai';

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

 // ── Replicate helpers ──
 const SDXL_VERSION = '39ed52f2a78e934b3ba6e2a89de1373d13f2c514922eb5623f9e7e0d7cb9a233';

 async function replicatePredict(input: any) {
   const res = await axios.post(
     'https://api.replicate.com/v1/predictions',
     { version: SDXL_VERSION, input },
     { headers: { Authorization: `Bearer ${REPLICATE_TOKEN}`, 'Content-Type': 'application/json' } }
   );
   return res.data;
 }

 async function pollReplicate(id: string) {
   let attempts = 0;
   while (attempts < 60) {
     const poll = await axios.get(`https://api.replicate.com/v1/predictions/${id}`, {
       headers: { Authorization: `Bearer ${REPLICATE_TOKEN}` },
     });
     const result = poll.data;
     if (result.status === 'succeeded' || result.status === 'failed') return result;
     await new Promise(r => setTimeout(r, 2000));
     attempts++;
   }
   throw new Error('Timeout waiting for Replicate');
 }

 async function generatePose(prompt: string, width = 512, height = 768, image?: string) {
   const input: any = {
     prompt,
     width,
     height,
     num_outputs: 1,
     negative_prompt: 'blurry, low quality, deformed, extra limbs, bad anatomy',
   };
   if (image) {
     input.image = image;
     input.strength = 0.55;
     input.num_inference_steps = 30;
   }
   const pred = await replicatePredict(input);
   const result = await pollReplicate(pred.id);
   if (result.status === 'succeeded' && result.output?.[0]) {
     const imgRes = await axios.get(result.output[0], { responseType: 'arraybuffer' });
     return Buffer.from(imgRes.data);
   }
   throw new Error(result.error || 'Generation failed');
 }

 // ── Character sprite generation (killer feature) ──
 async function generateCharacter(job: any) {
   const { characterId, userId, name, gender = 'male', prompt } = job.data;
   if (!REPLICATE_TOKEN || REPLICATE_TOKEN === 'dummy' || REPLICATE_TOKEN.length < 20) {
     await webhook({ type: 'character_generate', characterId, userId, status: 'failed', error: 'Replicate API key missing or invalid. Set REPLICATE_TOKEN in backend .env' });
     return;
   }
   try {
     const basePrompt = prompt || `${name}, ${gender === 'female' ? 'female' : 'male'} character, consistent cartoon style, front facing`;
     const style = '2d flat cartoon illustration, clean art style, solid color, white plain background, full body visible, facing camera';

     // 1. Generate idle reference (anchor pose)
     console.log(`[${characterId}] Generating idle reference...`);
     const idleBuffer = await generatePose(`${basePrompt}, idle standing pose, arms relaxed at sides, ${style}`);
     const idleUrl = await uploadToS3(`characters/${userId}/${characterId}/idle.png`, idleBuffer, 'image/png');

     // Use idle image as img2img reference for consistency
     const posePrompts: Record<string, string> = {
       walk_1: `${basePrompt}, walking pose left leg stepping forward, slight arm swing, ${style}`,
       walk_2: `${basePrompt}, walking pose right leg stepping forward, opposite arm swing, ${style}`,
       sit: `${basePrompt}, sitting pose on a chair or ground, legs bent, ${style}`,
       talk: `${basePrompt}, talking pose mouth slightly open, one hand gesturing, ${style}`,
       happy: `${basePrompt}, happy cheerful pose arms slightly raised, big smile, ${style}`,
       sad: `${basePrompt}, sad pose head slightly down, shoulders slumped, ${style}`,
       angry: `${basePrompt}, angry pose arms crossed or fist clenched, stern expression, ${style}`,
     };

     const spriteSet: Record<string, string> = { idle: idleUrl };

     // Generate remaining poses using idle as reference for consistency
     for (const [poseKey, posePrompt] of Object.entries(posePrompts)) {
       console.log(`[${characterId}] Generating ${poseKey}...`);
       try {
         const buf = await generatePose(posePrompt, 512, 768, idleUrl);
         const url = await uploadToS3(`characters/${userId}/${characterId}/${poseKey}.png`, buf, 'image/png');
         spriteSet[poseKey] = url;
       } catch (e: any) {
         console.error(`Failed ${poseKey}:`, e.message);
         spriteSet[poseKey] = idleUrl; // fallback
       }
     }

     // Face crop reference (for existing faceImageUrl compatibility)
     // We reuse idle as faceImageUrl
     await webhook({
       type: 'character_generate',
       characterId,
       userId,
       status: 'done',
       url: idleUrl,
       spriteSet,
     });
   } catch (e: any) {
     console.error('Character generation error:', e.message);
     await webhook({ type: 'character_generate', characterId, userId, status: 'failed', error: e.message });
   }
 }

 // Background generation via Replicate
 async function generateBackground(job: any) {
   const { sceneId, userId, prompt } = job.data;
   if (!REPLICATE_TOKEN || REPLICATE_TOKEN === 'dummy' || REPLICATE_TOKEN.length < 20) {
     await webhook({ type: 'background_generate', sceneId, userId, status: 'failed', error: 'Replicate API key missing or invalid' });
     return;
   }
   try {
     const fullPrompt = `${prompt}, 2d cartoon background, wide shot, clean art style, vibrant colors, no characters`;
     const buf = await generatePose(fullPrompt, 1280, 720);
     const s3Key = `backgrounds/${userId}/${sceneId}.png`;
     const publicUrl = await uploadToS3(s3Key, buf, 'image/png');
     await webhook({ type: 'background_generate', sceneId, userId, status: 'done', url: publicUrl });
   } catch (e: any) {
     console.error('Background generation error:', e.message);
     await webhook({ type: 'background_generate', sceneId, userId, status: 'failed', error: e.message });
   }
 }

 // Voice generation via ElevenLabs
 async function generateVoice(job: any) {
   const { sceneId, userId, text, voiceStyle = 'male_1' } = job.data;
   if (!ELEVENLABS_KEY || ELEVENLABS_KEY === 'dummy' || ELEVENLABS_KEY.length < 10) {
     await webhook({ type: 'voice_generate', sceneId, userId, status: 'failed', error: 'ElevenLabs API key missing or invalid' });
     return;
   }
   try {
     const voiceMap: Record<string, string> = {
       male_1: 'pNInz6obpgDQGcFmaJgB',
       female_1: '21m00Tcm4TlvDq8ikWAM',
       male_2: 'ErXwobaYiN019PkySvjV',
       female_2: 'EXAVITQu4vr4xnSDxMaL',
     };
     const voiceId = voiceMap[voiceStyle] || voiceMap.male_1;

     const response = await axios.post(
       `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
       { text, model_id: 'eleven_monolingual_v1', voice_settings: { stability: 0.5, similarity_boost: 0.75 } },
       { headers: { 'xi-api-key': ELEVENLABS_KEY, 'Content-Type': 'application/json' }, responseType: 'arraybuffer' }
     );

     const s3Key = `voices/${userId}/${sceneId}.mp3`;
     const publicUrl = await uploadToS3(s3Key, Buffer.from(response.data), 'audio/mpeg');
     await webhook({ type: 'voice_generate', sceneId, userId, status: 'done', url: publicUrl });
   } catch (e: any) {
     console.error('Voice generation error:', e.message);
     await webhook({ type: 'voice_generate', sceneId, userId, status: 'failed', error: e.message });
   }
 }

 // Script breakdown via OpenAI
 async function breakdownScript(job: any) {
   const { projectId, userId, scriptText } = job.data;
   if (!OPENAI_KEY || OPENAI_KEY === 'dummy' || OPENAI_KEY.length < 10) {
     await webhook({ type: 'script_breakdown', projectId, userId, status: 'failed', error: 'OpenAI API key missing or invalid' });
     return;
   }
   try {
     const response = await axios.post(
       'https://api.openai.com/v1/chat/completions',
       {
         model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
         messages: [
           {
             role: 'system',
             content: `You are an animation script breakdown assistant. Parse the user's script into scenes. Return JSON only: { scenes: [{ setting: string, mood: string, description: string, characters: string[], dialogText: string, durationSec: number }] }. Available moods: neutral, happy, sad, angry, scary, romantic. Available settings: bedroom_day, kitchen_day, living_room_day, classroom, hospital_room, street_day, park_day, park_night, forest_path, beach_day, market, restaurant.`,
           },
           { role: 'user', content: scriptText },
         ],
         response_format: { type: 'json_object' },
       },
       { headers: { Authorization: `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' } }
     );

     const content = response.data.choices[0].message.content;
     const parsed = JSON.parse(content);
     await webhook({ type: 'script_breakdown', projectId, userId, status: 'done', scenes: parsed.scenes });
   } catch (e: any) {
     console.error('Script breakdown error:', e.message);
     await webhook({ type: 'script_breakdown', projectId, userId, status: 'failed', error: e.message });
   }
 }

 // Render video job - forward to render-engine queue
 async function renderVideo(job: any) {
   const { projectId, userId } = job.data;
   await webhook({ type: 'render_video', projectId, userId, status: 'queued' });
 }

 const worker = new Worker(
   'generation',
   async (job) => {
     console.log(`Processing job ${job.id}: ${job.name}`);
     switch (job.name) {
       case 'character_generate':
         return generateCharacter(job);
       case 'background_generate':
         return generateBackground(job);
       case 'voice_generate':
         return generateVoice(job);
       case 'script_breakdown':
         return breakdownScript(job);
       case 'render_video':
         return renderVideo(job);
       default:
         console.log('Unknown job type:', job.name);
     }
   },
   { connection: redis, concurrency: 2 } // lowered to 2 because sprite gen is heavy
 );

 worker.on('completed', (job) => console.log(`Job ${job.id} completed`));
 worker.on('failed', (job, err) => console.error(`Job ${job?.id} failed:`, err.message));

 console.log('AI Worker started (with sprite rigging)');
