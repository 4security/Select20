pipeline {
    environment {
        registry = 's20'
        registryCredential = '977ae189-bf38-4b7c-a7c4-ccc5f6111858'
        dockerImage = ''
        ANDROID_HOME = '/usr/local/android-sdk-linux'
        PATH = "/usr/local/android-sdk-linux/platform-tools:${PATH}"
    }

    agent none

    stages {
        stage('Backend') {
            agent {
                docker {
                    image 'bitnami/laravel:latest'
                }
            }
            stages {
                stage('Restore Backend') {
                    steps {
                        sh 'cd backend-laravel && composer clearcache'
                        sh 'cd backend-laravel && rm -rf vendor/*'
                        sh 'cd backend-laravel && composer install  --ignore-platform-reqs'
                        sh 'cd backend-laravel && cp .env.example .env'
                        sh 'cd backend-laravel && php artisan key:generate'
                        sh 'cd backend-laravel && php artisan jwt:secret'
                    }
                }
                stage('Build Docker') {
                    steps {
                        script {
                            dockerImage = docker.build registry + ':nightly'
                        }
                    }
                }
                stage('Push') {
                    steps {
                        script {
                            docker.withRegistry( 'https://register.lan', registryCredential ) {
                                dockerImage.push()
                            }
                        }
                    }
                }
            }
        }

        stage('Frontend') {
            agent {
                    docker {
                            image 'satantime/puppeteer-node:latest'
                            label 'node'
                    }
            }
            stages {
                stage('Restore Frontend') {
                    steps {
                        sh '''
                            # change script mode from debugging to command logging
                            set +x -v
                            cd frontend-ionic/
                            npm install -f
                        '''
                    }
                }

                stage('Build NPM') {
                    steps {
                        sh 'npm install -g @ionic/cli && ionic build --prod'
                    }
                }

                stage('Test') {
                    steps {
                        sh 'npm install -g @angular/cli && npm i -D puppeteer && npm install && node node_modules/puppeteer/install.js && ng test'
                    }
                }

                stage('Build Docker') {
                    steps {
                        script {
                            dockerImage = docker.build registry + ':nightly'
                        }
                    }
                }
                stage('Push') {
                    steps {
                        script {
                            docker.withRegistry( 'https://register.lan', registryCredential ) {
                                dockerImage.push()
                            }
                        }
                    }
                }
            }
        }
    }
}
