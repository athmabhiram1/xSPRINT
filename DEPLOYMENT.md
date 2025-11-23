# xSPRINT Production Deployment Guide

## 🚀 Deployment Options

### Option 1: Vercel (Frontend) + Railway/Render (Backend)

#### Frontend (Vercel)
1. Push code to GitHub
2. Import project in Vercel
3. Set environment variables:
   ```
   NEXT_PUBLIC_API_BASE_URL=https://your-backend.railway.app
   NEXT_PUBLIC_SOCKET_URL=https://your-backend.railway.app
   NEXT_PUBLIC_ENV_NAME=PRODUCTION
   ```
4. Deploy

#### Backend (Railway)
1. Create new project in Railway
2. Add PostgreSQL database
3. Set environment variables:
   ```
   DATABASE_URL=<from Railway PostgreSQL>
   JWT_SECRET=<generate strong secret>
   PORT=3001
   NODE_ENV=production
   ALLOWED_ORIGINS=https://your-frontend.vercel.app
   ```
4. Deploy from GitHub

---

### Option 2: VPS with PM2

#### Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx
```

#### Database Setup
```bash
sudo -u postgres psql
CREATE DATABASE xsprint;
CREATE USER xsprint_user WITH PASSWORD 'strong_password';
GRANT ALL PRIVILEGES ON DATABASE xsprint TO xsprint_user;
\q
```

#### Backend Deployment
```bash
# Clone and setup
git clone <repo-url>
cd xsprint/backend
npm install
npm run build

# Configure environment
cp .env.example .env
nano .env  # Edit with production values

# Run migrations
npx prisma migrate deploy

# Start with PM2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

#### Frontend Deployment
```bash
cd ../frontend
npm install
npm run build

# Serve with PM2
pm2 serve .next 3000 --name xsprint-frontend --spa
pm2 save
```

#### Nginx Configuration
```nginx
# /etc/nginx/sites-available/xsprint
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Socket.IO
    location /socket.io {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/xsprint /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Setup SSL with Let's Encrypt
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## 🔒 Security Checklist

- [ ] Change default JWT_SECRET to strong random value
- [ ] Use environment-specific DATABASE_URL
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS with production domains only
- [ ] Set up database backups (daily recommended)
- [ ] Enable firewall (ufw on Ubuntu)
- [ ] Set up monitoring (PM2 monitoring, Sentry, etc.)
- [ ] Configure log rotation
- [ ] Review rate limiting thresholds
- [ ] Set up database connection pooling

---

## 📊 Monitoring

### PM2 Monitoring
```bash
# View logs
pm2 logs

# Monitor resources
pm2 monit

# Check status
pm2 status

# Restart if needed
pm2 restart xsprint-backend
```

### Health Checks
```bash
# Backend health
curl https://your-domain.com/api/health

# Expected response:
# {"success":true,"data":{"status":"UP","timestamp":"...","uptime":123}}
```

---

## 🔄 Database Migrations

### Production Migration
```bash
cd backend
npx prisma migrate deploy
```

### Rollback (if needed)
```bash
# Restore from backup
pg_restore -U xsprint_user -d xsprint backup.dump
```

---

## 📦 Backup Strategy

### Database Backup Script
```bash
#!/bin/bash
# /home/user/backup-db.sh

BACKUP_DIR="/home/user/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/xsprint_$TIMESTAMP.dump"

pg_dump -U xsprint_user -d xsprint -F c -f $BACKUP_FILE

# Keep only last 7 days
find $BACKUP_DIR -name "xsprint_*.dump" -mtime +7 -delete

echo "Backup completed: $BACKUP_FILE"
```

### Cron Job
```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /home/user/backup-db.sh >> /home/user/backup.log 2>&1
```

---

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check logs
pm2 logs xsprint-backend

# Common issues:
# 1. Database connection - verify DATABASE_URL
# 2. Port in use - check PORT in .env
# 3. Missing dependencies - run npm install
```

### Frontend build errors
```bash
# Clear cache
rm -rf .next
npm run build

# Check environment variables
cat .env.local
```

### Socket.IO not connecting
```bash
# Verify CORS settings in backend
# Check NEXT_PUBLIC_SOCKET_URL in frontend
# Ensure Nginx proxy_pass includes Socket.IO path
```

---

## 📈 Performance Optimization

### Database
- Enable connection pooling in Prisma
- Add indexes for frequently queried fields
- Use database query logging to identify slow queries

### Backend
- Enable compression middleware ✅ (already configured)
- Use PM2 cluster mode ✅ (already configured)
- Implement caching for leaderboard queries

### Frontend
- Use Next.js Image optimization
- Enable static page generation where possible
- Implement code splitting

---

## 🔐 Environment Variables Reference

### Backend Required
```env
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_SECRET=<min-32-char-random-string>
PORT=3001
NODE_ENV=production
ALLOWED_ORIGINS=https://frontend.com,https://www.frontend.com
```

### Frontend Required
```env
NEXT_PUBLIC_API_BASE_URL=https://api.your-domain.com
NEXT_PUBLIC_SOCKET_URL=https://api.your-domain.com
NEXT_PUBLIC_ENV_NAME=PRODUCTION
```

---

## 📞 Support

For deployment issues:
1. Check logs: `pm2 logs`
2. Verify environment variables
3. Test health endpoint
4. Review Nginx error logs: `sudo tail -f /var/log/nginx/error.log`

---

**Last Updated:** 2024
