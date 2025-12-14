---
description: Set up rate limiting and API security
---

# API Security Setup

## Prerequisites
- Express.js server running
- npm initialized

## Steps

// turbo
1. Install security packages:
```bash
npm install helmet cors express-rate-limit hpp express-validator
```

2. Create src/middleware/security.js:
```javascript
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');

// CORS configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Rate limiter - general
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiter - auth endpoints (stricter)
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 login attempts per hour
  message: { error: 'Too many login attempts, please try again later' }
});

// Rate limiter - API endpoints
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: { error: 'API rate limit exceeded' }
});

function setupSecurity(app) {
  // Helmet for security headers
  app.use(helmet());
  
  // CORS
  app.use(cors(corsOptions));
  
  // HPP - prevent HTTP Parameter Pollution
  app.use(hpp());
  
  // Rate limiting
  app.use(generalLimiter);
  app.use('/auth', authLimiter);
  app.use('/api', apiLimiter);
  
  // Disable x-powered-by
  app.disable('x-powered-by');
}

module.exports = { setupSecurity, authLimiter, apiLimiter };
```

3. Input validation middleware:
```javascript
const { body, param, query, validationResult } = require('express-validator');

// Validation error handler
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Validation failed',
      details: errors.array() 
    });
  }
  next();
};

// Common validators
const validators = {
  email: body('email').isEmail().normalizeEmail(),
  password: body('password').isLength({ min: 8 }).matches(/\d/).matches(/[a-z]/i),
  id: param('id').isInt({ min: 1 }),
  pagination: [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ]
};

module.exports = { validate, validators };
```

4. Usage in routes:
```javascript
const { validate, validators } = require('../middleware/validation');

router.post('/register', 
  validators.email,
  validators.password,
  body('name').trim().isLength({ min: 2, max: 50 }),
  validate,
  authController.register
);
```

5. Apply to app:
```javascript
const { setupSecurity } = require('./middleware/security');
setupSecurity(app);
```

## Success Criteria
- Security headers present
- Rate limiting working
- CORS configured
- Input validation active
