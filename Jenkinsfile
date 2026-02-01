

pipeline {
    agent any

    tools {
        nodejs 'node20'  // Name of NodeJS installation in Jenkins
    }

    environment {
        // credentials for git
        GIT_CREDENTIALS = 'Git_Credential'
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
                echo "Deleting workspace..."
                cleanWs()   // or use deleteDir()
            }
        }
        
        stage('Checkout') {
            steps {

                script {
                    env.branchName = env.ref.replace('refs/heads/', '')
                    echo "Checking out branch: ${env.branchName}"   
                }
                git(
                    branch: env.branchName,
                    credentialsId: "${env.GIT_CREDENTIALS}",
                    url: 'https://github.com/vincentino1/frontend.git'
                )
            }
        }

        stage('Install Dependencies') {
            steps {
                dir('angular-app') {
                    sh 'npm install -g @angular/cli@latest'
                    sh 'npm install'
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
        
        stage('Build angular app') {
            steps {
                dir('angular-app') {
                    sh 'ng build --configuration production'
                }
            }
        }
    }
}
