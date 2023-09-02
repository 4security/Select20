FROM composer:lts as build
COPY . /app/
RUN composer install --no-dev --optimize-autoloader --no-interaction

FROM php:8.2-alpine3.17

ADD https://github.com/mlocati/docker-php-extension-installer/releases/latest/download/install-php-extensions /usr/local/bin/

RUN apk add --no-cache \
    bash \
    curl \
    freetype-dev \
    g++ \
    gcc \
    git \
    icu-dev \
    icu-libs \
    libc-dev \
    libzip-dev \
    make \
    mysql-client \
    nodejs \
    npm \
    oniguruma-dev \
    yarn \
    openssh-client \
    postgresql-libs \
    rsync \
    zlib-dev

RUN chmod +x /usr/local/bin/install-php-extensions && \
    install-php-extensions \
    @composer \
    redis-stable \
    imagick-stable \
    xdebug-stable \
    bcmath \
    calendar \
    exif \
    gd \
    intl \
    pdo_mysql \
    pdo_pgsql \
    pcntl \
    soap \
    zip

ENV PATH ./vendor/bin:/composer/vendor/bin:/root/.composer/vendor/bin:/usr/local/bin:$PATH

ENV APP_ENV=production
ENV APP_DEBUG=false

RUN docker-php-ext-configure opcache --enable-opcache && \
    docker-php-ext-install pdo pdo_mysql
COPY --from=build /app /var/www/html


RUN chmod 777 -R /var/www/html/storage/ && \
    chown -R www-data:www-data /var/www/ 
USER www-data
CMD php /var/www/html/artisan optimize &&  php /var/www/html/artisan route:clear &&  php /var/www/html/artisan route:cache &&  php /var/www/html/artisan config:clear &&  php /var/www/html/artisan config:cache && php /var/www/html/artisan serve --host=0.0.0.0 --port=8001