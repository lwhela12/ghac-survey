# Vercel Deployment Guide for GHAC Survey Platform

## Prerequisites
- Vercel account
- PostgreSQL database (Vercel Postgres, Supabase, or external)
- Redis instance (optional, for caching)
- VideoAsk API credentials
- Google Drive API credentials (optional)
- Clerk authentication credentials (if using Clerk)

## Deployment Steps

### 1. Fork/Clone Repository
```bash
git clone <your-repo-url>
cd ghac-survey
```

### 2. Install Vercel CLI (optional but recommended)
```bash
npm i -g vercel
```

### 3. Deploy to Vercel

#### Option A: Using Vercel CLI
```bash
vercel
```
Follow the prompts to:
- Link to existing project or create new
- Configure project settings
- Set environment variables

#### Option B: Using Vercel Dashboard
1. Go to https://vercel.com/new
2. Import your Git repository
3. Vercel will auto-detect the configuration from `vercel.json`

The root `npm run build` script only builds the backend (`npm run build:backend`). Vercel's `vercel.json` handles the frontend build with `cd frontend && npm install && npm run build`. If you deploy the frontend using another provider, override its build command accordingly.

### 4. Configure Environment Variables

In Vercel Dashboard > Settings > Environment Variables, add:

#### Required Variables:
```
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/dbname
JWT_SECRET=your-secure-jwt-secret
VITE_API_URL=/api
```

#### Optional Variables:
```
# Redis (for caching)
REDIS_URL=redis://your-redis-url

# VideoAsk Integration
VIDEOASK_API_KEY=your-videoask-api-key
VIDEOASK_FORM_ID=your-form-id
VIDEOASK_WEBHOOK_SECRET=your-webhook-secret

# Google Drive Integration
GOOGLE_DRIVE_CLIENT_ID=your-client-id
GOOGLE_DRIVE_CLIENT_SECRET=your-client-secret
GOOGLE_DRIVE_REFRESH_TOKEN=your-refresh-token
GOOGLE_DRIVE_FOLDER_ID=your-folder-id

# Clerk Authentication
CLERK_PUBLISHABLE_KEY=pk_live_xxxxx
CLERK_SECRET_KEY=sk_live_xxxxx
VITE_CLERK_PUBLISHABLE_KEY=pk_live_xxxxx

# Frontend URL (for CORS)
FRONTEND_URL=https://your-domain.vercel.app
```

### 5. Database Setup

#### Using Vercel Postgres:
1. Go to Vercel Dashboard > Storage
2. Create a new Postgres database
3. Copy the connection string to DATABASE_URL

#### Using External Database:
1. Ensure your database is accessible from Vercel's IPs
2. Set DATABASE_URL with your connection string

#### Run Migrations:
After deployment, run migrations using Vercel CLI:
```bash
vercel env pull .env.local
cd backend
npm install
npm run migrate
npm run seed  # Optional: seed with test data
```

### 6. Configure Domain (Optional)
1. Go to Vercel Dashboard > Settings > Domains
2. Add your custom domain
3. Update DNS records as instructed

### 7. Post-Deployment Checklist

- [ ] Test the health endpoint: `https://your-app.vercel.app/api/health`
- [ ] Verify survey loads: `https://your-app.vercel.app/`
- [ ] Test admin login: `https://your-app.vercel.app/admin`
- [ ] Check CORS is working properly
- [ ] Verify VideoAsk integration (if configured)
- [ ] Test data export functionality

## Project Structure

```
ghac-survey/
├── frontend/          # React frontend (built and served statically)
├── backend/
│   ├── api/          # Vercel serverless function entry
│   └── src/          # Backend source code
├── vercel.json       # Vercel configuration
└── package.json      # Root package scripts
```

## Troubleshooting

### Build Failures
- Check build logs in Vercel dashboard
- Ensure all dependencies are in `dependencies` not `devDependencies`
- Verify TypeScript builds locally: `npm run build`

### API Not Working
- Check function logs in Vercel dashboard
- Verify environment variables are set
- Test locally with: `vercel dev`

### Database Connection Issues
- Verify DATABASE_URL is correct
- Check database is accessible from Vercel
- Look for connection errors in function logs

### CORS Errors
- Verify FRONTEND_URL environment variable
- Check browser console for specific origin
- Update allowed origins in `backend/api/index.ts`

## Monitoring

- Use Vercel Analytics for performance monitoring
- Check Function logs for errors
- Set up alerts for function failures

## Scaling Considerations

- Vercel automatically scales serverless functions
- For high traffic, consider:
  - Implementing Redis caching
  - Using Vercel Edge Config for configuration
  - Optimizing database queries
  - Setting up database connection pooling

## Security Notes

- All sensitive environment variables should be set in Vercel, not committed to repo
- Use strong JWT_SECRET (min 32 characters)
- Regularly rotate API keys
- Keep dependencies updated
- Enable Vercel's DDoS protection

## Support

For issues specific to:
- Vercel deployment: https://vercel.com/support
- Application bugs: Create issue in repository
- Database: Check your provider's documentation