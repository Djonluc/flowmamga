# FlowManga V2 - Deployment Guide

## 🚀 Quick Start

This guide will help you deploy FlowManga V2 to production.

## Prerequisites

- PostgreSQL database (Supabase, Railway, or self-hosted)
- Resend account for emails
- Upstash Redis for rate limiting
- OAuth apps (Discord/GitHub) - optional
- Node.js 18+ environment

## Step 1: Database Setup

### Option A: Supabase (Recommended)

1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Get connection string from Settings → Database
4. Add to `.env`:
```env
DATABASE_URL="postgresql://postgres:[password]@[host]:5432/postgres"
```

### Option B: Railway

1. Create account at [railway.app](https://railway.app)
2. Create PostgreSQL service
3. Copy connection string
4. Add to `.env`

### Option C: Self-Hosted

```bash
# Install PostgreSQL
sudo apt install postgresql

# Create database
createdb flowmanga

# Set connection string
DATABASE_URL="postgresql://user:password@localhost:5432/flowmanga"
```

## Step 2: Environment Variables

Create `.env` file with all required variables:

```env
# Database
DATABASE_URL="your-postgres-connection-string"

# NextAuth
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# OAuth (Optional)
DISCORD_CLIENT_ID="your-discord-id"
DISCORD_CLIENT_SECRET="your-discord-secret"
GITHUB_ID="your-github-id"
GITHUB_SECRET="your-github-secret"

# Email (Resend)
RESEND_API_KEY="re_xxxxxxxxxxxxx"
EMAIL_FROM="noreply@yourdomain.com"

# Rate Limiting (Upstash)
UPSTASH_REDIS_REST_URL="https://your-redis.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-token"

# App
NEXT_PUBLIC_APP_URL="https://your-domain.com"
```

## Step 3: Resend Email Setup

1. Sign up at [resend.com](https://resend.com)
2. Verify your domain (or use resend.dev for testing)
3. Create API key
4. Add to environment variables

## Step 4: Upstash Redis Setup

1. Sign up at [upstash.com](https://upstash.com)
2. Create Redis database (free tier available)
3. Copy REST URL and token
4. Add to environment variables

## Step 5: OAuth Setup (Optional)

### Discord OAuth

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create New Application
3. Go to OAuth2 → Add Redirect: `https://your-domain.com/api/auth/callback/discord`
4. Copy Client ID and Secret

### GitHub OAuth

1. Go to [GitHub Settings → Developer Settings](https://github.com/settings/developers)
2. New OAuth App
3. Authorization callback URL: `https://your-domain.com/api/auth/callback/github`
4. Copy Client ID and Secret

## Step 6: Database Migration

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Optional: Seed initial data
npx prisma db seed
```

## Step 7: Build Application

```bash
# Build for production
npm run build

# Test production build locally
npm start
```

## Step 8: Deploy

### Option A: Vercel (Easiest)

1. Push code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy!

**Vercel Configuration:**
- Framework Preset: Next.js
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`

### Option B: Railway

1. Connect GitHub repository
2. Add environment variables
3. Deploy automatically on push

### Option C: Docker

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npx prisma generate
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t flowmanga .
docker run -p 3000:3000 --env-file .env flowmanga
```

### Option D: VPS (Ubuntu)

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone repository
git clone your-repo
cd flowmamga

# Install dependencies
npm ci --only=production

# Build
npm run build

# Install PM2
npm install -g pm2

# Start with PM2
pm2 start npm --name "flowmanga" -- start

# Setup nginx reverse proxy
sudo apt install nginx
```

Nginx configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Step 9: Post-Deployment

### Create Admin User

```bash
# Connect to database
npx prisma studio

# Or use SQL
UPDATE "User" SET role = 'ADMIN' WHERE email = 'your-email@example.com';
```

### Verify Functionality

- ✅ User registration/login works
- ✅ Email notifications send
- ✅ Image uploads work
- ✅ Rate limiting active
- ✅ Search functions properly
- ✅ Analytics display correctly

### Setup Monitoring (Optional)

- **Sentry**: Error tracking
- **LogRocket**: Session replay
- **Vercel Analytics**: Performance monitoring

## Step 10: Domain & SSL

### Vercel
- Add custom domain in project settings
- SSL automatically configured

### Manual (Let's Encrypt)
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Troubleshooting

### Database Connection Issues
```bash
# Test connection
npx prisma db pull

# Check connection string format
# Should be: postgresql://USER:PASSWORD@HOST:PORT/DATABASE
```

### Build Errors
```bash
# Clear cache
rm -rf .next node_modules
npm install
npm run build
```

### Email Not Sending
- Verify Resend API key
- Check domain verification
- Review email logs in Resend dashboard

### Rate Limiting Not Working
- Verify Upstash credentials
- Check Redis connection in logs
- Ensure environment variables are set

## Performance Optimization

### Enable Caching
```javascript
// next.config.js
module.exports = {
  images: {
    domains: ['your-cdn.com'],
  },
  headers: async () => [
    {
      source: '/covers/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    },
  ],
};
```

### CDN Setup
- Use Vercel's built-in CDN
- Or configure Cloudflare for caching

### Database Optimization
```sql
-- Add indexes for common queries
CREATE INDEX idx_comics_trending ON "Comic"("trendingScore" DESC);
CREATE INDEX idx_comics_created ON "Comic"("createdAt" DESC);
CREATE INDEX idx_views_comic ON "ComicView"("comicId", "viewedAt");
```

## Security Checklist

- ✅ Environment variables secured
- ✅ HTTPS enabled
- ✅ Rate limiting active
- ✅ CORS configured
- ✅ SQL injection protected (Prisma)
- ✅ XSS protection enabled
- ✅ CSRF tokens (NextAuth)

## Backup Strategy

### Database Backups
```bash
# Automated daily backups
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Restore
psql $DATABASE_URL < backup-20260212.sql
```

### File Backups
- Backup `flowmanga_library/` directory
- Backup `public/covers/` and `public/pages/`

## Scaling Considerations

### Horizontal Scaling
- Use load balancer (Nginx, Cloudflare)
- Database connection pooling
- Redis cluster for rate limiting

### Vertical Scaling
- Increase server resources
- Optimize database queries
- Enable Next.js caching

## Support

For issues or questions:
- Check logs: `pm2 logs flowmanga`
- Review Prisma logs
- Check Vercel deployment logs

---

**Deployment Status**: Production Ready 🚀
**Estimated Setup Time**: 30-60 minutes
