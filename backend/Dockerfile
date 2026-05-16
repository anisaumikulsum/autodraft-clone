FROM node:20-alpine

WORKDIR /app

# Install dependencies first for layer caching
COPY package*.json ./
RUN npm ci --only=production

# Install tsx for running TS directly
RUN npm install -g tsx

# Copy prisma schema first (needed for generate)
COPY prisma ./prisma/
RUN npx prisma generate

# Copy source
COPY . .

EXPOSE 4000

CMD ["npx", "tsx", "src/server.ts"]
