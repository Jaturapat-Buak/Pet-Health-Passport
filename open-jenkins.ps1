$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectRoot

Write-Host ""
Write-Host "Starting Pet Health Passport Jenkins..." -ForegroundColor Cyan
try {
  docker info *> $null
} catch {
  Write-Host "Docker Desktop is not running yet. Start Docker Desktop first, then run this script again." -ForegroundColor Red
  exit 1
}

docker compose -f docker-compose.jenkins.yml up --build -d

Write-Host ""
Write-Host "Jenkins URL:" -ForegroundColor Green
Write-Host "  http://localhost:8080"

Write-Host ""
Write-Host "Initial admin password:" -ForegroundColor Yellow
$containerId = docker compose -f docker-compose.jenkins.yml ps -q jenkins
if ($containerId) {
  docker exec $containerId sh -c "if [ -f /var/jenkins_home/secrets/initialAdminPassword ]; then cat /var/jenkins_home/secrets/initialAdminPassword; else echo 'Jenkins is still starting. Run this script again in a minute.'; fi"
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Open http://localhost:8080 and unlock Jenkins with the password above."
Write-Host "  2. Create an admin user."
Write-Host "  3. Add a Secret file credential with ID: pet-health-passport-env"
Write-Host "     Use this project's .env file as the uploaded secret file."
Write-Host "  4. Create a Pipeline job from SCM:"
Write-Host "     Repository: https://github.com/Jaturapat-Buak/Pet-Health-Passport.git"
Write-Host "     Branch: */main"
Write-Host "     Script path: Jenkinsfile"
Write-Host "  5. Click Build Now."
Write-Host ""
Write-Host "For GitHub auto-trigger, expose Jenkins with a public HTTPS URL and add webhook:"
Write-Host "  https://YOUR-JENKINS-URL/github-webhook/"
