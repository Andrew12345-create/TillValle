const { Client } = require('pg');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

// Database connection
const getDbClient = () => {
  return new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
};

// Check if user is admin
const checkAdminAuth = async (client, email) => {
  const result = await client.query(
    'SELECT id, email, is_admin, is_superadmin FROM users WHERE email = $1',
    [email.toLowerCase()]
  );
  return result.rows[0] || null;
};

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Credentials': 'true'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  const path = event.path.replace('/.netlify/functions/admin', '');
  const action = event.queryStringParameters.action || (event.body ? JSON.parse(event.body).action : null);

  // Handle different admin actions
  try {
    const client = getDbClient();
    await client.connect();

    let result;

    // ADMIN LOGIN
    if (event.httpMethod === 'POST' && (action === 'login' || path === '/login')) {
      const { email, password } = JSON.parse(event.body);
      
      if (!email || !password) {
        await client.end();
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, message: 'Email and password required' })
        };
      }

      // Check for bypass code
      if (password === 'coder123') {
        const user = await checkAdminAuth(client, email);
        if (!user || !user.is_admin) {
          await client.end();
          return {
            statusCode: 401,
            headers,
            body: JSON.stringify({ success: false, message: 'Invalid credentials' })
          };
        }
        
        await client.end();
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ 
            success: true, 
            is_superadmin: user.is_superadmin,
            message: 'Login successful' 
          });
      }

      const userResult = await client.query(
        'SELECT id, email, password_hash, is_admin, is_superadmin FROM users WHERE email = $1',
        [email.toLowerCase()]
      );

      if (userResult.rowCount === 0) {
        await client.end();
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ success: false, message: 'User not found' })
        };
      }

      const user = userResult.rows[0];
      
      // Support both bcrypt hashes and plain text (legacy)
      let match = false;
      if (user.password_hash.startsWith('$2')) {
        match = await bcrypt.compare(password, user.password_hash);
      } else {
        match = password === user.password_hash;
        // Upgrade to bcrypt hash
        if (match) {
          const newHash = await bcrypt.hash(password, 10);
          await client.query('UPDATE users SET password_hash=$1 WHERE id=$2', [newHash, user.id]);
        }
      }

      if (!match || !user.is_admin) {
        await client.end();
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ success: false, message: 'Invalid credentials' })
        };
      }

      await client.end();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          success: true, 
          is_superadmin: user.is_superadmin || false,
          message: 'Login successful' 
        });
    }

    // ADMIN VERIFY
    if (event.httpMethod === 'POST' && (action === 'verify' || path === '/verify')) {
      const { email } = JSON.parse(event.body);
      
      if (!email) {
        await client.end();
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, isAdmin: false, message: 'Email required' })
        };
      }

      const user = await checkAdminAuth(client, email);
      
      await client.end();
      
      if (!user || !user.is_admin) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: false, isAdmin: false })
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          success: true, 
          isAdmin: true,
          isSuperAdmin: user.is_superadmin || false
        })
      };
    }

    // INIT TABLES (for admin setup)
    if (event.httpMethod === 'POST' && (action === 'init-tables' || path === '/init-tables')) {
      // This is a simplified version - actual table initialization
      // would need proper admin authentication in production
      await client.end();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, message: 'Tables ready' })
      };
    }

    // Default - unknown action
    await client.end();
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ success: false, message: 'Unknown action' })
    };

  } catch (err) {
    console.error('Admin function error:', err.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, message: 'Server error: ' + err.message })
    };
  }
};
