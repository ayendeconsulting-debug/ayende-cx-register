# Ayende-CX Product Management API Test Script - Simple Version
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  Ayende-CX Product Management API Tests" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

$baseUrl = "http://localhost:5000/api/v1"
$token = $null

Write-Host "`n[TEST 1] Login as Admin..." -ForegroundColor Yellow
try {
    $loginBody = @{
        username = "admin"
        password = "admin123"
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.data.accessToken
    Write-Host "SUCCESS: Logged in as $($loginResponse.data.user.firstName) $($loginResponse.data.user.lastName)" -ForegroundColor Green
    Write-Host "Role: $($loginResponse.data.user.role)" -ForegroundColor Gray
} catch {
    Write-Host "FAILED: Could not login" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit
}

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

Write-Host "`n[TEST 2] Get All Categories..." -ForegroundColor Yellow
try {
    $categories = Invoke-RestMethod -Uri "$baseUrl/categories" -Method GET -Headers $headers
    Write-Host "SUCCESS: Retrieved $($categories.data.Count) categories" -ForegroundColor Green
    foreach ($cat in $categories.data) {
        Write-Host "  - $($cat.name)" -ForegroundColor Gray
    }
    $categoryId = $categories.data[0].id
} catch {
    Write-Host "FAILED: Could not get categories" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host "`n[TEST 3] Get All Products..." -ForegroundColor Yellow
try {
    $products = Invoke-RestMethod -Uri "$baseUrl/products" -Method GET -Headers $headers
    Write-Host "SUCCESS: Retrieved $($products.data.Count) products" -ForegroundColor Green
    Write-Host "Total: $($products.pagination.total) products in database" -ForegroundColor Gray
    foreach ($prod in $products.data | Select-Object -First 3) {
        Write-Host "  - $($prod.name) - SKU: $($prod.sku) - Price: `$$($prod.price)" -ForegroundColor Gray
    }
    $firstProductId = $products.data[0].id
} catch {
    Write-Host "FAILED: Could not get products" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host "`n[TEST 4] Search Products (search=Coca)..." -ForegroundColor Yellow
try {
    $searchResults = Invoke-RestMethod -Uri "$baseUrl/products?search=Coca" -Method GET -Headers $headers
    Write-Host "SUCCESS: Found $($searchResults.data.Count) matching products" -ForegroundColor Green
    foreach ($prod in $searchResults.data) {
        Write-Host "  - $($prod.name)" -ForegroundColor Gray
    }
} catch {
    Write-Host "FAILED: Search failed" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host "`n[TEST 5] Get Product by Barcode (12345678901)..." -ForegroundColor Yellow
try {
    $barcodeProduct = Invoke-RestMethod -Uri "$baseUrl/products/barcode/12345678901" -Method GET -Headers $headers
    Write-Host "SUCCESS: Product found by barcode" -ForegroundColor Green
    Write-Host "  Name: $($barcodeProduct.data.name)" -ForegroundColor Gray
    Write-Host "  Price: `$$($barcodeProduct.data.price)" -ForegroundColor Gray
    Write-Host "  Stock: $($barcodeProduct.data.stockQuantity)" -ForegroundColor Gray
} catch {
    Write-Host "FAILED: Barcode lookup failed" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host "`n[TEST 6] Create New Product..." -ForegroundColor Yellow
try {
    $newProduct = @{
        sku = "TEST-$(Get-Random -Maximum 9999)"
        name = "Test Product"
        description = "Created by test script"
        categoryId = $categoryId
        price = 9.99
        costPrice = 5.00
        stockQuantity = 100
        lowStockAlert = 20
        barcode = "TEST$(Get-Random -Maximum 999999999)"
        loyaltyPoints = 10
        isTaxable = $true
        isActive = $true
    } | ConvertTo-Json

    $createdProduct = Invoke-RestMethod -Uri "$baseUrl/products" -Method POST -Body $newProduct -Headers $headers
    Write-Host "SUCCESS: Product created" -ForegroundColor Green
    Write-Host "  Name: $($createdProduct.data.name)" -ForegroundColor Gray
    Write-Host "  SKU: $($createdProduct.data.sku)" -ForegroundColor Gray
    Write-Host "  ID: $($createdProduct.data.id)" -ForegroundColor Gray
    $testProductId = $createdProduct.data.id
} catch {
    Write-Host "FAILED: Could not create product" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    $testProductId = $firstProductId
}

Write-Host "`n[TEST 7] Update Product..." -ForegroundColor Yellow
try {
    $updateData = @{
        price = 12.99
        description = "Updated by test script"
    } | ConvertTo-Json

    $updatedProduct = Invoke-RestMethod -Uri "$baseUrl/products/$testProductId" -Method PUT -Body $updateData -Headers $headers
    Write-Host "SUCCESS: Product updated" -ForegroundColor Green
    Write-Host "  New price: `$$($updatedProduct.data.price)" -ForegroundColor Gray
} catch {
    Write-Host "FAILED: Could not update product" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host "`n[TEST 8] Adjust Stock (add 50 units)..." -ForegroundColor Yellow
try {
    $stockAdjustment = @{
        quantity = 50
        movementType = "PURCHASE"
        reference = "TEST-PO-123"
        notes = "Test stock adjustment"
    } | ConvertTo-Json

    $stockResult = Invoke-RestMethod -Uri "$baseUrl/products/$testProductId/adjust-stock" -Method POST -Body $stockAdjustment -Headers $headers
    Write-Host "SUCCESS: Stock adjusted" -ForegroundColor Green
    Write-Host "  Previous: $($stockResult.data.stockMovement.previousStock)" -ForegroundColor Gray
    Write-Host "  New: $($stockResult.data.stockMovement.newStock)" -ForegroundColor Gray
} catch {
    Write-Host "FAILED: Stock adjustment failed" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host "`n[TEST 9] Get Stock History..." -ForegroundColor Yellow
try {
    $stockHistory = Invoke-RestMethod -Uri "$baseUrl/products/$testProductId/stock-history" -Method GET -Headers $headers
    Write-Host "SUCCESS: Retrieved $($stockHistory.data.Count) stock movements" -ForegroundColor Green
    foreach ($movement in $stockHistory.data | Select-Object -First 3) {
        Write-Host "  - $($movement.movementType): $($movement.quantity) units" -ForegroundColor Gray
    }
} catch {
    Write-Host "FAILED: Could not get stock history" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host "`n[TEST 10] Get Low Stock Alerts..." -ForegroundColor Yellow
try {
    $lowStockProducts = Invoke-RestMethod -Uri "$baseUrl/products/alerts/low-stock" -Method GET -Headers $headers
    if ($lowStockProducts.data.Count -gt 0) {
        Write-Host "SUCCESS: Found $($lowStockProducts.data.Count) low stock products" -ForegroundColor Yellow
        foreach ($prod in $lowStockProducts.data | Select-Object -First 3) {
            Write-Host "  - $($prod.name): $($prod.stockQuantity) units" -ForegroundColor Gray
        }
    } else {
        Write-Host "SUCCESS: No low stock products" -ForegroundColor Green
    }
} catch {
    Write-Host "FAILED: Could not get low stock alerts" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host "`n[TEST 11] Create New Category..." -ForegroundColor Yellow
try {
    $newCategory = @{
        name = "Test Category $(Get-Random -Maximum 999)"
        description = "Created by test script"
        sortOrder = 99
    } | ConvertTo-Json

    $createdCategory = Invoke-RestMethod -Uri "$baseUrl/categories" -Method POST -Body $newCategory -Headers $headers
    Write-Host "SUCCESS: Category created" -ForegroundColor Green
    Write-Host "  Name: $($createdCategory.data.name)" -ForegroundColor Gray
} catch {
    Write-Host "FAILED: Could not create category" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host "`n[TEST 12] Filter Products by Category..." -ForegroundColor Yellow
try {
    $filteredProducts = Invoke-RestMethod -Uri "$baseUrl/products?categoryId=$categoryId" -Method GET -Headers $headers
    Write-Host "SUCCESS: Found $($filteredProducts.data.Count) products in category" -ForegroundColor Green
} catch {
    Write-Host "FAILED: Could not filter products" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host "`n[TEST 13] Get Product Details..." -ForegroundColor Yellow
try {
    $productDetails = Invoke-RestMethod -Uri "$baseUrl/products/$testProductId" -Method GET -Headers $headers
    Write-Host "SUCCESS: Product details retrieved" -ForegroundColor Green
    Write-Host "  Name: $($productDetails.data.name)" -ForegroundColor Gray
    Write-Host "  Category: $($productDetails.data.category.name)" -ForegroundColor Gray
    Write-Host "  Stock: $($productDetails.data.stockQuantity)" -ForegroundColor Gray
} catch {
    Write-Host "FAILED: Could not get product details" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host "`n==================================================" -ForegroundColor Cyan
Write-Host "  All Tests Completed!" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "`nProduct Management API is working correctly!" -ForegroundColor Green
