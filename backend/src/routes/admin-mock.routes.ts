// Simple mock admin routes for testing without database
import { Router } from 'express';
import jwt from 'jsonwebtoken';

const router = Router();

// Mock admin user
const MOCK_ADMIN = {
  id: '11111111-1111-1111-1111-111111111111',
  email: 'admin@ghac.org',
  password: 'ghac2024!',
  name: 'GHAC Admin',
  role: 'admin'
};

// Mock responses data
const MOCK_RESPONSES = [
  {
    id: 'resp-001',
    survey_id: '11111111-1111-1111-1111-111111111111',
    respondent_name: 'Jane Doe',
    started_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    completed_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    survey_name: 'GHAC Donor Survey',
    answer_count: 15
  },
  {
    id: 'resp-002',
    survey_id: '11111111-1111-1111-1111-111111111111',
    respondent_name: 'John Smith',
    started_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    completed_at: null,
    survey_name: 'GHAC Donor Survey',
    answer_count: 8
  }
];

// Login endpoint
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  
  if (email === MOCK_ADMIN.email && password === MOCK_ADMIN.password) {
    const accessToken = jwt.sign(
      { userId: MOCK_ADMIN.id, email: MOCK_ADMIN.email, role: MOCK_ADMIN.role },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '15m' }
    );
    
    const refreshToken = jwt.sign(
      { userId: MOCK_ADMIN.id },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '7d' }
    );
    
    res.json({
      accessToken,
      refreshToken,
      user: {
        id: MOCK_ADMIN.id,
        email: MOCK_ADMIN.email,
        name: MOCK_ADMIN.name,
        role: MOCK_ADMIN.role
      }
    });
  } else {
    res.status(401).json({ status: 'error', message: 'Invalid credentials' });
  }
});

// Refresh token endpoint
router.post('/refresh', (req, res) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    return res.status(400).json({ status: 'error', message: 'Refresh token required' });
  }
  
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET || 'test-secret') as any;
    
    if (decoded.userId === MOCK_ADMIN.id) {
      const accessToken = jwt.sign(
        { userId: MOCK_ADMIN.id, email: MOCK_ADMIN.email, role: MOCK_ADMIN.role },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '15m' }
      );
      
      res.json({ accessToken });
    } else {
      res.status(404).json({ status: 'error', message: 'User not found' });
    }
  } catch (error) {
    res.status(401).json({ status: 'error', message: 'Invalid token' });
  }
});

// Get responses endpoint
router.get('/responses', (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  
  let filtered = MOCK_RESPONSES;
  if (status === 'completed') {
    filtered = MOCK_RESPONSES.filter(r => r.completed_at !== null);
  } else if (status === 'incomplete') {
    filtered = MOCK_RESPONSES.filter(r => r.completed_at === null);
  }
  
  res.json({
    responses: filtered,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: filtered.length,
      totalPages: 1
    }
  });
});

// Get response detail
router.get('/responses/:responseId', (req, res) => {
  const { responseId } = req.params;
  const response = MOCK_RESPONSES.find(r => r.id === responseId);
  
  if (!response) {
    return res.status(404).json({ status: 'error', message: 'Response not found' });
  }
  
  const mockAnswers = [
    {
      id: 'ans-001',
      response_id: responseId,
      question_id: 'b2',
      question_text: 'How are you connected to the Greater Hartford Arts Council (GHAC)?',
      question_type: 'single-choice',
      answer_text: 'Individual donor',
      video_url: null as string | null,
      answered_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      order_index: 1
    }
  ];
  
  res.json({ response, answers: mockAnswers });
});

// Analytics endpoint
router.get('/analytics/summary', (_req, res) => {
  res.json({
    total_responses: '25',
    completed_responses: '20',
    avg_completion_time_minutes: '8.5'
  });
});

// Export endpoint
router.get('/export', (_req, res) => {
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="survey-export-${Date.now()}.csv"`);
  res.send('Response ID,Name,Started,Completed\nresp-001,Jane Doe,2024-01-01,2024-01-01');
});

// Logout endpoint
router.post('/logout', (_req, res) => {
  res.json({ success: true });
});

export default router;