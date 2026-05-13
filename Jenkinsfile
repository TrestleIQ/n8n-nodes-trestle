def projectName = "n8n-nodes-trestle"
def projectKey   = "n8n-nodes-trestle"

@Library("jenkins-shared-library@main") _

pipeline {
    agent {
        label 'java22'
    }

    environment {
        NPM_TOKEN = credentials('npm-token')
        NVM_DIR = "${env.HOME}/.nvm"
        NODE_VERSION = "22"
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

        stage('Setup Node.js 22') {
            steps {
                sh '''
                    # Install NVM if not present
                    if [ ! -d "${NVM_DIR}" ]; then
                        echo "Installing NVM..."
                        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
                    else
                        echo "NVM already installed"
                    fi

                    # Source NVM and install Node 22
                    export NVM_DIR="${NVM_DIR}"
                    [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

                    nvm install ${NODE_VERSION}
                    nvm use ${NODE_VERSION}

                    echo "==============================================="
                    echo "Node Version:"
                    node -v

                    echo "NPM Version:"
                    npm -v
                    echo "==============================================="
                '''
            }
        }

        stage('Install Dependencies') {
            steps {
                sh '''
                    export NVM_DIR="${NVM_DIR}"
                    [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
                    nvm use ${NODE_VERSION}

                    echo "Installing dependencies with npm ci..."
                    npm ci
                '''
            }
        }

        stage('Build') {
            steps {
                sh '''
                    export NVM_DIR="${NVM_DIR}"
                    [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
                    nvm use ${NODE_VERSION}

                    echo "Building project..."
                    npm run build
                '''
            }
        }

        stage('SonarQube Analysis') {
            when {
                anyOf {
                    branch 'master'
                    expression { env.BRANCH_NAME ==~ /PR.*/ }
                }
            }
            steps {
                withSonarQubeEnv('SonarQube') {
                    sh '''
                        export NVM_DIR="${NVM_DIR}"
                        [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
                        nvm use ${NODE_VERSION}

                        echo "Running SonarQube analysis..."
                        rm -rf ~/.sonar/cache

                        npx --yes sonarqube-scanner@4.2.6 \
                        -Dsonar.projectKey=n8n-nodes-trestle \
                        -Dsonar.projectName='n8n-nodes-trestle' \
                        -Dsonar.sources=index.js,nodes,credentials \
                        -Dsonar.exclusions=**/node_modules/**,**/dist/**,**/build/**,**/coverage/**,README.md,README_TEMPLATE.md,LICENSE.md,CODE_OF_CONDUCT.md,package-lock.json,tsconfig.json,gulpfile.js \
                        -Dsonar.javascript.file.suffixes=.js \
                        -Dsonar.typescript.file.suffixes=.ts \
                        -Dsonar.sourceEncoding=UTF-8
                    '''
                }
            }
        }

        stage('Publish to npm') {
            when {
                branch 'master'
            }

            steps {
                sh '''
                    export NVM_DIR="${NVM_DIR}"
                    [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
                    nvm use ${NODE_VERSION}

                    echo "Publishing to npm registry..."
                    echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > ~/.npmrc

                    npm publish
                '''
            }
        }
    }

    post {
        success {
            echo "✅ Build and publish completed successfully."
        }

        failure {
            echo "❌ Pipeline failed."
        }

        always {
            sh 'rm -f ~/.npmrc || true'
            cleanWs()
        }
    }
}