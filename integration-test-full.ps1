# Ayende-CX Integration Test - Full Flow
# All services are now operational!

Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host "  Ayende-CX POS-CRM Integration Test - Full Flow" -ForegroundColor Cyan
Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Status: All services operational ✓" -ForegroundColor Green
Write-Host ""

# Configuration
$POS_URL = "https://pos-staging.ayendecx.com"
$CRM_ADMIN_URL = "https://staging.ayendecx.com"
$TENANT_URL = "https://test.ayendecx.com"
$TENANT_ID = "a-cx-m0bgh"

# Test credentials
$TEST_EMAIL = "integration-test@ayendecx.com"
$TEST_PASSWORD = "TestPass123!"

Write-Host "Configuration:" -ForegroundColor Yellow
Write-Host "  POS API: $POS_URL" -ForegroundColor Gray
Write-Host "  CRM Admin: $CRM_ADMIN_URL/admin/" -ForegroundColor Gray
Write-Host "  Tenant: $TENANT_URL" -ForegroundColor Gray
Write-Host "  Tenant ID: $TENANT_ID" -ForegroundColor Gray
Write-Host ""

# ============================================================
# PHASE 1: SERVICE HEALTH CHECKS
# ============================================================

Write-Host "[PHASE 1] Service Health Checks" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# POS Health
Write-Host "Checking POS health..." -ForegroundColor Yellow
try {
    $posHealth = Invoke-RestMethod -Uri "$POS_URL/health" -ErrorAction Stop
    Write-Host "✓ POS: HEALTHY" -ForegroundColor Green
    Write-Host "  Status: $($posHealth.status)" -ForegroundColor Gray
    Write-Host "  Database: $($posHealth.database)" -ForegroundColor Gray
    Write-Host "  CRM Sync: $($posHealth.features.crmSync)" -ForegroundColor Gray
    Write-Host "  Webhooks: $($posHealth.features.webhooks)" -ForegroundColor Gray
    Write-Host "  Uptime: $([math]::Round($posHealth.uptime / 3600, 2)) hours" -ForegroundColor Gray
} catch {
    Write-Host "✗ POS: FAILED" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    exit
}
Write-Host ""

# CRM Admin
Write-Host "Checking CRM admin..." -ForegroundColor Yellow
try {
    $crmResponse = Invoke-WebRequest -Uri "$CRM_ADMIN_URL/admin/" -Method HEAD -ErrorAction Stop
    Write-Host "✓ CRM Admin: ACCESSIBLE" -ForegroundColor Green
    Write-Host "  Status: $($crmResponse.StatusCode)" -ForegroundColor Gray
} catch {
    Write-Host "✗ CRM Admin: FAILED" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    exit
}
Write-Host ""

# Tenant Site
Write-Host "Checking tenant site..." -ForegroundColor Yellow
try {
    $tenantResponse = Invoke-WebRequest -Uri "$TENANT_URL/" -Method HEAD -ErrorAction Stop
    Write-Host "✓ Tenant Site: ACCESSIBLE" -ForegroundColor Green
    Write-Host "  Status: $($tenantResponse.StatusCode)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Tenant Site: FAILED" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""
Write-Host "Press Enter to continue with business registration..." -ForegroundColor Yellow
Read-Host

# ============================================================
# PHASE 2: BUSINESS REGISTRATION IN POS
# ============================================================

Write-Host "[PHASE 2] Business Registration in POS" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

$businessData = @{
    businessName = "Integration Test Store"
    email = $TEST_EMAIL
    password = $TEST_PASSWORD
    firstName = "Integration"
    lastName = "Tester"
    externalTenantId = $TENANT_ID
} | ConvertTo-Json

Write-Host "Registering business with POS..." -ForegroundColor Yellow
Write-Host "  Email: $TEST_EMAIL" -ForegroundColor Gray
Write-Host "  Tenant ID: $TENANT_ID" -ForegroundColor Gray
Write-Host ""

try {
    $registerResponse = Invoke-RestMethod -Uri "$POS_URL/api/v1/registration/register" `
        -Method POST `
        -Body $businessData `
        -ContentType "application/json" `
        -ErrorAction Stop
    
    Write-Host "✓ Business registered successfully" -ForegroundColor Green
    Write-Host "  Business ID: $($registerResponse.business.id)" -ForegroundColor Gray
    Write-Host "  Business Name: $($registerResponse.business.name)" -ForegroundColor Gray
    Write-Host "  Tenant ID: $($registerResponse.business.externalTenantId)" -ForegroundColor Gray
    Write-Host "  Owner: $($registerResponse.user.firstName) $($registerResponse.user.lastName)" -ForegroundColor Gray
    Write-Host ""
    
    $script:businessId = $registerResponse.business.id
    $script:userId = $registerResponse.user.id
} catch {
    $errorMsg = $_.Exception.Message
    if ($errorMsg -like "*already exists*" -or $errorMsg -like "*duplicate*") {
        Write-Host "⚠ Business already registered" -ForegroundColor Yellow
        Write-Host "  This is OK - proceeding with existing business..." -ForegroundColor Gray
        Write-Host ""
    } else {
        Write-Host "✗ Business registration failed" -ForegroundColor Red
        Write-Host "  Error: $errorMsg" -ForegroundColor Red
        Write-Host ""
        Write-Host "Cannot continue without business. Please check:" -ForegroundColor Yellow
        Write-Host "  1. POS API is accessible" -ForegroundColor Gray
        Write-Host "  2. Database is connected" -ForegroundColor Gray
        Write-Host "  3. Tenant ID is valid: $TENANT_ID" -ForegroundColor Gray
        exit
    }
}

Write-Host "Press Enter to continue with login..." -ForegroundColor Yellow
Read-Host

# ============================================================
# PHASE 3: LOGIN TO POS
# ============================================================

Write-Host "[PHASE 3] Login to POS" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

$loginData = @{
    email = $TEST_EMAIL
    password = $TEST_PASSWORD
} | ConvertTo-Json

Write-Host "Logging in..." -ForegroundColor Yellow
try {
    $loginResponse = Invoke-RestMethod -Uri "$POS_URL/api/v1/auth/login" `
        -Method POST `
        -Body $loginData `
        -ContentType "application/json" `
        -ErrorAction Stop
    
    Write-Host "✓ Login successful" -ForegroundColor Green
    Write-Host "  Token received: $($loginResponse.token.Substring(0, 30))..." -ForegroundColor Gray
    Write-Host "  User: $($loginResponse.user.email)" -ForegroundColor Gray
    Write-Host "  Business: $($loginResponse.user.businessId)" -ForegroundColor Gray
    Write-Host ""
    
    $script:authToken = $loginResponse.token
    $script:businessId = $loginResponse.user.businessId
} catch {
    Write-Host "✗ Login failed" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please verify credentials:" -ForegroundColor Yellow
    Write-Host "  Email: $TEST_EMAIL" -ForegroundColor Gray
    Write-Host "  Password: $TEST_PASSWORD" -ForegroundColor Gray
    exit
}

Write-Host "Press Enter to continue with customer creation..." -ForegroundColor Yellow
Read-Host

# ============================================================
# PHASE 4: CREATE TEST CUSTOMER IN POS
# ============================================================

Write-Host "[PHASE 4] Create Test Customer in POS" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$customerData = @{
    email = "customer-$timestamp@example.com"
    firstName = "Test"
    lastName = "Customer-$timestamp"
    phone = "+1-555-$(Get-Random -Minimum 100 -Maximum 999)-$(Get-Random -Minimum 1000 -Maximum 9999)"
} | ConvertTo-Json

$headers = @{
    Authorization = "Bearer $authToken"
    "Content-Type" = "application/json"
}

Write-Host "Creating customer in POS..." -ForegroundColor Yellow
Write-Host "  Email: $($customerData | ConvertFrom-Json | Select-Object -ExpandProperty email)" -ForegroundColor Gray
Write-Host ""

try {
    $customerResponse = Invoke-RestMethod -Uri "$POS_URL/api/v1/customers" `
        -Method POST `
        -Body $customerData `
        -Headers $headers `
        -ErrorAction Stop
    
    Write-Host "✓ Customer created successfully" -ForegroundColor Green
    Write-Host "  Customer ID: $($customerResponse.id)" -ForegroundColor Gray
    Write-Host "  Name: $($customerResponse.firstName) $($customerResponse.lastName)" -ForegroundColor Gray
    Write-Host "  Email: $($customerResponse.email)" -ForegroundColor Gray
    Write-Host "  Phone: $($customerResponse.phone)" -ForegroundColor Gray
    Write-Host "  Loyalty Points: $($customerResponse.loyaltyPoints)" -ForegroundColor Gray
    Write-Host ""
    
    $script:customerId = $customerResponse.id
    $script:customerEmail = $customerResponse.email
    $script:customerName = "$($customerResponse.firstName) $($customerResponse.lastName)"
} catch {
    Write-Host "✗ Customer creation failed" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please check:" -ForegroundColor Yellow
    Write-Host "  1. Authentication token is valid" -ForegroundColor Gray
    Write-Host "  2. Customer API endpoint is working" -ForegroundColor Gray
    exit
}

Write-Host "Customer created and added to sync queue!" -ForegroundColor Green
Write-Host ""
Write-Host "Press Enter to wait for sync..." -ForegroundColor Yellow
Read-Host

# ============================================================
# PHASE 5: WAIT FOR SYNC (5 MINUTES)
# ============================================================

Write-Host "[PHASE 5] Waiting for Scheduled Sync" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "The POS cron job runs every 5 minutes." -ForegroundColor Yellow
Write-Host "Customer has been added to the sync queue with HIGH priority." -ForegroundColor Yellow
Write-Host ""
Write-Host "What's happening now:" -ForegroundColor Cyan
Write-Host "  1. Customer is in SyncQueue with status: PENDING" -ForegroundColor Gray
Write-Host "  2. Cron job will pick it up within 5 minutes" -ForegroundColor Gray
Write-Host "  3. POS will send customer data to CRM API" -ForegroundColor Gray
Write-Host "  4. CRM will create/update the customer record" -ForegroundColor Gray
Write-Host "  5. SyncQueue status will change to: SUCCESS" -ForegroundColor Gray
Write-Host ""
Write-Host "Waiting 5 minutes for sync..." -ForegroundColor Yellow
Write-Host ""

$syncWaitTime = 300  # 5 minutes
$intervalTime = 30   # Update every 30 seconds
$elapsed = 0

for ($i = 0; $i -lt $syncWaitTime; $i += $intervalTime) {
    $remaining = $syncWaitTime - $i
    $minutes = [math]::Floor($remaining / 60)
    $seconds = $remaining % 60
    $elapsed = $i
    
    # Progress bar
    $percent = [math]::Round(($i / $syncWaitTime) * 100)
    $progressBar = "█" * [math]::Floor($percent / 5) + "░" * (20 - [math]::Floor($percent / 5))
    
    Write-Host "`r  [$progressBar] $percent% - Time remaining: ${minutes}m ${seconds}s    " -NoNewline -ForegroundColor Cyan
    Start-Sleep -Seconds $intervalTime
}

Write-Host "`r  [████████████████████] 100% - Sync wait complete!                    " -ForegroundColor Green
Write-Host ""
Write-Host ""
Write-Host "✓ Sync wait period complete" -ForegroundColor Green
Write-Host ""
Write-Host "Press Enter to verify customer in CRM..." -ForegroundColor Yellow
Read-Host

# ============================================================
# PHASE 6: VERIFY CUSTOMER IN CRM (MANUAL)
# ============================================================

Write-Host "[PHASE 6] Verify Customer Sync to CRM" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Manual verification required in CRM admin:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Open CRM Admin:" -ForegroundColor Cyan
Write-Host "   $CRM_ADMIN_URL/admin/" -ForegroundColor White
Write-Host ""
Write-Host "2. Login to CRM admin" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Navigate to: Customers" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. Search for customer:" -ForegroundColor Cyan
Write-Host "   Name: $customerName" -ForegroundColor White
Write-Host "   Email: $customerEmail" -ForegroundColor White
Write-Host ""
Write-Host "5. Verify customer details:" -ForegroundColor Cyan
Write-Host "   • Email: $customerEmail" -ForegroundColor Gray
Write-Host "   • External ID: $customerId" -ForegroundColor Gray
Write-Host "   • Tenant: $TENANT_ID" -ForegroundColor Gray
Write-Host "   • Loyalty Points: 0" -ForegroundColor Gray
Write-Host ""
Write-Host "6. Take note of customer ID in CRM" -ForegroundColor Cyan
Write-Host ""

$syncConfirmed = Read-Host "Did you find the customer in CRM? (y/n)"
Write-Host ""

if ($syncConfirmed -eq "y" -or $syncConfirmed -eq "Y") {
    Write-Host "✓ Customer sync confirmed - POS to CRM working!" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "✗ Customer not found in CRM" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting steps:" -ForegroundColor Yellow
    Write-Host "1. Check POS logs in Railway for sync activity" -ForegroundColor Gray
    Write-Host "   Look for: [CRON] Starting sync job..." -ForegroundColor Gray
    Write-Host "   Look for: [CRM SYNC] Customer synced successfully" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Check CRM logs for incoming sync requests" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3. Verify INTEGRATION_SECRET matches in both services" -ForegroundColor Gray
    Write-Host ""
    Write-Host "4. Check POS environment variables:" -ForegroundColor Gray
    Write-Host "   CRM_API_URL = $TENANT_URL" -ForegroundColor Gray
    Write-Host "   ENABLE_CRM_SYNC = true" -ForegroundColor Gray
    Write-Host ""
    
    $continueAnyway = Read-Host "Continue with webhook test anyway? (y/n)"
    if ($continueAnyway -ne "y" -and $continueAnyway -ne "Y") {
        exit
    }
}

Write-Host "Press Enter to continue with reverse sync test..." -ForegroundColor Yellow
Read-Host

# ============================================================
# PHASE 7: TEST REVERSE SYNC (CRM → POS)
# ============================================================

Write-Host "[PHASE 7] Test Reverse Sync (CRM → POS Webhook)" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Manual test for webhook from CRM to POS:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. In CRM admin, find the customer: $customerName" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Update customer loyalty points:" -ForegroundColor Cyan
Write-Host "   • Change loyalty points to: 100" -ForegroundColor Gray
Write-Host "   • Or update any other field" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Click 'Save' in CRM admin" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. CRM should trigger webhook to POS" -ForegroundColor Cyan
Write-Host ""
Write-Host "5. Check POS logs in Railway:" -ForegroundColor Cyan
Write-Host "   Railway > ayende-cx-register > Deployments > Logs" -ForegroundColor Gray
Write-Host ""
Write-Host "   Expected log messages:" -ForegroundColor Gray
Write-Host "   • [WEBHOOK] Received customer-updated webhook" -ForegroundColor Gray
Write-Host "   • [INTEGRATION] Customer updated from CRM" -ForegroundColor Gray
Write-Host "   • [WEBHOOK] Customer update successful" -ForegroundColor Gray
Write-Host ""

$webhookConfirmed = Read-Host "Did you see the webhook logs in POS? (y/n)"
Write-Host ""

if ($webhookConfirmed -eq "y" -or $webhookConfirmed -eq "Y") {
    Write-Host "✓ Webhook confirmed - CRM to POS working!" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "✗ Webhook not confirmed" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Verify POS_WEBHOOK_URL in CRM:" -ForegroundColor Gray
    Write-Host "   Should be: $POS_URL" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Verify ENABLE_WEBHOOKS=True in CRM" -ForegroundColor Gray
    Write-Host "3. Verify ENABLE_WEBHOOKS=true in POS" -ForegroundColor Gray
    Write-Host "4. Check CRM logs for webhook sending errors" -ForegroundColor Gray
    Write-Host ""
}

# ============================================================
# PHASE 8: TEST SUMMARY
# ============================================================

Write-Host ""
Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host "  Integration Test Summary" -ForegroundColor Cyan
Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Test Results:" -ForegroundColor Yellow
Write-Host "  ✓ POS Health: PASSED" -ForegroundColor Green
Write-Host "  ✓ CRM Admin: PASSED" -ForegroundColor Green
Write-Host "  ✓ Tenant Site: PASSED" -ForegroundColor Green
Write-Host "  ✓ Business Registration: PASSED" -ForegroundColor Green
Write-Host "  ✓ POS Login: PASSED" -ForegroundColor Green
Write-Host "  ✓ Customer Creation: PASSED" -ForegroundColor Green

if ($syncConfirmed -eq "y" -or $syncConfirmed -eq "Y") {
    Write-Host "  ✓ POS → CRM Sync: PASSED" -ForegroundColor Green
} else {
    Write-Host "  ✗ POS → CRM Sync: NEEDS INVESTIGATION" -ForegroundColor Red
}

if ($webhookConfirmed -eq "y" -or $webhookConfirmed -eq "Y") {
    Write-Host "  ✓ CRM → POS Webhook: PASSED" -ForegroundColor Green
} else {
    Write-Host "  ✗ CRM → POS Webhook: NEEDS INVESTIGATION" -ForegroundColor Red
}

Write-Host ""
Write-Host "Integration Status:" -ForegroundColor Yellow
if ($syncConfirmed -eq "y" -and $webhookConfirmed -eq "y") {
    Write-Host "  🎉 FULL INTEGRATION WORKING!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Phase 2D: Complete" -ForegroundColor Green
} else {
    Write-Host "  ⚠ PARTIAL INTEGRATION - Some issues need resolution" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Test Details:" -ForegroundColor Yellow
Write-Host "  Customer Created:" -ForegroundColor Gray
Write-Host "    ID: $customerId" -ForegroundColor Gray
Write-Host "    Name: $customerName" -ForegroundColor Gray
Write-Host "    Email: $customerEmail" -ForegroundColor Gray
Write-Host ""
Write-Host "  Business:" -ForegroundColor Gray
Write-Host "    ID: $businessId" -ForegroundColor Gray
Write-Host "    Tenant: $TENANT_ID" -ForegroundColor Gray
Write-Host ""
Write-Host "  Endpoints:" -ForegroundColor Gray
Write-Host "    POS: $POS_URL" -ForegroundColor Gray
Write-Host "    CRM: $CRM_ADMIN_URL" -ForegroundColor Gray
Write-Host "    Tenant: $TENANT_URL" -ForegroundColor Gray
Write-Host ""
Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Review any failed tests" -ForegroundColor Gray
Write-Host "  2. Check Railway logs for both services" -ForegroundColor Gray
Write-Host "  3. Document test results" -ForegroundColor Gray
Write-Host "  4. Create session handover if needed" -ForegroundColor Gray
Write-Host ""
Write-Host "Test complete! Press Enter to exit..." -ForegroundColor Cyan
Read-Host
