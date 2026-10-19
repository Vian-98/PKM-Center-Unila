FROM node:22-alpine

WORKDIR /app

# Pin versi agar hasil build reproducible di local maupun server
RUN npm install -g 9router@0.5.104

COPY provision-key.js /app/

EXPOSE 20128

CMD ["9router", "--host", "0.0.0.0", "--port", "20128", "--no-browser", "--skip-update"]
