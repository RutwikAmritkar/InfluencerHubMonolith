# ==============================================================================
# CreatorsBrand Production Monolith Bootstrap Script
# ==============================================================================

Write-Host ">>> [PROD BOOT] Initializing CreatorsBrand Monolith..." -ForegroundColor Cyan

# 1. Environment Check
if (-not (Test-Path ".env")) {
    Write-Warning "[PROD BOOT] No .env file found in root. Checking backend/.env..."
    if (Test-Path "backend/.env") {
        Copy-Item "backend/.env" ".env"
    } else {
        Write-Error "[PROD BOOT] Missing required .env configuration file."
        exit 1
    }
}

# 2. Launch Monolith in Production Mode
Write-Host ">>> [PROD BOOT] Launching single-origin server on port 5001..." -ForegroundColor Green
$env:NODE_ENV = "production"
node --env-file=.env backend/dist/index.mjs

