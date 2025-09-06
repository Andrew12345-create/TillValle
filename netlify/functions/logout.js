exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ ok: false, error: 'Method not allowed' }),
    };
  }

  // For serverless functions, logout is typically handled client-side by clearing tokens
  // Since JWT is stateless, we just return success and let client clear localStorage
  return {
    statusCode: 200,
    body: JSON.stringify({ ok: true, message: 'Logged out successfully' }),
  };
};
