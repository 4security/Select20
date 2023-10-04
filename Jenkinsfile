pipeline {
    environment {
        registry = 's20'
        registryCredential = '977ae189-bf38-4b7c-a7c4-ccc5f6111858'
        dockerImage = ''
    }

    agent {
        docker {
            image 'laravelphp/vapor:php82'
        }
    }

    stages {
        stage('Backend') {
            agent {
                docker {
                    image 'laravelphp/vapor:php82'
                }
            }
            stages {
                stage('Composer Install') {
                    steps {
                        dir('backend-laravel') {
                            sh 'php composer install --prefer-dist --no-dev --optimize-autoloader --no-interaction'
                        }
                    }
                }

                stage('Build Laravel Docker') {
                    steps {
                        dir('backend-laravel') {
                            script {
                                dockerImage = docker.build 's20api:nightly'
                            }
                        }
                    }
                }

                stage('Push Laravel Docker') {
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
                    image 'satantime/puppeteer-node:20-buster-slim'
                }
            }

            stages {
                stage('Install NPM Dep') {
                    steps {
                        dir('frontend-ionic') {
                            sh 'npm install -f'
                            sh 'npm install -g @angular/cli'
                        }
                    }
                }

                stage('Run Tests') {
                    steps {
                        dir('frontend-ionic') {
                            sh 'ng test'
                        }
                    }
                }

                stage('Modify Env') {
                    steps {
                        dir('frontend-ionic') {
                            sh 'cp src/app/config.prod.ts src/app/config.ts'
                        }
                    }
                }

                stage('Build Ionic Docker') {
                    steps {
                        dir('frontend-ionic') {
                            script {
                                dockerImage = docker.build 's20:nightly'
                            }
                        }
                    }
                }

                stage('Push Ionic Docker') {
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
