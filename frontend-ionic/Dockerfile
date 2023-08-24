FROM node:20-slim AS build
WORKDIR /app
COPY package.json .
ENV PUPPETEER_SKIP_DOWNLOAD='true'
RUN npm install npm@9.5.0 -g
RUN npm install @angular/cli -g
RUN npm install @ionic/cli -g
RUN npm install -f 
COPY . .
RUN ionic build --prod

FROM nginxinc/nginx-unprivileged:stable-alpine-slim AS production
COPY --from=build app/www/ /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/nginx.conf