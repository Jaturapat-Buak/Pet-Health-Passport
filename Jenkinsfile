def runOnAgent(String unixCommand, String windowsCommand = null) {
  if (isUnix()) {
    sh unixCommand
  } else {
    bat(windowsCommand ?: unixCommand)
  }
}

def composeOnAgent(String unixArgs, String windowsArgs = null) {
  runOnAgent(
    """
      if docker compose version >/dev/null 2>&1; then
        docker compose ${unixArgs}
      else
        docker-compose ${unixArgs}
      fi
    """,
    "docker compose ${windowsArgs ?: unixArgs}"
  )
}

pipeline {
  agent any

  parameters {
    choice(name: 'DEPLOY_TARGET', choices: ['compose', 'kind'], description: 'Deploy with Docker Compose or the local kind cluster')
  }

  options {
    skipDefaultCheckout()
    disableConcurrentBuilds()
    timeout(time: 30, unit: 'MINUTES')
    timestamps()
  }

  triggers {
    githubPush()
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Install Backend Dependencies') {
      steps {
        dir('backend') {
          script { runOnAgent('npm ci') }
        }
      }
    }

    stage('Install Frontend Dependencies') {
      steps {
        dir('frontend') {
          script { runOnAgent('npm ci') }
        }
      }
    }

    stage('Backend Test') {
      steps {
        dir('backend') {
          script { runOnAgent('npm test') }
        }
      }
    }

    stage('Frontend Build') {
      steps {
        dir('frontend') {
          script { runOnAgent('npm run build') }
        }
      }
    }

    stage('Docker Build') {
      when { expression { params.DEPLOY_TARGET == 'compose' } }
      steps {
        withCredentials([file(credentialsId: 'pet-health-passport-env', variable: 'COMPOSE_ENV_FILE')]) {
          script {
            composeOnAgent('--env-file "$COMPOSE_ENV_FILE" build', '--env-file "%COMPOSE_ENV_FILE%" build')
          }
        }
      }
    }

    stage('Docker Compose Deploy') {
      when { expression { params.DEPLOY_TARGET == 'compose' } }
      steps {
        withCredentials([file(credentialsId: 'pet-health-passport-env', variable: 'COMPOSE_ENV_FILE')]) {
          script {
            composeOnAgent('--env-file "$COMPOSE_ENV_FILE" up -d', '--env-file "%COMPOSE_ENV_FILE%" up -d')
          }
        }
      }
    }

    stage('Health Check') {
      when { expression { params.DEPLOY_TARGET == 'compose' } }
      steps {
        withCredentials([file(credentialsId: 'pet-health-passport-env', variable: 'COMPOSE_ENV_FILE')]) {
          script {
            runOnAgent(
              '''
                for attempt in $(seq 1 24); do
                  if docker compose version >/dev/null 2>&1; then
                    docker compose --env-file "$COMPOSE_ENV_FILE" exec -T backend node src/healthcheck.js && exit 0
                  else
                    docker-compose --env-file "$COMPOSE_ENV_FILE" exec -T backend node src/healthcheck.js && exit 0
                  fi
                  echo "Waiting for backend health check... ($attempt/24)"
                  sleep 5
                done
                exit 1
              ''',
              'for /l %%i in (1,1,24) do (docker compose --env-file "%COMPOSE_ENV_FILE%" exec -T backend node src/healthcheck.js && exit /b 0 || timeout /t 5) & exit /b 1'
            )
            composeOnAgent('--env-file "$COMPOSE_ENV_FILE" ps', '--env-file "%COMPOSE_ENV_FILE%" ps')
          }
        }
      }
    }

    stage('Kubernetes Image Build') {
      when { expression { params.DEPLOY_TARGET == 'kind' } }
      steps {
        script {
          env.KIND_IMAGE_TAG = "kind-jenkins-${env.BUILD_NUMBER}"
          runOnAgent('docker build -t pet-health-passport-postgres:kind database')
          runOnAgent("docker build -t pet-health-passport-backend:kind -t pet-health-passport-backend:${env.KIND_IMAGE_TAG} backend")
          runOnAgent("docker build -t pet-health-passport-frontend:kind -t pet-health-passport-frontend:${env.KIND_IMAGE_TAG} frontend")
        }
      }
    }

    stage('Kubernetes Deploy and Health Check') {
      when { expression { params.DEPLOY_TARGET == 'kind' } }
      steps {
        withCredentials([file(credentialsId: 'pet-health-passport-env', variable: 'COMPOSE_ENV_FILE')]) {
          script {
            if (isUnix()) {
              sh 'sh k8s/deploy-kind.sh "$COMPOSE_ENV_FILE" "$KIND_IMAGE_TAG"'
            } else {
              bat 'powershell -NoProfile -ExecutionPolicy Bypass -File open-kubernetes.ps1 -SkipBuild -EnvFile "%COMPOSE_ENV_FILE%"'
            }
          }
        }
      }
    }
  }

  post {
    success {
      echo 'Pet Health Passport pipeline completed successfully.'
    }
    failure {
      echo 'Pet Health Passport pipeline failed.'
    }
  }
}
