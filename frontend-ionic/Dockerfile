FROM node:24-slim AS build
WORKDIR /app
COPY package.json .
ENV PUPPETEER_SKIP_DOWNLOAD='true'
RUN npm install npm -g
RUN npm cache clear --force
RUN npm install @angular/cli -g
RUN npm install @ionic/cli -g
RUN npm install
COPY . .
RUN ionic build --prod

FROM nginxinc/nginx-unprivileged:stable-alpine-slim AS production
COPY --from=build app/www/ /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/nginx.conf