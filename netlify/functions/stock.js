const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_qn6wAlZJavf3@SCRAMBLED_Longtoken(32+)_3b568c4b14986e27.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  ssl: { rejectUnauthorized: false },
});

exports.handler = async function(event, context) {
  try {
    // Test database connection first
    await pool.query('SELECT 1');
    
    if (event.httpMethod === 'GET') {
      // Create table and insert data if needed
      await pool.query(`
        CREATE TABLE IF NOT EXISTS product_stock (
          product_id SERIAL PRIMARY KEY,
          product_name VARCHAR(255) NOT NULL,
          stock_quantity INTEGER DEFAULT 0,
          in_stock BOOLEAN DEFAULT false,
          last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Check if table has data, if not insert sample data
      const countResult = await pool.query('SELECT COUNT(*) FROM product_stock');
      if (parseInt(countResult.rows[0].count) === 0) {
        await pool.query(`
          INSERT INTO product_stock (product_name, stock_quantity, in_stock) VALUES
          ('Fresh Milk', 25, true),
          ('Farm Fresh Eggs', 50, true),
          ('Apples', 30, true),
          ('Bananas', 15, true),
          ('Mangoes', 20, true),
          ('Avocados', 12, true),
          ('Kales', 18, true),
          ('Spinach', 22, true),
          ('Lettuce', 8, true),
          ('Basil', 10, true),
          ('Mint', 14, true),
          ('Free-Range Chicken', 5, true)
        `);
      }
      
      const result = await pool.query('SELECT product_id, product_name, stock_quantity FROM product_stock ORDER BY product_name');
      
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        },
        body: JSON.stringify(result.rows.map(row => ({
          product_id: row.product_id || row.product_name?.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          product_name: row.product_name || 'Unknown Product',
          name: row.product_name || 'Unknown Product',
          stock_quantity: parseInt(row.stock_quantity) || 0,
          quantity: parseInt(row.stock_quantity) || 0
        }))),
      };
    } else if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body);
      
      // Handle chatbot queries
      if (body.query) {
        const query = body.query.toLowerCase();
        const type = body.type || 'specific';
        
        if (type === 'all') {
          // Return all stock
          const result = await pool.query('SELECT product_name, stock_quantity FROM product_stock ORDER BY product_name');
          return {
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify(result.rows.map(row => ({
              name: row.product_name,
              quantity: row.stock_quantity || 0
            }))),
          };
        } else {
          // Search for specific products
          const result = await pool.query(
            'SELECT product_name, stock_quantity FROM product_stock WHERE LOWER(product_name) LIKE $1',
            [`%${query}%`]
          );
          return {
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify(result.rows.map(row => ({
              name: row.product_name,
              quantity: row.stock_quantity || 0
            }))),
          };
        }
      }
      
      // Handle admin stock updates
      const { product_id, stock_quantity } = body;
      if (!product_id || typeof stock_quantity !== 'number' || stock_quantity < 0) {
        return {
          statusCode: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify({ error: 'Invalid request body' }),
        };
      }
      const in_stock = stock_quantity > 0;
      const result = await pool.query(
        'UPDATE product_stock SET in_stock = $1, stock_quantity = $2, last_updated = CURRENT_TIMESTAMP WHERE product_id = $3 RETURNING *',
        [in_stock, stock_quantity, product_id]
      );
      if (result.rowCount === 0) {
        return {
          statusCode: 404,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify({ error: 'Product not found' }),
        };
      }
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ message: 'Stock updated', updated: result.rows[0] }),
      };
    } else {
      return {
        statusCode: 405,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Method Not Allowed' }),
      };
    }
  } catch (error) {
    console.error('Database error:', error);
    
    // Return fallback stock data if database fails
    const fallbackStock = [
      { name: 'Fresh Milk', quantity: 25 },
      { name: 'Farm Fresh Eggs', quantity: 50 },
      { name: 'Apples', quantity: 30 },
      { name: 'Bananas', quantity: 15 },
      { name: 'Mangoes', quantity: 20 },
      { name: 'Avocados', quantity: 12 },
      { name: 'Kales', quantity: 18 },
      { name: 'Spinach', quantity: 22 },
      { name: 'Lettuce', quantity: 8 },
      { name: 'Basil', quantity: 10 },
      { name: 'Mint', quantity: 14 },
      { name: 'Free-Range Chicken', quantity: 5 }
    ];
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(fallbackStock),
    };
  }
};
