FROM node:24-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY src/ ./src/

VOLUME /app/data
EXPOSE 8793

ENV NODE_ENV=production
ENV PORT=8793

CMD ["node", "src/index.js"]
