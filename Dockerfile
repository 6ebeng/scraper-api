# Production stage
FROM node:lts-alpine AS production

# Install chrommium and xvfb
RUN apk --update --upgrade add --no-cache chromium xvfb && rm -rf /var/cache/apk/*

RUN Xvfb :10 -ac &
RUN export DISPLAY=:10

WORKDIR /app
COPY package.json ./
RUN yarn install && yarn cache clean
COPY . .
CMD [ "yarn","dev" ]