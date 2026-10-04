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
      steps {
        withCredentials([file(credentialsId: 'pet-health-passport-env', variable: 'COMPOSE_ENV_FILE')]) {
          script {
            composeOnAgent('--env-file "$COMPOSE_ENV_FILE" build', '--env-file "%COMPOSE_ENV_FILE%" build')
          }
        }
      }
    }

    stage('Docker Compose Deploy') {
      steps {
        withCredentials([file(credentialsId: 'pet-health-passport-env', variable: 'COMPOSE_ENV_FILE')]) {
          script {
            composeOnAgent('--env-file "$COMPOSE_ENV_FILE" up -d', '--env-file "%COMPOSE_ENV_FILE%" up -d')
          }
        }
      }
    }

    stage('Health Check') {
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
