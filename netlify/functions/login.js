const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL,
});

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ ok: false, error: 'Method not allowed' }),
    };
  }

  try {
    const { email, password } = JSON.parse(event.body);
    if (!email || !password) {
      return {
        statusCode: 400,
        body: JSON.stringify({ ok: false, error: 'Email and password required' }),
      };
    }

    const lowerEmail = email.toLowerCase();

    const result = await pool.query('SELECT id, password_hash FROM users WHERE email = $1', [lowerEmail]);
    if (result.rowCount === 0) {
      return {
        statusCode: 401,
        body: JSON.stringify({ ok: false, error: 'User not found' }),
      };
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return {
        statusCode: 401,
        body: JSON.stringify({ ok: false, error: 'Invalid password' }),
      };
    }

    const token = generateToken({ id: user.id, email: lowerEmail });

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, message: 'Login successful', token }),
    };
  } catch (err) {
    console.error('Login error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: 'Server error' }),
    };
  }
};
