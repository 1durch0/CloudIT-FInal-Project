FROM node:24-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY gallery-service.js ./

USER node

EXPOSE 3001

CMD ["npm", "start"]
