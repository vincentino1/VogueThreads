properties([
    pipelineTriggers([
        [
            $class: 'GenericTrigger',
            token: 'MY_GEN_TOKEN',
            printContributedVariables: true,
            genericVariables: [
                [key: 'ref',       value: '$.ref'],
                [key: 'repo_name', value: '$.repository.name']
            ],
            regexpFilterText: '$repo_name:$ref',
            regexpFilterExpression: '^frontend:refs/heads/main$'
        ]
    ])
])

pipeline {
    agent any

        environment {
        // credentials for git
        GIT_CREDENTIALS = 'Git_Credential'
    }
    
    tools {
        nodejs 'node20' // Name must match the one you configured in Jenkins
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
                    def branchName = env.ref.replace('refs/heads/', '')
                    echo "Checking out branch: ${branchName}"          
                git(
                    branch: "${env.branchName}",
                    credentialsId: "${env.GIT_CREDENTIALS}",
                    url: 'https://github.com/vincentino1/frontend.git'
                )
            }
        }

        stage('Install Dependencies') {
            steps {
                dir('angular-app') {
                    sh 'npm install'
                }
            }
        }
        
        stage('Build Angular app') {
            steps {
                dir('angular-app') {
                    sh 'npm run build --prod'

                }
            }
        }


    }
}
