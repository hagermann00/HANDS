---
description: Add testing framework to project (Jest or Pytest)
---

# Testing Setup

## Prerequisites
- Project initialized
- Source code to test exists

## Option A: Jest (JavaScript/Node.js)

// turbo
1. Install Jest:
```bash
npm install --save-dev jest @types/jest
```

2. Add jest config to package.json:
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  },
  "jest": {
    "testEnvironment": "node",
    "coverageDirectory": "coverage",
    "collectCoverageFrom": ["src/**/*.js"]
  }
}
```

3. Create tests/example.test.js:
```javascript
describe('Example Test Suite', () => {
  test('should pass basic assertion', () => {
    expect(1 + 1).toBe(2);
  });
  
  test('should handle arrays', () => {
    const arr = [1, 2, 3];
    expect(arr).toHaveLength(3);
    expect(arr).toContain(2);
  });
  
  test('should handle objects', () => {
    const obj = { name: 'test', value: 42 };
    expect(obj).toHaveProperty('name');
    expect(obj.value).toBeGreaterThan(40);
  });
  
  test('should handle async operations', async () => {
    const fetchData = () => Promise.resolve({ data: 'hello' });
    const result = await fetchData();
    expect(result.data).toBe('hello');
  });
});
```

// turbo
4. Run tests:
```bash
npm test
```

## Option B: Pytest (Python)

// turbo
1. Install pytest:
```bash
pip install pytest pytest-cov pytest-asyncio
```

2. Create pytest.ini:
```ini
[pytest]
testpaths = tests
python_files = test_*.py
python_functions = test_*
addopts = -v --tb=short
```

3. Create tests/test_example.py:
```python
import pytest

def test_basic_assertion():
    assert 1 + 1 == 2

def test_list_operations():
    items = [1, 2, 3]
    assert len(items) == 3
    assert 2 in items

def test_dict_operations():
    data = {"name": "test", "value": 42}
    assert "name" in data
    assert data["value"] > 40

class TestMathOperations:
    def test_addition(self):
        assert 2 + 2 == 4
    
    def test_subtraction(self):
        assert 5 - 3 == 2

@pytest.fixture
def sample_data():
    return {"id": 1, "name": "Sample"}

def test_with_fixture(sample_data):
    assert sample_data["id"] == 1
    assert sample_data["name"] == "Sample"

@pytest.mark.parametrize("input,expected", [
    (1, 2),
    (2, 4),
    (3, 6),
])
def test_double(input, expected):
    assert input * 2 == expected
```

// turbo
4. Run tests:
```bash
pytest
```

// turbo
5. Run with coverage:
```bash
pytest --cov=src --cov-report=html
```

## Success Criteria
- Testing framework installed
- Sample tests pass
- Coverage report generated
