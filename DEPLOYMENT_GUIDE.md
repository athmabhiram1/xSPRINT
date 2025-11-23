# 🚀 Production Deployment Guide

This guide covers deploying xSPRINT to production environments.

---

## 📋 Pre-Deployment Checklist

### **1. Security**
- [ ] Change `JWT_SECRET` to a strong random string (min 32 characters)
- [ ] Change `ADMIN_BOOTSTRAP_CODE` to a secure value
- [ ] Set `COOKIE_SECURE="true"` for HTTPS
- [ ] Update `CORS_ORIGIN` to production domain
- [ ] Enable rate limiting in production
- [ ] Review and update all `.env` values
- [ ] Remove any hardcoded secrets from code
- [ ] Ensure `.env` files are in `.gitignore`

### **2. Database**
- [ ] Set up production PostgreSQL database
- [ ] Run all migrations: `npx prisma migrate deploy`
- [ ] Configure database backups
- [ ] Set up database connection pooling
- [ ] Test database connection from production server

### **3. Code Quality**
- [ ] Run `npm run build` on both frontend and backend
- [ ] Fix all TypeScript errors
- [ ] Run linter: `npm run lint`
- [ ] Run tests: `npm run test`
- [ ] Remove console.logs from production code
- [ ] Minify and optimize assets

### **4. Performance**
- [ ] Enable compression middleware
- [ ] Configure CDN for static assets
- [ ] Set up image optimization
- [ ] Enable HTTP/2
- [ ] Configure caching headers

---

## 🌐 Deployment Options

### **Option 1: VPS/Cloud Server (DigitalOcean, AWS EC2, etc.)**

#### **1. Server Setup**

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install PM2 for process management
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx
```

#### **2. PostgreSQL Setup**

```bash
# Create database user
sudo -u postgres psql
CREATE DATABASE xsprint;
CREATE USER xsprint_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE xsprint TO xsprint_user;
\q
```

#### **3. Deploy Backend**

```bash
# Clone repository
git clone https://github.com/yourusername/xsprint.git
cd xsprint/backend

# Install dependencies
npm install --production

# Set up environment
cp .env.example .env
nano .env  # Edit with production values

# Build TypeScript
npm run build

# Run migrations
npx prisma migrate deploy
npx prisma generate

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Follow instructions to enable auto-start
```

**ecosystem.config.js:**
```javascript
module.exports = {
  apps: [{
    name: 'xsprint-api',
    script: './dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    }
  }]
};
```

#### **4. Deploy Frontend**

```bash
cd ../frontend

# Install dependencies
npm install --production

# Build
npm run build

# Option A: Serve with PM2
pm2 start npm --name "xsprint-web" -- start

# Option B: Use Nginx to serve static files (recommended)
# Copy build output to Nginx directory
sudo cp -r .next /var/www/xsprint
```

#### **5. Nginx Configuration**

**Frontend Reverse Proxy:**
```nginx
# /etc/nginx/sites-available/xsprint-frontend
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Backend API:**
```nginx
# /etc/nginx/sites-available/xsprint-api
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # Increase timeouts for long-running requests
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

Enable sites:
```bash
sudo ln -s /etc/nginx/sites-available/xsprint-frontend /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/xsprint-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### **6. SSL Certificate (Let's Encrypt)**

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificates
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
sudo certbot --nginx -d api.yourdomain.com

# Auto-renewal (already configured by Certbot)
sudo systemctl status certbot.timer
```

---

### **Option 2: Vercel (Frontend) + Railway/Render (Backend)**

#### **Frontend on Vercel**

1. Push code to GitHub
2. Import project on [Vercel](https://vercel.com)
3. Set environment variables:
   ```
   NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com
   ```
4. Deploy!

#### **Backend on Railway**

1. Create account on [Railway](https://railway.app)
2. Create new project from GitHub repo
3. Add PostgreSQL database addon
4. Set environment variables from `.env.example`
5. Railway will auto-deploy on push

**Alternative: Render.com**
- Similar to Railway
- Free tier available
- Built-in PostgreSQL

---

### **Option 3: Docker Deployment**

#### **Create Dockerfiles**

**Backend Dockerfile:**
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production

# Copy source
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

EXPOSE 5000

CMD ["npm", "start"]
```

**Frontend Dockerfile:**
```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
```

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_USER: xsprint
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: xsprint
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgresql://xsprint:${DB_PASSWORD}@postgres:5432/xsprint
      JWT_SECRET: ${JWT_SECRET}
      NODE_ENV: production
    ports:
      - "5000:5000"
    depends_on:
      - postgres
    command: sh -c "npx prisma migrate deploy && npm start"

  frontend:
    build: ./frontend
    environment:
      NEXT_PUBLIC_API_BASE_URL: http://backend:5000
    ports:
      - "3000:3000"
    depends_on:
      - backend

volumes:
  postgres_data:
```

Deploy:
```bash
docker-compose up -d
```

---

## 🔒 Production Security Hardening

### **1. Environment Variables**

Never commit `.env` files. Use environment-specific configs:

```bash
# Production .env
NODE_ENV=production
JWT_SECRET=<generated-with-openssl-rand-base64-32>
COOKIE_SECURE=true
CORS_ORIGIN=https://yourdomain.com
```

### **2. Rate Limiting**

Already configured in `backend/src/middleware/security.ts`:
- General: 100 requests/15min
- Auth: 5 requests/15min

### **3. Database Security**

```sql
-- Revoke public access
REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO xsprint_user;

-- Read-only user for analytics
CREATE ROLE xsprint_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO xsprint_readonly;
```

### **4. Firewall Rules**

```bash
# UFW (Ubuntu)
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### **5. Monitoring**

Install PM2 monitoring:
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

---

## 📊 Monitoring & Logging

### **1. PM2 Logs**

```bash
# View logs
pm2 logs xsprint-api

# Monitor in real-time
pm2 monit
```

### **2. Database Monitoring**

```sql
-- Check active connections
SELECT count(*) FROM pg_stat_activity;

-- Slow queries
SELECT query, mean_exec_time 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;
```

### **3. Set Up Alerts**

Use services like:
- **Sentry** - Error tracking
- **LogRocket** - Session replay
- **Datadog** - Infrastructure monitoring
- **UptimeRobot** - Uptime monitoring

---

## 🔄 CI/CD Pipeline

### **GitHub Actions Example**

**.github/workflows/deploy.yml:**
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install Backend Dependencies
        working-directory: ./backend
        run: npm ci
      
      - name: Build Backend
        working-directory: ./backend
        run: npm run build
      
      - name: Deploy Backend
        env:
          SSH_PRIVATE_KEY: ${{ secrets.SSH_PRIVATE_KEY }}
        run: |
          ssh user@server 'cd /app/backend && git pull && npm ci && npm run build && pm2 restart xsprint-api'
      
      - name: Deploy Frontend to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

---

## 🧪 Post-Deployment Testing

```bash
# Health check
curl https://api.yourdomain.com/api/health

# Test authentication
curl -X POST https://api.yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"test123"}'

# Load testing (optional)
npm install -g artillery
artillery quick --count 10 --num 50 https://yourdomain.com
```

---

## 🔧 Troubleshooting

### **Common Issues**

**1. CORS Errors**
- Check `CORS_ORIGIN` in backend `.env`
- Verify frontend uses correct API URL

**2. Database Connection Failed**
- Verify PostgreSQL is running
- Check `DATABASE_URL` format
- Ensure firewall allows port 5432

**3. 502 Bad Gateway**
- Backend server not running
- Check PM2 status: `pm2 status`
- Check logs: `pm2 logs`

**4. SSL Certificate Issues**
- Renew cert: `sudo certbot renew`
- Check expiration: `sudo certbot certificates`

---

## 📞 Support

For deployment assistance:
- GitHub Issues
- Documentation: `/docs`
- Email: support@xsprint.dev

---

**Last Updated:** November 23, 2025
