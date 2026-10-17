FROM node:22-alpine

WORKDIR /app

# Install 9router secara global
RUN npm install -g 9router

EXPOSE 20128

# Minta 9router berjalan dalam mode server/foreground dan mengizinkan binding remote
CMD ["9router", "--host", "0.0.0.0", "--port", "20128", "--allow-remote"]