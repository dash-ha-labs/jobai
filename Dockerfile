FROM node:22-slim
WORKDIR /app
COPY . .
RUN npm install --include=dev
RUN npm run build
ENV NODE_ENV=production PORT=3000 HOST=0.0.0.0
EXPOSE 3000
CMD ["npm", "run", "start"]