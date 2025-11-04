# PowerShell script to test JWT token with proper transaction data
# Usage: .\test-crm-with-transaction.ps1

Write-Host "======================================================================"
Write-Host "TESTING JWT TOKEN WITH TRANSACTION DATA"
Write-Host "======================================================================"
Write-Host ""

# Fresh token from test-jwt-esm.js output
$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJheWVuZGUtcG9zIiwic2NvcGUiOiJpbnRlZ3JhdGlvbiIsInN1YiI6InN5c3RlbS10by1zeXN0ZW0iLCJ0ZW5hbnRJZCI6ImEtY3gtaWlvajciLCJzb3VyY2UiOiJwb3MiLCJ0aW1lc3RhbXAiOjE3NjIyNzA0MDQ4MzAsImlhdCI6MTc2MjI3MDQwNCwiZXhwIjoxNzYyMjc0MDA0fQ.YAAccp4S_eAeZJdlzt7Nv4RrSeM3zFO41AtwknAVkNM"

# CRM endpoint
$crmUrl = "https://staging.ayendecx.com/api/v1/sync/transaction"

Write-Host "Testing token against: $crmUrl"
Write-Host ""

# Prepare the request with proper transaction data
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# Transaction data in the format CRM expects
$transactionData = @{
    transactionId = "test-$(Get-Date -Format 'yyyyMMddHHmmss')"
    businessId = "84b4e567-f249-402e-b5df-d9008862e59c"
    tenantId = "a-cx-iioj7"
    customer = @{
        email = "test@example.com"
        name = "Test Customer"
        phone = "1234567890"
    }
    amount = 100.00
    items = @(
        @{
            name = "Test Product"
            quantity = 1
            price = 100.00
        }
    )
    timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    status = "COMPLETED"
}

$body = $transactionData | ConvertTo-Json -Depth 10

Write-Host "Request Body:"
Write-Host $body
Write-Host ""
Write-Host "Sending POST request..."
Write-Host ""

try {
    # Send the request
    $response = Invoke-WebRequest -Uri $crmUrl -Method Post -Headers $headers -Body $body -UseBasicParsing
    
    Write-Host "======================================================================"
    Write-Host "SUCCESS!" -ForegroundColor Green
    Write-Host "======================================================================"
    Write-Host ""
    Write-Host "Status Code: $($response.StatusCode)"
    Write-Host "Status Description: $($response.StatusDescription)"
    Write-Host ""
    Write-Host "Response Body:"
    Write-Host $response.Content
    Write-Host ""
    Write-Host "CONCLUSION:"
    Write-Host "Transaction sync is working! Authentication passed and data accepted."
    
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    $statusDescription = $_.Exception.Response.StatusDescription
    
    Write-Host "======================================================================"
    Write-Host "REQUEST FAILED" -ForegroundColor Red
    Write-Host "======================================================================"
    Write-Host ""
    Write-Host "Status Code: $statusCode"
    Write-Host "Status Description: $statusDescription"
    Write-Host ""
    
    # Try to get response body
    Write-Host "Response Body:" -ForegroundColor Yellow
    try {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host $responseBody
        Write-Host ""
    } catch {
        Write-Host "Could not read response body"
        Write-Host ""
    }
    
    if ($statusCode -eq 400) {
        Write-Host "ANALYSIS:" -ForegroundColor Yellow
        Write-Host "400 Bad Request means authentication passed but data format is wrong."
        Write-Host "The CRM is expecting different fields or data structure."
        Write-Host ""
        Write-Host "NEXT STEPS:" -ForegroundColor Cyan
        Write-Host "1. Share sync_views.py to see what fields CRM expects"
        Write-Host "2. Check CRM logs for detailed error message"
        Write-Host "3. Compare with actual crmSyncService.js payload format"
        
    } elseif ($statusCode -eq 401) {
        Write-Host "ANALYSIS:" -ForegroundColor Yellow
        Write-Host "401 Unauthorized means token was rejected."
        Write-Host ""
        
    } elseif ($statusCode -eq 404) {
        Write-Host "ANALYSIS:" -ForegroundColor Yellow
        Write-Host "404 Not Found means endpoint does not exist or middleware blocked it."
        Write-Host ""
        
    } elseif ($statusCode -eq 500) {
        Write-Host "ANALYSIS:" -ForegroundColor Yellow
        Write-Host "500 Internal Server Error means CRM crashed processing the request."
        Write-Host ""
    }
}

Write-Host ""
Write-Host "======================================================================"
Write-Host "TEST COMPLETE"
Write-Host "======================================================================"
Write-Host ""
