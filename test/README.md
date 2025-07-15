# Testing

This directory contains tests for the Registry Console application.

## Test Types

### 1. Smoke Tests (`smoke.test.js`)
- Tests basic application startup
- Verifies health endpoint responds correctly
- Checks home page loads without errors
- Runs in isolated environment with test configuration

### 2. Docker Container Tests (`docker.test.sh`)
- Builds Docker image locally
- Runs container with test configuration
- Tests health endpoint and basic routes
- Cleans up container and image after tests

## Running Tests

### Locally
```bash
# Run smoke tests only
npm run test

# Run Docker container tests
npm run test:docker

# Run all tests
npm run test:all
```

### In CI/CD
Tests run automatically in GitHub Actions:
1. **test** job runs before building
2. **build-and-push** job only runs if tests pass
3. PRs are tested but not pushed to registry

## Test Configuration

Tests use these environment variables:
- `PORT=3001` (smoke tests) / `PORT=3000` (Docker tests)
- `NODE_ENV=test`
- `AUTH_ENABLED=false`
- Mock registry credentials for testing

## Adding New Tests

1. Create test files in `/test` directory
2. Add test scripts to `package.json`
3. Update GitHub Actions workflow if needed
4. Document new tests in this README
