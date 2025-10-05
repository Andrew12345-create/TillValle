const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.STOCK_DB_URL,
  ssl: { rejectUnauthorized: false },
});

exports.handler = async function(event, context) {
  try {
    if (event.httpMethod === 'GET') {
      const result = await pool.query('SELECT product_id, product_name, stock_quantity FROM product_stock ORDER BY product_name');
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result.rows),
      };
    } else if (event.httpMethod === 'POST') {
      const { product_id, stock_quantity } = JSON.parse(event.body);
      if (!product_id || typeof stock_quantity !== 'number' || stock_quantity < 0) {
        return { statusCode: 400, body: 'Invalid request body' };
      }
      const result = await pool.query(
        'UPDATE product_stock SET stock_quantity = $1, last_updated = CURRENT_TIMESTAMP WHERE product_id = $2 RETURNING *',
        [stock_quantity, product_id]
      );
      if (result.rowCount === 0) {
        return { statusCode: 404, body: 'Product not found' };
      }
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Stock updated', updated: result.rows[0] }),
      };
    } else {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }
  } catch (error) {
    console.error('API error:', error);
    return {
      statusCode: 500,
      body: 'Internal Server Error',
    };
  }
};
