---
description: Set up caching with Redis
---

# Redis Cache Setup

## Prerequisites
- Redis server installed/running
- Node.js project initialized

## Steps

// turbo
1. Install Redis client:
```bash
npm install ioredis
```

2. Create src/cache/redis.js:
```javascript
const Redis = require('ioredis');

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3
});

redis.on('connect', () => {
  console.log('✓ Redis connected');
});

redis.on('error', (err) => {
  console.error('Redis error:', err);
});

// Cache utilities
const cache = {
  async get(key) {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  },
  
  async set(key, value, ttlSeconds = 3600) {
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  },
  
  async del(key) {
    await redis.del(key);
  },
  
  async delPattern(pattern) {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  },
  
  async flush() {
    await redis.flushdb();
  }
};

module.exports = { redis, cache };
```

3. Create cache middleware:
```javascript
const { cache } = require('../cache/redis');

function cacheMiddleware(ttlSeconds = 300) {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }
    
    const key = `cache:${req.originalUrl}`;
    
    try {
      const cached = await cache.get(key);
      if (cached) {
        return res.json(cached);
      }
      
      // Store original send
      const originalSend = res.json.bind(res);
      
      // Override res.json to cache response
      res.json = async (body) => {
        await cache.set(key, body, ttlSeconds);
        return originalSend(body);
      };
      
      next();
    } catch (err) {
      console.error('Cache error:', err);
      next();
    }
  };
}

module.exports = cacheMiddleware;
```

4. Usage in routes:
```javascript
const cacheMiddleware = require('../middleware/cache');

// Cache for 5 minutes
router.get('/items', cacheMiddleware(300), itemController.getAll);

// Clear cache on mutations
router.post('/items', async (req, res, next) => {
  // ... create item
  await cache.delPattern('cache:/api/items*');
  next();
}, itemController.create);
```

5. Session storage with Redis:
```javascript
const session = require('express-session');
const RedisStore = require('connect-redis').default;
const { redis } = require('./cache/redis');

app.use(session({
  store: new RedisStore({ client: redis }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));
```

## Success Criteria
- Redis connection established
- Cache middleware working
- Cache invalidation on mutations
- Sessions stored in Redis
