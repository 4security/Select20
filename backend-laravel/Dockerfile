FROM php:8.2-fpm

# setup user as root
USER root

WORKDIR /var/www

# Install environment dependencies
RUN apt-get update \
	# gd
	&& apt-get install -y build-essential  openssl nginx libfreetype6-dev libjpeg-dev libpng-dev libwebp-dev zlib1g-dev libzip-dev gcc g++ make vim unzip curl git jpegoptim optipng pngquant gifsicle locales libonig-dev  \
	&& docker-php-ext-configure gd  \
	&& docker-php-ext-install gd \
	# gmp
	&& apt-get install -y --no-install-recommends libgmp-dev \
	&& docker-php-ext-install gmp \
	# pdo_mysql
	&& docker-php-ext-install pdo_mysql mbstring \
	# pdo
	&& docker-php-ext-install pdo \
	# opcache
	&& docker-php-ext-enable opcache \
	# exif
    && docker-php-ext-install exif \
    && docker-php-ext-install sockets \
    && docker-php-ext-install pcntl \
    && docker-php-ext-install bcmath \
	# zip
	&& docker-php-ext-install zip \
	&& apt-get autoclean -y \
	&& rm -rf /var/lib/apt/lists/* \
	&& rm -rf /tmp/pear/

# Copy files

COPY . /var/www
COPY /app/Http/Controllers/AProjectController.php /var/www/app/Http/Controllers/AProjectController.php
RUN chmod +rwx /var/www
RUN chmod -R 777 /var/www
COPY ./local.ini /usr/local/etc/php/local.ini

COPY ./nginx.conf /etc/nginx/nginx.conf



# setup composer and laravel
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

RUN composer install --working-dir="/var/www"

RUN composer dump-autoload --working-dir="/var/www"

EXPOSE 80

#CMD php artisan optimize &&  php artisan route:clear &&  php artisan route:cache &&  php artisan config:clear &&  php artisan config:cache && php artisan serve --host=0.0.0.0 --port=8001
