# Vercel Frontend Deployment Setup

## Your Backend Details
- **Railway Backend URL**: `https://ghac-survey-production.up.railway.app`
- **API Endpoint**: `https://ghac-survey-production.up.railway.app/api`

## Step 1: Push to GitHub
Make sure your latest changes are pushed to GitHub:
```bash
git add .
git commit -m "Configure frontend for Vercel deployment"
git push
```

## Step 2: Deploy to Vercel via GitHub

1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Select your `ghac-survey` repository
4. Vercel will auto-detect the configuration from `vercel.json`
5. **IMPORTANT**: Before clicking "Deploy", add these environment variables:

## Step 3: Add Environment Variables in Vercel

Click on "Environment Variables" and add:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://ghac-survey-production.up.railway.app/api` |
| `VITE_VIDEOASK_FORM_URL` | `https://www.videoask.com/fx3xt4u0q` |
| `VITE_ENABLE_VIDEO_QUESTIONS` | `true` |
| `VITE_MAX_VIDEO_DURATION` | `90` |

If you have Clerk authentication keys:
| Key | Value |
|-----|-------|
| `VITE_CLERK_PUBLISHABLE_KEY` | `your-clerk-publishable-key` |

## Step 4: Deploy

Click "Deploy" and wait for the build to complete. Vercel will provide you with a URL like:
- `https://ghac-survey-xxx.vercel.app`

## Step 5: Update Railway Backend CORS

Once you have your Vercel URL, you need to update your Railway backend to allow CORS from your Vercel domain.

In Railway dashboard for your backend:
1. Go to Variables
2. Add or update: `CORS_ORIGIN` = `https://ghac-survey-xxx.vercel.app` (replace with your actual Vercel URL)
3. The backend will automatically redeploy

Alternatively, if you want to allow multiple origins, update the CORS configuration in the backend code.

## Step 6: Test the Connection

After both deployments are complete:

1. Visit your Vercel URL: `https://ghac-survey-xxx.vercel.app`
2. Check browser console for any CORS errors
3. Test the survey flow
4. Check admin panel at `/admin`

## Troubleshooting

### If you see CORS errors:
- Make sure the `CORS_ORIGIN` environment variable in Railway matches your Vercel URL exactly
- Check that the backend is running at `https://ghac-survey-production.up.railway.app/health`

### If API calls fail:
- Verify the `VITE_API_URL` in Vercel is set correctly
- Check Railway logs for any errors
- Test the API directly: `https://ghac-survey-production.up.railway.app/api/health`

### Build failures:
- Check Vercel build logs
- Make sure all dependencies are listed in package.json
- Try building locally first: `cd frontend && npm run build`

## Next Steps

After successful deployment:
1. Set up a custom domain (optional)
2. Configure production database if needed
3. Set up monitoring and analytics
4. Test all survey flows thoroughly