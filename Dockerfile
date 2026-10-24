FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY src ./src
COPY db ./db
RUN mkdir -p uploads data
ENV NODE_ENV=production
EXPOSE 3030
CMD ["node", "src/server.js"]
