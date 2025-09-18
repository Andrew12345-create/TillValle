exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ ok: false, error: 'Method not allowed' }),
    };
  }

  // For serverless functions, logout is typically handled client-side by clearing tokens
  // Since JWT is stateless, we just return success and let client clear localStorage
  // Added CORS headers to allow logout from Netlify domain and localhost:3001
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': event.headers.origin || '*',
      'Access-Control-Allow-Credentials': true,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Set-Cookie': 'token=; HttpOnly; Path=/; Max-Age=0', // Clear token cookie if used
    },
    body: JSON.stringify({ ok: true, message: 'Logged out successfully' }),
  };
};
