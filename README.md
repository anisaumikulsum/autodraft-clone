# Autodraft Clone MVP

AI Animation Maker — Generate characters, backgrounds, voiceovers, and render videos from text scripts.

## Architecture

- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Express + Prisma + PostgreSQL
- **Queue**: BullMQ + Redis
- **Storage**: Minio (S3-compatible)
- **AI APIs**: Replicate (SDXL), ElevenLabs (TTS), OpenAI (script breakdown)
- **Payments**: Stripe
- **Render**: FFmpeg + Node Canvas

## Quick Start

### 1. Environment

Copy `.env` and fill in your API keys:

```bash
cp .env.example .env
# Edit .env and add:
# OPENAI_KEY=
# REPLICATE_TOKEN=
# ELEVENLABS_KEY=
# STRIPE_SECRET=
# STRIPE_WEBHOOK_SECRET=
```

### 2. Docker Compose

```bash
docker-compose up -d
```

Services:
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- Minio Console: http://localhost:9001 (autodraft / autodraft_pass)
- PostgreSQL: localhost:5432
- Redis: localhost:6379

### 3. Prisma Setup (first run)

```bash
docker-compose exec backend npx prisma migrate dev --name init
```

### 4. Manual Dev (without Docker)

Requires Node 20+, PostgreSQL, Redis running locally.

```bash
# Backend
cd backend
npm install
npx prisma migrate dev
npm run dev

# Frontend
cd frontend
npm install
npm run dev

# AI Worker
cd ai-worker
npm install
npm run dev

# Render Engine
cd render-engine
npm install
npm run dev
```

## Credit System

| Action | Cost |
|--------|------|
| Generate character | 5 credits |
| Generate background | 3 credits |
| Generate voiceover | 2 credits |
| Script breakdown | 1 credit |
| Render video | 10 credits |

Free tier: 100 credits/month.

## API Keys Required

1. **Replicate** — https://replicate.com (for SDXL image generation)
2. **ElevenLabs** — https://elevenlabs.io (for text-to-speech)
3. **OpenAI** — https://platform.openai.com (for script breakdown)
4. **Stripe** — https://stripe.com (for subscriptions)

## Production Notes

- Change `JWT_SECRET` and `STRIPE_WEBHOOK_SECRET`
- Use AWS S3 instead of Minio for production storage
- Run PostgreSQL and Redis on managed services (RDS, ElastiCache)
- Add CloudFront or CDN for asset delivery
