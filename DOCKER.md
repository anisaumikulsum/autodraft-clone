# Docker Compose Setup

Jalankan seluruh stack Autodraft Clone dengan 1 command.

## Prerequisites

- Docker Engine 24+
- Docker Compose v2+

### Install Docker (Ubuntu)

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker
```

## Quick Start

```bash
cd autodraft-clone
docker-compose up --build
```

Tunggu semua service healthy (sekitar 30-60 detik pertama kali).

## Services

| Service | Port | Deskripsi |
|---------|------|-----------|
| Frontend | `http://localhost:3000` | React dev server |
| Backend API | `http://localhost:4000` | Express + Prisma |
| Minio Console | `http://localhost:9001` | Object storage UI (login: minioadmin / minioadmin) |
| Minio API | `http://localhost:9000` | S3-compatible API |
| PostgreSQL | `5432` | Database |
| Redis | `6379` | Queue & cache |

## Per-Command Reference

```bash
# Build ulang semua image
docker-compose up --build

# Background mode
docker-compose up -d

# Lihat log
docker-compose logs -f backend
docker-compose logs -f render-engine

# Restart service tertentu
docker-compose restart backend

# Hapus semua data (hati-hati!)
docker-compose down -v
```

## Environment Variables

Salin `.env` dari contoh di bawah atau biarkan Docker Compose pakai default dev values.

```bash
# Opsional: bikin .env di root project
OPENAI_KEY=sk-your-key
REPLICATE_TOKEN=r8-your-token
ELEVENLABS_KEY=your-key
STRIPE_SECRET=sk_test_your-key
```

Docker Compose otomatis inject variabel dari `.env` file ke container.

## Troubleshooting

**Backend stuck di "prisma db push"**
- Pastikan PostgreSQL sudah healthy: `docker-compose ps`
- Kalau schema udah beda, hapus volume: `docker-compose down -v` lalu `up --build`

**Render engine error "canvas"**
- Render engine Dockerfile udah install semua native deps. Kalau masih error, rebuild image: `docker-compose build --no-cache render-engine`

**Frontend gak bisa akses backend**
- Cek `VITE_API_URL` di frontend environment. Default `http://localhost:4000` — harusnya work untuk local browser.
