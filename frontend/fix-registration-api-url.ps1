# Fix BusinessRegistration.jsx to use environment variable for API URL
# This script updates hardcoded localhost URLs to use VITE_API_BASE_URL

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Fix Registration API URL" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Navigate to frontend directory
$frontendPath = "C:\Users\Admin\OneDrive\Documents\Environment\ayende-cx-register\frontend"
$filePath = Join-Path $frontendPath "src\pages\BusinessRegistration.jsx"

if (-not (Test-Path $filePath)) {
    Write-Host "Error: BusinessRegistration.jsx not found at: $filePath" -ForegroundColor Red
    exit 1
}

Write-Host "[1/5] Backing up original file..." -ForegroundColor Yellow
$backupPath = "$filePath.backup.$(Get-Date -Format 'yyyyMMddHHmmss')"
Copy-Item $filePath $backupPath
Write-Host "✓ Backup created: $backupPath`n" -ForegroundColor Green

Write-Host "[2/5] Reading file..." -ForegroundColor Yellow
$content = Get-Content $filePath -Raw
Write-Host "✓ File loaded`n" -ForegroundColor Green

Write-Host "[3/5] Applying fixes..." -ForegroundColor Yellow

# Fix 1: Add API_BASE_URL constant after imports
$importPattern = "import axios from 'axios';"
$replacement = @"
import axios from 'axios';

// Use environment variable for API URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';
"@

if ($content -match [regex]::Escape($importPattern)) {
    $content = $content -replace [regex]::Escape($importPattern), $replacement
    Write-Host "  ✓ Added API_BASE_URL constant" -ForegroundColor Green
} else {
    Write-Host "  ! Could not find axios import - API_BASE_URL may not be added" -ForegroundColor Yellow
}

# Fix 2: Replace check-availability endpoint
$checkAvailabilityOld = "await axios.post('http://localhost:5000/api/v1/registration/check-availability',"
$checkAvailabilityNew = "await axios.post(`${API_BASE_URL}/registration/check-availability`,"

if ($content -match [regex]::Escape($checkAvailabilityOld)) {
    $content = $content -replace [regex]::Escape($checkAvailabilityOld), $checkAvailabilityNew
    Write-Host "  ✓ Fixed check-availability endpoint" -ForegroundColor Green
} else {
    Write-Host "  ! Could not find check-availability endpoint" -ForegroundColor Yellow
}

# Fix 3: Replace business registration endpoint
$businessRegOld = "await axios.post('http://localhost:5000/api/v1/registration/business', formData);"
$businessRegNew = "await axios.post(`${API_BASE_URL}/registration/business`, formData);"

if ($content -match [regex]::Escape($businessRegOld)) {
    $content = $content -replace [regex]::Escape($businessRegOld), $businessRegNew
    Write-Host "  ✓ Fixed business registration endpoint" -ForegroundColor Green
} else {
    Write-Host "  ! Could not find business registration endpoint" -ForegroundColor Yellow
}

Write-Host ""

Write-Host "[4/5] Writing updated file..." -ForegroundColor Yellow
$content | Set-Content $filePath -NoNewline
Write-Host "✓ File updated`n" -ForegroundColor Green

Write-Host "[5/5] Verifying changes..." -ForegroundColor Yellow
$verifyContent = Get-Content $filePath -Raw

if ($verifyContent -match "const API_BASE_URL = import.meta.env.VITE_API_BASE_URL") {
    Write-Host "  ✓ API_BASE_URL constant found" -ForegroundColor Green
} else {
    Write-Host "  ✗ API_BASE_URL constant NOT found" -ForegroundColor Red
}

if ($verifyContent -match "\`\$\{API_BASE_URL\}/registration/check-availability") {
    Write-Host "  ✓ check-availability uses API_BASE_URL" -ForegroundColor Green
} else {
    Write-Host "  ✗ check-availability NOT updated" -ForegroundColor Red
}

if ($verifyContent -match "\`\$\{API_BASE_URL\}/registration/business") {
    Write-Host "  ✓ business registration uses API_BASE_URL" -ForegroundColor Green
} else {
    Write-Host "  ✗ business registration NOT updated" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Fix Applied Successfully!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Review the changes in VS Code (optional)" -ForegroundColor White
Write-Host "   code $filePath`n" -ForegroundColor Cyan

Write-Host "2. Commit and push to trigger rebuild:" -ForegroundColor White
Write-Host "   cd $frontendPath" -ForegroundColor Cyan
Write-Host "   git add src/pages/BusinessRegistration.jsx" -ForegroundColor Cyan
Write-Host "   git commit -m 'Fix: Use environment variable for API URL in registration'" -ForegroundColor Cyan
Write-Host "   git push origin main`n" -ForegroundColor Cyan

Write-Host "3. Wait 2-3 minutes for Railway deployment" -ForegroundColor White
Write-Host ""
Write-Host "4. Test registration at: https://pos-app.ayendecx.com/register" -ForegroundColor White
Write-Host ""

Write-Host "Backup saved at: $backupPath" -ForegroundColor Gray
