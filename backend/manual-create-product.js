// manual-create-product.js
/**
 * Simple step-by-step product creation
 * Run this to manually create a test product
 */

const POS_URL = 'http://localhost:5000';

async function createProduct() {
  console.log('Manual Product Creation\n');
  console.log('Step 1: Login...');
  
  // Login
  const loginResponse = await fetch(`${POS_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'testadmin',
      password: 'Admin123456',
    }),
  });

  const loginData = await loginResponse.json();
  const token = loginData.data.accessToken;
  console.log('✓ Logged in\n');

  // Get or create category
  console.log('Step 2: Get categories...');
  const catResponse = await fetch(
    `${POS_URL}/api/v1/categories?businessId=e6fa01f0-857a-4e23-bc86-346a816cd4f4`,
    {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
    }
  );

  const catData = await catResponse.json();
  let categoryId;

  if (catData.data && catData.data.length > 0) {
    categoryId = catData.data[0].id;
    console.log(`✓ Using existing category: ${catData.data[0].name}\n`);
  } else {
    console.log('Creating new category...');
    const newCatResponse = await fetch(
      `${POS_URL}/api/v1/categories`,
      {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: 'Beverages',
          description: 'Drinks and beverages',
          businessId: 'e6fa01f0-857a-4e23-bc86-346a816cd4f4',
        }),
      }
    );
    
    const newCatData = await newCatResponse.json();
    
    if (!newCatResponse.ok) {
      console.error('Failed to create category:', newCatData);
      return;
    }
    
    categoryId = newCatData.data.id;
    console.log(`✓ Created category: ${newCatData.data.name}\n`);
  }

  // Create product
  console.log('Step 3: Create product...');
  const productResponse = await fetch(
    `${POS_URL}/api/v1/products`,
    {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Coffee',
        description: 'Regular coffee',
        price: 3.50,
        costPrice: 1.50,
        sku: `COFFEE-${Date.now()}`,
        barcode: `${Date.now()}`,
        categoryId: categoryId,
        businessId: 'e6fa01f0-857a-4e23-bc86-346a816cd4f4',
        stockQuantity: 100,
        lowStockAlert: 10,  // Changed from lowStockThreshold
        isActive: true,
      }),
    }
  );

  const productData = await productResponse.json();

  if (!productResponse.ok) {
    console.error('\n❌ Failed to create product:');
    console.error(JSON.stringify(productData, null, 2));
    return;
  }

  console.log('✓ Product created successfully!\n');
  console.log('Product details:');
  console.log(`  ID: ${productData.data.id}`);
  console.log(`  Name: ${productData.data.name}`);
  console.log(`  Price: $${productData.data.price}`);
  console.log(`  SKU: ${productData.data.sku}`);
  console.log(`  Stock: ${productData.data.stockQuantity}`);
  console.log(`  Category: ${categoryId}`);
}

createProduct().catch(console.error);