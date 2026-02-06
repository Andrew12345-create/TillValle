# Netlify Environment Variables

Add these environment variables in your Netlify dashboard:
**Site Settings → Environment Variables**

## Required Variables

### Database
```
DATABASE_URL=postgresql://neondb_owner:npg_StsfT1R6ZyNi@ep-bold-silence-aiue9xsj-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

### Node Environment
```
NODE_ENV=production
```

### JWT Secret (for authentication)
```
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

### Session Secret
```
SESSION_SECRET=your-super-secret-session-key-change-this-in-production
```

### Email Configuration (for password reset)
```
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password
```

### M-Pesa Configuration (if using M-Pesa payments)
```
MPESA_CONSUMER_KEY=your-mpesa-consumer-key
MPESA_CONSUMER_SECRET=your-mpesa-consumer-secret
MPESA_SHORTCODE=174379
MPESA_PASSKEY=your-mpesa-passkey
SITE_URL=https://your-site.netlify.app
```

## How to Add in Netlify

1. Go to your Netlify site dashboard
2. Click **Site Settings**
3. Click **Environment Variables** in the left sidebar
4. Click **Add a variable**
5. Add each variable with its key and value
6. Click **Save**
7. Redeploy your site for changes to take effect

## Minimum Required for Basic Functionality

```
DATABASE_URL=postgresql://neondb_owner:npg_StsfT1R6ZyNi@ep-bold-silence-aiue9xsj-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
NODE_ENV=production
JWT_SECRET=change-this-to-random-string
SESSION_SECRET=change-this-to-random-string
```
