# CRM to POS Webhook Deployment Script
# This script automates the deployment of CRM → POS webhook functionality
# Date: November 7, 2025

Write-Host "╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     CRM → POS WEBHOOK DEPLOYMENT SCRIPT                       ║" -ForegroundColor Cyan
Write-Host "║     Ayende-CX Bidirectional Integration                       ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Function to prompt for continuation
function Confirm-Step {
    param([string]$Message)
    Write-Host "`n$Message" -ForegroundColor Yellow
    $response = Read-Host "Continue? (y/n)"
    if ($response -ne 'y') {
        Write-Host "Deployment cancelled by user." -ForegroundColor Red
        exit
    }
}

# Function to check if file exists
function Test-FileExists {
    param([string]$Path, [string]$Description)
    if (Test-Path $Path) {
        Write-Host "✓ Found: $Description" -ForegroundColor Green
        return $true
    } else {
        Write-Host "✗ Missing: $Description" -ForegroundColor Red
        Write-Host "  Path: $Path" -ForegroundColor Gray
        return $false
    }
}

# ============================================
# STEP 1: Pre-flight Checks
# ============================================
Write-Host "`n[STEP 1] Pre-flight Checks" -ForegroundColor Cyan
Write-Host "─────────────────────────────────────────────────────────────────" -ForegroundColor Gray

$posBackendPath = "C:\Users\Admin\OneDrive\Documents\Environment\ayende-cx-register\backend"
$crmPath = "C:\Users\Admin\OneDrive\Documents\Environment\ayende-cx"

# Check POS backend directory
if (-not (Test-Path $posBackendPath)) {
    Write-Host "✗ POS backend directory not found!" -ForegroundColor Red
    Write-Host "  Expected: $posBackendPath" -ForegroundColor Gray
    exit
}

# Check CRM directory
if (-not (Test-Path $crmPath)) {
    Write-Host "✗ CRM directory not found!" -ForegroundColor Red
    Write-Host "  Expected: $crmPath" -ForegroundColor Gray
    exit
}

Write-Host "✓ Directory structure verified" -ForegroundColor Green

# Check required files
Write-Host "`nChecking for uploaded files..." -ForegroundColor White

# Prompt for uploaded files location
Write-Host "`nWhere are the uploaded files located?" -ForegroundColor Yellow
Write-Host "  1. Desktop" -ForegroundColor Gray
Write-Host "  2. Downloads" -ForegroundColor Gray
Write-Host "  3. Custom path" -ForegroundColor Gray
$locationChoice = Read-Host "Enter choice (1-3)"

switch ($locationChoice) {
    "1" { $uploadPath = "$env:USERPROFILE\Desktop" }
    "2" { $uploadPath = "$env:USERPROFILE\Downloads" }
    "3" { 
        $uploadPath = Read-Host "Enter full path to uploaded files"
        if (-not (Test-Path $uploadPath)) {
            Write-Host "✗ Path not found: $uploadPath" -ForegroundColor Red
            exit
        }
    }
    default {
        Write-Host "Invalid choice" -ForegroundColor Red
        exit
    }
}

Write-Host "`nLooking for files in: $uploadPath" -ForegroundColor Gray

$webhooksFile = Join-Path $uploadPath "webhooks.js"
$signalsFile = Join-Path $uploadPath "signals.py"
$webhookServiceFile = Join-Path $uploadPath "webhook_service.py"

$allFilesPresent = $true
$allFilesPresent = (Test-FileExists $webhooksFile "webhooks.js") -and $allFilesPresent
$allFilesPresent = (Test-FileExists $signalsFile "signals.py") -and $allFilesPresent
$allFilesPresent = (Test-FileExists $webhookServiceFile "webhook_service.py") -and $allFilesPresent

if (-not $allFilesPresent) {
    Write-Host "`n✗ Some required files are missing!" -ForegroundColor Red
    Write-Host "Please ensure all files are in: $uploadPath" -ForegroundColor Yellow
    exit
}

Confirm-Step "[STEP 1] Pre-flight checks complete. Ready to proceed with deployment?"

# ============================================
# STEP 2: Backup Existing Files
# ============================================
Write-Host "`n[STEP 2] Creating Backups" -ForegroundColor Cyan
Write-Host "─────────────────────────────────────────────────────────────────" -ForegroundColor Gray

# Backup POS server.js
$posServerFile = Join-Path $posBackendPath "src\server.js"
if (Test-Path $posServerFile) {
    $backupFile = "$posServerFile.backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
    Copy-Item $posServerFile $backupFile -Force
    Write-Host "✓ Backed up: src\server.js" -ForegroundColor Green
    Write-Host "  → $backupFile" -ForegroundColor Gray
}

# Backup CRM signals.py
$crmSignalsFile = Join-Path $crmPath "customers\signals.py"
if (Test-Path $crmSignalsFile) {
    $backupFile = "$crmSignalsFile.backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
    Copy-Item $crmSignalsFile $backupFile -Force
    Write-Host "✓ Backed up: customers\signals.py" -ForegroundColor Green
    Write-Host "  → $backupFile" -ForegroundColor Gray
}

# Backup CRM webhook_service.py
$crmWebhookServiceFile = Join-Path $crmPath "dashboard\services\webhook_service.py"
if (Test-Path $crmWebhookServiceFile) {
    $backupFile = "$crmWebhookServiceFile.backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
    Copy-Item $crmWebhookServiceFile $backupFile -Force
    Write-Host "✓ Backed up: dashboard\services\webhook_service.py" -ForegroundColor Green
    Write-Host "  → $backupFile" -ForegroundColor Gray
}

Write-Host "`n✓ All backups created successfully" -ForegroundColor Green

Confirm-Step "[STEP 2] Backups complete. Ready to deploy files?"

# ============================================
# STEP 3: Deploy POS Backend Files
# ============================================
Write-Host "`n[STEP 3] Deploying POS Backend Files" -ForegroundColor Cyan
Write-Host "─────────────────────────────────────────────────────────────────" -ForegroundColor Gray

Set-Location $posBackendPath

# Copy webhooks.js to routes folder
$destWebhooksFile = Join-Path $posBackendPath "src\routes\webhooks.js"
Copy-Item $webhooksFile $destWebhooksFile -Force
Write-Host "✓ Copied: webhooks.js → src\routes\webhooks.js" -ForegroundColor Green

# Note: User needs to manually update server.js or use the provided output file
Write-Host "`n⚠  Manual Step Required:" -ForegroundColor Yellow
Write-Host "   Update src\server.js with the version from outputs folder" -ForegroundColor Yellow
Write-Host "   Or manually add this line after other route imports:" -ForegroundColor Gray
Write-Host "   import webhookRoutes from './routes/webhooks.js';" -ForegroundColor Gray
Write-Host "   And add this line in the routes section:" -ForegroundColor Gray
Write-Host "   app.use('/api/v1/webhooks', webhookRoutes);" -ForegroundColor Gray

Confirm-Step "Have you updated server.js? (Check outputs folder for updated version)"

# Git operations for POS
Write-Host "`nCommitting POS changes to git..." -ForegroundColor White
git add src/routes/webhooks.js
git add src/server.js
git status

Confirm-Step "Review the changes above. Ready to commit and push?"

git commit -m "Feature: Add CRM to POS webhook receiver endpoints"
Write-Host "✓ Changes committed" -ForegroundColor Green

Write-Host "`nPushing to Railway..." -ForegroundColor White
git push

Write-Host "✓ POS backend deployed!" -ForegroundColor Green
Write-Host "  Deployment will take 2-3 minutes..." -ForegroundColor Gray

# ============================================
# STEP 4: Deploy CRM Backend Files
# ============================================
Write-Host "`n[STEP 4] Deploying CRM Backend Files" -ForegroundColor Cyan
Write-Host "─────────────────────────────────────────────────────────────────" -ForegroundColor Gray

Set-Location $crmPath

# Copy signals.py
$destSignalsFile = Join-Path $crmPath "customers\signals.py"
Copy-Item $signalsFile $destSignalsFile -Force
Write-Host "✓ Copied: signals.py → customers\signals.py" -ForegroundColor Green

# Copy webhook_service.py
$destWebhookServiceFile = Join-Path $crmPath "dashboard\services\webhook_service.py"
Copy-Item $webhookServiceFile $destWebhookServiceFile -Force
Write-Host "✓ Copied: webhook_service.py → dashboard\services\webhook_service.py" -ForegroundColor Green

# Git operations for CRM
Write-Host "`nCommitting CRM changes to git..." -ForegroundColor White
git add customers/signals.py
git add dashboard/services/webhook_service.py
git status

Confirm-Step "Review the changes above. Ready to commit and push?"

git commit -m "Feature: Add CRM to POS webhook sender with customer signals"
Write-Host "✓ Changes committed" -ForegroundColor Green

Write-Host "`nPushing to Railway..." -ForegroundColor White
git push

Write-Host "✓ CRM backend deployed!" -ForegroundColor Green
Write-Host "  Deployment will take 2-3 minutes..." -ForegroundColor Gray

# ============================================
# STEP 5: Environment Variables Check
# ============================================
Write-Host "`n[STEP 5] Environment Variables Configuration" -ForegroundColor Cyan
Write-Host "─────────────────────────────────────────────────────────────────" -ForegroundColor Gray

Write-Host "`n⚠  Important: Configure these environment variables in Railway:" -ForegroundColor Yellow
Write-Host ""
Write-Host "CRM (ayende-crm-force):" -ForegroundColor White
Write-Host "  • POS_WEBHOOK_URL=https://pos-staging.ayendecx.com" -ForegroundColor Gray
Write-Host "  • ENABLE_CRM_SYNC=true" -ForegroundColor Gray
Write-Host "  • INTEGRATION_SECRET=<your-shared-secret>" -ForegroundColor Gray
Write-Host ""
Write-Host "POS (ayende-cx-pos-backend):" -ForegroundColor White
Write-Host "  • INTEGRATION_SECRET=<same-as-crm>" -ForegroundColor Gray
Write-Host ""
Write-Host "⚠  CRITICAL: INTEGRATION_SECRET must match exactly!" -ForegroundColor Red
Write-Host ""

Confirm-Step "Have you configured all environment variables in Railway?"

# ============================================
# STEP 6: Verification
# ============================================
Write-Host "`n[STEP 6] Verification" -ForegroundColor Cyan
Write-Host "─────────────────────────────────────────────────────────────────" -ForegroundColor Gray

Write-Host "`nWaiting for deployments to complete..." -ForegroundColor Yellow
Write-Host "This may take 3-5 minutes..." -ForegroundColor Gray
Start-Sleep -Seconds 10

Write-Host "`nTesting webhook health endpoint..." -ForegroundColor White
try {
    $response = Invoke-RestMethod -Uri "https://pos-staging.ayendecx.com/api/v1/webhooks/health" -Method Get
    if ($response.success) {
        Write-Host "✓ Webhook endpoint is healthy!" -ForegroundColor Green
        Write-Host "  Response: $($response.message)" -ForegroundColor Gray
    }
} catch {
    Write-Host "⚠  Could not reach webhook endpoint yet" -ForegroundColor Yellow
    Write-Host "  This is normal if deployment is still in progress" -ForegroundColor Gray
    Write-Host "  Wait a few more minutes and test manually" -ForegroundColor Gray
}

# ============================================
# COMPLETION
# ============================================
Write-Host "`n╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                  DEPLOYMENT COMPLETE!                          ║" -ForegroundColor Green
Write-Host "╚═══════════════════════════════════════════════════════════════╝" -ForegroundColor Green

Write-Host "`nNext Steps:" -ForegroundColor Cyan
Write-Host "  1. Wait 3-5 minutes for Railway deployments to complete" -ForegroundColor White
Write-Host "  2. Check Railway logs for any errors:" -ForegroundColor White
Write-Host "     railway logs --service ayende-cx-pos-backend --follow" -ForegroundColor Gray
Write-Host "     railway logs --service ayende-crm-force --follow" -ForegroundColor Gray
Write-Host "  3. Test by creating/updating a customer in CRM" -ForegroundColor White
Write-Host "  4. Verify customer syncs to POS" -ForegroundColor White
Write-Host ""
Write-Host "Documentation:" -ForegroundColor Cyan
Write-Host "  See CRM_TO_POS_WEBHOOK_IMPLEMENTATION_GUIDE.md for:" -ForegroundColor White
Write-Host "  • Complete testing instructions" -ForegroundColor Gray
Write-Host "  • Troubleshooting guide" -ForegroundColor Gray
Write-Host "  • Monitoring guidelines" -ForegroundColor Gray
Write-Host ""
Write-Host "Backups saved in case rollback is needed" -ForegroundColor Yellow
Write-Host ""
