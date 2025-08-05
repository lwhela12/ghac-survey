const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();

// CORS configuration for production
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // In production, check against allowed origins
    if (process.env.NODE_ENV === 'production') {
      const allowedOrigins = [
        process.env.FRONTEND_URL,
        'https://ghac-survey.vercel.app',
        /^https:\/\/ghac-survey-.*\.vercel\.app$/,
        /^https:\/\/.*-lwhela12s-projects\.vercel\.app$/
      ].filter(Boolean);
      
      const isAllowed = allowedOrigins.some(allowed => {
        if (allowed instanceof RegExp) return allowed.test(origin);
        return allowed === origin;
      });
      
      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    } else {
      // In development, allow all origins
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    message: 'API is running'
  });
});

// For now, let's get the basic deployment working
// We'll add the full backend routes after confirming deployment works

// Survey start endpoint (temporary - using actual survey structure)
app.post('/api/survey/start', (req, res) => {
  console.log('Survey start request:', req.body);
  
  res.json({
    sessionId: 'session-' + Date.now(),
    firstQuestion: {
      id: 'b1',
      content: "Hi there! I'm Amanda from the Greater Hartford Arts Council. Thank you for taking the time to share your thoughts with us today. Your feedback is incredibly valuable in helping us better serve our community. What's your name?",
      type: 'text-input',
      required: true,
      placeholder: 'Type your name here'
    },
    progress: 0
  });
});

// Survey answer endpoint (temporary)
app.post('/api/survey/answer', (req, res) => {
  const { questionId, answer } = req.body;
  console.log('Survey answer:', { questionId, answer });
  
  // Return next question based on the current question
  if (questionId === 'b1') {
    res.json({
      nextQuestion: {
        id: 'b2',
        content: `Nice to meet you, ${answer}! How are you connected to the Greater Hartford Arts Council (GHAC)?`,
        type: 'single-choice',
        options: [
          'Individual donor',
          'Corporate donor',
          'Board member',
          'Volunteer',
          'Partner organization',
          'Community member',
          'Other'
        ],
        required: true
      },
      progress: 5
    });
  } else {
    // For now, just complete the survey
    res.json({
      nextQuestion: null,
      progress: 100,
      completed: true
    });
  }
});

// Catch-all for API routes
app.all('/api/*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.path,
    method: req.method
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('API Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

module.exports = app;