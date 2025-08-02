# Technical Design Document
## GHAC Donor Survey Platform

### Version 1.0
### Date: January 2025

---

## 1. System Architecture Overview

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│                 │     │                  │     │                 │
│  React Frontend ├────►│  Node.js Backend ├────►│   PostgreSQL    │
│   (Web App)     │     │   (API Server)   │     │   (Database)    │
│                 │     │                  │     │                 │
└─────────────────┘     └────────┬─────────┘     └─────────────────┘
                                 │
                    ┌────────────┼────────────┐
                    │            │            │
              ┌─────▼─────┐ ┌───▼────┐ ┌─────▼──────┐
              │ VideoAsk  │ │ Google │ │   Redis    │
              │    API    │ │ Drive  │ │  (Cache)   │
              └───────────┘ └────────┘ └────────────┘
```

## 2. Technology Stack

### 2.1 Frontend
- **Framework**: React 18.x with TypeScript
- **State Management**: Redux Toolkit
- **Styling**: Styled Components + GHAC Design System
- **UI Components**: Custom component library
- **Build Tool**: Vite
- **Testing**: Jest + React Testing Library

### 2.2 Backend
- **Runtime**: Node.js 20.x
- **Framework**: Express.js with TypeScript
- **API**: RESTful with optional GraphQL
- **Authentication**: JWT with refresh tokens
- **Validation**: Joi/Yup
- **Testing**: Jest + Supertest

### 2.3 Database
- **Primary**: PostgreSQL 15.x
- **ORM**: Prisma
- **Caching**: Redis for session management
- **Real-time**: PostgreSQL LISTEN/NOTIFY or Socket.io

### 2.4 Infrastructure
- **Hosting**: AWS (EC2/ECS for compute, RDS for database)
- **CDN**: CloudFront
- **Storage**: S3 for static assets
- **Monitoring**: CloudWatch + Sentry
- **CI/CD**: GitHub Actions

## 3. Database Design

### 3.1 Core Tables

```sql
-- Surveys table (for future multi-survey support)
CREATE TABLE surveys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Questions table
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    survey_id UUID REFERENCES surveys(id),
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) NOT NULL, -- 'single_choice', 'multiple_choice', 'text', 'video', 'rating'
    order_index INTEGER NOT NULL,
    is_required BOOLEAN DEFAULT true,
    metadata JSONB, -- For storing options, branching logic, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Responses table
CREATE TABLE responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    survey_id UUID REFERENCES surveys(id),
    respondent_name VARCHAR(255),
    session_id VARCHAR(255) UNIQUE,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    metadata JSONB -- For storing additional context
);

-- Answers table
CREATE TABLE answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    response_id UUID REFERENCES responses(id),
    question_id UUID REFERENCES questions(id),
    answer_text TEXT,
    answer_choice_ids TEXT[], -- For multiple choice
    video_url TEXT, -- VideoAsk URL reference
    answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB
);

-- Admin users table
CREATE TABLE admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3.2 Indexes
```sql
CREATE INDEX idx_responses_survey_id ON responses(survey_id);
CREATE INDEX idx_answers_response_id ON answers(response_id);
CREATE INDEX idx_questions_survey_order ON questions(survey_id, order_index);
```

## 4. API Design

### 4.1 Public Endpoints (Survey Respondents)

```typescript
// Start survey session
POST /api/survey/start
Body: { name: string, surveyId: string }
Response: { sessionId: string, firstQuestion: Question }

// Get next question based on answer
POST /api/survey/answer
Body: { 
  sessionId: string, 
  questionId: string, 
  answer: string | string[] | { videoUrl: string } 
}
Response: { nextQuestion: Question | null, progress: number }

// Complete survey
POST /api/survey/complete
Body: { sessionId: string }
Response: { success: boolean, completionMessage: string }
```

### 4.2 Admin Endpoints

```typescript
// Authentication
POST /api/admin/login
POST /api/admin/logout
POST /api/admin/refresh

// Response management
GET /api/admin/responses?surveyId={id}&page={n}&limit={n}
GET /api/admin/responses/{responseId}
GET /api/admin/export?surveyId={id}&format=csv

// Survey management (future)
GET /api/admin/surveys
POST /api/admin/surveys
PUT /api/admin/surveys/{id}
```

## 5. Frontend Architecture

### 5.1 Component Structure
```
src/
├── components/
│   ├── Survey/
│   │   ├── ChatInterface.tsx
│   │   ├── QuestionTypes/
│   │   │   ├── SingleChoice.tsx
│   │   │   ├── MultipleChoice.tsx
│   │   │   ├── TextInput.tsx
│   │   │   ├── VideoQuestion.tsx
│   │   │   └── RatingScale.tsx
│   │   ├── ProgressBar.tsx
│   │   └── SurveyContainer.tsx
│   ├── Admin/
│   │   ├── Dashboard.tsx
│   │   ├── ResponsesTable.tsx
│   │   ├── ResponseDetail.tsx
│   │   └── ExportModal.tsx
│   └── Shared/
│       ├── Layout.tsx
│       ├── Button.tsx
│       └── LoadingSpinner.tsx
├── hooks/
│   ├── useSurvey.ts
│   ├── useVideoAsk.ts
│   └── useAuth.ts
├── services/
│   ├── api.ts
│   ├── videoAsk.ts
│   └── googleDrive.ts
├── store/
│   ├── surveySlice.ts
│   ├── adminSlice.ts
│   └── store.ts
└── styles/
    └── theme.ts
```

### 5.2 State Management

```typescript
// Survey State
interface SurveyState {
  currentQuestion: Question | null;
  answers: Answer[];
  progress: number;
  sessionId: string | null;
  isLoading: boolean;
  error: string | null;
}

// Admin State
interface AdminState {
  responses: Response[];
  selectedResponse: Response | null;
  filters: FilterOptions;
  isExporting: boolean;
}
```

## 6. Integration Details

### 6.1 VideoAsk Integration

```typescript
class VideoAskService {
  async createVideoQuestion(questionId: string): Promise<string> {
    // Create VideoAsk form for specific question
    const response = await fetch(`${VIDEOASK_API_URL}/forms`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VIDEOASK_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: `GHAC Survey Question ${questionId}`,
        questions: [{
          type: 'video',
          video_duration: 90,
          // Additional VideoAsk config
        }]
      })
    });
    
    const { form_id, embed_url } = await response.json();
    return embed_url;
  }
  
  async getVideoResponse(formId: string): Promise<VideoResponse> {
    // Webhook or polling to get video response
  }
}
```

### 6.2 Google Drive Export

```typescript
class GoogleDriveExport {
  async exportToSheets(surveyId: string): Promise<string> {
    // 1. Fetch all responses
    const responses = await fetchSurveyResponses(surveyId);
    
    // 2. Format as CSV
    const csv = await formatAsCSV(responses);
    
    // 3. Upload to Google Drive
    const file = await drive.files.create({
      requestBody: {
        name: `GHAC_Survey_Export_${new Date().toISOString()}.csv`,
        mimeType: 'text/csv',
        parents: [GHAC_DRIVE_FOLDER_ID]
      },
      media: {
        mimeType: 'text/csv',
        body: csv
      }
    });
    
    return file.data.id;
  }
}
```

## 7. Security Considerations

### 7.1 Authentication Flow
```
1. Admin login with email/password
2. Server validates credentials
3. Server issues JWT access token (15min) + refresh token (7 days)
4. Frontend stores tokens securely (httpOnly cookies)
5. All admin requests include access token
6. Auto-refresh when access token expires
```

### 7.2 Security Measures
- HTTPS everywhere
- Input validation on all endpoints
- SQL injection prevention via parameterized queries
- XSS prevention via React's built-in escaping
- CSRF tokens for state-changing operations
- Rate limiting: 100 requests/minute per IP
- Secure headers (Helmet.js)

## 8. Performance Optimization

### 8.1 Frontend
- Code splitting by route
- Lazy loading for admin panel
- Image optimization and WebP format
- Service worker for offline capability
- Debounced API calls

### 8.2 Backend
- Database connection pooling
- Redis caching for frequently accessed data
- Pagination for large datasets
- Gzip compression
- CDN for static assets

### 8.3 Database
- Proper indexing (see section 3.2)
- Query optimization
- Periodic vacuum and analyze
- Read replicas for reporting (future)

## 9. Deployment Strategy

### 9.1 Environments
- **Development**: Local Docker setup
- **Staging**: AWS staging environment
- **Production**: AWS production with auto-scaling

### 9.2 CI/CD Pipeline
```yaml
# GitHub Actions workflow
1. Code push to main branch
2. Run automated tests
3. Build Docker images
4. Push to ECR
5. Deploy to ECS
6. Run smoke tests
7. Notify team
```

### 9.3 Monitoring & Logging
- Application logs: CloudWatch
- Error tracking: Sentry
- Performance monitoring: New Relic/DataDog
- Uptime monitoring: Pingdom
- Custom dashboards for survey metrics

## 10. Testing Strategy

### 10.1 Test Coverage Goals
- Unit tests: 80% coverage
- Integration tests: Critical paths
- E2E tests: Main survey flow
- Performance tests: 2000 concurrent users

### 10.2 Test Types
```typescript
// Unit test example
describe('SurveyEngine', () => {
  test('should return next question based on branching logic', () => {
    const answer = { questionId: 'q1', choice: 'yes' };
    const nextQuestion = surveyEngine.getNextQuestion(answer);
    expect(nextQuestion.id).toBe('q2a');
  });
});

// Integration test example
describe('Survey API', () => {
  test('should complete full survey flow', async () => {
    const session = await startSurvey({ name: 'Test User' });
    // ... complete survey flow
    expect(session.completed).toBe(true);
  });
});
```

## 11. Development Timeline

### Week 1-2: Foundation
- Set up development environment
- Initialize project structure
- Database schema implementation
- Basic API endpoints

### Week 3-4: Core Features
- Survey engine with branching logic
- Frontend chat interface
- Question type components
- Real-time data sync

### Week 5: Integrations
- VideoAsk integration
- Google Drive export
- Testing integrations

### Week 6: Admin Panel
- Admin authentication
- Response viewing
- Export functionality
- Basic analytics

### Week 7: Polish & Testing
- UI/UX refinements
- Performance optimization
- Security hardening
- Comprehensive testing

### Week 8: Deployment
- Production setup
- Migration & deployment
- Documentation
- Team training

## 12. Future Architecture Considerations

### 12.1 Multi-Survey Support
- Survey builder interface
- Template system
- Version control for surveys

### 12.2 Advanced Analytics
- Real-time dashboards
- Custom report builder
- ML-powered insights

### 12.3 Scalability
- Microservices architecture
- Kubernetes orchestration
- Global CDN distribution
- Multi-region database replication