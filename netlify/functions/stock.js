const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.STOCK_DB_URL,
  ssl: { rejectUnauthorized: false },
});

exports.handler = async function(event, context) {
  try {
    if (event.httpMethod === 'GET') {
      const result = await pool.query('SELECT product_name, stock_quantity FROM product_stock ORDER BY product_name');
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        },
        body: JSON.stringify(result.rows.map(row => ({
          name: row.product_name || 'Unknown Product',
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
    console.error('API error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Internal Server Error', details: error.message }),
    };
  }
};
