# Deployment Files Reference

This document describes all files created for Railway deployment.

## Configuration Files

### Backend

| File | Purpose |
|------|---------|
| `backend/.env.example` | Template for environment variables |
| `backend/nixpacks.toml` | Railway build configuration |
| `backend/.railwayignore` | Files to exclude from deployment |
| `backend/validate-env.js` | Environment variable validation script |

### Frontend

| File | Purpose |
|------|---------|
| `frontend/.env.example` | Template for environment variables |
| `frontend/nixpacks.toml` | Railway build configuration |
| `frontend/.railwayignore` | Files to exclude from deployment |

### Root

| File | Purpose |
|------|---------|
| `railway.json` | Railway project configuration |
| `DEPLOYMENT.md` | Comprehensive deployment guide |
| `RAILWAY_QUICKSTART.md` | Quick start guide (5 minutes) |
| `DEPLOYMENT_FILES.md` | This file |

## File Details

### `backend/nixpacks.toml`
Configures Railway to:
- Use Node.js 18
- Install dependencies with `npm ci`
- Run database migrations before starting
- Start server with `npm start`

### `frontend/nixpacks.toml`
Configures Railway to:
- Use Node.js 18
- Install dependencies with `npm ci`
- Build production bundle with `npm run build`
- Serve static files with `serve`

### `.railwayignore`
Excludes unnecessary files from deployment:
- Development files (node_modules, logs)
- Testing files (test directories, spec files)
- Documentation
- IDE configuration
- Git files

### `railway.json`
Defines project-level Railway settings:
- Builder: Nixpacks
- Number of replicas: 1
- Restart policy: On failure (max 10 retries)

### `backend/validate-env.js`
Executable script that:
- Checks all required environment variables
- Validates JWT_SECRET strength
- Validates OPENAI_API_KEY format
- Warns about missing optional variables
- Exits with error code if validation fails

Usage:
```bash
cd backend
node validate-env.js
```

## Deployment Checklist

Follow this order when deploying:

1. **Read Documentation**
   - [ ] Review `RAILWAY_QUICKSTART.md` for quick deploy
   - [ ] Review `DEPLOYMENT.md` for detailed guide

2. **Railway Setup**
   - [ ] Create Railway account
   - [ ] Create new project from GitHub
   - [ ] Add PostgreSQL database
   - [ ] Add Redis database

3. **Backend Deployment**
   - [ ] Set root directory to `/backend`
   - [ ] Configure environment variables (see `.env.example`)
   - [ ] Verify `nixpacks.toml` is detected
   - [ ] Deploy backend
   - [ ] Copy public URL

4. **Frontend Deployment**
   - [ ] Set root directory to `/frontend`
   - [ ] Configure `VITE_API_URL` with backend URL
   - [ ] Verify `nixpacks.toml` is detected
   - [ ] Deploy frontend
   - [ ] Copy public URL

5. **Final Configuration**
   - [ ] Set `FRONTEND_URL` in backend with frontend URL
   - [ ] Verify CORS is working
   - [ ] Test the application

6. **Validation**
   - [ ] Run `backend/validate-env.js` locally to verify configuration
   - [ ] Test user registration
   - [ ] Test deck generation
   - [ ] Check deployment logs

## Environment Variables Quick Reference

### Backend Minimum Required

```env
PORT=8888
NODE_ENV=production
DATABASE_URL=<auto-provided-by-railway>
REDIS_URL=<auto-provided-by-railway>
JWT_SECRET=<generate-strong-secret>
OPENAI_API_KEY=<your-api-key>
FRONTEND_URL=<frontend-railway-url>
```

### Frontend Minimum Required

```env
VITE_API_URL=<backend-railway-url>/api
```

## Useful Commands

### Validate Environment
```bash
cd backend
node validate-env.js
```

### Railway CLI Commands
```bash
# Link project
railway link

# Run migrations
railway run npm run migrate

# View logs
railway logs

# Open in browser
railway open
```

## Troubleshooting Reference

| Issue | Solution File | Section |
|-------|---------------|---------|
| Missing env vars | `DEPLOYMENT.md` | Environment Variable Reference |
| CORS errors | `RAILWAY_QUICKSTART.md` | Step 8 |
| Migration failures | `DEPLOYMENT.md` | Troubleshooting → Database Issues |
| Build errors | `DEPLOYMENT.md` | Troubleshooting sections |
| General questions | `RAILWAY_QUICKSTART.md` | Need Help? |

## Additional Resources

- Railway Documentation: https://docs.railway.app
- Railway Community Discord: https://discord.gg/railway
- OpenAI Platform: https://platform.openai.com
- Project Repository: https://github.com/champi-dev/aistudybuddy

## Updates

To update deployment configuration:

1. Modify relevant files
2. Commit and push to GitHub
3. Railway will automatically detect changes
4. Services will redeploy with new configuration

## Support

For deployment issues:
1. Check `DEPLOYMENT.md` troubleshooting section
2. Review Railway deployment logs
3. Join Railway community Discord
4. Open GitHub issue for app-specific problems

---

All deployment files are ready for Railway deployment!
