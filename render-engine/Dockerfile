FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
RUN npm install -g tsx
COPY . .

CMD ["npx", "tsx", "src/render.ts"]
