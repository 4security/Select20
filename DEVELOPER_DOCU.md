# Intro

Select20 is based on the [SabreAPI](https://sabre.io/dav/building-a-caldav-client/) of a [Nextcloud](https://docs.nextcloud.com/) instances. It uses the [ICAL-Format](https://www.ietf.org/rfc/rfc2445.txt) todos and events. The backend uses [Laravel](https://laravel.com/docs/10.x/readme), a PHP framework, and as a frontend [Ionic](https://ionicframework.com/docs), a hybrid development platform based on [Angular](https://angular.io/docs) which can compile Android, iOS and web apps.

## Installation - Quick Startup Guide Development

Select20 based on Ionic (NPM) + Laravel (PHP) + MySQL (Database). The following guide is tested on Ubuntu 22.04.

**Requirement: Nextcloud instance with API-Key (active calendar and todo app)**

0. You debian based distributions needs some dependencies for Laravel:

```sh
sudo  apt install zip unzip php-zip -y
sudo apt-get install php-dom
echo "deb https://packages.sury.org/php/ $(lsb_release -sc) main" | sudo tee /etc/apt/sources.list.d/sury-php.list
curl -fsSL  https://packages.sury.org/php/apt.gpg| sudo gpg --dearmor -o /etc/apt/trusted.gpg.d/sury-keyring.gpg
sudo apt update
```

1. Checkout project
2. Install dependencies for Laravel:

```sh
sudo apt-get install php8.3 libapache2-mod-php8.3 php8.3-common php8.3-gd php8.3-mysql php8.3-curl php8.3-intl php8.3-xsl php8.3-mbstring php8.3-zip php8.3-bcmath php8.3-soap php-xdebug php-imagick
wget -O composer-setup.php https://getcomposer.org/installer
sudo php composer-setup.php --install-dir=/usr/local/bin --filename=composer
cd backend
composer install
```

3. Install NVM, Node, NPM and all the dependencies for Ionic:

```sh
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
source ~/.bashrc
nvm install v19.6.0
npm install npm@latest -g
npm install @angular/cli -g
npm install @ionic/cli -g

cd frontend
npm i -f
```

3. Bootstrap the mysql database and add mysql user

```sql
use laravel;
CREATE USER 'super'@'localhost' IDENTIFIED BY 'Pkjaljfök20234@!';
GRANT ALL ON *.* TO 'super'@'localhost';
FLUSH PRIVILEGES;
```

4. update .env with the database passwords
5. Reload backend

```sh
php artisan migrate
php artisan jwt:secret
php artisan key:generate
```

6. Run for laravel (only for development) - starts on http://localhost:8000/

```sh
cd backend
php artisan serve
```

7. Run Ionic - starts at http://localhost:8100/

```sh
cd frontend
ionic serve
```

Verify that you using the correct chain of ports

- /backend-laravel/.env --> Connection backend - MariaDB
- /frontend-ionic/src/app/config.ts --> Connection backend - fronted

### Helpful commands

Run ionic locally:

```sh
ionic serve
```

Run Ionic on remote server on other port

```sh
ng run app:serve  --public-host=httpfake://0.0.0.0:0/ --host=0.0.0.0  --port=12341 --disable-host-check
```

Start Laravel on local host

```sh
php artisan serve
```

Start Laravel on a remote server:

```sh
php artisan optimize &&  php artisan route:clear &&  php artisan route:cache &&  php artisan config:clear &&  php artisan config:cache && php artisan serve --host=192.168.178.XX --port=8001
```

Look for Swagger / API docu - work in progress:

http://localhost:8001/api/documentation#/auth
Show routes:

```sh
php artisan route:list
```

Scan for vulnerabilities:

```sh
php composer.phar  global require enlightn/security-checker --ignore-platform-reqs
php artisan security:check
```

Scan with enlightn:

```sh
php artisan enlightn
```

https://www.laravel-enlightn.com/docs/getting-started/usage.html

## Manual Deployment

### On Web Server

```sh
ionic build --prod -- --base-href https://yourdomainyourdomain

```

Copy the www folder to your web server

### On Android Phone

```sh
ionic build --prod && npx cap copy && npx cap sync
```

1. In Android Studio select **Build** -> **Clean Project**
2. https://ionicframework.com/docs/developing/android -
   Open Android Studio and run the app on your phone.

# Backend

## Controllers

- AuthController: Everything goes via middleware auth:api. Use bcrypt function for hashing passwords
- Project & TodoController: Uses the XML request of the SabreAPI and adapt the requests

## Models

- History: Every action is recorded for further analysis in a habit tracker (pre alpha)

# Frontend

## Central Ideas

- **Sync**: Uses the IndexDB to store todos offline. The todos are instantly loaded from Ionic Storage (IndexDB) on page load. Then the sync starts and fetches the data from the nextcloud instance and replaces the todos on the fly. During Offline Mode, all todos are saved in queue (QueueItem) and they are synced when the device gets online again.
- **Parsing of Nextcloud todos**: The app receives a XML from the instances. It filters the old ones and parses each todo a new json format (todo.ts)
- **Resolving nextcloud API**: The app submits and parses nextcloud todos in parallel to reduce the load time. The sync services changes the status from `running -> resolved` if all todos are parsed. The sync uses polling between the home page and the sync service. Please, provide a better way of code if you have a better idea.
- **Recurring todos**: the rrule.service.ts manages the recurring rules. The ical-format is limited so I added to the description the appendix `;NEXTEVENT=`. The next date is calculated based on the time it is done. Look in the documentation date-fns to understand it better.
- **Regex**: The projects uses a bunch of regular expressions in regex.service.ts to parse the todos. Add more tests if you want to change or add new functions and expressions. Currently the software accepts dates in the date format date.month.year or date.month
- **Checklist**: The sub todos are only hiding visually if you start a todo with `*`. There is no interaction with the backend. On the next refresh the checklist is reseted.

# Known Issues / Open Tasks

- Add Swagger documentation
- Add useful tests to the backend
-
