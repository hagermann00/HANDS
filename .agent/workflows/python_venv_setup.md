---
description: Set up Python virtual environment and install dependencies
---

# Python Virtual Environment Setup

## Prerequisites
- Python 3.8+ installed
- Project directory exists

## Steps

// turbo
1. Create virtual environment:
```bash
python -m venv venv
```

2. Activate virtual environment:

**Windows:**
```bash
venv\Scripts\activate
```

**macOS/Linux:**
```bash
source venv/bin/activate
```

// turbo
3. Upgrade pip:
```bash
pip install --upgrade pip
```

4. Create requirements.txt:
```
# Core
requests>=2.28.0
python-dotenv>=1.0.0

# Development
pytest>=7.0.0
black>=23.0.0
flake8>=6.0.0

# API (optional)
fastapi>=0.100.0
uvicorn>=0.23.0
```

// turbo
5. Install dependencies:
```bash
pip install -r requirements.txt
```

6. Create .env file:
```
# Environment variables
DEBUG=True
API_KEY=your_key_here
```

7. Create main.py:
```python
from dotenv import load_dotenv
import os

load_dotenv()

def main():
    print("Hello from Python!")
    debug = os.getenv("DEBUG", "False")
    print(f"Debug mode: {debug}")

if __name__ == "__main__":
    main()
```

## Success Criteria
- venv directory exists
- requirements.txt created
- Dependencies installed
- main.py runs without errors
