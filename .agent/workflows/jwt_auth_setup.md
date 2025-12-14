---
description: Set up authentication with JWT tokens
---

# JWT Authentication Setup

## Prerequisites
- Express.js API running
- npm initialized

## Steps

// turbo
1. Install dependencies:
```bash
npm install jsonwebtoken bcryptjs
npm install --save-dev @types/jsonwebtoken @types/bcryptjs
```

2. Create src/config/auth.js:
```javascript
module.exports = {
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  jwtExpiration: '24h',
  saltRounds: 10
};
```

3. Create src/middleware/auth.js:
```javascript
const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/auth');

module.exports = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};
```

4. Create src/controllers/authController.js:
```javascript
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { jwtSecret, jwtExpiration, saltRounds } = require('../config/auth');

// In-memory users (replace with database)
const users = [];

exports.register = async (req, res) => {
  const { email, password, name } = req.body;
  
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'All fields required' });
  }
  
  if (users.find(u => u.email === email)) {
    return res.status(409).json({ error: 'Email already exists' });
  }
  
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  const user = { id: users.length + 1, email, name, password: hashedPassword };
  users.push(user);
  
  const token = jwt.sign({ id: user.id, email: user.email }, jwtSecret, {
    expiresIn: jwtExpiration
  });
  
  res.status(201).json({ 
    message: 'User registered',
    token,
    user: { id: user.id, email: user.email, name: user.name }
  });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  
  const user = users.find(u => u.email === email);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  const token = jwt.sign({ id: user.id, email: user.email }, jwtSecret, {
    expiresIn: jwtExpiration
  });
  
  res.json({ 
    token,
    user: { id: user.id, email: user.email, name: user.name }
  });
};

exports.me = (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({ id: user.id, email: user.email, name: user.name });
};
```

5. Create src/routes/auth.js:
```javascript
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authMiddleware, authController.me);

module.exports = router;
```

6. Add to server:
```javascript
const authRoutes = require('./routes/auth');
app.use('/auth', authRoutes);
```

## Success Criteria
- Register endpoint creates user
- Login endpoint returns JWT
- Protected routes require valid token
