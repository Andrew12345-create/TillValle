const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_StsfT1R6ZyNi@ep-bold-silence-aiue9xsj-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  ssl: { rejectUnauthorized: false }
});

const realProducts = [
  // Dairy
  { name: 'Fresh Milk', price: 120, category: 'Dairy', description: 'Pure, fresh milk from our farm.', image: 'milk.png', stock: 50 },
  { name: 'Farm Fresh Eggs', price: 25, category: 'Dairy', description: 'Fresh eggs from free-range chickens.', image: 'eggs.png', stock: 100 },
  { name: 'Pure Ghee', price: 600, category: 'Dairy', description: 'Traditional clarified butter.', image: 'ghee.png', stock: 20 },
  { name: 'Honey', price: 400, category: 'Dairy', description: 'Pure, natural honey from local beekeepers.', image: 'honey.png', stock: 30 },
  
  // Meat
  { name: 'Free-Range Chicken', price: 800, category: 'Meat', description: 'Healthy, free-range chicken.', image: 'chicken.png', stock: 15 },
  
  // Fruits
  { name: 'Bananas', price: 150, category: 'Fruits', description: 'Fresh bananas, perfect for snacking.', image: 'bananas-ripe.png', stock: 60 },
  { name: 'Oranges', price: 200, category: 'Fruits', description: 'Juicy oranges, rich in vitamin C.', image: 'oranges.png', stock: 40 },
  { name: 'Watermelon', price: 250, category: 'Fruits', description: 'Sweet watermelon, perfect for hot days.', image: 'watermelon.png', stock: 25 },
  { name: 'Mangoes', price: 40, category: 'Fruits', description: 'Juicy mangoes, perfect for summer.', image: 'mangoes.png', stock: 80 },
  { name: 'Lemon', price: 20, category: 'Fruits', description: 'Fresh lemons for cooking and drinks.', image: 'lemon.png', stock: 100 },
  { name: 'Pawpaw', price: 120, category: 'Fruits', description: 'Sweet pawpaw fruit, rich in vitamins.', image: 'pawpaw.png', stock: 35 },
  { name: 'Pixies', price: 35, category: 'Fruits', description: 'Mini sweet oranges, great for snacking.', image: 'pixies.png', stock: 70 },
  { name: 'Avocadoes', price: 30, category: 'Fruits', description: 'Creamy avocados for healthy eating.', image: 'avocadoes.png', stock: 90 },
  { name: 'Yellow Passion', price: 25, category: 'Fruits', description: 'Tangy passion fruit for juices.', image: 'yellow-passion.png', stock: 60 },
  { name: 'Kiwi', price: 60, category: 'Fruits', description: 'Nutritious kiwi fruit, full of vitamin C.', image: 'kiwi.png', stock: 40 },
  { name: 'Raw Bananas', price: 100, category: 'Fruits', description: 'Green bananas for cooking.', image: 'raw-bananas.png', stock: 45 },
  { name: 'Dragon Fruit', price: 300, category: 'Fruits', description: 'Exotic dragon fruit, sweet and nutritious.', image: 'dragonfruit.png', stock: 20 },
  { name: 'Soursop', price: 250, category: 'Fruits', description: 'Tropical soursop fruit, great for juices.', image: 'soursop.png', stock: 15 },
  
  // Herbs
  { name: 'Basil', price: 50, category: 'Herbs', description: 'Fresh basil leaves for cooking.', image: 'basil.png', stock: 50 },
  { name: 'Coriander', price: 30, category: 'Herbs', description: 'Aromatic coriander leaves and seeds.', image: 'coriander.png', stock: 60 },
  { name: 'Mint', price: 40, category: 'Herbs', description: 'Fresh mint leaves for cooking and drinks.', image: 'mint.png', stock: 55 },
  { name: 'Parsley', price: 35, category: 'Herbs', description: 'Fresh parsley leaves for cooking.', image: 'parsley.png', stock: 50 },
  { name: 'Soursop Leaves', price: 200, category: 'Herbs', description: 'Medicinal soursop leaves.', image: 'soursop-herbs.png', stock: 25 },
  
  // Vegetables
  { name: 'Kales (Sukuma Wiki)', price: 30, category: 'Vegetables', description: 'Nutritious kales, perfect for sukuma wiki.', image: 'kales.png', stock: 80 },
  { name: 'Lettuce', price: 80, category: 'Vegetables', description: 'Fresh, crisp lettuce for salads.', image: 'lettuce.png', stock: 40 },
  { name: 'Managu', price: 40, category: 'Vegetables', description: 'Traditional African vegetable.', image: 'managu.png', stock: 50 },
  { name: 'Terere', price: 40, category: 'Vegetables', description: 'Fresh terere leaves for cooking.', image: 'terere.png', stock: 50 },
  { name: 'Salgaa', price: 20, category: 'Vegetables', description: 'Fresh salgaa for traditional dishes.', image: 'salgaa.png', stock: 60 },
  { name: 'Spinach', price: 30, category: 'Vegetables', description: 'Fresh spinach leaves, rich in iron.', image: 'spinach.png', stock: 70 },
  { name: 'Cauliflower', price: 80, category: 'Vegetables', description: 'Fresh cauliflower, perfect for healthy meals.', image: 'cauliflower.png', stock: 30 },
  { name: 'Broccoli', price: 70, category: 'Vegetables', description: 'Nutritious broccoli, rich in vitamins.', image: 'broccoli.png', stock: 35 },
  { name: 'Kunde', price: 40, category: 'Vegetables', description: 'Fresh kunde leaves for traditional dishes.', image: 'kunde.png', stock: 45 }
];

async function populateProducts() {
  try {
    console.log('🔄 Clearing existing products...');
    await pool.query('DELETE FROM product_stock');
    await pool.query('DELETE FROM products');
    
    console.log('📦 Inserting real products...');
    for (const product of realProducts) {
      await pool.query(
        'INSERT INTO products (name, price, category, description, image, stock) VALUES ($1, $2, $3, $4, $5, $6)',
        [product.name, product.price, product.category, product.description, product.image, product.stock]
      );
      
      await pool.query(
        'INSERT INTO product_stock (product_name, stock_quantity, in_stock) VALUES ($1, $2, $3)',
        [product.name, product.stock, product.stock > 0]
      );
    }
    
    console.log(`✅ Successfully added ${realProducts.length} products!`);
    console.log('🎉 Database populated with real products and images!');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

populateProducts();
