---
description: Set up logging with Winston or Pino
---

# Logging Setup

## Prerequisites
- Node.js project initialized

## Option A: Winston (Full-featured)

// turbo
1. Install Winston:
```bash
npm install winston
```

2. Create src/utils/logger.js:
```javascript
const winston = require('winston');
const path = require('path');

const logDir = 'logs';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'my-app' },
  transports: [
    // Error logs
    new winston.transports.File({ 
      filename: path.join(logDir, 'error.log'), 
      level: 'error' 
    }),
    // Combined logs
    new winston.transports.File({ 
      filename: path.join(logDir, 'combined.log') 
    })
  ]
});

// Console logging for non-production
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

module.exports = logger;
```

3. Usage:
```javascript
const logger = require('./utils/logger');

logger.info('Application started');
logger.warn('This is a warning', { userId: 123 });
logger.error('Something went wrong', { error: err.message, stack: err.stack });
```

## Option B: Pino (High-performance)

// turbo
1. Install Pino:
```bash
npm install pino pino-pretty
```

2. Create src/utils/logger.js:
```javascript
const pino = require('pino');

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV !== 'production' 
    ? { target: 'pino-pretty', options: { colorize: true } }
    : undefined,
  base: { service: 'my-app' },
  timestamp: () => `,"time":"${new Date().toISOString()}"`
});

module.exports = logger;
```

3. Express middleware:
```javascript
const pinoHttp = require('pino-http');

app.use(pinoHttp({ logger }));
```

## Option C: Morgan (HTTP request logging)

// turbo
1. Install Morgan:
```bash
npm install morgan
```

2. Setup:
```javascript
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');

// Create write stream for access logs
const accessLogStream = fs.createWriteStream(
  path.join(__dirname, 'logs', 'access.log'),
  { flags: 'a' }
);

// Development: colored console output
app.use(morgan('dev'));

// Production: combined format to file
app.use(morgan('combined', { stream: accessLogStream }));
```

## Success Criteria
- Logger configured
- Logs written to files
- Console output in development
- JSON logs in production
