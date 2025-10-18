const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.STOCK_DB_URL,
  ssl: { rejectUnauthorized: false },
});

exports.handler = async function(event, context) {
  try {
    if (event.httpMethod === 'GET') {
      const result = await pool.query('SELECT product_id, product_name, in_stock FROM product_stock ORDER BY product_name');
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        },
        body: JSON.stringify(result.rows),
      };
    } else if (event.httpMethod === 'POST') {
      const { product_id, stock_quantity } = JSON.parse(event.body);
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
        'UPDATE product_stock SET in_stock = $1, last_updated = CURRENT_TIMESTAMP WHERE product_id = $2 RETURNING *',
        [in_stock, product_id]
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
