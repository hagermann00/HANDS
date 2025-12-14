---
description: Initialize a new Node.js project with essential dependencies
---

# NPM Project Initialization

## Prerequisites
- Node.js installed
- Target directory specified

## Steps

// turbo
1. Create package.json with project metadata:
```bash
npm init -y
```

// turbo
2. Install common dev dependencies:
```bash
npm install --save-dev eslint prettier nodemon
```

// turbo
3. Install common runtime dependencies:
```bash
npm install express dotenv
```

4. Create .gitignore for Node:
```
node_modules/
.env
.DS_Store
*.log
dist/
coverage/
```

5. Create basic project structure:
```bash
mkdir src tests
touch src/index.js
```

6. Add npm scripts to package.json:
```json
{
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js",
    "test": "jest",
    "lint": "eslint src/"
  }
}
```

## Success Criteria
- package.json exists with scripts
- node_modules directory created
- src/index.js exists
