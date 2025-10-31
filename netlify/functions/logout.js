const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'SCRAMBLED_Longtoken(32+)_27a8be7c6972a114': 'true',
};

exports.handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ ok: false, error: 'Method not allowed' }),
    };
  }

  try {
    // Here, session management depends on your setup.
    // If using cookies or JWT, clear them accordingly.
    // For example, clear cookies by setting expired Set-Cookie header.

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: true, message: 'Logout successful' }),
    };
  } catch (err) {
    console.error('Logout error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ ok: false, error: 'Server error' }),
    };
  }
};
