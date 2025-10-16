# AI Study Buddy - Railway Deployment Guide

This guide will walk you through deploying the AI Study Buddy application to Railway.app.

## Prerequisites

1. A Railway account (sign up at [railway.app](https://railway.app))
2. OpenAI API key (get one at [platform.openai.com](https://platform.openai.com))
3. Git repository (already set up at github.com:champi-dev/aistudybuddy.git)

## Architecture

The application consists of three services:
- **Backend**: Node.js/Express API server
- **Frontend**: React/Vite static site
- **Database**: PostgreSQL (managed by Railway)
- **Redis**: Redis cache (managed by Railway)

## Deployment Steps

### 1. Create a New Railway Project

1. Go to [railway.app](https://railway.app) and sign in
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository: `champi-dev/aistudybuddy`

### 2. Deploy PostgreSQL Database

1. In your Railway project, click "+ New"
2. Select "Database" → "Add PostgreSQL"
3. Railway will automatically create a PostgreSQL database and provide a `DATABASE_URL` environment variable
4. Note: The `DATABASE_URL` will be automatically injected into your backend service

### 3. Deploy Redis

1. In your Railway project, click "+ New"
2. Select "Database" → "Add Redis"
3. Railway will automatically create a Redis instance and provide a `REDIS_URL` environment variable
4. Note: The `REDIS_URL` will be automatically injected into your backend service

### 4. Deploy Backend Service

1. In your Railway project, click "+ New"
2. Select "GitHub Repo" → select your repository
3. Choose the `backend` directory as the root path
4. Configure the following settings:
   - **Root Directory**: `/backend`
   - **Build Command**: `npm ci && npm run migrate`
   - **Start Command**: `npm start`

#### Backend Environment Variables

Add the following environment variables to your backend service:

```
PORT=8888
NODE_ENV=production
JWT_SECRET=<generate-a-secure-random-string>
JWT_EXPIRE=7d
BCRYPT_ROUNDS=10
OPENAI_API_KEY=<your-openai-api-key>
OPENAI_MODEL=gpt-4o-mini
OPENAI_MAX_TOKENS_PER_REQUEST=1000
OPENAI_TEMPERATURE=0.7
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
DAILY_TOKEN_LIMIT=0
MAX_TOKENS_PER_REQUEST=500
FRONTEND_URL=<will-be-set-after-frontend-deployment>
```

**Important Notes:**
- `DATABASE_URL` and `REDIS_URL` are automatically provided by Railway
- Generate a strong `JWT_SECRET` using: `openssl rand -base64 32`
- Set `DAILY_TOKEN_LIMIT=0` to disable token limits in production
- You'll update `FRONTEND_URL` after deploying the frontend

#### Backend Railway Configuration

Railway will automatically detect the `nixpacks.toml` file in the backend directory, which configures the build process.

### 5. Run Database Migrations

After the backend deploys:

1. Go to your backend service in Railway
2. Click on "Settings" → "Deployments"
3. The migrations should run automatically as part of the build process
4. If migrations fail, you can run them manually using the Railway CLI:
   ```bash
   railway run npm run migrate
   ```

### 6. Deploy Frontend Service

1. In your Railway project, click "+ New"
2. Select "GitHub Repo" → select your repository
3. Choose the `frontend` directory as the root path
4. Configure the following settings:
   - **Root Directory**: `/frontend`
   - **Build Command**: `npm ci && npm run build`
   - **Start Command**: `npx serve -s dist -l $PORT`

#### Frontend Environment Variables

Add the following environment variables to your frontend service:

```
VITE_API_URL=<your-backend-railway-url>/api
VITE_APP_NAME=AI Study Buddy
```

**Getting the Backend URL:**
1. Go to your backend service in Railway
2. Click on "Settings"
3. Copy the public domain URL (e.g., `https://your-backend.up.railway.app`)
4. Use this URL for `VITE_API_URL` (append `/api`)

#### Frontend Railway Configuration

Railway will automatically detect the `nixpacks.toml` file in the frontend directory.

### 7. Update Backend CORS Configuration

After deploying the frontend:

1. Copy the frontend public domain URL from Railway
2. Go to your backend service in Railway
3. Update the `FRONTEND_URL` environment variable with your frontend URL
4. The backend will automatically redeploy with the updated CORS settings

## Post-Deployment Configuration

### Database Schema

The database migrations run automatically during backend deployment. The schema includes:

- `users` - User accounts and authentication
- `decks` - Study deck information
- `cards` - Flashcards and quiz questions
- `study_sessions` - Study session tracking
- `study_answers` - Individual card answers
- `analytics_cache` - Cached analytics data

### Environment Variable Reference

#### Backend Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `8888` |
| `NODE_ENV` | Environment | `production` |
| `DATABASE_URL` | PostgreSQL connection | Auto-provided by Railway |
| `REDIS_URL` | Redis connection | Auto-provided by Railway |
| `JWT_SECRET` | JWT signing key | `<random-string>` |
| `OPENAI_API_KEY` | OpenAI API key | `sk-...` |
| `FRONTEND_URL` | Frontend URL for CORS | `https://your-frontend.railway.app` |

#### Frontend Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `https://your-backend.railway.app/api` |
| `VITE_APP_NAME` | Application name | `AI Study Buddy` |

## Monitoring and Logs

### Viewing Logs

1. Go to your service in Railway
2. Click on "Deployments" tab
3. Select the latest deployment
4. View real-time logs in the logs panel

### Health Check

Check if your backend is running:
```bash
curl https://your-backend.railway.app/health
```

Expected response:
```json
{
  "status": "ok",
  "database": "connected",
  "redis": "connected"
}
```

## Troubleshooting

### Backend Issues

**Problem: Migrations not running**
- Solution: Manually run migrations using Railway CLI
  ```bash
  railway link
  railway run npm run migrate
  ```

**Problem: Database connection errors**
- Solution: Verify `DATABASE_URL` is set correctly
- Check PostgreSQL service is running in Railway

**Problem: Redis connection errors**
- Solution: Verify `REDIS_URL` is set correctly
- Check Redis service is running in Railway

### Frontend Issues

**Problem: API calls failing (CORS errors)**
- Solution: Verify `FRONTEND_URL` is set correctly in backend
- Ensure `VITE_API_URL` points to correct backend URL

**Problem: 404 on page refresh**
- Solution: Railway's serve should handle this automatically
- Verify `nixpacks.toml` start command is correct

**Problem: Environment variables not updating**
- Solution: Rebuild the frontend after changing environment variables
- In Railway, go to Deployments → click "Redeploy"

### Database Issues

**Problem: Database tables missing**
- Solution: Run migrations manually
  ```bash
  railway run npm run migrate
  ```

**Problem: Database connection pool errors**
- Solution: Check PostgreSQL instance size and limits
- Consider upgrading Railway plan if needed

## Performance Optimization

### Backend

1. **Enable connection pooling**: Already configured in `knexfile.js`
2. **Redis caching**: Analytics are cached for 5 minutes
3. **Rate limiting**: Set in environment variables

### Frontend

1. **Build optimization**: Vite automatically optimizes the build
2. **Code splitting**: Implemented via React Router
3. **Asset compression**: Handled by serve

## Scaling

### Horizontal Scaling

Railway supports horizontal scaling:
1. Go to your service settings
2. Adjust the number of replicas
3. Backend can scale horizontally (stateless)
4. Frontend serves static files (easily scalable)

### Database Scaling

1. Monitor database performance in Railway dashboard
2. Upgrade PostgreSQL instance size if needed
3. Consider read replicas for high-traffic scenarios

## Cost Estimation

Railway pricing (as of 2024):
- **Hobby Plan**: $5/month (includes $5 usage credit)
- **Developer Plan**: $20/month (includes $20 usage credit)

Estimated monthly costs:
- PostgreSQL: ~$5-10/month
- Redis: ~$2-5/month
- Backend: ~$3-5/month
- Frontend: ~$1-3/month

Total: ~$11-23/month

## Security Checklist

- [x] JWT_SECRET is a strong random string
- [x] Database credentials are managed by Railway
- [x] CORS is properly configured
- [x] Rate limiting is enabled
- [x] Environment variables are not committed to git
- [x] OpenAI API key is secured
- [x] HTTPS is enforced (Railway default)

## Continuous Deployment

Railway automatically deploys when you push to your main branch:

```bash
git add .
git commit -m "Your commit message"
git push origin main
```

Railway will:
1. Detect changes
2. Build updated services
3. Run migrations (backend)
4. Deploy new versions
5. Health check new deployments
6. Switch traffic to new deployments

## Rollback

If a deployment fails:

1. Go to the service in Railway
2. Click "Deployments"
3. Find the last working deployment
4. Click "..." → "Redeploy"

## Additional Resources

- [Railway Documentation](https://docs.railway.app)
- [Railway CLI](https://docs.railway.app/develop/cli)
- [OpenAI API Documentation](https://platform.openai.com/docs)

## Support

For issues with:
- **Railway**: Check [Railway Community](https://discord.gg/railway) or [Railway Help](https://help.railway.app)
- **Application**: Open an issue on GitHub

---

Generated with [Claude Code](https://claude.com/claude-code)
