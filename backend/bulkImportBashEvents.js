/**
 * Bulk Product Import Script for Bash Events
 * 
 * This script creates:
 * - 9 Product Categories
 * - 60+ Products across all categories
 * - Realistic Nigerian Naira (₦) pricing
 * - Proper inventory quantities
 * 
 * Usage:
 * node bulkImportBashEvents.js
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const BUSINESS_ID = '1fcc7984-68c2-493c-a364-778c3a82cb66'; // Bash Events

// Categories to create
const categories = [
  { name: 'Tableware', description: 'Plates, cutlery, glasses, and dining accessories' },
  { name: 'Furniture', description: 'Chairs, tables, and seating arrangements' },
  { name: 'Lighting', description: 'Event lighting and ambiance equipment' },
  { name: 'Decor', description: 'Decorative items and accessories' },
  { name: 'Linens', description: 'Tablecloths, napkins, and fabric accessories' },
  { name: 'Serving Equipment', description: 'Chafing dishes, trays, and serving items' },
  { name: 'Nigerian Cuisine', description: 'Traditional Nigerian dishes and delicacies' },
  { name: 'English Cuisine', description: 'Classic English and Continental dishes' },
  { name: 'Beverages', description: 'Drinks and beverage packages' },
];

// Products to create
const products = [
  // TABLEWARE
  { name: 'White China Dinner Plates (10.5")', category: 'Tableware', price: 500, stock: 500, description: 'Classic white china dinner plates, perfect for formal events' },
  { name: 'Gold Rim Charger Plates', category: 'Tableware', price: 800, stock: 200, description: 'Elegant gold-rimmed charger plates for upscale events' },
  { name: 'Premium Stainless Steel Cutlery Set', category: 'Tableware', price: 300, stock: 300, description: 'Complete cutlery set - fork, knife, spoon' },
  { name: 'Crystal Wine Glasses', category: 'Tableware', price: 400, stock: 400, description: 'Premium crystal wine glasses' },
  { name: 'Champagne Flutes', category: 'Tableware', price: 400, stock: 300, description: 'Elegant champagne flutes for celebrations' },
  { name: 'Gold Plastic Forks (100-pack)', category: 'Tableware', price: 3500, stock: 50, description: 'Disposable gold plastic forks, pack of 100' },
  { name: 'White Linen Napkins', category: 'Tableware', price: 200, stock: 600, description: 'Premium white linen napkins' },
  { name: 'Glass Water Goblets', category: 'Tableware', price: 350, stock: 400, description: 'Classic glass water goblets' },
  { name: 'Dessert Plates (7")', category: 'Tableware', price: 300, stock: 400, description: 'Small plates for desserts and appetizers' },
  { name: 'Soup Bowls', category: 'Tableware', price: 350, stock: 300, description: 'White ceramic soup bowls' },

  // FURNITURE
  { name: 'White Chiavari Chairs', category: 'Furniture', price: 2500, stock: 200, description: 'Classic white chiavari chairs for elegant events' },
  { name: 'Gold Chiavari Chairs', category: 'Furniture', price: 2500, stock: 150, description: 'Luxurious gold chiavari chairs' },
  { name: 'Ghost Acrylic Chairs', category: 'Furniture', price: 3000, stock: 100, description: 'Modern transparent acrylic chairs' },
  { name: '6ft Rectangular Tables', category: 'Furniture', price: 5000, stock: 80, description: '6-foot rectangular banquet tables' },
  { name: '5ft Round Tables (seats 8)', category: 'Furniture', price: 6000, stock: 60, description: 'Round tables seating 8 guests' },
  { name: 'Cocktail High-Top Tables', category: 'Furniture', price: 4000, stock: 40, description: 'Standing cocktail tables for receptions' },
  { name: 'White Leather Lounge Sofa', category: 'Furniture', price: 15000, stock: 20, description: '3-seater white leather lounge sofa' },
  { name: 'Wooden Folding Chairs', category: 'Furniture', price: 1500, stock: 300, description: 'Durable wooden folding chairs' },
  { name: 'Bar Stools', category: 'Furniture', price: 2000, stock: 60, description: 'Modern bar stools for high tables' },
  { name: 'Kids Tables', category: 'Furniture', price: 3000, stock: 30, description: 'Child-sized tables for kids' },

  // LIGHTING
  { name: 'LED Uplighting (per unit)', category: 'Lighting', price: 8000, stock: 50, description: 'Wireless LED uplighting for ambiance' },
  { name: 'Fairy String Lights (100ft)', category: 'Lighting', price: 12000, stock: 40, description: 'Decorative fairy string lights' },
  { name: 'Crystal Chandelier', category: 'Lighting', price: 35000, stock: 10, description: 'Elegant crystal chandelier centerpiece' },
  { name: 'LED Dance Floor Lights', category: 'Lighting', price: 20000, stock: 15, description: 'Colorful LED lights for dance floor' },
  { name: 'Vintage Edison Bulb Strings', category: 'Lighting', price: 15000, stock: 25, description: 'Vintage-style Edison bulb strings' },
  { name: 'Colored LED Par Lights', category: 'Lighting', price: 10000, stock: 40, description: 'Professional LED par can lights' },
  { name: 'Spotlight', category: 'Lighting', price: 18000, stock: 20, description: 'Focused spotlight for stage/dance floor' },
  { name: 'Disco Ball with Motor', category: 'Lighting', price: 25000, stock: 8, description: 'Classic disco ball with rotating motor' },

  // DECOR
  { name: 'Floral Centerpiece (Large)', category: 'Decor', price: 12000, stock: 50, description: 'Large fresh floral centerpiece arrangement' },
  { name: 'Gold Candelabra (5-arm)', category: 'Decor', price: 8000, stock: 30, description: 'Elegant 5-arm gold candelabra' },
  { name: 'White Fabric Backdrop (20ft)', category: 'Decor', price: 25000, stock: 15, description: 'White draping backdrop for ceremonies' },
  { name: 'Decorative Pillars', category: 'Decor', price: 5000, stock: 40, description: 'Decorative columns for event styling' },
  { name: 'Photo Booth Backdrop Frame', category: 'Decor', price: 30000, stock: 10, description: 'Adjustable photo booth backdrop frame' },
  { name: 'Balloon Arch Kit', category: 'Decor', price: 15000, stock: 20, description: 'Complete balloon arch kit with stand' },
  { name: 'Red Carpet Runner (50ft)', category: 'Decor', price: 20000, stock: 12, description: 'Classic red carpet for VIP entrance' },

  // LINENS
  { name: 'White Tablecloth (6ft)', category: 'Linens', price: 2500, stock: 150, description: 'Premium white tablecloth for 6ft tables' },
  { name: 'Gold Satin Tablecloth (Round)', category: 'Linens', price: 3500, stock: 100, description: 'Luxurious gold satin tablecloth' },
  { name: 'White Chair Covers', category: 'Linens', price: 800, stock: 300, description: 'Universal white spandex chair covers' },
  { name: 'Gold Satin Sash', category: 'Linens', price: 400, stock: 400, description: 'Gold satin chair sashes' },
  { name: 'Table Runners (Gold)', category: 'Linens', price: 1500, stock: 100, description: 'Gold decorative table runners' },
  { name: 'Sequin Tablecloth (Silver)', category: 'Linens', price: 5000, stock: 50, description: 'Sparkly silver sequin tablecloth' },
  { name: 'Napkin Rings (Set of 10)', category: 'Linens', price: 2000, stock: 60, description: 'Decorative napkin rings' },

  // SERVING EQUIPMENT
  { name: 'Chafing Dish Set (Full Size)', category: 'Serving Equipment', price: 8000, stock: 40, description: 'Complete chafing dish with fuel holders' },
  { name: 'Crystal Punch Bowl', category: 'Serving Equipment', price: 12000, stock: 20, description: 'Large crystal punch bowl with ladle' },
  { name: 'Silver Serving Trays (Large)', category: 'Serving Equipment', price: 3000, stock: 60, description: 'Large silver serving platters' },
  { name: 'Beverage Dispenser (5 gallon)', category: 'Serving Equipment', price: 6000, stock: 30, description: 'Glass beverage dispenser with stand' },
  { name: 'Cake Stand (3-tier)', category: 'Serving Equipment', price: 5000, stock: 25, description: 'Elegant 3-tier cake display stand' },
  { name: 'Ice Bucket with Tongs', category: 'Serving Equipment', price: 3500, stock: 40, description: 'Stainless steel ice bucket' },

  // NIGERIAN CUISINE (Per Tray - serves 20-25)
  { name: 'Jollof Rice (Party Tray)', category: 'Nigerian Cuisine', price: 45000, stock: 0, description: 'Nigerian party jollof rice - serves 20-25 people' },
  { name: 'Fried Rice (Party Tray)', category: 'Nigerian Cuisine', price: 45000, stock: 0, description: 'Nigerian fried rice with vegetables - serves 20-25' },
  { name: 'Coconut Rice (Party Tray)', category: 'Nigerian Cuisine', price: 40000, stock: 0, description: 'Coconut-infused rice - serves 20-25' },
  { name: 'Pounded Yam with Egusi Soup (Tray)', category: 'Nigerian Cuisine', price: 55000, stock: 0, description: 'Traditional pounded yam with egusi - serves 15-20' },
  { name: 'Pounded Yam with Efo Riro (Tray)', category: 'Nigerian Cuisine', price: 55000, stock: 0, description: 'Pounded yam with vegetable soup - serves 15-20' },
  { name: 'Pepper Soup (Goat) - Large Pot', category: 'Nigerian Cuisine', price: 65000, stock: 0, description: 'Spicy goat pepper soup - serves 20-25' },
  { name: 'Suya Platter (Beef)', category: 'Nigerian Cuisine', price: 50000, stock: 0, description: 'Grilled suya beef platter - serves 20-25' },
  { name: 'Moi Moi (Party Pack - 50 pieces)', category: 'Nigerian Cuisine', price: 30000, stock: 0, description: 'Bean pudding, pack of 50' },
  { name: 'Puff Puff (Party Pack - 100 pieces)', category: 'Nigerian Cuisine', price: 20000, stock: 0, description: 'Deep fried dough balls, 100 pieces' },
  { name: 'Asun (Spicy Grilled Goat) - Tray', category: 'Nigerian Cuisine', price: 70000, stock: 0, description: 'Spicy grilled goat meat - serves 20-25' },
  { name: 'Nigerian Meat Pie (Party Pack - 50)', category: 'Nigerian Cuisine', price: 35000, stock: 0, description: 'Meat pies, pack of 50' },
  { name: 'Fried Plantain (Party Tray)', category: 'Nigerian Cuisine', price: 15000, stock: 0, description: 'Fried plantain - serves 20-25' },
  { name: 'Chin Chin (Party Pack - 5kg)', category: 'Nigerian Cuisine', price: 25000, stock: 0, description: 'Crunchy chin chin snacks, 5kg' },
  { name: 'Ayamase Sauce with Rice (Tray)', category: 'Nigerian Cuisine', price: 50000, stock: 0, description: 'Designer stew with rice - serves 20-25' },
  { name: 'Nigerian Spring Rolls (Pack of 50)', category: 'Nigerian Cuisine', price: 30000, stock: 0, description: 'Crispy spring rolls, 50 pieces' },
  { name: 'Grilled Chicken (Party Pack - 20)', category: 'Nigerian Cuisine', price: 55000, stock: 0, description: 'Grilled whole chickens, 20 pieces' },
  { name: 'Fried Fish (Party Pack)', category: 'Nigerian Cuisine', price: 60000, stock: 0, description: 'Fried fish platter - serves 20-25' },

  // ENGLISH CUISINE (Per Tray - serves 20-25)
  { name: 'Roast Beef with Yorkshire Pudding (Tray)', category: 'English Cuisine', price: 80000, stock: 0, description: 'Traditional roast beef - serves 20-25' },
  { name: 'Fish and Chips (Party Pack - 25)', category: 'English Cuisine', price: 65000, stock: 0, description: 'Classic fish and chips, 25 servings' },
  { name: 'Shepherd\'s Pie (Party Tray)', category: 'English Cuisine', price: 55000, stock: 0, description: 'Traditional shepherd\'s pie - serves 20-25' },
  { name: 'Bangers and Mash (Party Tray)', category: 'English Cuisine', price: 50000, stock: 0, description: 'Sausages with mashed potatoes - serves 20-25' },
  { name: 'Chicken Tikka Masala (Party Tray)', category: 'English Cuisine', price: 60000, stock: 0, description: 'British-Indian curry - serves 20-25' },
  { name: 'Sunday Roast Platter', category: 'English Cuisine', price: 75000, stock: 0, description: 'Complete Sunday roast - serves 20-25' },
  { name: 'Beef Wellington (Party Portion)', category: 'English Cuisine', price: 95000, stock: 0, description: 'Luxurious beef wellington - serves 15-20' },
  { name: 'Cottage Pie (Party Tray)', category: 'English Cuisine', price: 55000, stock: 0, description: 'Traditional cottage pie - serves 20-25' },
  { name: 'English Breakfast Platter', category: 'English Cuisine', price: 60000, stock: 0, description: 'Full English breakfast - serves 20-25' },
  { name: 'Coronation Chicken (Party Tray)', category: 'English Cuisine', price: 50000, stock: 0, description: 'Curried chicken salad - serves 20-25' },
  { name: 'Scones with Clotted Cream (Pack of 50)', category: 'English Cuisine', price: 35000, stock: 0, description: 'Traditional scones, 50 pieces' },
  { name: 'Victoria Sponge Cake (Large)', category: 'English Cuisine', price: 30000, stock: 0, description: 'Classic Victoria sponge - serves 20-25' },
  { name: 'Trifle (Party Portion)', category: 'English Cuisine', price: 35000, stock: 0, description: 'Traditional English trifle - serves 20-25' },
  { name: 'Bread and Butter Pudding (Tray)', category: 'English Cuisine', price: 30000, stock: 0, description: 'Classic dessert - serves 20-25' },

  // BEVERAGES
  { name: 'Chapman (Party Jug - 5L)', category: 'Beverages', price: 15000, stock: 0, description: 'Nigerian cocktail mix - serves 20-25' },
  { name: 'Zobo (Party Jug - 5L)', category: 'Beverages', price: 12000, stock: 0, description: 'Hibiscus drink - serves 20-25' },
  { name: 'Palm Wine (Per Bottle)', category: 'Beverages', price: 3500, stock: 0, description: 'Traditional palm wine' },
  { name: 'Nigerian Malt Drinks (Crate - 24)', category: 'Beverages', price: 8000, stock: 0, description: 'Assorted malt drinks, 24 bottles' },
  { name: 'English Tea Service (50 servings)', category: 'Beverages', price: 20000, stock: 0, description: 'Complete tea service with cups' },
  { name: 'Fresh Fruit Juice (Party Jug - 5L)', category: 'Beverages', price: 15000, stock: 0, description: 'Fresh mixed fruit juice - serves 20-25' },
  { name: 'Soft Drinks (Assorted Crate - 24)', category: 'Beverages', price: 7000, stock: 0, description: 'Assorted soft drinks, 24 bottles' },
  { name: 'Bottled Water (Carton - 24)', category: 'Beverages', price: 4000, stock: 0, description: 'Bottled water, 24 bottles' },
];

async function main() {
  console.log('🚀 Starting Bash Events Product Import...\n');

  try {
    // Verify business exists
    const business = await prisma.business.findUnique({
      where: { id: BUSINESS_ID }
    });

    if (!business) {
      throw new Error(`Business with ID ${BUSINESS_ID} not found!`);
    }

    console.log(`✅ Business found: ${business.name}\n`);

    // Create categories
    console.log('📁 Creating categories...');
    const createdCategories = {};

    for (const category of categories) {
      const created = await prisma.category.create({
        data: {
          businessId: BUSINESS_ID,
          name: category.name,
          description: category.description,
          isActive: true,
        }
      });
      createdCategories[category.name] = created.id;
      console.log(`   ✓ ${category.name}`);
    }

    console.log(`\n✅ Created ${Object.keys(createdCategories).length} categories\n`);

    // Create products
    console.log('📦 Creating products...');
    let productCount = 0;

    for (const product of products) {
      const categoryId = createdCategories[product.category];
      
      if (!categoryId) {
        console.log(`   ⚠️  Skipping ${product.name} - category not found`);
        continue;
      }

      await prisma.product.create({
        data: {
          businessId: BUSINESS_ID,
          categoryId: categoryId,
          name: product.name,
          description: product.description,
          price: product.price,
          cost: product.price * 0.6, // Assume 40% markup
          stockQuantity: product.stock,
          unit: 'piece',
          sku: `BASH-${Date.now()}-${productCount}`,
          barcode: null,
          isActive: true,
          trackInventory: product.stock > 0,
        }
      });

      productCount++;
      console.log(`   ✓ ${product.name} (₦${product.price.toLocaleString()})`);
    }

    console.log(`\n✅ Created ${productCount} products\n`);

    console.log('═══════════════════════════════════════');
    console.log('🎉 IMPORT COMPLETE!');
    console.log('═══════════════════════════════════════');
    console.log(`Categories: ${Object.keys(createdCategories).length}`);
    console.log(`Products: ${productCount}`);
    console.log('═══════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error during import:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
