# GHAC Survey Deployment Guide

## Overview
This application is deployed as two separate services:
- **Frontend**: React app on Vercel
- **Backend**: Node.js/Express API on Railway/Render/Heroku

`npm run build` now compiles only the backend service (`npm run build:backend`). If deploying the frontend separately, configure your environment to run `npm run build:frontend` or `cd frontend && npm install && npm run build` (e.g., via Vercel's `buildCommand`).

## Frontend Deployment (Vercel)

### 1. Connect to Vercel
- Go to [vercel.com](https://vercel.com)
- Import your GitHub repository
- Set the root directory to: `.` (repository root)
- Framework Preset: Vite

### 2. Environment Variables
Set these in Vercel's project settings:
```
VITE_API_URL=https://your-backend-url.railway.app
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
```

### 3. Deploy
- Vercel will automatically deploy on every push to main
- The build command is already configured in `vercel.json`

## Backend Deployment

### Option A: Railway (Recommended)

1. **Create New Project**
   - Go to [railway.app](https://railway.app)
   - Create new project from GitHub repo
   - Set root directory to: `backend`

2. **Add PostgreSQL**
   - Click "New Service" → PostgreSQL
   - Railway will automatically set DATABASE_URL

3. **Add Redis (Optional)**
   - Click "New Service" → Redis
   - Copy the REDIS_URL to your backend service

4. **Environment Variables**
   ```
   NODE_ENV=production
   PORT=4001
   JWT_SECRET=your-production-jwt-secret
   CORS_ORIGIN=https://your-app.vercel.app
   FRONTEND_URL=https://your-app.vercel.app
   
   # VideoAsk (if using)
   VIDEOASK_API_KEY=your-key
   VIDEOASK_FORM_ID=your-form-id
   VIDEOASK_WEBHOOK_SECRET=your-secret
   
   # Google Drive (if using)
   GOOGLE_DRIVE_CLIENT_ID=your-id
   GOOGLE_DRIVE_CLIENT_SECRET=your-secret
   GOOGLE_DRIVE_REFRESH_TOKEN=your-token
   GOOGLE_DRIVE_FOLDER_ID=your-folder-id
   
   # Clerk (if using)
   CLERK_SECRET_KEY=your-clerk-secret-key
   CLERK_WEBHOOK_SECRET=your-webhook-secret
   ```

5. **Deploy**
   - Railway will automatically deploy when you push
   - Your backend URL will be: `https://your-app.railway.app`

### Option B: Render

1. **Create Web Service**
   - Go to [render.com](https://render.com)
   - New → Web Service
   - Connect GitHub repo
   - Root Directory: `backend`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`

2. **Add PostgreSQL**
   - New → PostgreSQL
   - Copy Internal Database URL to your web service

3. **Environment Variables**
   - Same as Railway (see above)
   - Your backend URL will be: `https://your-app.onrender.com`

### Option C: Heroku

1. **Create App**
   ```bash
   heroku create your-app-name
   git push heroku main
   ```

2. **Add PostgreSQL**
   ```bash
   heroku addons:create heroku-postgresql:mini
   ```

3. **Set Config**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set JWT_SECRET=your-secret
   # ... other env vars
   ```

## Post-Deployment

### 1. Update Frontend Environment
Once your backend is deployed, update the frontend's `VITE_API_URL`:
- Go to Vercel project settings
- Update `VITE_API_URL` with your backend URL
- Redeploy the frontend

### 2. Set up Webhooks
If using VideoAsk webhooks:
- Set webhook URL to: `https://your-backend-url.railway.app/api/webhook/videoask`

### 3. Test the Application
1. Visit your frontend URL
2. Check browser console for any CORS errors
3. Test the survey flow end-to-end

## Troubleshooting

### CORS Issues
- Ensure `FRONTEND_URL` is set correctly in backend
- Check that backend allows your Vercel preview URLs

### Database Connection
- Verify DATABASE_URL is set correctly
- Check that migrations have run: `npm run migrate`

### 502/503 Errors
- Check backend logs for startup errors
- Ensure all required environment variables are set
- Verify Node.js version compatibility

## Local Development
To run both services locally:
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

Make sure `.env` files are configured for local development.