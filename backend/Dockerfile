FROM node:20-alpine AS base
WORKDIR /app

# Dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Source
COPY src/ ./src/

# Create logs directory
RUN mkdir -p logs

# Non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodeuser -u 1001
USER nodeuser

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s \
  CMD node -e "require('http').get('http://localhost:5000/api/v1/health',(r)=>{process.exit(r.statusCode===200?0:1)})" || exit 1

CMD ["node", "src/server.js"]
