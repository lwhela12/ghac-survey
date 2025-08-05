const express = require('express');
const cors = require('cors');

const app = express();

// Simple CORS - allow all origins for debugging
app.use(cors());
app.use(express.json());

// Debug endpoint
app.all('/api/*', (req, res) => {
  res.json({
    message: 'API is working',
    path: req.path,
    url: req.url,
    method: req.method,
    baseUrl: req.baseUrl,
    originalUrl: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Survey start endpoint
app.post('/api/survey/start', (req, res) => {
  res.json({
    sessionId: 'test-session-' + Date.now(),
    firstQuestion: {
      id: 'test',
      content: 'This is a test response from the simplified API'
    }
  });
});

module.exports = app;