$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ProjectRoot

$DevJwtSecret = "dev_local_jwt_secret_change_me_1234567890"

function Write-Step {
    param([string] $Message)
    Write-Host ""
    Write-Host "==> $Message" -ForegroundColor Cyan
}

function Ensure-EnvFile {
    param(
        [string] $Path,
        [string] $ExamplePath
    )

    if (Test-Path $Path) {
        return
    }

    Copy-Item -Path $ExamplePath -Destination $Path
    Write-Host "Created $Path"
}

function Ensure-JwtSecret {
    param([string] $Path)

    $content = Get-Content -Path $Path -Raw
    $secretMatch = [regex]::Match($content, "(?m)^JWT_SECRET=(.*)$")

    if (-not $secretMatch.Success) {
        if (-not $content.EndsWith("`n")) {
            $content += "`r`n"
        }
        $content += "JWT_SECRET=$DevJwtSecret`r`n"
        Set-Content -Path $Path -Value $content -NoNewline
        Write-Host "Added JWT_SECRET in $Path"
        return
    }

    $currentSecret = $secretMatch.Groups[1].Value.Trim()
    $isUnsafeSecret = [string]::IsNullOrWhiteSpace($currentSecret) -or
        $currentSecret -eq "replace_with_a_long_random_secret" -or
        [Text.Encoding]::UTF8.GetByteCount($currentSecret) -lt 32

    if ($isUnsafeSecret) {
        $content = [regex]::Replace($content, "(?m)^JWT_SECRET=.*$", "JWT_SECRET=$DevJwtSecret", 1)
        Set-Content -Path $Path -Value $content -NoNewline
        Write-Host "Updated JWT_SECRET in $Path"
    }
}

function Get-EnvValue {
    param(
        [string] $Path,
        [string] $Name,
        [string] $DefaultValue
    )

    if (-not (Test-Path $Path)) {
        return $DefaultValue
    }

    $match = Select-String -Path $Path -Pattern "^$Name=(.+)$" | Select-Object -First 1
    if ($null -eq $match) {
        return $DefaultValue
    }

    return $match.Matches[0].Groups[1].Value.Trim()
}

function Test-DockerReady {
    & docker info *> $null
    return $LASTEXITCODE -eq 0
}

Write-Host "Pet Health Passport project launcher" -ForegroundColor Green
Write-Host "Project: $ProjectRoot"

Write-Step "Preparing environment files"
Ensure-EnvFile -Path (Join-Path $ProjectRoot ".env") -ExamplePath (Join-Path $ProjectRoot ".env.example")
Ensure-EnvFile -Path (Join-Path $ProjectRoot "backend\.env") -ExamplePath (Join-Path $ProjectRoot "backend\.env.example")
Ensure-JwtSecret -Path (Join-Path $ProjectRoot ".env")
Ensure-JwtSecret -Path (Join-Path $ProjectRoot "backend\.env")

Write-Step "Checking Docker"
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "Docker was not found. Please install Docker Desktop first." -ForegroundColor Red
    exit 1
}

if (-not (Test-DockerReady)) {
    $dockerDesktopPaths = @(
        "$env:ProgramFiles\Docker\Docker\Docker Desktop.exe",
        "$env:LocalAppData\Programs\Docker\Docker\Docker Desktop.exe"
    )
    $dockerDesktop = $dockerDesktopPaths | Where-Object { Test-Path $_ } | Select-Object -First 1

    if ($dockerDesktop) {
        Write-Host "Starting Docker Desktop..."
        Start-Process -FilePath $dockerDesktop -WindowStyle Hidden
    }
    else {
        Write-Host "Docker is installed, but Docker Desktop is not running." -ForegroundColor Yellow
        Write-Host "Please open Docker Desktop, then run this file again."
        exit 1
    }

    Write-Host "Waiting for Docker to become ready..."
    $ready = $false
    for ($i = 1; $i -le 60; $i++) {
        Start-Sleep -Seconds 3
        if (Test-DockerReady) {
            $ready = $true
            break
        }
        Write-Host "." -NoNewline
    }
    Write-Host ""

    if (-not $ready) {
        Write-Host "Docker is still not ready. Please wait for Docker Desktop to finish starting, then run this file again." -ForegroundColor Yellow
        exit 1
    }
}

$frontendPort = Get-EnvValue -Path (Join-Path $ProjectRoot ".env") -Name "FRONTEND_PORT" -DefaultValue "5173"
$appUrl = "http://localhost:$frontendPort"

Write-Step "Starting containers"
& docker compose up --build -d
if ($LASTEXITCODE -ne 0) {
    Write-Host "Docker Compose failed to start the project." -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Step "Waiting for the web app"
$webReady = $false
for ($i = 1; $i -le 60; $i++) {
    try {
        Invoke-WebRequest -Uri $appUrl -UseBasicParsing -TimeoutSec 2 *> $null
        $webReady = $true
        break
    }
    catch {
        Start-Sleep -Seconds 2
    }
}

if ($webReady) {
    Write-Host "Opening $appUrl"
    Start-Process $appUrl
}
else {
    Write-Host "The containers are running, but the web app did not answer yet." -ForegroundColor Yellow
    Write-Host "Try opening $appUrl in a browser in a moment."
}

Write-Step "Current containers"
& docker compose ps

Write-Host ""
Write-Host "Demo login:"
Write-Host "  owner@example.com / password123"
Write-Host "  vet@example.com   / password123"
Write-Host "  admin@example.com / password123"
Write-Host ""
Write-Host "To stop the project later, run: docker compose down"
