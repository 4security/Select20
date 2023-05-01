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
                    image 'satantime/puppeteer-node:19-buster-slim'
                }
            }

            stages {
                stage('Install NPM Dep') {
                    steps {
                        dir('frontend-ionic') {
                            sh 'npm install -f'
                            sh 'export PUPPETEER_DOWNLOAD_HOST=https://npm.taobao.org/mirrors/'
                            sh 'npm install -g @angular/cli'
                            sh 'npm i puppeteer --unsafe-perms -f'
                            sh 'node node_modules/puppeteer/install.js'
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
