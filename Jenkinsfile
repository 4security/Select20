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
                    image 'composer:2.5.8'
                }
            }
            stages {
                stage('Composer Install') {
                    steps {
                        dir('backend-laravel') {
                            sh 'php composer install  --ignore-platform-reqs'
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
                    image 'node:20'
                }
            }

            stages {
                stage('Install NPM Dep') {
                    steps {
                        dir('frontend-ionic') {
                            sh 'corepack enable'
                            sh 'corepack prepare pnpm@latest-8 --activate'
                            sh 'pnpm install'
                            sh 'pnpm install @angular/cli'
                            sh 'pnpm i -D puppeteer && node node_modules/puppeteer/install.js'
                        }
                    }
                }

                stage('Run Tests') {
                    steps {
                        dir('frontend-ionic') {
                            sh 'npm run-script ng test'
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
