# 🚀 Render Deployment Guide

## Environment Variables to Set in Render:

### Required:
- `PORT` = `10000` (Render will set this automatically)
- `NODE_ENV` = `production`

### Optional (for enhanced security):
- `JWT_SECRET` = `your-super-secret-jwt-key-change-this-in-production`
- `RATE_LIMIT_WINDOW_MS` = `900000`
- `RATE_LIMIT_MAX_REQUESTS` = `100`
- `CORS_ORIGIN` = `https://your-frontend-domain.vercel.app`

## Deployment Steps:

1. **Go to [render.com](https://render.com)**
2. **Sign up/Login with GitHub**
3. **Click "New +" → "Web Service"**
4. **Connect your GitHub repository**
5. **Select the `backend` folder**
6. **Configure:**
   - **Name:** `metaverse-backend`
   - **Environment:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Port:** `10000` (Render will set this)

7. **Add Environment Variables** (see above)
8. **Click "Create Web Service"**

## Health Check:
- Your service will be available at: `https://your-service-name.onrender.com`
- Health check endpoint: `https://your-service-name.onrender.com/health`

## Update Frontend:
After deployment, update your frontend to use the new backend URL:
```typescript
const serverUrl = 'https://your-service-name.onrender.com';
``` 