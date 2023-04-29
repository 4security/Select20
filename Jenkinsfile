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
                        dir('backend-laravel') {
                            sh 'composer clearcache'
                            sh 'rm -rf vendor/*'
                            sh 'composer install  --ignore-platform-reqs'
                            sh 'cp .env.example .env'
                            sh 'php artisan key:generate'
                            sh 'php artisan jwt:secret'
                        }
                    }
                }
                stage('Build Docker') {
                    steps {
                        dir('backend-laravel') {
                            script {
                                dockerImage = docker.build registry + ':nightly'
                            }
                        }
                    }
                }
                stage('Push') {
                    steps {
                        dir('backend-laravel') {
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

        stage('Frontend') {
            agent {
                    docker {
                            image 'satantime/puppeteer-node:latest'
                            label 'node'
                    }
            }
            stages {
                stage('Restore Frontend') {
                    dir('frontend-ionic') {
                        steps {
                            sh 'npm install -f'
                        }
                    }
                }

                stage('Build NPM') {
                    dir('frontend-ionic') {
                        steps {
                            sh 'npm install -g @ionic/cli && ionic build --prod'
                        }
                    }
                }

                stage('Test') {
                    dir('frontend-ionic') {
                        steps {
                            sh 'npm install -g @angular/cli && npm i -D puppeteer && npm install && node node_modules/puppeteer/install.js && ng test'
                        }
                    }
                }

                stage('Build Docker') {
                    steps {
                        dir('frontend-ionic') {
                            script {
                                dockerImage = docker.build registry + ':nightly'
                            }
                        }
                    }
                }
                stage('Push') {
                    steps {
                        script {
                            dir('frontend-ionic') {
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
}
