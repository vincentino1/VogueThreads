properties([
    pipelineTriggers([
        [
            $class: 'GenericTrigger',
            token: 'MY_GEN_TOKEN',
            printContributedVariables: true,
            genericVariables: [
                [key: 'ref', value: '$.ref'],
                [key: 'repo_name', value: '$.repository.name']
            ],
            regexpFilterText: '$repo_name:$ref',
            regexpFilterExpression: '^.+:refs/heads/main$'
        ]
    ])
])

pipeline {
    agent any

    tools {
        nodejs 'node20'
    }

    environment {
        GIT_CREDENTIALS = 'github-creds'
        GIT_BRANCH_URL  = 'https://github.com/vincentino1/frontend.git'

        DOCKER_REPO_PUSH      = 'myapp-docker-hosted'
        DOCKER_REPO_PULL      = 'myapp-docker-group'
        DOCKER_CREDENTIALS_ID = 'docker-registry-creds'
    }

    stages {

        stage('Clean Workspace') {
            steps {
                cleanWs()
            }
        }

        stage('Checkout') {
            steps {
                script {
                    if (!env.ref) {
                        error "Webhook did not provide 'ref'."
                    }

                    env.branchName = env.ref.replace('refs/heads/', '')
                    echo "Checking out branch: ${env.branchName}"
                }

                git(
                    branch: env.branchName,
                    credentialsId: env.GIT_CREDENTIALS,
                    url: env.GIT_BRANCH_URL
                )
            }
        }

        stage('Install Dependencies') {
            steps {
                dir('angular-app') {
                    withNPM(npmrcConfig: 'my-custom-npmrc') {
                        sh 'npm ci'
                        sh 'npm whoami'
                    }
                }
            }
            post {
                always {
                    dir('angular-app') {
                        sh 'rm -f .npmrc'
                    }
                }
            }
        }

        // stage('Unit Tests') { 
            // steps { 
                // dir('angular-app') {
                    // sh 'npm run test:ci' 
                    // } 
            // }
        // }
    
        stage('Build Angular App') {
            steps {
                dir('angular-app') {
                    sh 'npm run build'
                }
            }
        }

        stage('NPM Publish') {
            when {
                expression { env.branchName == 'main' }
            }
            steps {
                dir('angular-app') {
                    script {
                        def pkg = readJSON file: 'package.json'

                        if (pkg.private) {
                            echo "Package is private — skipping npm publish."
                        } else {
                            withNPM(npmrcConfig: 'my-custom-npmrc') {
                                sh 'npm publish --registry https://repo.vinny-dev.com/repository/myapp-npm-hosted/'
                            }
                        }
                    }
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                dir('angular-app') {
                    script {
                        def pkg = readJSON file: 'package.json'
                        def appName = pkg.name
                        def appVersion = pkg.version

                        env.IMAGE_NAME = "${env.NEXUS_URL}/${env.DOCKER_REPO_PUSH}/${appName}:v${appVersion}-${env.BUILD_NUMBER}"

                        docker.withRegistry("https://${env.NEXUS_URL}", env.DOCKER_CREDENTIALS_ID) {
                            docker.build(
                                env.IMAGE_NAME,
                                "--build-arg DOCKER_PRIVATE_REPO=${env.NEXUS_URL}/${env.DOCKER_REPO_PULL} ."
                            )
                        }

                        echo "Built image: ${env.IMAGE_NAME}"
                    }
                }
            }
        }

        stage('Push Docker Image') {
            when {
                expression { env.branchName == 'main' }
            }
            steps {
                script {
                    docker.withRegistry("https://${env.NEXUS_URL}", env.DOCKER_CREDENTIALS_ID) {
                        docker.image(env.IMAGE_NAME).push()
                        docker.image(env.IMAGE_NAME).push('latest')
                    }

                    echo "Pushed image: ${env.IMAGE_NAME}"
                }
            }
        }
    }

    post {
        always {
            script {
                if (env.IMAGE_NAME) {
                    sh """
                        docker image inspect ${env.IMAGE_NAME} > /dev/null 2>&1 && \
                        docker rmi ${env.IMAGE_NAME} || true
                    """
                }
            }
        }

        success {
            echo 'Pipeline completed successfully.'
        }

        failure {
            echo 'Pipeline failed.'
        }
    }
}
