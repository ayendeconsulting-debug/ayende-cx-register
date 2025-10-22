# Product Management API Documentation

## Authentication Required
All endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

---

## Product Endpoints

### 1. Get All Products
**GET** `/api/v1/products`

Get a paginated list of products with optional filtering.

**Query Parameters:**
- `page` (optional, default: 1) - Page number
- `limit` (optional, default: 20) - Items per page
- `search` (optional) - Search in name, SKU, barcode, description
- `categoryId` (optional) - Filter by category
- `isActive` (optional) - Filter by active status (true/false)
- `lowStock` (optional) - Show only low stock products (true/false)
- `sortBy` (optional, default: 'name') - Sort field
- `sortOrder` (optional, default: 'asc') - Sort order (asc/desc)

**Example Request:**
```bash
GET /api/v1/products?page=1&limit=20&search=cola&sortBy=price&sortOrder=desc
```

**Response:**
```json
{
  "success": true,
  "message": "Products retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "sku": "BEV-001",
      "name": "Coca Cola 500ml",
      "description": "Refreshing cola drink",
      "categoryId": "uuid",
      "price": "2.50",
      "costPrice": "1.20",
      "stockQuantity": 150,
      "lowStockAlert": 20,
      "barcode": "12345678901",
      "imageUrl": null,
      "isActive": true,
      "isTaxable": true,
      "loyaltyPoints": 5,
      "unit": "unit",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z",
      "category": {
        "id": "uuid",
        "name": "Beverages"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

---

### 2. Get Single Product
**GET** `/api/v1/products/:id`

Get detailed information about a specific product including stock movement history.

**Response:**
```json
{
  "success": true,
  "message": "Product retrieved successfully",
  "data": {
    "id": "uuid",
    "sku": "BEV-001",
    "name": "Coca Cola 500ml",
    "description": "Refreshing cola drink",
    "categoryId": "uuid",
    "price": "2.50",
    "costPrice": "1.20",
    "stockQuantity": 150,
    "lowStockAlert": 20,
    "barcode": "12345678901",
    "category": {
      "id": "uuid",
      "name": "Beverages",
      "description": "Drinks and refreshments"
    },
    "stockMovements": [
      {
        "id": "uuid",
        "movementType": "PURCHASE",
        "quantity": 50,
        "previousStock": 100,
        "newStock": 150,
        "reference": "PO-12345",
        "createdAt": "2025-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

---

### 3. Get Product by SKU
**GET** `/api/v1/products/sku/:sku`

Quickly lookup a product by its SKU.

**Example:**
```bash
GET /api/v1/products/sku/BEV-001
```

---

### 4. Get Product by Barcode
**GET** `/api/v1/products/barcode/:barcode`

Scan and retrieve product by barcode (useful for POS scanning).

**Example:**
```bash
GET /api/v1/products/barcode/12345678901
```

---

### 5. Create Product
**POST** `/api/v1/products`

**Authorization:** SUPER_ADMIN, ADMIN, INVENTORY_MANAGER

**Request Body:**
```json
{
  "sku": "BEV-003",
  "name": "Orange Juice 1L",
  "description": "Fresh orange juice",
  "categoryId": "uuid",
  "price": 4.99,
  "costPrice": 2.50,
  "stockQuantity": 50,
  "lowStockAlert": 10,
  "barcode": "12345678903",
  "imageUrl": "https://example.com/image.jpg",
  "unit": "bottle",
  "loyaltyPoints": 10,
  "isTaxable": true,
  "isActive": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "id": "uuid",
    "sku": "BEV-003",
    "name": "Orange Juice 1L",
    // ... full product details
  }
}
```

---

### 6. Update Product
**PUT** `/api/v1/products/:id`

**Authorization:** SUPER_ADMIN, ADMIN, INVENTORY_MANAGER

**Request Body** (all fields optional):
```json
{
  "name": "Orange Juice 1L (Fresh Squeezed)",
  "price": 5.99,
  "description": "Updated description",
  "lowStockAlert": 15
}
```

---

### 7. Delete Product
**DELETE** `/api/v1/products/:id`

**Authorization:** SUPER_ADMIN, ADMIN

Soft deletes a product (sets isActive to false).

**Response:**
```json
{
  "success": true,
  "message": "Product deleted successfully",
  "data": null
}
```

---

### 8. Adjust Stock
**POST** `/api/v1/products/:id/adjust-stock`

**Authorization:** SUPER_ADMIN, ADMIN, INVENTORY_MANAGER

**Request Body:**
```json
{
  "quantity": 50,
  "movementType": "PURCHASE",
  "reference": "PO-12345",
  "notes": "Weekly stock replenishment"
}
```

**Movement Types:**
- `PURCHASE` - Stock in (adds to inventory)
- `SALE` - Stock out (removes from inventory)
- `ADJUSTMENT` - Manual correction (can be + or -)
- `RETURN` - Customer return (adds to inventory)
- `DAMAGE` - Damaged goods (removes from inventory)
- `TRANSFER` - Transfer between locations

**Response:**
```json
{
  "success": true,
  "message": "Stock adjusted successfully",
  "data": {
    "product": {
      "id": "uuid",
      "stockQuantity": 200
    },
    "stockMovement": {
      "id": "uuid",
      "movementType": "PURCHASE",
      "quantity": 50,
      "previousStock": 150,
      "newStock": 200,
      "reference": "PO-12345",
      "notes": "Weekly stock replenishment",
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  }
}
```

---

### 9. Get Low Stock Products
**GET** `/api/v1/products/alerts/low-stock`

**Authorization:** SUPER_ADMIN, ADMIN, INVENTORY_MANAGER

Get all products where current stock is at or below the low stock alert threshold.

**Response:**
```json
{
  "success": true,
  "message": "Low stock products retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "sku": "BEV-001",
      "name": "Coca Cola 500ml",
      "stockQuantity": 15,
      "lowStockAlert": 20,
      "category": {
        "id": "uuid",
        "name": "Beverages"
      }
    }
  ]
}
```

---

### 10. Get Stock History
**GET** `/api/v1/products/:id/stock-history`

**Authorization:** SUPER_ADMIN, ADMIN, INVENTORY_MANAGER

**Query Parameters:**
- `limit` (optional, default: 50) - Number of movements to retrieve

**Response:**
```json
{
  "success": true,
  "message": "Stock history retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "productId": "uuid",
      "movementType": "SALE",
      "quantity": 10,
      "previousStock": 160,
      "newStock": 150,
      "reference": "TXN-20250101-001",
      "notes": "",
      "createdAt": "2025-01-01T10:30:00.000Z"
    }
  ]
}
```

---

## Category Endpoints

### 1. Get All Categories
**GET** `/api/v1/categories`

**Query Parameters:**
- `includeInactive` (optional, default: false) - Include inactive categories

**Response:**
```json
{
  "success": true,
  "message": "Categories retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "name": "Beverages",
      "description": "Drinks and refreshments",
      "isActive": true,
      "sortOrder": 1,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z",
      "_count": {
        "products": 5
      }
    }
  ]
}
```

---

### 2. Get Single Category
**GET** `/api/v1/categories/:id`

Get category with all its products.

**Response:**
```json
{
  "success": true,
  "message": "Category retrieved successfully",
  "data": {
    "id": "uuid",
    "name": "Beverages",
    "description": "Drinks and refreshments",
    "isActive": true,
    "sortOrder": 1,
    "products": [
      {
        "id": "uuid",
        "sku": "BEV-001",
        "name": "Coca Cola 500ml",
        "price": "2.50",
        "stockQuantity": 150,
        "isActive": true
      }
    ],
    "_count": {
      "products": 5
    }
  }
}
```

---

### 3. Create Category
**POST** `/api/v1/categories`

**Authorization:** SUPER_ADMIN, ADMIN

**Request Body:**
```json
{
  "name": "Frozen Foods",
  "description": "Frozen items",
  "sortOrder": 4,
  "isActive": true
}
```

---

### 4. Update Category
**PUT** `/api/v1/categories/:id`

**Authorization:** SUPER_ADMIN, ADMIN

**Request Body** (all fields optional):
```json
{
  "name": "Frozen & Chilled Foods",
  "description": "Frozen and refrigerated items",
  "sortOrder": 5
}
```

---

### 5. Delete Category
**DELETE** `/api/v1/categories/:id`

**Authorization:** SUPER_ADMIN, ADMIN

Cannot delete categories that have products. Must reassign or delete products first.

---

### 6. Reorder Categories
**POST** `/api/v1/categories/reorder`

**Authorization:** SUPER_ADMIN, ADMIN

Update the display order of multiple categories.

**Request Body:**
```json
[
  { "id": "uuid1", "sortOrder": 1 },
  { "id": "uuid2", "sortOrder": 2 },
  { "id": "uuid3", "sortOrder": 3 }
]
```

---

## Error Responses

All endpoints may return these error responses:

**400 Bad Request**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "price",
      "message": "Valid price is required"
    }
  ]
}
```

**401 Unauthorized**
```json
{
  "success": false,
  "message": "Invalid or expired token"
}
```

**403 Forbidden**
```json
{
  "success": false,
  "message": "You do not have permission to perform this action",
  "requiredRole": ["SUPER_ADMIN", "ADMIN"],
  "userRole": "CASHIER"
}
```

**404 Not Found**
```json
{
  "success": false,
  "message": "Product not found"
}
```

---

## Common Use Cases

### POS Barcode Scanning Flow
1. Scan barcode → `GET /products/barcode/12345678901`
2. Display product details
3. Add to cart (frontend state)
4. Process transaction (coming in Phase 2B)

### Inventory Management Flow
1. Check low stock → `GET /products/alerts/low-stock`
2. Create purchase order
3. Receive stock → `POST /products/:id/adjust-stock` (movementType: PURCHASE)
4. Verify → `GET /products/:id/stock-history`

### Daily Operations
1. Search product → `GET /products?search=cola`
2. View details → `GET /products/:id`
3. Sell item → Transaction API (Phase 2B)
4. Stock automatically updated

---

## Testing Tips

1. **Use Postman Collections** - Import endpoints and save requests
2. **Test with different roles** - Login as admin, then cashier
3. **Check stock movements** - Verify history after adjustments
4. **Test validation** - Try invalid data to see error messages
5. **Use the test script** - Run `.\test-product-api.ps1` for automated testing
