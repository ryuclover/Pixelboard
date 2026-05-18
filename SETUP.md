# 🚀 SETUP & DEPLOYMENT GUIDE

## 🔧 LOCAL DEVELOPMENT

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with a proper JWT_SECRET
npm start
```

### Frontend Setup
```bash
cd Pixel-Board
npm install
npm run dev
```

Frontend will be at `http://localhost:5173`  
Backend will be at `http://localhost:3001`

## 📦 DATABASE SETUP

The backend uses SQLite by default (dev.db). For production, you'll need PostgreSQL.

### Local Database Initialization
```bash
cd backend
npx prisma generate
npx prisma migrate dev --name init
```

### Seed Shop Items (Optional)
```bash
curl -X POST http://localhost:3001/shop/seed
```

## 🌐 PRODUCTION DEPLOYMENT

### Option 1: Railway.app (Recommended)
1. Create account at https://railway.app
2. Connect your GitHub repo
3. Create a new project and select "Provision PostgreSQL"
4. Set environment variables:
   - `JWT_SECRET` (generate a random string)
   - `DATABASE_URL` (auto-filled by Railway)
   - `ALLOWED_ORIGINS=https://pixel-board-platform.vercel.app`
   - `NODE_ENV=production`

### Option 2: Render.com
1. Create account at https://render.com
2. New Web Service from GitHub
3. Create PostgreSQL database
4. Set same env vars as Railway option

### Option 3: Heroku (Legacy)
```bash
heroku login
heroku create pixel-board-api
heroku addons:create heroku-postgresql:hobby-dev
heroku config:set JWT_SECRET="your-random-secret"
git push heroku main
```

## 🚢 Frontend Deployment (Vercel - Already Done)

The frontend is already deployed at:  
https://pixel-board-platform.vercel.app

To update environment:
1. Go to Vercel Dashboard
2. Project Settings → Environment Variables
3. Add `VITE_API_URL=https://your-backend-url.com`

## ✅ POST-DEPLOY CHECKLIST

- [ ] Backend deployed and running
- [ ] PostgreSQL database provisioned
- [ ] Environment variables set (JWT_SECRET, DATABASE_URL, ALLOWED_ORIGINS)
- [ ] Run migrations: `npx prisma migrate deploy`
- [ ] Seed shop items: `POST /shop/seed`
- [ ] Update frontend VITE_API_URL
- [ ] Test login/register flow
- [ ] Test online multiplayer
- [ ] Monitor logs for errors

## 🔑 Environment Variables

### Backend (.env)
```
PORT=3001
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host:5432/db
JWT_SECRET=generate_a_long_random_string_here
JWT_EXPIRES_IN=7d
ALLOWED_ORIGINS=https://pixel-board-platform.vercel.app
```

### Frontend (Vercel)
```
VITE_API_URL=https://your-backend-domain.com
```

## 🐛 TROUBLESHOOTING

### "CORS origin denied"
- Check ALLOWED_ORIGINS in backend .env
- Make sure it matches frontend URL exactly

### "Connection refused"
- Backend not running or port blocked
- Check if database is accessible
- Verify DATABASE_URL format

### Chat/Socket not working
- Check Socket.io CORS settings
- Verify WebSocket is not blocked by firewall

## 📝 RUNNING TESTS

```bash
npm test  # When tests are added
```

## 📊 MONITORING

- Railway: Dashboard > Logs
- Render: Logs tab
- Heroku: `heroku logs --tail`
