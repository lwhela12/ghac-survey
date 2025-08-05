const express = require('express');
const cors = require('cors');

const app = express();

// Enable CORS for all origins during debugging
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Request body:', JSON.stringify(req.body));
  }
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});

// Survey start endpoint
app.post('/api/survey/start', (req, res) => {
  try {
    console.log('Survey start request received');
    console.log('Body:', req.body);
    
    const sessionId = 'session-' + Date.now();
    const response = {
      sessionId: sessionId,
      firstQuestion: {
        id: 'b1',
        content: 'Welcome to the GHAC Donor Survey! What is your name?',
        type: 'text-input',
        required: true,
        placeholder: 'Enter your name'
      },
      progress: 0
    };
    
    console.log('Sending response:', JSON.stringify(response));
    
    // Ensure we're sending JSON with proper headers
    res.status(200).json(response);
  } catch (error) {
    console.error('Error in /api/survey/start:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Survey answer endpoint (minimal implementation)
app.post('/api/survey/answer', (req, res) => {
  try {
    console.log('Survey answer request:', req.body);
    
    res.json({
      nextQuestion: {
        id: 'b2',
        content: 'Thank you! How are you connected to GHAC?',
        type: 'single-choice',
        options: ['Donor', 'Volunteer', 'Staff', 'Other'],
        required: true
      },
      progress: 10
    });
  } catch (error) {
    console.error('Error in /api/survey/answer:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Catch-all for debugging
app.all('/api/*', (req, res) => {
  console.log('Unhandled route:', req.method, req.path);
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Root handler for Vercel
app.get('/', (req, res) => {
  res.json({
    message: 'GHAC Survey API',
    version: '1.0.0',
    endpoints: [
      'GET /api/health',
      'POST /api/survey/start',
      'POST /api/survey/answer'
    ]
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Express error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

module.exports = app;