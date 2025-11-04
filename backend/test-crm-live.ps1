# PowerShell script to test JWT token against live CRM endpoint
# Updated with fresh token from test-jwt-esm.js
# Usage: .\test-crm-live.ps1

Write-Host "======================================================================"
Write-Host "TESTING JWT TOKEN AGAINST LIVE CRM ENDPOINT"
Write-Host "======================================================================"
Write-Host ""

# Fresh token from test-jwt-esm.js output
$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJheWVuZGUtcG9zIiwic2NvcGUiOiJpbnRlZ3JhdGlvbiIsInN1YiI6InN5c3RlbS10by1zeXN0ZW0iLCJ0ZW5hbnRJZCI6ImEtY3gtaWlvajciLCJzb3VyY2UiOiJwb3MiLCJ0aW1lc3RhbXAiOjE3NjIyNzA0MDQ4MzAsImlhdCI6MTc2MjI3MDQwNCwiZXhwIjoxNzYyMjc0MDA0fQ.YAAccp4S_eAeZJdlzt7Nv4RrSeM3zFO41AtwknAVkNM"

# CRM endpoint
$crmUrl = "https://staging.ayendecx.com/api/v1/sync/transaction"

Write-Host "Testing token against: $crmUrl"
Write-Host ""
Write-Host "Token Details:"
Write-Host "  - iss: ayende-pos (Required)"
Write-Host "  - scope: integration (Required)"
Write-Host "  - tenantId: a-cx-iioj7"
Write-Host "  - Algorithm: HS256"
Write-Host "  - Expires: 1 hour from generation"
Write-Host ""
Write-Host "Token (first 50 chars): $($token.Substring(0, 50))..."
Write-Host ""

# Prepare the request
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$body = @{
    test = "data"
    tenantId = "a-cx-iioj7"
} | ConvertTo-Json

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
    Write-Host "Response Headers:"
    $response.Headers | Format-Table
    Write-Host ""
    Write-Host "Response Body:"
    Write-Host $response.Content
    Write-Host ""
    Write-Host "CONCLUSION:"
    Write-Host "The token is ACCEPTED by the CRM! This means the issue is with"
    Write-Host "how crmSyncService.js generates tokens on Railway."
    
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
    
    if ($statusCode -eq 401) {
        Write-Host "401 UNAUTHORIZED - Token Rejected by CRM" -ForegroundColor Red
        Write-Host ""
        Write-Host "CRITICAL FINDING:" -ForegroundColor Yellow
        Write-Host "Even though our locally generated token has the correct format,"
        Write-Host "the CRM is still rejecting it. This could mean:"
        Write-Host ""
        Write-Host "1. INTEGRATION_SECRET on CRM does not match what we are using"
        Write-Host "2. CRM has additional validation we are not aware of"
        Write-Host "3. Middleware is blocking the request before authentication"
        Write-Host "4. CRM authentication.py has been modified"
        Write-Host ""
        Write-Host "Response Body:" -ForegroundColor Yellow
        try {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host $responseBody
            Write-Host ""
        } catch {
            Write-Host "Could not read response body"
        }
        
        Write-Host "NEXT STEPS:" -ForegroundColor Cyan
        Write-Host "1. Verify INTEGRATION_SECRET on CRM Railway service"
        Write-Host "2. Add debug logging to CRM authentication.py"
        Write-Host "3. Check CRM logs to see what error is being logged"
        Write-Host "4. Verify TenantMiddleware is not blocking the request"
        
    } elseif ($statusCode -eq 404) {
        Write-Host "404 NOT FOUND - Endpoint Does Not Exist" -ForegroundColor Red
        Write-Host ""
        Write-Host "The endpoint does not exist or middleware blocked it."
        Write-Host "This could mean:"
        Write-Host ""
        Write-Host "1. TenantMiddleware is still blocking /api/v1/sync/ paths"
        Write-Host "2. The URL routing in CRM is incorrect"
        Write-Host "3. The CRM service is not running properly"
        Write-Host ""
        Write-Host "NEXT STEPS:" -ForegroundColor Cyan
        Write-Host "1. Check CRM middleware.py excludes /api/v1/sync/"
        Write-Host "2. Verify CRM urls.py has the sync endpoint registered"
        Write-Host "3. Check CRM Railway logs for routing errors"
        
    } elseif ($statusCode -eq 500) {
        Write-Host "500 INTERNAL SERVER ERROR - CRM Has a Bug" -ForegroundColor Red
        Write-Host ""
        Write-Host "The CRM is crashing when processing our request."
        Write-Host ""
        Write-Host "Response Body:" -ForegroundColor Yellow
        try {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host $responseBody
            Write-Host ""
        } catch {
            Write-Host "Could not read response body"
        }
        
        Write-Host "NEXT STEPS:" -ForegroundColor Cyan
        Write-Host "1. Check CRM Railway logs for Python errors"
        Write-Host "2. Verify CRM database connection"
        Write-Host "3. Check CRM sync_views.py for bugs"
        
    } else {
        Write-Host "Unexpected Error Code: $statusCode" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Error Details:" -ForegroundColor Yellow
        Write-Host $_.Exception.Message
        Write-Host ""
        try {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host "Response Body:"
            Write-Host $responseBody
        } catch {
            Write-Host "Could not read response body"
        }
    }
}

Write-Host ""
Write-Host "======================================================================"
Write-Host "TEST COMPLETE"
Write-Host "======================================================================"
Write-Host ""
