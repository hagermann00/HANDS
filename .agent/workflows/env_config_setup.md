---
description: Set up environment variables and configuration management
---

# Environment Configuration Setup

## Prerequisites
- Project initialized
- .env file needed

## Steps

// turbo
1. Install dotenv:
```bash
npm install dotenv
```

2. Create .env.example (commit this):
```env
# Server
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgres://user:password@localhost:5432/myapp
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-secret-key-here
JWT_EXPIRATION=24h

# External APIs
API_KEY=your-api-key
OPENAI_API_KEY=sk-xxx

# Email
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user@example.com
SMTP_PASS=password

# Feature Flags
ENABLE_NEW_FEATURE=false
DEBUG_MODE=true
```

3. Create .env (copy from .env.example, don't commit):
```bash
cp .env.example .env
```

4. Create src/config/index.js:
```javascript
require('dotenv').config();

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  
  database: {
    url: process.env.DATABASE_URL,
    pool: {
      min: 2,
      max: 10
    }
  },
  
  redis: {
    url: process.env.REDIS_URL
  },
  
  jwt: {
    secret: process.env.JWT_SECRET,
    expiration: process.env.JWT_EXPIRATION || '24h'
  },
  
  email: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  
  features: {
    newFeature: process.env.ENABLE_NEW_FEATURE === 'true',
    debug: process.env.DEBUG_MODE === 'true'
  },
  
  isDevelopment() {
    return this.env === 'development';
  },
  
  isProduction() {
    return this.env === 'production';
  }
};

// Validate required vars in production
if (config.isProduction()) {
  const required = ['JWT_SECRET', 'DATABASE_URL'];
  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing required env var: ${key}`);
    }
  }
}

module.exports = config;
```

5. Usage in code:
```javascript
const config = require('./config');

console.log(`Running in ${config.env} mode on port ${config.port}`);

if (config.features.debug) {
  console.log('Debug mode enabled');
}

if (config.isDevelopment()) {
  // Development-only code
}
```

6. Add to .gitignore:
```
.env
.env.local
.env.*.local
```

## Success Criteria
- .env.example committed
- .env ignored by git
- Config module exports all vars
- Required vars validated in prod
