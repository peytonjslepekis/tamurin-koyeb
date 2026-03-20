FROM node:18-alpine

WORKDIR /app

# Install server deps
COPY server/package.json ./server/
RUN cd server && npm install

# Build client
COPY client/package.json ./client/
RUN cd client && npm install
COPY client/ ./client/
RUN cd client && npm run build

# Copy server code
COPY server/ ./server/

EXPOSE 3001
CMD ["node", "server/index.js"]
