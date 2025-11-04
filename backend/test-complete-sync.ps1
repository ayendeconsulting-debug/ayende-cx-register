# PowerShell script to test complete sync workflow: customer first, then transaction
# Usage: .\test-complete-sync.ps1

Write-Host "======================================================================"
Write-Host "TESTING COMPLETE POS-TO-CRM SYNC WORKFLOW"
Write-Host "======================================================================"
Write-Host ""

# Fresh token from test-jwt-esm.js output
$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJheWVuZGUtcG9zIiwic2NvcGUiOiJpbnRlZ3JhdGlvbiIsInN1YiI6InN5c3RlbS10by1zeXN0ZW0iLCJ0ZW5hbnRJZCI6ImEtY3gtaWlvajciLCJzb3VyY2UiOiJwb3MiLCJ0aW1lc3RhbXAiOjE3NjIyNzA0MDQ4MzAsImlhdCI6MTc2MjI3MDQwNCwiZXhwIjoxNzYyMjc0MDA0fQ.YAAccp4S_eAeZJdlzt7Nv4RrSeM3zFO41AtwknAVkNM"

$tenantId = "a-cx-iioj7"
$customerId = "test-customer-$(Get-Date -Format 'yyyyMMddHHmmss')"
$transactionId = "test-txn-$(Get-Date -Format 'yyyyMMddHHmmss')"

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

Write-Host "Test IDs:"
Write-Host "  Customer ID: $customerId"
Write-Host "  Transaction ID: $transactionId"
Write-Host "  Tenant ID: $tenantId"
Write-Host ""
Write-Host "======================================================================"
Write-Host "STEP 1: SYNCING CUSTOMER TO CRM"
Write-Host "======================================================================"
Write-Host ""

# Step 1: Create customer
$customerUrl = "https://staging.ayendecx.com/api/v1/sync/customer"

$customerData = @{
    customerId = $customerId
    tenantId = $tenantId
    email = "test@example.com"
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

Write-Host "Customer Data:"
Write-Host $customerBody
Write-Host ""
Write-Host "Sending customer to CRM..."
Write-Host ""

try {
    $customerResponse = Invoke-WebRequest -Uri $customerUrl -Method Post -Headers $headers -Body $customerBody -UseBasicParsing
    
    Write-Host "CUSTOMER SYNC SUCCESS!" -ForegroundColor Green
    Write-Host "Status Code: $($customerResponse.StatusCode)"
    Write-Host "Response:"
    Write-Host $customerResponse.Content
    Write-Host ""
    
} catch {
    Write-Host "CUSTOMER SYNC FAILED!" -ForegroundColor Red
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
Write-Host "STEP 2: SYNCING TRANSACTION TO CRM"
Write-Host "======================================================================"
Write-Host ""

# Step 2: Create transaction
$transactionUrl = "https://staging.ayendecx.com/api/v1/sync/transaction"

$transactionData = @{
    transactionId = $transactionId
    transactionNumber = "TXN-TEST-001"
    tenantId = $tenantId
    customerId = $customerId
    customerEmail = "test@example.com"
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
            productId = "test-product-1"
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

Write-Host "Transaction Data:"
Write-Host $transactionBody
Write-Host ""
Write-Host "Sending transaction to CRM..."
Write-Host ""

try {
    $transactionResponse = Invoke-WebRequest -Uri $transactionUrl -Method Post -Headers $headers -Body $transactionBody -UseBasicParsing
    
    Write-Host "TRANSACTION SYNC SUCCESS!" -ForegroundColor Green
    Write-Host "Status Code: $($transactionResponse.StatusCode)"
    Write-Host "Response:"
    Write-Host $transactionResponse.Content
    Write-Host ""
    
} catch {
    Write-Host "TRANSACTION SYNC FAILED!" -ForegroundColor Red
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
Write-Host "Summary:"
Write-Host "  Customer synced: $customerId"
Write-Host "  Transaction synced: $transactionId"
Write-Host "  Both operations completed successfully!"
Write-Host ""
Write-Host "NEXT STEPS:"
Write-Host "1. Verify JWT authentication is now working in production"
Write-Host "2. Update crmSyncService.js to ensure customer sync before transaction"
Write-Host "3. Test with real POS transactions"
Write-Host ""
