const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_StsfT1R6ZyNi@ep-bold-silence-aiue9xsj-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  ssl: { rejectUnauthorized: false }
});

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    if (event.httpMethod === 'GET') {
      // Create products table if it doesn't exist
      await pool.query(`
        CREATE TABLE IF NOT EXISTS products (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          price DECIMAL(10,2) NOT NULL,
          category VARCHAR(100) NOT NULL,
          description TEXT NOT NULL,
          image VARCHAR(255),
          stock INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Check if table has data, if not insert sample products
      const countResult = await pool.query('SELECT COUNT(*) FROM products');
      if (parseInt(countResult.rows[0].count) === 0) {
        // Insert all real products from TillValle
        await pool.query(`
          INSERT INTO products (name, price, category, description, image, stock) VALUES
          ('Fresh Milk', 120, 'Dairy', 'Pure, fresh milk from our farm.', 'milk.png', 50),
          ('Farm Fresh Eggs', 25, 'Dairy', 'Fresh eggs from free-range chickens.', 'eggs.png', 100),
          ('Pure Ghee', 600, 'Dairy', 'Traditional clarified butter.', 'ghee.png', 20),
          ('Honey', 400, 'Dairy', 'Pure, natural honey from local beekeepers.', 'honey.png', 30),
          ('Free-Range Chicken', 800, 'Meat', 'Healthy, free-range chicken.', 'chicken.png', 15),
          ('Bananas', 150, 'Fruits', 'Fresh bananas, perfect for snacking.', 'bananas-ripe.png', 60),
          ('Oranges', 200, 'Fruits', 'Juicy oranges, rich in vitamin C.', 'oranges.png', 40),
          ('Watermelon', 250, 'Fruits', 'Sweet watermelon, perfect for hot days.', 'watermelon.png', 25),
          ('Mangoes', 40, 'Fruits', 'Juicy mangoes, perfect for summer.', 'mangoes.png', 80),
          ('Lemon', 20, 'Fruits', 'Fresh lemons for cooking and drinks.', 'lemon.png', 100),
          ('Pawpaw', 120, 'Fruits', 'Sweet pawpaw fruit, rich in vitamins.', 'pawpaw.png', 35),
          ('Pixies', 35, 'Fruits', 'Mini sweet oranges, great for snacking.', 'pixies.png', 70),
          ('Avocadoes', 30, 'Fruits', 'Creamy avocados for healthy eating.', 'avocadoes.png', 90),
          ('Kiwi', 60, 'Fruits', 'Nutritious kiwi fruit, full of vitamin C.', 'kiwi.png', 40),
          ('Raw Bananas', 100, 'Fruits', 'Green bananas for cooking.', 'raw-bananas.png', 45),
          ('Dragon Fruit', 300, 'Fruits', 'Exotic dragon fruit, sweet and nutritious.', 'dragonfruit.png', 20),
          ('Soursop', 250, 'Fruits', 'Tropical soursop fruit, great for juices.', 'soursop.png', 15),
          ('Basil', 50, 'Herbs', 'Fresh basil leaves for cooking.', 'basil.png', 50),
          ('Coriander', 30, 'Herbs', 'Aromatic coriander leaves and seeds.', 'coriander.png', 60),
          ('Mint', 40, 'Herbs', 'Fresh mint leaves for cooking and drinks.', 'mint.png', 55),
          ('Parsley', 35, 'Herbs', 'Fresh parsley leaves for cooking.', 'parsley.png', 50),
          ('Soursop Leaves', 200, 'Herbs', 'Medicinal soursop leaves.', 'soursop-herbs.png', 25),
          ('Kales (Sukuma Wiki)', 30, 'Vegetables', 'Nutritious kales, perfect for sukuma wiki.', 'kales.png', 80),
          ('Lettuce', 80, 'Vegetables', 'Fresh, crisp lettuce for salads.', 'lettuce.png', 40),
          ('Managu', 40, 'Vegetables', 'Traditional African vegetable.', 'managu.png', 50),
          ('Terere', 40, 'Vegetables', 'Fresh terere leaves for cooking.', 'terere.png', 50),
          ('Salgaa', 20, 'Vegetables', 'Fresh salgaa for traditional dishes.', 'salgaa.png', 60),
          ('Spinach', 30, 'Vegetables', 'Fresh spinach leaves, rich in iron.', 'spinach.png', 70),
          ('Cauliflower', 80, 'Vegetables', 'Fresh cauliflower, perfect for healthy meals.', 'cauliflower.png', 30),
          ('Broccoli', 70, 'Vegetables', 'Nutritious broccoli, rich in vitamins.', 'broccoli.png', 35),
          ('Kunde', 40, 'Vegetables', 'Fresh kunde leaves for traditional dishes.', 'kunde.png', 45)
        `);
        console.log('✅ Seeded products table with sample data');
      }

      const result = await pool.query('SELECT * FROM products ORDER BY name');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result.rows)
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to fetch products' })
    };
  }
};
