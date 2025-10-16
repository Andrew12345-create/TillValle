const express = require('express');
const app = express();

app.use(express.json());

const API_KEY = process.env.API_GATEWAY_KEY || 'default-secure-key-123';

app.post('/api/gateway', (req, res) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey || apiKey !== API_KEY) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  
  res.json({ 
    success: true, 
    message: 'Gateway access granted',
    data: req.body 
  });
});

const PORT = process.env.GATEWAY_PORT || 3002;
app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});

module.exports = app;