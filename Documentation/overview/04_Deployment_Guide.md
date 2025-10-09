# 🚀 EduLearn - Deployment Guide

## Production Deployment Overview

This guide covers deploying EduLearn to production environments using popular hosting platforms.

---

## 🎯 Deployment Checklist

### Pre-Deployment
- [ ] All features tested locally
- [ ] Environment variables documented
- [ ] Database migrations completed
- [ ] API keys obtained for production
- [ ] Frontend built successfully
- [ ] Security review completed
- [ ] Performance testing done

### Post-Deployment
- [ ] Health checks passing
- [ ] SSL/HTTPS configured
- [ ] Monitoring set up
- [ ] Backup strategy implemented
- [ ] Error tracking configured
- [ ] Performance monitoring active

---

## 🌐 Deployment Architecture Options

### Option 1: Separate Frontend & Backend (Recommended)

```
Frontend (Vercel/Netlify) ←→ Backend (Render/Railway) ←→ MongoDB Atlas
                                     ↓
                          External Services (Supabase, Pinecone)
```

**Pros:**
- Independent scaling
- Faster frontend CDN delivery
- Easier CI/CD pipeline

**Cons:**
- CORS configuration needed
- Multiple services to manage

### Option 2: Unified Deployment

```
Single Server (DigitalOcean/AWS) → MongoDB (Same/External)
```

**Pros:**
- Simpler CORS handling
- Single point of management

**Cons:**
- Scaling limitations
- Single point of failure

---

## 📦 Backend Deployment

### Option A: Render.com (Recommended)

#### Step 1: Prepare Repository

```bash
# Ensure package.json has start script
# Backend/package.json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  }
}
```

#### Step 2: Create Render Web Service

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" → "Web Service"
3. Connect your Git repository
4. Configure:
   - **Name:** edulearn-backend
   - **Region:** Choose closest to users
   - **Branch:** main
   - **Root Directory:** Backend
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free or Starter

#### Step 3: Environment Variables

Add all environment variables from `.env`:

```env
# Server
PORT=4000
MONGO_URI=your_mongodb_atlas_connection_string
ORIGIN=https://your-frontend-domain.vercel.app

# AI
LLM_PROVIDER=gemini
GEMINI_API_KEY=your_production_gemini_key
OPENAI_API_KEY=your_production_openai_key

# Storage
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key
SUPABASE_BUCKET=edulearn-pdfs
MAX_UPLOAD_BYTES=52428800

# Pinecone
PINECONE_API_KEY=your_pinecone_key
PINECONE_ENVIRONMENT=us-east-1
PINECONE_INDEX_NAME=edulearn-vectors

# Auth
JWT_ACCESS_TOKEN_SECRET=generate_strong_random_string
JWT_REFRESH_TOKEN_SECRET=generate_different_strong_random_string

# Optional
ENABLE_DEBUG_ROUTES=false
YOUTUBE_API_KEY=your_youtube_key
```

#### Step 4: Deploy

- Click "Create Web Service"
- Render automatically builds and deploys
- Note your backend URL: `https://edulearn-backend.onrender.com`

---

### Option B: Railway.app

1. Visit [Railway.app](https://railway.app/)
2. Click "Start a New Project" → "Deploy from GitHub repo"
3. Select repository and set Root Directory: `Backend`
4. Add environment variables
5. Deploy

---

### Option C: AWS EC2

#### Launch EC2 Instance

```bash
# SSH into instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MongoDB (or use Atlas)
# ... MongoDB installation steps

# Clone and setup
git clone <repo-url>
cd Backend
npm install

# Setup environment
nano .env
# Paste production environment variables

# Install PM2 for process management
sudo npm install -g pm2
pm2 start server.js --name edulearn-backend
pm2 startup
pm2 save

# Setup Nginx reverse proxy
sudo apt install nginx
sudo nano /etc/nginx/sites-available/edulearn

# Nginx config:
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

sudo ln -s /etc/nginx/sites-available/edulearn /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Setup SSL with Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## 🎨 Frontend Deployment

### Option A: Vercel (Recommended)

#### Step 1: Prepare Build

```bash
# Frontend/vite.config.js - ensure correct config
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false
  }
})
```

#### Step 2: Deploy to Vercel

**Method 1: CLI**

```bash
cd Frontend
npm install -g vercel
vercel login
vercel
# Follow prompts, set Framework Preset: Vite
```

**Method 2: Dashboard**

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Import Git repository
4. Configure:
   - **Framework Preset:** Vite
   - **Root Directory:** Frontend
   - **Build Command:** `npm run build`
   - **Output Directory:** dist

#### Step 3: Environment Variables

Vercel doesn't need frontend env vars unless you have:

```env
# If using frontend API keys (rare)
VITE_API_URL=https://your-backend.onrender.com/api
```

#### Step 4: Update Backend CORS

In Backend `.env`, set:
```env
ORIGIN=https://your-app.vercel.app
```

#### Step 5: Deploy

- Vercel auto-deploys on git push
- Access: `https://your-app.vercel.app`

---

### Option B: Netlify

```bash
cd Frontend
npm run build

# Install Netlify CLI
npm install -g netlify-cli
netlify login
netlify deploy --prod --dir=dist
```

---

## 🗄️ Database Deployment

### MongoDB Atlas (Recommended)

#### Step 1: Create Cluster

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Create account and organization
3. Click "Build a Cluster"
4. Choose:
   - **Cloud Provider:** AWS/GCP/Azure
   - **Region:** Closest to backend
   - **Cluster Tier:** M0 (Free) or M10+ (Production)

#### Step 2: Configure Security

**Database Access:**
1. Go to "Database Access"
2. Add Database User:
   - Username: `edulearn_admin`
   - Password: Generate strong password
   - Privileges: Atlas admin or Read/Write

**Network Access:**
1. Go to "Network Access"
2. Add IP Address:
   - For development: Your IP
   - For production: `0.0.0.0/0` (allow all) or specific backend IPs

#### Step 3: Get Connection String

1. Click "Connect" on your cluster
2. Choose "Connect your application"
3. Copy connection string:
   ```
   mongodb+srv://edulearn_admin:<password>@cluster0.xxxxx.mongodb.net/edulearn?retryWrites=true&w=majority
   ```
4. Replace `<password>` with actual password
5. Use this as `MONGO_URI` in backend environment

---

## 🔐 Security Configuration

### 1. Strong JWT Secrets

Generate random secrets:

```bash
# Linux/Mac
openssl rand -base64 32

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Use different secrets for access and refresh tokens.

### 2. CORS Configuration

Backend `src/app.js`:

```javascript
const ORIGIN = process.env.ORIGIN || 'http://localhost:5173';
app.use(cors({ 
  origin: ORIGIN, 
  credentials: true 
}));
```

Ensure `ORIGIN` matches exact frontend URL (no trailing slash).

### 3. Environment Variables Security

- Never commit `.env` to Git
- Use platform's secret management
- Rotate keys periodically
- Use separate keys for dev/prod

### 4. HTTPS/SSL

- Vercel/Netlify provide free SSL automatically
- For custom domains: Use Let's Encrypt
- Backend on Render: SSL included

---

## 🔄 CI/CD Pipeline

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - name: Deploy Backend
        run: |
          cd Backend
          npm install
          npm test
          # Deploy to Render/Railway triggers automatically

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - name: Build Frontend
        run: |
          cd Frontend
          npm install
          npm run build
      - name: Deploy to Vercel
        run: npx vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
```

---

## 📊 Monitoring & Logging

### Error Tracking

**Sentry Integration:**

```bash
npm install @sentry/node @sentry/react
```

Backend:
```javascript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV
});

app.use(Sentry.Handlers.errorHandler());
```

Frontend:
```javascript
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: process.env.VITE_SENTRY_DSN
});
```

### Performance Monitoring

Use platform-specific tools:
- **Vercel:** Built-in Analytics
- **Render:** Metrics dashboard
- **Custom:** New Relic, Datadog

---

## 🔄 Database Backups

### MongoDB Atlas Automated Backups

1. Go to Cluster → Backup tab
2. Enable Cloud Backup (paid tier)
3. Configure:
   - Backup frequency
   - Retention period
   - Restore testing schedule

### Manual Backup Script

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
MONGO_URI="your_mongodb_atlas_uri"
BACKUP_DIR="./backups/$DATE"

mongodump --uri="$MONGO_URI" --out="$BACKUP_DIR"
tar -czf "backup_$DATE.tar.gz" "$BACKUP_DIR"
# Upload to S3 or backup service
```

---

## 🚀 Performance Optimization

### 1. Enable Compression

```javascript
// Backend/src/app.js
import compression from 'compression';
app.use(compression());
```

### 2. Database Indexing

```javascript
// Add indexes for frequent queries
await db.collection('pdfs').createIndex({ user: 1, createdAt: -1 });
await db.collection('quizAttempts').createIndex({ user: 1, pdf: 1 });
```

### 3. Caching Strategy

Consider Redis for:
- Session storage
- Frequently accessed PDFs
- API response caching

### 4. CDN for Static Assets

- Vercel automatically uses CDN
- For custom: CloudFlare, AWS CloudFront

---

## 🧪 Post-Deployment Testing

### Health Check Endpoint

```bash
curl https://your-backend.onrender.com/api/health
# Expected: {"ok":true}
```

### Test User Flow

1. Sign up new user
2. Upload PDF
3. Generate quiz
4. Chat with AI
5. Check dashboard analytics

### Load Testing

```bash
# Install Apache Bench
ab -n 1000 -c 10 https://your-backend.onrender.com/api/health
```

---

## 🛠️ Troubleshooting

### Issue: Backend Not Starting

- Check Render/Railway logs
- Verify all environment variables set
- Ensure MongoDB Atlas IP whitelist includes backend IP

### Issue: Frontend API Calls Failing

- Verify CORS `ORIGIN` matches frontend URL exactly
- Check backend is accessible from frontend
- Inspect browser Network tab for actual error

### Issue: MongoDB Connection Timeout

- Check Network Access whitelist in Atlas
- Verify connection string format
- Test connection locally with same string

### Issue: WebSocket Not Connecting

- Ensure backend supports WebSocket upgrades
- Check firewall/proxy settings
- Verify Socket.IO versions match (frontend & backend)

---

## 📈 Scaling Strategies

### Horizontal Scaling

- Deploy multiple backend instances
- Use Redis for Socket.IO adapter
- Load balancer (AWS ELB, Nginx)

### Vertical Scaling

- Upgrade server instance size
- Increase MongoDB cluster tier
- Optimize database queries

### Database Sharding

For large user bases:
- Shard by userId
- Implement read replicas
- Use MongoDB Atlas scaling features

---

## 🔗 Additional Resources

- [Render Documentation](https://render.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [MongoDB Atlas Documentation](https://www.mongodb.com/docs/atlas/)
- [Let's Encrypt](https://letsencrypt.org/)
- [PM2 Process Manager](https://pm2.keymetrics.io/)

---

**Last Updated:** October 2025  
**Version:** 1.0.0  
**Deployment Status:** Production Ready ✅
