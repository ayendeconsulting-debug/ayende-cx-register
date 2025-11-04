# TEST PRODUCT & CATEGORY CREATION
# Run this script to create test products and categories

$baseUrl = "https://pos-staging.ayendecx.com/api/v1"

# First, login to get token
$loginBody = @{
    username = "johnsmith"  # Change to your username
    password = "TestPass123!!"  # Change to your password
} | ConvertTo-Json

Write-Host "Logging in..." -ForegroundColor Cyan
$loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
$token = $loginResponse.data.accessToken
Write-Host "Login successful! Token obtained." -ForegroundColor Green

$headers = @{
    Authorization = "Bearer $token"
    "Content-Type" = "application/json"
}

# Create Categories
Write-Host "`nCreating categories..." -ForegroundColor Cyan

$categories = @(
    @{ name = "Beverages"; description = "Hot and cold drinks" },
    @{ name = "Food"; description = "Meals and snacks" },
    @{ name = "Electronics"; description = "Electronic devices and accessories" },
    @{ name = "Clothing"; description = "Apparel and accessories" }
)

$createdCategories = @()

foreach ($category in $categories) {
    try {
        $categoryBody = $category | ConvertTo-Json
        $response = Invoke-RestMethod -Uri "$baseUrl/categories" -Method POST -Body $categoryBody -Headers $headers
        Write-Host "✓ Created category: $($category.name)" -ForegroundColor Green
        $createdCategories += $response.data
    } catch {
        Write-Host "✗ Failed to create category: $($category.name) - $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Create Products
Write-Host "`nCreating products..." -ForegroundColor Cyan

$products = @(
    @{ 
        name = "Espresso"
        description = "Strong Italian coffee"
        price = 3.50
        cost = 1.50
        sku = "BEV-ESP-001"
        barcode = "123456789001"
        categoryId = $createdCategories[0].id
        stock = 100
        loyaltyPointsEarned = 5
    },
    @{ 
        name = "Cappuccino"
        description = "Espresso with steamed milk"
        price = 4.50
        cost = 2.00
        sku = "BEV-CAP-001"
        barcode = "123456789002"
        categoryId = $createdCategories[0].id
        stock = 100
        loyaltyPointsEarned = 7
    },
    @{ 
        name = "Croissant"
        description = "Fresh butter croissant"
        price = 3.00
        cost = 1.20
        sku = "FOOD-CRO-001"
        barcode = "123456789003"
        categoryId = $createdCategories[1].id
        stock = 50
        loyaltyPointsEarned = 5
    },
    @{ 
        name = "Sandwich"
        description = "Turkey and cheese sandwich"
        price = 7.50
        cost = 3.50
        sku = "FOOD-SAN-001"
        barcode = "123456789004"
        categoryId = $createdCategories[1].id
        stock = 30
        loyaltyPointsEarned = 10
    },
    @{ 
        name = "Wireless Mouse"
        description = "Ergonomic wireless mouse"
        price = 29.99
        cost = 15.00
        sku = "ELEC-MOU-001"
        barcode = "123456789005"
        categoryId = $createdCategories[2].id
        stock = 25
        loyaltyPointsEarned = 30
    },
    @{ 
        name = "T-Shirt"
        description = "Cotton crew neck t-shirt"
        price = 19.99
        cost = 8.00
        sku = "CLO-TSH-001"
        barcode = "123456789006"
        categoryId = $createdCategories[3].id
        stock = 50
        loyaltyPointsEarned = 20
    }
)

foreach ($product in $products) {
    try {
        $productBody = $product | ConvertTo-Json
        $response = Invoke-RestMethod -Uri "$baseUrl/products" -Method POST -Body $productBody -Headers $headers
        Write-Host "✓ Created product: $($product.name) - $($product.price)" -ForegroundColor Green
    } catch {
        Write-Host "✗ Failed to create product: $($product.name) - $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n✅ Setup complete!" -ForegroundColor Green
Write-Host "Categories created: $($createdCategories.Count)" -ForegroundColor Cyan
Write-Host "You can now view products at: https://pos-app.ayendecx.com" -ForegroundColor Cyan
