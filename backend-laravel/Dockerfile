FROM composer:lts as build
COPY . /app/
RUN composer install --prefer-dist --no-dev --optimize-autoloader --no-interaction

FROM php:8.4-fpm-alpine

WORKDIR /opt

# Install apk packages we want
RUN apk add -Uuv \
    libzip-dev libpng-dev
# Download and install composer
RUN /bin/sh -c "curl https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer"


# Install PHP extensions

RUN docker-php-ext-install pdo pdo_mysql mysqli opcache pcntl gd bcmath posix zip
ENV APP_ENV=production		
ENV APP_DEBUG=false

COPY --from=build /app /var/www/html

RUN chmod 777 -R /var/www/html/storage/ && \
    chown -R www-data:www-data /var/www/ 
USER www-data
CMD php /var/www/html/artisan optimize &&  php /var/www/html/artisan route:clear &&  php /var/www/html/artisan route:cache &&  php /var/www/html/artisan config:clear &&  php /var/www/html/artisan config:cache && php /var/www/html/artisan serve --host=0.0.0.0 --port=8001