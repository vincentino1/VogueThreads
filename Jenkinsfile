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
            // Only trigger on main branch
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
        // Git
        GIT_CREDENTIALS = 'github-creds'
        GIT_BRANCH_URL  = 'https://github.com/vincentino1/frontend.git'

        // Nexus Docker Registry
        DOCKER_REPO_PUSH      = 'myapp-docker-hosted'
        DOCKER_REPO_PULL      = 'myapp-docker-group'
        DOCKER_CREDENTIALS_ID = 'docker-registry-creds'

        // NEXUS_URL is set as Jenkins environment variable
    }

    stages {

        stage('Webhook Debug') {
            steps {
                echo "Branch: ${env.ref}"
                echo "Repo: ${env.repo_name}"
            }
        }

        stage('Clean Workspace') {
            steps {
                echo "Cleaning workspace..."
                cleanWs()
            }
        }

        stage('Checkout') {
            steps {
                script {
                    if (!env.ref) {
                        error "Webhook did not provide 'ref'. Cannot determine branch."
                    }

                    env.branchName = env.ref.replace('refs/heads/', '')
                    echo "Checking out branch: ${env.branchName}"
                }

                git(
                    branch: "${env.branchName}",
                    credentialsId: "${env.GIT_CREDENTIALS}",
                    url: "${env.GIT_BRANCH_URL}"
                )
            }
        }

        stage('Install Dependencies') {
            steps {
                dir('angular-app') {
                    withNPM(npmrcConfig: 'my-custom-npmrc') {
                        echo "Performing npm build..."
                        sh 'npm install'
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
        //     steps {
        //         dir('angular-app') {
        //             sh 'npm run test:ci'
        //         }
        //     }
        // }

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
                                sh 'npm publish'
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
                        def pkg        = readJSON file: 'package.json'
                        def appName    = pkg.name
                        def appVersion = pkg.version

                        env.IMAGE_NAME = "${env.NEXUS_URL}/${env.DOCKER_REPO_PUSH}/${appName}:v${appVersion}-${env.BUILD_NUMBER}"

                        docker.withRegistry('https://${env.NEXUS_URL}', '${env.DOCKER_CREDENTIALS_ID}') {
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

        stage('Push Docker Image to Nexus') {
            when {
                expression { env.branchName == 'main' }
            }
            steps {
                script {
                    docker.withRegistry('https://${env.NEXUS_URL}', '${env.DOCKER_CREDENTIALS_ID}') {
                        docker.image(env.IMAGE_NAME).push()
                        docker.image(env.IMAGE_NAME).push('latest')
                    }

                    echo "Pushed Docker image: ${env.IMAGE_NAME}"
                }
            }
        }
    }

    post {
        always {
            script {
                if (env.IMAGE_NAME) {
                    sh "docker rmi ${env.IMAGE_NAME} || true"
                }
            }
        }

        success {
            echo 'Pipeline completed successfully.'
        }

        failure {
            echo 'The pipeline encountered an error and did not complete successfully.'
        }
    }
}
