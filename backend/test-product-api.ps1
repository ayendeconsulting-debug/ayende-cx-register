# Ayende-CX Product Management API Test Script
Write-Host "╔═══════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  Ayende-CX Product Management API Tests  ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════╝" -ForegroundColor Cyan

$baseUrl = "http://localhost:5000/api/v1"
$token = $null

# Function to make API calls
function Invoke-ApiRequest {
    param(
        [string]$Method,
        [string]$Endpoint,
        [object]$Body = $null,
        [bool]$RequiresAuth = $true
    )
    
    $uri = "$baseUrl$Endpoint"
    $headers = @{
        "Content-Type" = "application/json"
    }
    
    if ($RequiresAuth -and $token) {
        $headers["Authorization"] = "Bearer $token"
    }
    
    try {
        if ($Body) {
            $jsonBody = $Body | ConvertTo-Json -Depth 10
            $response = Invoke-RestMethod -Uri $uri -Method $Method -Headers $headers -Body $jsonBody
        } else {
            $response = Invoke-RestMethod -Uri $uri -Method $Method -Headers $headers
        }
        return $response
    } catch {
        Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# Test 1: Login as Admin
Write-Host "`n[1] Logging in as Admin..." -ForegroundColor Yellow
$loginBody = @{
    username = "admin"
    password = "admin123"
}

$loginResponse = Invoke-ApiRequest -Method POST -Endpoint "/auth/login" -Body $loginBody -RequiresAuth $false

if ($loginResponse) {
    $token = $loginResponse.data.accessToken
    Write-Host "✓ Login successful!" -ForegroundColor Green
    Write-Host "  User: $($loginResponse.data.user.firstName) $($loginResponse.data.user.lastName)" -ForegroundColor Gray
    Write-Host "  Role: $($loginResponse.data.user.role)" -ForegroundColor Gray
} else {
    Write-Host "✗ Login failed. Exiting..." -ForegroundColor Red
    exit
}

# Test 2: Get all categories
Write-Host "`n[2] Getting all categories..." -ForegroundColor Yellow
$categories = Invoke-ApiRequest -Method GET -Endpoint "/categories"

if ($categories) {
    Write-Host "✓ Retrieved $($categories.data.Count) categories" -ForegroundColor Green
    foreach ($cat in $categories.data) {
        Write-Host "  - $($cat.name) (Products: $($cat._count.products))" -ForegroundColor Gray
    }
} else {
    Write-Host "✗ Failed to retrieve categories" -ForegroundColor Red
}

# Get first category ID for testing
$categoryId = $categories.data[0].id

# Test 3: Get all products
Write-Host "`n[3] Getting all products..." -ForegroundColor Yellow
$products = Invoke-ApiRequest -Method GET -Endpoint "/products?limit=10"

if ($products) {
    Write-Host "✓ Retrieved $($products.data.Count) products (Page $($products.pagination.page) of $($products.pagination.totalPages))" -ForegroundColor Green
    Write-Host "  Total products: $($products.pagination.total)" -ForegroundColor Gray
    foreach ($prod in $products.data | Select-Object -First 3) {
        Write-Host "  - $($prod.name) (SKU: $($prod.sku)) - `$$($prod.price)" -ForegroundColor Gray
    }
} else {
    Write-Host "✗ Failed to retrieve products" -ForegroundColor Red
}

# Test 4: Search products
Write-Host "`n[4] Searching for 'Coca'..." -ForegroundColor Yellow
$searchResults = Invoke-ApiRequest -Method GET -Endpoint "/products?search=Coca"

if ($searchResults) {
    Write-Host "✓ Found $($searchResults.data.Count) matching products" -ForegroundColor Green
    foreach ($prod in $searchResults.data) {
        Write-Host "  - $($prod.name) - Stock: $($prod.stockQuantity)" -ForegroundColor Gray
    }
} else {
    Write-Host "✗ Search failed" -ForegroundColor Red
}

# Test 5: Get product by barcode
Write-Host "`n[5] Getting product by barcode (12345678901)..." -ForegroundColor Yellow
$barcodeProduct = Invoke-ApiRequest -Method GET -Endpoint "/products/barcode/12345678901"

if ($barcodeProduct) {
    Write-Host "✓ Product found!" -ForegroundColor Green
    Write-Host "  Name: $($barcodeProduct.data.name)" -ForegroundColor Gray
    Write-Host "  Price: `$$($barcodeProduct.data.price)" -ForegroundColor Gray
    Write-Host "  Stock: $($barcodeProduct.data.stockQuantity)" -ForegroundColor Gray
} else {
    Write-Host "✗ Product not found" -ForegroundColor Red
}

# Test 6: Create new product
Write-Host "`n[6] Creating new product..." -ForegroundColor Yellow
$newProduct = @{
    sku = "TEST-001"
    name = "Test Product"
    description = "This is a test product"
    categoryId = $categoryId
    price = 9.99
    costPrice = 5.00
    stockQuantity = 100
    lowStockAlert = 20
    barcode = "9999999999999"
    loyaltyPoints = 10
    isTaxable = $true
    isActive = $true
}

$createdProduct = Invoke-ApiRequest -Method POST -Endpoint "/products" -Body $newProduct

if ($createdProduct) {
    Write-Host "✓ Product created successfully!" -ForegroundColor Green
    Write-Host "  ID: $($createdProduct.data.id)" -ForegroundColor Gray
    Write-Host "  Name: $($createdProduct.data.name)" -ForegroundColor Gray
    Write-Host "  SKU: $($createdProduct.data.sku)" -ForegroundColor Gray
    $testProductId = $createdProduct.data.id
} else {
    Write-Host "✗ Failed to create product" -ForegroundColor Red
    $testProductId = $products.data[0].id  # Use existing product for remaining tests
}

# Test 7: Update product
Write-Host "`n[7] Updating product..." -ForegroundColor Yellow
$updateData = @{
    price = 12.99
    description = "Updated test product description"
}

$updatedProduct = Invoke-ApiRequest -Method PUT -Endpoint "/products/$testProductId" -Body $updateData

if ($updatedProduct) {
    Write-Host "✓ Product updated successfully!" -ForegroundColor Green
    Write-Host "  New price: `$$($updatedProduct.data.price)" -ForegroundColor Gray
} else {
    Write-Host "✗ Failed to update product" -ForegroundColor Red
}

# Test 8: Adjust stock (add stock)
Write-Host "`n[8] Adjusting stock (adding 50 units)..." -ForegroundColor Yellow
$stockAdjustment = @{
    quantity = 50
    movementType = "PURCHASE"
    reference = "PO-12345"
    notes = "Stock replenishment"
}

$stockResult = Invoke-ApiRequest -Method POST -Endpoint "/products/$testProductId/adjust-stock" -Body $stockAdjustment

if ($stockResult) {
    Write-Host "✓ Stock adjusted successfully!" -ForegroundColor Green
    Write-Host "  Previous stock: $($stockResult.data.stockMovement.previousStock)" -ForegroundColor Gray
    Write-Host "  New stock: $($stockResult.data.stockMovement.newStock)" -ForegroundColor Gray
} else {
    Write-Host "✗ Failed to adjust stock" -ForegroundColor Red
}

# Test 9: Get stock history
Write-Host "`n[9] Getting stock history..." -ForegroundColor Yellow
$stockHistory = Invoke-ApiRequest -Method GET -Endpoint "/products/$testProductId/stock-history?limit=5"

if ($stockHistory) {
    Write-Host "✓ Retrieved $($stockHistory.data.Count) stock movements" -ForegroundColor Green
    foreach ($movement in $stockHistory.data | Select-Object -First 3) {
        Write-Host "  - $($movement.movementType): $($movement.quantity) units" -ForegroundColor Gray
    }
} else {
    Write-Host "✗ Failed to get stock history" -ForegroundColor Red
}

# Test 10: Get low stock products
Write-Host "`n[10] Getting low stock alerts..." -ForegroundColor Yellow
$lowStockProducts = Invoke-ApiRequest -Method GET -Endpoint "/products/alerts/low-stock"

if ($lowStockProducts) {
    if ($lowStockProducts.data.Count -gt 0) {
        Write-Host "✓ Found $($lowStockProducts.data.Count) low stock products" -ForegroundColor Yellow
        foreach ($prod in $lowStockProducts.data | Select-Object -First 3) {
            Write-Host "  - $($prod.name): $($prod.stockQuantity) units (Alert at: $($prod.lowStockAlert))" -ForegroundColor Gray
        }
    } else {
        Write-Host "✓ No low stock products" -ForegroundColor Green
    }
} else {
    Write-Host "✗ Failed to get low stock products" -ForegroundColor Red
}

# Test 11: Create new category
Write-Host "`n[11] Creating new category..." -ForegroundColor Yellow
$newCategory = @{
    name = "Test Category"
    description = "This is a test category"
    sortOrder = 99
}

$createdCategory = Invoke-ApiRequest -Method POST -Endpoint "/categories" -Body $newCategory

if ($createdCategory) {
    Write-Host "✓ Category created successfully!" -ForegroundColor Green
    Write-Host "  Name: $($createdCategory.data.name)" -ForegroundColor Gray
    $testCategoryId = $createdCategory.data.id
} else {
    Write-Host "✗ Failed to create category" -ForegroundColor Red
}

# Test 12: Filter products by category
Write-Host "`n[12] Filtering products by category..." -ForegroundColor Yellow
$filteredProducts = Invoke-ApiRequest -Method GET -Endpoint "/products?categoryId=$categoryId"

if ($filteredProducts) {
    Write-Host "✓ Found $($filteredProducts.data.Count) products in category" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to filter products" -ForegroundColor Red
}

# Test 13: Get single product details
Write-Host "`n[13] Getting detailed product information..." -ForegroundColor Yellow
$productDetails = Invoke-ApiRequest -Method GET -Endpoint "/products/$testProductId"

if ($productDetails) {
    Write-Host "✓ Product details retrieved!" -ForegroundColor Green
    Write-Host "  Name: $($productDetails.data.name)" -ForegroundColor Gray
    Write-Host "  Category: $($productDetails.data.category.name)" -ForegroundColor Gray
    Write-Host "  Stock: $($productDetails.data.stockQuantity)" -ForegroundColor Gray
    Write-Host "  Recent movements: $($productDetails.data.stockMovements.Count)" -ForegroundColor Gray
} else {
    Write-Host "✗ Failed to get product details" -ForegroundColor Red
}

# Summary
Write-Host "`n╔═══════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║          Test Summary Complete            ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host "`nAll Product Management API tests completed!" -ForegroundColor Green
Write-Host "`nYou can now test these endpoints with Postman or continue with Transaction Processing!" -ForegroundColor Yellow
