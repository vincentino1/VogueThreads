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
        GIT_BRANCH_URL = 'https://github.com/vincentino1/frontend.git' 
        

        // Nexus Docker Registry
        DOCKER_REPO_PUSH           = 'myapp-docker-hosted'
        DOCKER_REPO_PULL           = 'myapp-docker-group'
        DOCKER_CREDENTIALS_ID = 'docker-registry-creds'

        // NEXUS_URL is set as Jenkins environment variables

        // Set CHROME_BIN for Jenkins and make sure to install chromium via snap; sudo snap install chromium
        CHROME_BIN = '/snap/bin/chromium'

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

                    withNPM(npmrcConfig:'my-custom-npmrc') {
                        echo "Performing npm build..."
                        sh 'npm install --verbose'
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

        stage('Unit Tests') {
            steps {
                dir('angular-app') {
                        sh 'npm run test:ci'
                }
            }
        }

        stage('Build Angular App') {
            steps {
                dir('angular-app') {
                    sh 'npm run build'
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
                        
                        docker.withRegistry("https://${env.NEXUS_URLL}", "${env.DOCKER_CREDENTIALS_ID}") {
                           
                            docker.build(env.IMAGE_NAME, "--build-arg DOCKER_PRIVATE_REPO=${env.NEXUS_URL}/${env.DOCKER_REPO_PULL} .")
                        }

                        echo "Built image: ${env.IMAGE_NAME}"
                    }
                }
            }
        }

        stage('Push Docker Image to Nexus') {
            when {
                expression { return env.branchName == 'main' }
            }
            steps {
                script {
                    docker.withRegistry("https://${env.NEXUS_URL}", "${env.DOCKER_CREDENTIALS_ID}") {
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
                    sh "docker rmi ${env.IMAGE_NAME} || true"  // Cleanup
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


// properties([
//     pipelineTriggers([  
//         [
//             $class: 'GenericTrigger',
//             token: 'MY_GEN_TOKEN',
//             printContributedVariables: true,
//             genericVariables: [
//                 [key: 'ref', value: '$.ref'],
//                 [key: 'repo_name', value: '$.repository.name']
//             ],
//             regexpFilterText: '$repo_name:$ref',
//             // Only trigger on main branch
//             regexpFilterExpression: '^.+:refs/heads/main$'
//         ]
//     ])
// ])

// pipeline {
//     // Use Docker-in-Docker agent with Docker socket mounted
//     agent any

//     tools {
//         nodejs 'node20'
//     }

//     environment {
//         GIT_CREDENTIALS        = 'github-creds'

//         // Nexus Docker Registry ENV
//         DOCKER_REPO            = 'myapp-docker-hosted'
//         REGISTRY_HOSTNAME      = '3-98-125-121.sslip.io'
//         REVERSE_PROXY_BASE_URL = 'https://3-98-125-121.sslip.io'

//         // Nexus npm registry configuration
//         NPM_REGISTRY_URL       = '3-98-125-121.sslip.io' 

//         // Docker credentials ID (Username/Password type in Jenkins)
//         DOCKER_CREDENTIALS_ID  = 'docker-registry-creds'

//         // Ensures npm trusts your private Nexus npm registry
//         NODE_EXTRA_CA_CERTS    = "/etc/ssl/certs/ca-certificates.crt"
//     }

//     stages {

//         stage('Webhook Debug') {
//             steps {
//                 echo "Branch: ${env.ref}"
//                 echo "Repo: ${env.repo_name}"
//             }
//         }

//         stage('Clean Workspace') {
//             steps {
//                 echo "Deleting workspace..."
//                 cleanWs()
//             }
//         }

//         stage('Checkout') {
//             steps {
//                 script {
//                     if (!env.ref) {
//                         error "Webhook did not provide 'ref'. Cannot determine branch."
//                     }
//                     env.branchName = env.ref.replace('refs/heads/', '')
//                     echo "Checking out branch: ${env.branchName}"
//                 }

//                 git(
//                     branch: "${env.branchName}",
//                     credentialsId: "${env.GIT_CREDENTIALS}",
//                     url: 'https://github.com/vincentino1/frontend.git'
//                 )
//             }
//         }

//         stage('Install Dependencies') {
//             steps {
//                 dir('angular-app') {
//                     withCredentials([
//                         string(credentialsId: 'NEXUS_NPM_TOKEN', variable: 'NPM_TOKEN')
//                     ]) {
//                         writeFile file: '.npmrc',   
//                                   text: """
// registry=https://${REGISTRY_HOSTNAME}/repository/myapp-npm-group/
// always-auth=true
// //${REGISTRY_HOSTNAME}/repository/myapp-npm-group/:_auth=${NPM_TOKEN}
// email=jenkins@example.com
// """                     
//                         sh 'npm install -g @angular/cli@latest'
//                         sh 'npm install'
//                         sh 'npm whoami'  // Verify auth
//                     }
//                 }
//             }
//             post {
//                 always {
//                     dir('angular-app') {
//                         sh 'rm -f .npmrc'
//                     }
//                 }
//             }
//         }

//         stage('Unit Tests') {
//             steps {
//                 dir('angular-app') {
//                     // Ensure Puppeteer is installed
//                     sh 'npm install --no-audit --no-fund puppeteer'

//                     // Set CHROME_BIN to Puppeteer Chromium
//                     withEnv(['CHROME_BIN=$(node -p "require(\'puppeteer\').executablePath()")']) {
//                         sh 'npm run test:ci'
//                     }
//                 }
//             }
//         }

//         stage('Build Angular App') {
//             steps {
//                 dir('angular-app') {
//                     sh 'npm run build'
//                 }
//             }
//         }

//         stage('Build Docker Image') {
//             steps {
//                 dir('angular-app') {
//                     script {
//                         def pkg = readJSON file: 'package.json'
//                         def appName = pkg.name
//                         def appVersion = pkg.version

//                         env.IMAGE_NAME = "${REGISTRY_HOSTNAME}/${DOCKER_REPO}/${appName}:v${appVersion}-${BUILD_NUMBER}"

//                         docker.withRegistry("${REVERSE_PROXY_BASE_URL}", "${DOCKER_CREDENTIALS_ID}") {
//                             docker.build(env.IMAGE_NAME, '.')
//                         }

//                         echo "Built image: ${env.IMAGE_NAME}"
//                     }
//                 }
//             }
//         }

//         stage('Push Docker Image to Nexus') {
//             when { 
//                 expression { return env.branchName == 'main' }
//             }
//             steps {
//                 script {
//                     docker.withRegistry("${REVERSE_PROXY_BASE_URL}", "${DOCKER_CREDENTIALS_ID}") {
//                         docker.image(env.IMAGE_NAME).push()
//                         docker.image(env.IMAGE_NAME).push('latest')
//                     }
//                     echo "Pushed Docker image: ${env.IMAGE_NAME}"
//                 }
//             }
//         }
//     }

//     post {
//         always {
//             script {
//                 if (env.IMAGE_NAME) {
//                     sh "docker rmi ${env.IMAGE_NAME} || true"  // Safe cleanup
//                 }
//             }
//         }

//         success {
//             echo 'Pipeline completed successfully.'
//         }

//         failure {
//             echo 'The pipeline encountered an error and did not complete successfully.'
//         }
//     }
// }
