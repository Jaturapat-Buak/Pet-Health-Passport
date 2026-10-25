param(
  [string]$EnvFile = '',
  [switch]$SkipBuild
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $EnvFile) { $EnvFile = Join-Path $projectRoot '.env' }
$EnvFile = [System.IO.Path]::GetFullPath($EnvFile)
$clusterName = 'pet-health-passport'
$context = "kind-$clusterName"
$namespace = 'pet-health-passport'
$k8sDir = Join-Path $projectRoot 'k8s'

if (-not (Test-Path -LiteralPath $EnvFile -PathType Leaf)) {
  throw "Missing env file: $EnvFile. Create it from .env.example first."
}
if (-not (Get-Command kubectl -ErrorAction SilentlyContinue)) {
  throw 'kubectl is required. Enable it in Docker Desktop or install the official Kubernetes client.'
}
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  throw 'Docker Desktop is required.'
}

function Invoke-Checked([string]$file, [string[]]$commandArguments) {
  & $file @commandArguments
  if ($LASTEXITCODE -ne 0) { throw "$file failed with exit code $LASTEXITCODE" }
}

function Test-Docker {
  try {
    docker info --format '{{.ServerVersion}}' 2>$null | Out-Null
    return $LASTEXITCODE -eq 0
  } catch { return $false }
}

if (-not (Test-Docker)) {
  $desktop = Join-Path $env:ProgramFiles 'Docker\Docker\Docker Desktop.exe'
  if (-not (Test-Path -LiteralPath $desktop)) { throw 'Docker Desktop is not running.' }
  Write-Host 'Starting Docker Desktop...'
  Start-Process -FilePath $desktop -WindowStyle Hidden
  for ($attempt = 0; $attempt -lt 90 -and -not (Test-Docker); $attempt++) {
    Start-Sleep -Seconds 2
  }
  if (-not (Test-Docker)) { throw 'Docker Desktop did not become ready within 3 minutes.' }
}

$installedKind = Get-Command kind -ErrorAction SilentlyContinue
if ($installedKind) {
  $kindExe = $installedKind.Source
} else {
  if ($env:PROCESSOR_ARCHITECTURE -ne 'AMD64') { throw 'The bundled kind download supports Windows AMD64 only.' }
  $toolsDir = Join-Path $projectRoot '.tools'
  $kindExe = Join-Path $toolsDir 'kind.exe'
  if (-not (Test-Path -LiteralPath $kindExe)) {
    New-Item -ItemType Directory -Path $toolsDir -Force | Out-Null
    $version = 'v0.33.0'
    $url = "https://kind.sigs.k8s.io/dl/$version/kind-windows-amd64"
    $downloadPath = Join-Path $toolsDir 'kind-windows-amd64.download'
    $checksumPath = Join-Path $toolsDir 'kind-windows-amd64.sha256sum'
    Write-Host "Downloading kind $version from the official release..."
    Invoke-WebRequest -Uri $url -OutFile $downloadPath
    Invoke-WebRequest -Uri "${url}.sha256sum" -OutFile $checksumPath
    $checksum = Get-Content -LiteralPath $checksumPath -Raw
    $expected = [regex]::Match($checksum, '^[0-9a-fA-F]{64}').Value
    if (-not $expected -or (Get-FileHash -LiteralPath $downloadPath -Algorithm SHA256).Hash -ne $expected) {
      throw 'kind checksum verification failed.'
    }
    Move-Item -LiteralPath $downloadPath -Destination $kindExe
  }
}

Set-Location $projectRoot
$clusters = @(& $kindExe get clusters)
if ($LASTEXITCODE -ne 0) { throw 'Could not list kind clusters.' }
if ($clusters -notcontains $clusterName) {
  Invoke-Checked $kindExe @('create', 'cluster', '--name', $clusterName, '--config', (Join-Path $k8sDir 'kind-config.yaml'), '--wait', '180s')
}

if (-not $SkipBuild) {
  Invoke-Checked 'docker' @('build', '-t', 'pet-health-passport-postgres:kind', 'database')
  $imageTag = 'kind-' + (Get-Date -Format 'yyyyMMddHHmmss')
  Invoke-Checked 'docker' @('build', '-t', 'pet-health-passport-backend:kind', '-t', "pet-health-passport-backend:$imageTag", 'backend')
  Invoke-Checked 'docker' @('build', '-t', 'pet-health-passport-frontend:kind', '-t', "pet-health-passport-frontend:$imageTag", 'frontend')
} else {
  $imageTag = $env:KIND_IMAGE_TAG
  if (-not $imageTag) { throw 'KIND_IMAGE_TAG is required with -SkipBuild.' }
}
Invoke-Checked $kindExe @('load', 'docker-image', '--name', $clusterName,
  'pet-health-passport-postgres:kind', 'pet-health-passport-backend:kind', 'pet-health-passport-frontend:kind',
  "pet-health-passport-backend:$imageTag", "pet-health-passport-frontend:$imageTag")

Invoke-Checked 'kubectl' @('--context', $context, 'apply', '-f', (Join-Path $k8sDir 'namespace.yaml'))
$secretYaml = & kubectl --context $context -n $namespace create secret generic pet-health-passport-secrets "--from-env-file=$EnvFile" --dry-run=client -o yaml
if ($LASTEXITCODE -ne 0) { throw 'Could not create the Kubernetes Secret from the env file.' }
$secretYaml | & kubectl --context $context -n $namespace apply -f -
if ($LASTEXITCODE -ne 0) { throw 'Could not apply the Kubernetes Secret.' }

Invoke-Checked 'kubectl' @('--context', $context, 'apply', '-k', $k8sDir)
foreach ($name in @('backend', 'frontend')) {
  $deployment = Join-Path $k8sDir "$name-deployment.yaml"
  $taggedYaml = & kubectl set image -f $deployment "$name=pet-health-passport-${name}:$imageTag" --local -o yaml
  if ($LASTEXITCODE -ne 0) { throw "Could not tag the $name Deployment." }
  $taggedYaml | & kubectl --context $context -n $namespace apply -f -
  if ($LASTEXITCODE -ne 0) { throw "Could not apply the $name Deployment." }
}

foreach ($resource in @('statefulset/postgres', 'deployment/backend', 'deployment/frontend', 'deployment/php-traefik')) {
  Invoke-Checked 'kubectl' @('--context', $context, '-n', $namespace, 'rollout', 'status', $resource, '--timeout=240s')
}

$healthy = $false
for ($attempt = 0; $attempt -lt 30; $attempt++) {
  try {
    $result = Invoke-RestMethod -Uri 'http://localhost:8081/api/health' -TimeoutSec 5
    if ($result.status -eq 'ok' -and $result.database -eq 'connected') { $healthy = $true; break }
  } catch {}
  Start-Sleep -Seconds 2
}
if (-not $healthy) { throw 'Kubernetes workloads are ready, but the public API health check failed.' }

Write-Host 'Kubernetes deployment is ready: http://localhost:8081' -ForegroundColor Green
Invoke-Checked 'kubectl' @('--context', $context, '-n', $namespace, 'get', 'pods')
