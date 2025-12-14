---
description: Scaffold a REST API with Express.js
---

# REST API Scaffold (Express)

## Prerequisites
- Node.js installed
- npm initialized

## Steps

// turbo
1. Install dependencies:
```bash
npm install express cors helmet morgan dotenv
npm install --save-dev nodemon
```

2. Create project structure:
```
src/
├── index.js
├── routes/
│   └── api.js
├── controllers/
│   └── itemController.js
├── middleware/
│   └── errorHandler.js
└── config/
    └── index.js
```

3. Create src/index.js:
```javascript
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const apiRoutes = require('./routes/api');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/api', apiRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
```

4. Create src/routes/api.js:
```javascript
const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');

router.get('/items', itemController.getAll);
router.get('/items/:id', itemController.getById);
router.post('/items', itemController.create);
router.put('/items/:id', itemController.update);
router.delete('/items/:id', itemController.delete);

module.exports = router;
```

5. Create src/controllers/itemController.js:
```javascript
let items = [];
let nextId = 1;

exports.getAll = (req, res) => {
  res.json(items);
};

exports.getById = (req, res) => {
  const item = items.find(i => i.id === parseInt(req.params.id));
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(item);
};

exports.create = (req, res) => {
  const item = { id: nextId++, ...req.body };
  items.push(item);
  res.status(201).json(item);
};

exports.update = (req, res) => {
  const index = items.findIndex(i => i.id === parseInt(req.params.id));
  if (index === -1) return res.status(404).json({ error: 'Not found' });
  items[index] = { ...items[index], ...req.body };
  res.json(items[index]);
};

exports.delete = (req, res) => {
  const index = items.findIndex(i => i.id === parseInt(req.params.id));
  if (index === -1) return res.status(404).json({ error: 'Not found' });
  items.splice(index, 1);
  res.status(204).send();
};
```

6. Create src/middleware/errorHandler.js:
```javascript
module.exports = (err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};
```

// turbo
7. Start the server:
```bash
npm run dev
```

## Success Criteria
- Server starts without errors
- GET /health returns 200
- CRUD endpoints functional
