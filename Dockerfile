FROM node:26-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev --no-audit --no-fund
COPY src ./src
ENV NODE_ENV=production PORT=7000
EXPOSE 7000
CMD ["npm", "start"]
