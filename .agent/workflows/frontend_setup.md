---
description: Create a React or Next.js frontend project
---

# Frontend Project Setup

## Prerequisites
- Node.js 18+ installed
- Project directory ready

## Option A: Create React App (Vite)

// turbo
1. Create Vite project:
```bash
npm create vite@latest . -- --template react
```

// turbo
2. Install dependencies:
```bash
npm install
```

// turbo
3. Install common packages:
```bash
npm install react-router-dom axios
npm install --save-dev @types/react @types/react-dom
```

// turbo
4. Start dev server:
```bash
npm run dev
```

## Option B: Next.js

// turbo
1. Create Next.js project:
```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir
```

// turbo
2. Start dev server:
```bash
npm run dev
```

## Common Setup Steps

3. Create folder structure:
```
src/
├── components/
│   ├── ui/
│   │   ├── Button.jsx
│   │   └── Input.jsx
│   └── layout/
│       ├── Header.jsx
│       └── Footer.jsx
├── pages/ (or app/ for Next.js)
├── hooks/
│   └── useApi.js
├── services/
│   └── api.js
├── utils/
│   └── helpers.js
└── styles/
    └── globals.css
```

4. Create src/services/api.js:
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 10000
});

// Request interceptor for auth
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for errors
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

5. Create src/hooks/useApi.js:
```javascript
import { useState, useEffect } from 'react';
import api from '../services/api';

export function useApi(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);The 

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get(url);
        setData(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [url]);

  return { data, loading, error };
}
```

## Success Criteria
- Project created successfully
- Dev server runs
- Folder structure organized
- API service configured
