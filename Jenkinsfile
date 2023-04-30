pipeline {
    environment {
        registry = 's20'
        registryCredential = '977ae189-bf38-4b7c-a7c4-ccc5f6111858'
        dockerImage = ''
    }

    agent {
        docker {
            image 'busybox'
        }
    }

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
                            sh 'ls'
                            sh 'php composer install  --ignore-platform-reqs'
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
                                dockerImage = docker.build 's20api:nightly'
                            }
                        }
                    }
                }
                stage('Push') {
                    steps {
                        dir('backend-laravel') {
                            script {
                                docker.withRegistry('https://register.lan', registryCredential) {
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
                    }
            }
            stages {
                stage('Restore Frontend') {
                    steps {
                        dir('frontend-ionic') {
                            sh "export PUPPETEER_SKIP_DOWNLOAD='true' && npm install"
                        }
                    }
                }

                stage('Build NPM') {
                        steps {
                            dir('frontend-ionic') {
                                sh 'npm install -g @ionic/cli && ionic build --prod'
                            }
                        }
                }

                stage('Test') {
                        steps {
                            dir('frontend-ionic') {
                                sh 'npm install -g @angular/cli && npm install && node node_modules/puppeteer/install.js && ng test'
                            }
                        }
                }

                stage('Build Docker') {
                    steps {
                        dir('frontend-ionic') {
                            script {
                                dockerImage = docker.build 's20:nightly'
                            }
                        }
                    }
                }
                stage('Push') {
                    steps {
                        script {
                            dir('frontend-ionic') {
                                docker.withRegistry('https://register.lan', registryCredential) {
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
