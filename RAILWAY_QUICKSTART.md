# Railway Quick Start Guide

Get AI Study Buddy deployed to Railway in minutes!

## 🚀 Quick Deploy (5 minutes)

### Step 1: Fork or Clone Repository
```bash
git clone https://github.com/champi-dev/aistudybuddy.git
cd aistudybuddy
```

### Step 2: Sign Up for Railway
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Verify your account

### Step 3: Create New Project
1. Click **"New Project"** in Railway dashboard
2. Select **"Deploy from GitHub repo"**
3. Choose `aistudybuddy` repository
4. Railway will create an empty project

### Step 4: Add PostgreSQL Database
1. Click **"+ New"** in your project
2. Select **"Database"** → **"PostgreSQL"**
3. Railway creates database and sets `DATABASE_URL` automatically
4. ✅ Database ready!

### Step 5: Add Redis
1. Click **"+ New"** in your project
2. Select **"Database"** → **"Redis"**
3. Railway creates Redis and sets `REDIS_URL` automatically
4. ✅ Redis ready!

### Step 6: Deploy Backend
1. Click **"+ New"** → **"GitHub Repo"**
2. Select your repository
3. Click **"Add variables"** and add:

```env
PORT=8888
NODE_ENV=production
JWT_SECRET=<run: openssl rand -base64 32>
OPENAI_API_KEY=<your-openai-key>
DAILY_TOKEN_LIMIT=0
```

4. Go to **"Settings"** → **"Root Directory"** → Set to `/backend`
5. Click **"Deploy"**
6. ✅ Backend deploying!
7. Copy the public URL (e.g., `https://aibuddy-backend.railway.app`)

### Step 7: Deploy Frontend
1. Click **"+ New"** → **"GitHub Repo"**
2. Select your repository again
3. Click **"Add variables"** and add:

```env
VITE_API_URL=<your-backend-url>/api
```

**Replace `<your-backend-url>` with the URL from Step 6**

Example: `https://aibuddy-backend.railway.app/api`

4. Go to **"Settings"** → **"Root Directory"** → Set to `/frontend`
5. Click **"Deploy"**
6. ✅ Frontend deploying!
7. Copy the public URL (e.g., `https://aibuddy.railway.app`)

### Step 8: Update Backend CORS
1. Go to your **backend service**
2. Click **"Variables"**
3. Add new variable:

```env
FRONTEND_URL=<your-frontend-url>
```

**Replace `<your-frontend-url>` with the URL from Step 7**

Example: `https://aibuddy.railway.app`

4. Backend will automatically redeploy
5. ✅ CORS configured!

### Step 9: Verify Deployment
1. Visit your frontend URL
2. You should see the landing page
3. Click **"Sign Up"** and create an account
4. Try generating a deck
5. ✅ You're live!

## 📋 Environment Variables Checklist

### Backend Required:
- [x] `PORT` → `8888`
- [x] `NODE_ENV` → `production`
- [x] `DATABASE_URL` → Auto-set by Railway
- [x] `REDIS_URL` → Auto-set by Railway
- [x] `JWT_SECRET` → Generate with `openssl rand -base64 32`
- [x] `OPENAI_API_KEY` → Get from [OpenAI](https://platform.openai.com)
- [x] `FRONTEND_URL` → Your frontend Railway URL

### Frontend Required:
- [x] `VITE_API_URL` → Your backend Railway URL + `/api`

### Optional (Backend):
- `OPENAI_MODEL` → Default: `gpt-4o-mini`
- `DAILY_TOKEN_LIMIT` → Set to `0` for unlimited (production)
- `JWT_EXPIRE` → Default: `7d`
- `RATE_LIMIT_MAX` → Default: `100`

## 🔧 Troubleshooting

### "Cannot connect to database"
**Solution:** Verify PostgreSQL service is running and `DATABASE_URL` is set.

### "CORS policy error"
**Solution:** Make sure `FRONTEND_URL` in backend matches your actual frontend URL exactly.

### "API calls failing (404)"
**Solution:** Check `VITE_API_URL` in frontend includes `/api` at the end.

### "Migrations not running"
**Solution:** Railway runs migrations automatically. Check deployment logs. If failed, run manually:
```bash
railway link
railway run npm run migrate
```

### "OpenAI errors"
**Solution:** Verify `OPENAI_API_KEY` is correct and has credits.

## 💰 Cost Estimate

Railway Hobby Plan: **$5/month** (includes $5 credit)

Estimated usage:
- PostgreSQL: ~$3/month
- Redis: ~$2/month
- Backend: ~$2/month
- Frontend: ~$1/month

**Total: ~$8/month** (within hobby plan)

## 📚 Next Steps

1. **Set up custom domain**: Railway Settings → Domains
2. **Enable monitoring**: Check deployment logs regularly
3. **Configure backups**: PostgreSQL backups in Railway
4. **Add team members**: Railway project settings
5. **Set up CI/CD**: Automatic deploys on git push (already working!)

## 🆘 Need Help?

- **Railway Docs**: https://docs.railway.app
- **Railway Community**: https://discord.gg/railway
- **OpenAI Docs**: https://platform.openai.com/docs
- **GitHub Issues**: Open an issue on the repository

## ✅ Deployment Checklist

- [ ] PostgreSQL database created
- [ ] Redis instance created
- [ ] Backend deployed with all environment variables
- [ ] Frontend deployed with API URL
- [ ] CORS configured (FRONTEND_URL set)
- [ ] Test user registration
- [ ] Test deck generation
- [ ] Test study session
- [ ] Monitor logs for errors

**Congratulations! Your AI Study Buddy is now live! 🎉**

---

For detailed deployment information, see [DEPLOYMENT.md](./DEPLOYMENT.md)
