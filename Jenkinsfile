pipeline {
  agent any

  environment {
    PROJECT_NAME = 'pet-health-passport'
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
          sh 'npm ci'
        }
      }
    }

    stage('Install Frontend Dependencies') {
      steps {
        dir('frontend') {
          sh 'npm ci'
        }
      }
    }

    stage('Backend Test') {
      steps {
        dir('backend') {
          sh 'npm test'
        }
      }
    }

    stage('Frontend Build') {
      steps {
        dir('frontend') {
          sh 'npm run build'
        }
      }
    }

    stage('Docker Build') {
      steps {
        sh 'docker compose build'
      }
    }

    stage('Docker Compose Deploy') {
      steps {
        sh 'docker compose up -d'
      }
    }

    stage('Health Check') {
      steps {
        sh 'docker compose exec -T backend node -e "fetch(\'http://localhost:5000/api/health\').then(r => { if (!r.ok) process.exit(1) })"'
      }
    }
  }

  post {
    always {
      sh 'docker compose ps || true'
    }
    success {
      echo 'Pet Health Passport pipeline completed successfully.'
    }
    failure {
      echo 'Pet Health Passport pipeline failed.'
    }
  }
}

