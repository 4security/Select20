FROM composer:2.5.8 as build
COPY . /app/
RUN composer install --prefer-dist --no-dev --optimize-autoloader --no-interaction

FROM php:8.2-fpm as production

ENV APP_ENV=production
ENV APP_DEBUG=false

RUN docker-php-ext-configure opcache --enable-opcache && \
    docker-php-ext-install pdo pdo_mysql
COPY --from=build /app /var/www/html


RUN chmod 777 -R /var/www/html/storage/ && \
    chown -R www-data:www-data /var/www/ 
USER www-data
CMD php /var/www/html/artisan optimize &&  php /var/www/html/artisan route:clear &&  php /var/www/html/artisan route:cache &&  php /var/www/html/artisan config:clear &&  php /var/www/html/artisan config:cache && php /var/www/html/artisan serve --host=0.0.0.0 --port=8001