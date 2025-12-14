---
description: Initialize git repository with proper configuration
---

# Git Repository Setup

## Prerequisites
- Git installed
- Project directory exists

## Steps

// turbo
1. Initialize git repository:
```bash
git init
```

2. Create comprehensive .gitignore:
```
# Dependencies
node_modules/
vendor/
__pycache__/
*.pyc
venv/

# Environment
.env
.env.local
*.local

# IDE
.idea/
.vscode/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Build
dist/
build/
*.egg-info/

# Logs
*.log
logs/

# Testing
coverage/
.pytest_cache/
```

3. Create README.md:
```markdown
# Project Name

## Description
Brief description of the project.

## Installation
\`\`\`bash
npm install
\`\`\`

## Usage
\`\`\`bash
npm start
\`\`\`

## License
MIT
```

// turbo
4. Stage all files:
```bash
git add -A
```

5. Create initial commit:
```bash
git commit -m "Initial commit: project setup"
```

## Optional: Remote Setup
```bash
git remote add origin <REPO_URL>
git push -u origin main
```

## Success Criteria
- .git directory exists
- .gitignore created
- README.md created
- Initial commit made
