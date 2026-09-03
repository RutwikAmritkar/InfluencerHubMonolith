# ==============================================================================
# InfluencerHub One-Command Local Development Startup Script
# ==============================================================================

$ProjectRoot = $PSScriptRoot

Write-Host "==================================================" -ForegroundColor DarkCyan
Write-Host "🚀 InfluencerHub Local Development Startup" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor DarkCyan

# 1. Check & Start PostgreSQL 18 Service
$pgService = Get-Service -Name "postgresql-x64-18" -ErrorAction SilentlyContinue

if ($null -ne $pgService) {
    if ($pgService.Status -ne 'Running') {
        Write-Host '[!] PostgreSQL 18 is stopped. Starting service...' -ForegroundColor Yellow
        Start-Service -Name "postgresql-x64-18" -ErrorAction SilentlyContinue
        Write-Host '[✓] PostgreSQL 18 service check complete.' -ForegroundColor Green
    } else {
        Write-Host '[✓] PostgreSQL 18 service: RUNNING' -ForegroundColor Green
    }
} else {
    Write-Host '[!] postgresql-x64-18 service not found. Ensure PostgreSQL 18 is running on port 5432.' -ForegroundColor Yellow
}

# 2. Check Backend Server (Port 5001)
$backendListen = Get-NetTCPConnection -LocalPort 5001 -State Listen -ErrorAction SilentlyContinue

if ($null -eq $backendListen) {
    Write-Host '[+] Launching Express Backend Server on port 5001 in a new window...' -ForegroundColor Cyan
    $backendCmd = "Set-Location '$ProjectRoot'; node --env-file=artifacts/api-server/.env artifacts/api-server/dist/index.mjs"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCmd
} else {
    Write-Host '[✓] Backend server already running on port 5001.' -ForegroundColor Green
}

# 3. Check Frontend Dev Server (Port 5000)
$frontendListen = Get-NetTCPConnection -LocalPort 5000 -State Listen -ErrorAction SilentlyContinue

if ($null -eq $frontendListen) {
    Write-Host '[+] Launching Vite Frontend App on port 5000 in a new window...' -ForegroundColor Cyan
    $frontendCmd = "Set-Location '$ProjectRoot'; npm.cmd --prefix artifacts/influencer-hub run dev"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCmd
} else {
    Write-Host '[✓] Frontend server already running on port 5000.' -ForegroundColor Green
}

Write-Host ""
Write-Host "==================================================" -ForegroundColor DarkCyan
Write-Host "🎉 InfluencerHub Local Environment is Ready!" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor DarkCyan
Write-Host "   Frontend Application: http://localhost:5000" -ForegroundColor Yellow
Write-Host "   Backend API Server:   http://localhost:5001" -ForegroundColor Yellow
Write-Host "   Health Check:         http://localhost:5001/health" -ForegroundColor Yellow
Write-Host "==================================================" -ForegroundColor DarkCyan
Write-Host ""
