# Claude.md - GHAC Donor Survey Platform Development Instructions

## Project Overview
You are building a custom conversational survey platform for the Greater Hartford Arts Council (GHAC). This platform will collect donor feedback through an engaging chat-like interface with multimedia capabilities.

## Required Reading
Before starting development, thoroughly review these documents in the repository:
1. **Product Requirements Document (PRD)** (docs/ghac-survey-prd.md) - Contains all functional requirements, user stories, and success metrics
2. **Technical Design Document** - (docs/ghac-survey-design-doc.md) - Provides Details the architecture, database schema, API design, and implementation approach
3. **Survey Script (Excel file)** - (docs/N_Ghac Donor Survey V4- Coversational Script.xlsx) - Contains the exact questions, branching logic, and flow for the survey

## Reference Implementation
- **`docs/reference/landbot-poc.html`** - The current proof of concept using Landbot
  - Shows the desired conversational flow
  - Demonstrates GHAC branding (colors, logo)
  - Use as a reference for UX, but we're building a custom solution
  - Note: We're replacing the Landbot iframe with our own implementation

## Key Project Constraints
- **Timeline**: 6-8 week development cycle for MVP
- **Performance**: Must handle 2000 concurrent users
- **Completion Time**: Survey must be completable in under 10 minutes
- **Video Limits**: 90-second maximum for video responses
- **Responsive**: Must work seamlessly on mobile and desktop

## Development Priorities

### Phase 1: Core Foundation (Weeks 1-2)
1. Set up the development environment with Docker
2. Implement the PostgreSQL database schema exactly as specified
3. Create the basic Express.js API structure with TypeScript
4. Set up the React frontend with the routing structure
5. Implement JWT authentication for admin users

### Phase 2: Survey Engine (Weeks 3-4)
1. Build the survey flow engine with branching logic from the Excel file
2. Create all question type components (single choice, multiple choice, text, rating)
3. Implement the chat-like conversational UI
4. Add real-time data persistence (save on every answer)
5. Create the progress tracking system

### Phase 3: Integrations (Week 5)
1. Integrate VideoAsk API for video questions
2. Implement Google Drive export functionality
3. Set up proper error handling for external services
4. Add retry logic for failed API calls

### Phase 4: Admin Panel (Week 6)
1. Build the admin dashboard with response viewing
2. Create the data export interface
3. Implement search and filter functionality
4. Add basic analytics/statistics view

### Phase 5: Polish & Testing (Week 7)
1. Apply GHAC branding (colors: #0055A5 blue, #B2BB1C green)
2. Optimize performance (lazy loading, caching)
3. Write comprehensive tests (aim for 80% coverage)
4. Conduct security audit

## Critical Implementation Notes

### Survey Logic Implementation
- The Excel file contains the exact branching logic - implement it precisely
- Question IDs from Excel should map to database question IDs
- Preserve the conversational tone from the script
- Some questions are conditional based on previous answers - ensure these conditions are properly implemented

### Data Structure Considerations
```typescript
// Example of how to structure branching logic in the database
{
  "questionId": "q3",
  "conditions": {
    "showIf": {
      "questionId": "q2",
      "answer": ["Yes", "Maybe"]
    }
  }
}
```

### VideoAsk Integration
- Each video question should create a unique VideoAsk form
- Store the VideoAsk response URL, not the actual video file
- Implement webhooks to receive video completion notifications
- Handle cases where users skip video questions

### State Management
- Use Redux Toolkit for complex survey state
- Persist survey progress in both Redux and database
- Implement optimistic updates for better UX
- Handle network failures gracefully

## Code Quality Standards

### TypeScript
- Use strict mode
- Define interfaces for all data structures
- Avoid `any` types
- Use proper error types

### Testing Requirements
```typescript
// Every feature should have:
- Unit tests for business logic
- Integration tests for API endpoints
- Component tests for React components
- At least one E2E test for critical paths
```

### Git Workflow
- Use feature branches (feature/survey-engine, feature/admin-panel)
- Write descriptive commit messages
- PR descriptions should reference PRD sections
- No direct commits to main branch

## Security Checklist
- [ ] All API endpoints have proper validation
- [ ] SQL queries use parameterized statements
- [ ] Passwords are properly hashed (bcrypt)
- [ ] JWT tokens have appropriate expiration
- [ ] CORS is properly configured
- [ ] Rate limiting is implemented
- [ ] All user inputs are sanitized

## Performance Checklist
- [ ] Database queries are optimized with proper indexes
- [ ] API responses are paginated where appropriate
- [ ] Static assets are served via CDN
- [ ] Images are optimized and use modern formats
- [ ] Code splitting is implemented for large components
- [ ] Caching strategy is implemented (Redis)

## External Dependencies
Ensure you have access to:
- VideoAsk API credentials (will be provided)
- Google Drive API credentials (will be provided)
- GHAC branding assets (logos, fonts)
- Production deployment credentials (when ready)

## Questions to Clarify Before Starting
1. Confirm the exact VideoAsk form configuration needed
2. Verify the Google Drive folder structure for exports
3. Get the production domain name for CORS configuration
4. Confirm any specific browser support requirements

## Development Environment Setup
```bash
# Your first steps should be:
1. Clone the repository
2. Copy .env.example to .env
3. Run: docker-compose up -d
4. Run: npm install (in both frontend and backend)
5. Run database migrations: npm run migrate
6. Seed test data: npm run seed
7. Start development: npm run dev
```

## Communication
- Daily progress updates via agreed channel
- Flag blockers immediately
- Ask for clarification on any ambiguous requirements
- Document any deviations from the original design

## Definition of Done
A feature is considered complete when:
1. Code is written and follows style guidelines
2. Unit tests are written and passing
3. Integration tests are written for API endpoints
4. Feature is tested on both mobile and desktop
5. Code is reviewed and approved
6. Documentation is updated
7. Feature is deployed to staging environment

## Final Notes
- The Excel file is the source of truth for survey questions and logic
- User experience is paramount - the survey should feel conversational and engaging
- Performance matters - keep the 10-minute completion target in mind
- This is V1 of a platform that will support multiple surveys in the future, so build with extensibility in mind

Remember: The goal is to create an engaging, conversational survey experience that makes donors feel heard while efficiently collecting valuable feedback for GHAC's mission.

---
*If you need clarification on any requirement or run into technical decisions not covered in the documentation, please ask before implementing.*