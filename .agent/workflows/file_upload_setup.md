---
description: Set up file upload handling with Multer
---

# File Upload Setup

## Prerequisites
- Express.js server running
- npm initialized

## Steps

// turbo
1. Install Multer:
```bash
npm install multer
npm install uuid  # for unique filenames
```

2. Create src/middleware/upload.js:
```javascript
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${uuidv4()}${ext}`;
    cb(null, uniqueName);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and PDF are allowed.'), false);
  }
};

// Size limits
const limits = {
  fileSize: 5 * 1024 * 1024, // 5MB
  files: 5 // Max 5 files
};

const upload = multer({ storage, fileFilter, limits });

module.exports = upload;
```

3. Create uploads directory:
```bash
mkdir uploads
```

4. Add to .gitignore:
```
uploads/*
!uploads/.gitkeep
```

5. Create route handlers:
```javascript
const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const path = require('path');
const fs = require('fs');

// Single file upload
router.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  res.json({
    message: 'File uploaded successfully',
    file: {
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      url: `/uploads/${req.file.filename}`
    }
  });
});

// Multiple files upload
router.post('/upload-multiple', upload.array('files', 5), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded' });
  }
  
  const files = req.files.map(file => ({
    filename: file.filename,
    originalName: file.originalname,
    size: file.size,
    url: `/uploads/${file.filename}`
  }));
  
  res.json({ message: 'Files uploaded', files });
});

// Delete file
router.delete('/upload/:filename', (req, res) => {
  const filePath = path.join('uploads', req.params.filename);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }
  
  fs.unlinkSync(filePath);
  res.json({ message: 'File deleted' });
});

// Error handling middleware
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Max 5MB allowed.' });
    }
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

module.exports = router;
```

6. Serve static uploads:
```javascript
app.use('/uploads', express.static('uploads'));
```

## Success Criteria
- File uploads work
- Size limits enforced
- Invalid types rejected
- Files served statically
