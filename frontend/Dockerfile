FROM node:22-alpine AS dependencies
WORKDIR /app
COPY package.json ./
RUN npm install

FROM dependencies AS development
WORKDIR /app
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev"]
