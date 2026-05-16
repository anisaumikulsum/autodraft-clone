# Deploy Autodraft Clone ke VPS - Step by Step

## Prerequisites
- VPS dengan OS Ubuntu 22.04 atau 24.04 (2GB+ RAM direkomendasikan)
- Domain yang sudah pointing ke IP VPS (A record)
- Akses SSH ke VPS

---

## Step 1: Login ke VPS via SSH

```bash
ssh root@IP_VPS_ANDA
# atau kalau pakai user biasa:
ssh ubuntu@IP_VPS_ANDA
```

---

## Step 2: Update Sistem & Install Docker

```bash
# Update package list
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh

# Tambah user ke docker group
sudo usermod -aG docker $USER

# Install docker-compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verifikasi
docker --version
docker-compose --version

# Re-login agar group docker aktif
exit
# Login ulang via SSH
```

---

## Step 3: Clone Repository

```bash
cd ~
git clone https://github.com/anisaumikulsum/autodraft-clone.git
cd autodraft-clone
```

---

## Step 4: Setup Environment Variables

```bash
cp .env.example .env
nano .env
```

**Isi file .env dengan nilai real:**

```env
# Database (jangan ubah kalau pakai docker-compose default)
DATABASE_URL=postgresql://autodraft:autodraft_pass@db:5432/autodraft

# Redis (jangan ubah)
REDIS_URL=redis://redis:6379

# MinIO (jangan ubah)
S3_ENDPOINT=http://minio:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=autodraft-assets

# JWT - WAJIB ganti! Generate random string
JWT_SECRET=ganti_dengan_random_string_panjang_32_karakter
JWT_EXPIRES_IN=7d

# Ganti dengan domain Anda
FRONTEND_URL=https://domainanda.com
API_URL=http://backend:4000

# Webhooks
AI_WEBHOOK_URL=http://backend:4000/webhooks/ai
RENDER_WEBHOOK_URL=http://backend:4000/webhooks/render

# === API KEYS - WAJIB isi yang real ===
# OpenAI (Script Breakdown)
OPENAI_KEY=sk-ganti_dengan_key_real_anda
OPENAI_MODEL=gpt-4o-mini

# Replicate (Character Sprite Generation)
REPLICATE_TOKEN=r8_ganti_dengan_token_real_anda
REPLICATE_MODEL=stability-ai/sdxl

# ElevenLabs (Voiceover)
ELEVENLABS_KEY=ganti_dengan_key_real_anda
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM

# Stripe (Opsional - untuk billing)
STRIPE_SECRET=sk_test_ganti
STRIPE_WEBHOOK_SECRET=whsec_ganti
STRIPE_PRICE_PRO_MONTHLY=price_ganti
STRIPE_PRICE_PRO_YEARLY=price_ganti

# Feature flags
ENABLE_FREE_GENERATION=true
FREE_DAILY_LIMIT=5
FREE_WATERMARK=true
```

**Simpan:** `Ctrl+O`, `Enter`, `Ctrl+X`

---

## Step 5: Deploy dengan Docker Compose

```bash
cd ~/autodraft-clone

# Pull image terbaru
sudo docker-compose pull

# Build dan jalankan semua container
sudo docker-compose up --build -d

# Tunggu 30 detik agar database siap
sleep 30

# Jalankan migrasi database
sudo docker-compose exec backend npx prisma migrate deploy

# Seed database (buat user test)
sudo docker-compose exec backend npx tsx seed.ts
```

---

## Step 6: Verifikasi Deployment

```bash
# Cek container yang berjalan
sudo docker-compose ps

# Cek log backend
sudo docker-compose logs -f backend

# Cek log frontend
sudo docker-compose logs -f frontend
```

**Akses aplikasi:**
- Frontend: `http://IP_VPS:3000`
- Backend API: `http://IP_VPS:4000`
- MinIO Console: `http://IP_VPS:9001` (login: minioadmin / minioadmin)

---

## Step 7: Setup Domain & SSL (HTTPS)

### Install Nginx sebagai Reverse Proxy

```bash
sudo apt install nginx certbot python3-certbot-nginx -y
```

### Buat Konfigurasi Nginx

```bash
sudo nano /etc/nginx/sites-available/autodraft
```

**Isi dengan:**

```nginx
server {
    listen 80;
    server_name domainanda.com www.domainanda.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /api/ {
        proxy_pass http://localhost:4000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
# Aktifkan konfigurasi
sudo ln -s /etc/nginx/sites-available/autodraft /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Dapatkan SSL gratis dari Let's Encrypt
sudo certbot --nginx -d domainanda.com -d www.domainanda.com

# Auto renew SSL
sudo systemctl enable certbot.timer
```

---

## Step 8: Update Environment untuk Production

Setelah SSL aktif, edit `.env` lagi:

```bash
nano ~/autodraft-clone/.env
```

Ubah:
```env
FRONTEND_URL=https://domainanda.com
S3_ENDPOINT=https://domainanda.com:9000  # atau pakai Cloudflare R2 untuk production
```

Restart container:
```bash
cd ~/autodraft-clone
sudo docker-compose down
sudo docker-compose up -d
```

---

## Troubleshooting

### Error: Port sudah digunakan
```bash
# Cek port yang dipakai
sudo ss -tlnp | grep -E "3000|4000|9000|5432|6379"

# Kill service yang pakai port tersebut
sudo systemctl stop apache2  # kalau ada apache
sudo pkill -f node  # hati-hati, ini kill semua node process
```

### Error: Database connection failed
```bash
# Cek log database
sudo docker-compose logs db

# Restart semua container
sudo docker-compose down
sudo docker-compose up -d
sleep 30
sudo docker-compose exec backend npx prisma migrate deploy
```

### Error: Out of memory saat render
```bash
# Tambah swap (kalau VPS RAM kecil)
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### Update Aplikasi
```bash
cd ~/autodraft-clone
git pull origin main
sudo docker-compose down
sudo docker-compose up --build -d
sleep 30
sudo docker-compose exec backend npx prisma migrate deploy
```

---

## Struktur Service (Docker Compose)

| Service | Port | Fungsi |
|---------|------|--------|
| frontend | 3000 | React app via Nginx |
| backend | 4000 | API Express + Prisma |
| ai-worker | internal | AI generation queue worker |
| render-engine | internal | Video render worker |
| db | 5432 | PostgreSQL database |
| redis | 6379 | Queue + cache |
| minio | 9000/9001 | Object storage (S3-compatible) |

---

## Checkpoint Berhasil Deploy

- [ ] Bisa buka `https://domainanda.com` → Landing page muncul
- [ ] Bisa login dengan akun test
- [ ] Buka dashboard dan project
- [ ] Editor jalan dengan camera controls
- [ ] Bisa render video (kalau API key sudah diisi)

**Kalau stuck di mana pun, screenshot error-nya atau paste log-nya sini, gue bantu debug.**
