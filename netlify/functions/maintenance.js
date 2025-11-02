const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_qn6wAlZJavf3@SCRAMBLED_Longtoken(32+)_3b568c4b14986e27.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  ssl: { rejectUnauthorized: false },
});

exports.handler = async function(event, context) {
  try {
    // Test database connection first
    await pool.query('SELECT 1');

    // Create maintenance table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS site_maintenance (
        id SERIAL PRIMARY KEY,
        active BOOLEAN DEFAULT false,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Ensure there's always one row
    const countResult = await pool.query('SELECT COUNT(*) FROM site_maintenance');
    if (parseInt(countResult.rows[0].count) === 0) {
      await pool.query('INSERT INTO site_maintenance (active) VALUES (false)');
    }

    if (event.httpMethod === 'GET') {
      const result = await pool.query('SELECT active FROM site_maintenance LIMIT 1');
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        },
        body: JSON.stringify({ active: result.rows[0].active }),
      };
    } else if (event.httpMethod === 'POST') {
      const { active } = JSON.parse(event.body);
      await pool.query(
        'UPDATE site_maintenance SET active = $1, last_updated = CURRENT_TIMESTAMP',
        [active]
      );
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        },
        body: JSON.stringify({ success: true }),
      };
    } else if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        },
        body: '',
      };
    } else {
      return {
        statusCode: 405,
        body: 'Method Not Allowed',
      };
    }
  } catch (error) {
    console.error('Database error:', error);

    // Fallback to localStorage-like behavior (but this won't work across devices)
    // Since we can't persist across devices without database, return false as safe default
    if (event.httpMethod === 'GET') {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ active: false }),
      };
    } else {
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Database error' }),
      };
    }
  }
};
