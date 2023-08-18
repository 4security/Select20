FROM node:20-slim AS build
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app
COPY pnpm-lock.yaml .
COPY package.json .
ENV PUPPETEER_SKIP_DOWNLOAD='true'
RUN pnpm install --prod --frozen-lockfile
RUN pnpm install --save-dev @angular-devkit/build-angular
RUN pnpm install @angular/cli -g
RUN pnpm install @ionic/cli -g
COPY . .
RUN ionic build --prod

FROM nginxinc/nginx-unprivileged:stable-alpine-slim AS production
COPY --from=build app/www/ /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/nginx.conf