def projectName = "n8n-nodes-trestle"
def projectKey   = "n8n-nodes-trestle"

@Library("jenkins-shared-library@main") _

pipeline {
    agent {
        label 'java22'
    }

    stages {
        stage('Retention Policy') {
            steps {
                script {
                    applyBuildRetention(rules: [master: '30', staging: '30', development: '30'], fallback: '30')
                }
            }
        }

        stage('SCM') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm ci'
            }
        }

        stage('SonarQube Analysis') {
            when {
                anyOf {
                    branch 'TRES-5042-add-sonarqube'
                    expression { env.BRANCH_NAME ==~ /PR.*/ }
                }
            }
            steps {
                withSonarQubeEnv('SonarQube') {
                    script {
                        sh 'rm -rf ~/.sonar/cache'

                        sh """
                            ./node_modules/.bin/sonar-scanner \
                            -Dsonar.projectKey=${projectKey} \
                            -Dsonar.projectName='${projectName}' \
                            -Dsonar.sources=index.js,nodes,credentials \
                            -Dsonar.exclusions=**/node_modules/**,**/dist/**,**/build/**,**/coverage/**,README.md,README_TEMPLATE.md,LICENSE.md,CODE_OF_CONDUCT.md,package-lock.json,tsconfig.json,gulpfile.js \
                            -Dsonar.javascript.file.suffixes=.js,.ts \
                            -Dsonar.sourceEncoding=UTF-8
                        """
                    }
                }
            }
        }
    }
}
