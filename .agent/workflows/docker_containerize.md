---
description: Create Dockerfile and docker-compose for containerization
---

# Docker Containerization

## Prerequisites
- Docker installed
- Application code ready

## Steps

1. Create Dockerfile for Node.js app:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["node", "src/index.js"]
```

2. Create Dockerfile for Python app:
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["python", "main.py"]
```

3. Create .dockerignore:
```
node_modules/
venv/
__pycache__/
.env
.git/
*.md
Dockerfile
docker-compose.yml
.dockerignore
```

4. Create docker-compose.yml:
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    volumes:
      - .:/app
      - /app/node_modules
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: myapp
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

// turbo
5. Build the image:
```bash
docker build -t myapp:latest .
```

// turbo
6. Run with docker-compose:
```bash
docker-compose up -d
```

## Success Criteria
- Docker image builds successfully
- Container runs without errors
- Application accessible on specified port
