FROM node:16.20.0-alpine3.17 AS build
WORKDIR /app
COPY package-lock.json .
COPY package.json .
ENV PUPPETEER_SKIP_DOWNLOAD='true'
RUN npm install npm@latest -g
RUN npm install @angular/cli -g
RUN npm install @ionic/cli -g
RUN npm install -f 
COPY . .
RUN ionic build --prod

FROM nginx:1.23.3-alpine AS production
RUN rm -rf /usr/share/nginx/html/*
COPY --from=build app/www/ /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/nginx.conf 