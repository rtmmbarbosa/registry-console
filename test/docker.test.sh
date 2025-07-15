#!/bin/bash

# Docker container tests
echo "🐳 Testing Docker container..."

# Build test image
docker build -t registry-console-test .

# Run container in background
docker run -d --name registry-console-test-container \
  -p 3002:3000 \
  -e AUTH_ENABLED=false \
  -e REGISTRY_URL=registry.example.com \
  -e REGISTRY_USERNAME=test \
  -e REGISTRY_PASSWORD=test \
  registry-console-test

# Wait for container to start
sleep 10

# Test health endpoint
echo "Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3002/health)
if [ "$HEALTH_RESPONSE" != "200" ]; then
    echo "❌ Health check failed (HTTP $HEALTH_RESPONSE)"
    docker logs registry-console-test-container
    docker stop registry-console-test-container
    docker rm registry-console-test-container
    exit 1
fi

# Test home page
echo "Testing home page..."
HOME_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3002/)
if [ "$HOME_RESPONSE" != "200" ]; then
    echo "❌ Home page test failed (HTTP $HOME_RESPONSE)"
    docker logs registry-console-test-container
    docker stop registry-console-test-container
    docker rm registry-console-test-container
    exit 1
fi

echo "✅ All Docker container tests passed!"

# Cleanup
docker stop registry-console-test-container
docker rm registry-console-test-container
docker rmi registry-console-test
