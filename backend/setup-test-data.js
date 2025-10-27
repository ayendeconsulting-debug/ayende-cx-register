// setup-test-data.js
/**
 * Setup test data (category and product) for integration testing
 */

const POS_URL = "http://localhost:5000";
const API_VERSION = "v1";
const BUSINESS_ID = "e6fa01f0-857a-4e23-bc86-346a816cd4f4";

const TEST_USER = {
  username: "testadmin",
  password: "Admin123456",
};

let authToken = null;

async function authenticatedFetch(url, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  return fetch(url, {
    ...options,
    headers,
  });
}

async function login() {
  console.log("Logging in...");
  const response = await fetch(`${POS_URL}/api/${API_VERSION}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(TEST_USER),
  });

  const data = await response.json();
  authToken = data.data.accessToken;
  console.log(`✓ Logged in as ${data.data.user.username}\n`);
}

async function createCategory() {
  console.log("Creating test category...");

  const category = {
    name: "Test Beverages",
    description: "Test category for beverages",
    businessId: BUSINESS_ID,
  };

  const response = await authenticatedFetch(
    `${POS_URL}/api/${API_VERSION}/categories`,
    {
      method: "POST",
      body: JSON.stringify(category),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.log("Note: Category might already exist");
    console.log(error);
    return null;
  }

  const data = await response.json();
  console.log(`✓ Category created: ${data.data.name} (ID: ${data.data.id})\n`);
  return data.data.id;
}

async function getCategory() {
  console.log("Fetching existing category...");

  const response = await authenticatedFetch(
    `${POS_URL}/api/${API_VERSION}/categories?businessId=${BUSINESS_ID}&limit=1`
  );

  const data = await response.json();

  if (data.data && data.data.length > 0) {
    console.log(
      `✓ Using existing category: ${data.data[0].name} (ID: ${data.data[0].id})\n`
    );
    return data.data[0].id;
  }

  return null;
}

async function createProduct(categoryId) {
  console.log("Creating test product...");

  const product = {
    name: "Test Coffee",
    description: "Premium test coffee",
    price: 4.5,
    cost: 2.0,
    sku: `TEST-COFFEE-${Date.now()}`,
    barcode: `${Date.now()}`,
    categoryId: categoryId,
    businessId: BUSINESS_ID,
    stockQuantity: 100,
    lowStockThreshold: 10,
    isActive: true,
  };

  const response = await authenticatedFetch(
    `${POS_URL}/api/${API_VERSION}/products`,
    {
      method: "POST",
      body: JSON.stringify(product),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create product: ${error}`);
  }

  const data = await response.json();
  console.log(`✓ Product created: ${data.data.name}`);
  console.log(`  ID: ${data.data.id}`);
  console.log(`  Price: $${data.data.price}`);
  console.log(`  SKU: ${data.data.sku}`);
  console.log(`  Stock: ${data.data.stockQuantity}\n`);

  return data.data;
}

async function setup() {
  console.log("╔═══════════════════════════════════════════════════════════╗");
  console.log("║  SETUP TEST DATA                                          ║");
  console.log(
    "╚═══════════════════════════════════════════════════════════╝\n"
  );

  try {
    await login();

    // Try to get existing category first
    let categoryId = await getCategory();

    // If no category exists, create one
    if (!categoryId) {
      categoryId = await createCategory();
    }

    if (!categoryId) {
      console.error("❌ Could not get or create category");
      return;
    }

    // Create product
    const product = await createProduct(categoryId);

    console.log("═══════════════════════════════════════════════════════════");
    console.log("✓ Setup complete!");
    console.log("\nYou can now run: node test-authenticated-integration.js");
  } catch (error) {
    console.error("\n❌ Setup failed:", error.message);
  }
}

setup();
