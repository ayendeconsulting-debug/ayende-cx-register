# PowerShell script to generate fresh JWT and test sync
# Usage: .\test-sync-fresh-token.ps1

Write-Host "======================================================================"
Write-Host "GENERATING FRESH JWT TOKEN AND TESTING SYNC"
Write-Host "======================================================================"
Write-Host ""

# Step 1: Generate fresh JWT token using Node.js
Write-Host "Step 1: Generating fresh JWT token..."
Write-Host ""

$nodeScript = @'
import jwt from 'jsonwebtoken';

const INTEGRATION_SECRET = 'CEMIQ6NfAMlh5pxB32Pma7jMt7a/OExkhJAyOCyaRAA=';
const TEST_TENANT_ID = 'a-cx-iioj7';

const payload = {
  iss: 'ayende-pos',
  scope: 'integration',
  sub: 'system-to-system',
  tenantId: TEST_TENANT_ID,
  source: 'pos',
  timestamp: Date.now(),
};

const token = jwt.sign(payload, INTEGRATION_SECRET, {
  expiresIn: '1h',
  algorithm: 'HS256'
});

console.log(token);
'@

# Save the Node.js script temporarily
$nodeScript | Out-File -FilePath "temp-token-gen.js" -Encoding UTF8

# Run Node.js to generate token
try {
    $token = node temp-token-gen.js
    Remove-Item "temp-token-gen.js"
    
    if (-not $token) {
        Write-Host "Failed to generate token" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "Fresh token generated successfully!" -ForegroundColor Green
    Write-Host "Token (first 50 chars): $($token.Substring(0, 50))..."
    Write-Host ""
    
} catch {
    Write-Host "Error generating token: $_" -ForegroundColor Red
    Remove-Item "temp-token-gen.js" -ErrorAction SilentlyContinue
    exit 1
}

$tenantId = "a-cx-iioj7"

# Generate proper UUIDs for testing
$customerId = [guid]::NewGuid().ToString()
$transactionId = [guid]::NewGuid().ToString()

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

Write-Host "======================================================================"
Write-Host "TESTING COMPLETE POS-TO-CRM SYNC WORKFLOW"
Write-Host "======================================================================"
Write-Host ""
Write-Host "Test IDs (UUIDs):"
Write-Host "  Customer ID: $customerId"
Write-Host "  Transaction ID: $transactionId"
Write-Host "  Tenant ID: $tenantId"
Write-Host ""
Write-Host "======================================================================"
Write-Host "STEP 2: SYNCING CUSTOMER TO CRM"
Write-Host "======================================================================"
Write-Host ""

# Step 2: Create customer
$customerUrl = "https://staging.ayendecx.com/api/v1/sync/customer"

$customerData = @{
    customerId = $customerId
    tenantId = $tenantId
    email = "test-$(Get-Date -Format 'HHmmss')@example.com"
    firstName = "Test"
    lastName = "Customer"
    phone = "1234567890"
    address = "123 Test St"
    city = "Test City"
    state = "TS"
    postalCode = "12345"
    zipCode = "12345"
    loyaltyPoints = 0
    loyaltyTier = "BRONZE"
    totalSpent = 0
    visitCount = 0
    lastVisit = $null
    marketingOptIn = $false
    notes = "Test customer created via sync test"
    isActive = $true
    updatedAt = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
}

$customerBody = $customerData | ConvertTo-Json -Depth 10

Write-Host "Sending customer to CRM..."
Write-Host ""

try {
    $customerResponse = Invoke-WebRequest -Uri $customerUrl -Method Post -Headers $headers -Body $customerBody -UseBasicParsing
    
    Write-Host "======================================================================"
    Write-Host "CUSTOMER SYNC SUCCESS!" -ForegroundColor Green
    Write-Host "======================================================================"
    Write-Host "Status Code: $($customerResponse.StatusCode)"
    Write-Host ""
    Write-Host "Response:"
    Write-Host $customerResponse.Content
    Write-Host ""
    
} catch {
    Write-Host "======================================================================"
    Write-Host "CUSTOMER SYNC FAILED!" -ForegroundColor Red
    Write-Host "======================================================================"
    Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)"
    Write-Host ""
    
    try {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body:"
        Write-Host $responseBody
    } catch {
        Write-Host "Could not read response body"
    }
    
    Write-Host ""
    Write-Host "Stopping test - customer sync must succeed before transaction sync"
    exit 1
}

Write-Host ""
Write-Host "======================================================================"
Write-Host "STEP 3: SYNCING TRANSACTION TO CRM"
Write-Host "======================================================================"
Write-Host ""

# Step 3: Create transaction
$transactionUrl = "https://staging.ayendecx.com/api/v1/sync/transaction"

$transactionData = @{
    transactionId = $transactionId
    transactionNumber = "TXN-TEST-$(Get-Date -Format 'yyyyMMddHHmmss')"
    tenantId = $tenantId
    customerId = $customerId
    customerEmail = $customerData.email
    amount = 90.00
    tax = 10.00
    discount = 0.00
    total = 100.00
    currency = "USD"
    paymentMethod = "CASH"
    pointsEarned = 100
    pointsRedeemed = 0
    items = @(
        @{
            productId = [guid]::NewGuid().ToString()
            productName = "Test Product"
            sku = "TEST-001"
            quantity = 1
            unitPrice = 90.00
            subtotal = 90.00
            discount = 0.00
            tax = 10.00
            total = 100.00
        }
    )
    status = "COMPLETED"
    notes = "Test transaction created via sync test"
    timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
}

$transactionBody = $transactionData | ConvertTo-Json -Depth 10

Write-Host "Sending transaction to CRM..."
Write-Host ""

try {
    $transactionResponse = Invoke-WebRequest -Uri $transactionUrl -Method Post -Headers $headers -Body $transactionBody -UseBasicParsing
    
    Write-Host "======================================================================"
    Write-Host "TRANSACTION SYNC SUCCESS!" -ForegroundColor Green
    Write-Host "======================================================================"
    Write-Host "Status Code: $($transactionResponse.StatusCode)"
    Write-Host ""
    Write-Host "Response:"
    Write-Host $transactionResponse.Content
    Write-Host ""
    
} catch {
    Write-Host "======================================================================"
    Write-Host "TRANSACTION SYNC FAILED!" -ForegroundColor Red
    Write-Host "======================================================================"
    Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)"
    Write-Host ""
    
    try {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body:"
        Write-Host $responseBody
    } catch {
        Write-Host "Could not read response body"
    }
    
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "======================================================================"
Write-Host "COMPLETE SYNC TEST SUCCESSFUL!"
Write-Host "======================================================================"
Write-Host ""
Write-Host "CRITICAL DISCOVERIES:"
Write-Host "  1. JWT authentication is WORKING with iss and scope fields!"
Write-Host "  2. Customer and transaction sync endpoints are operational"
Write-Host "  3. Customer IDs must be valid UUIDs"
Write-Host "  4. Customer must exist before transaction can be synced"
Write-Host ""
Write-Host "THE FIX THAT WORKED:"
Write-Host "  - Added 'iss: ayende-pos' to JWT payload"
Write-Host "  - Added 'scope: integration' to JWT payload"
Write-Host "  - These match CRM IntegrationJWTAuthentication requirements"
Write-Host ""
Write-Host "NEXT STEPS:"
Write-Host "  1. Deploy updated crmSyncService.js to Railway"
Write-Host "  2. Verify the JWT generation code is correct on Railway"
Write-Host "  3. Test with real POS transactions"
Write-Host ""
