#!/bin/bash

# Find all .go files and replace the old import path with the new one
find . -type f -name "*.go" -exec sed -i '' 's|github.com/anonystick/go-ecommerce-backend-api|gn-farm-go-server|g' {} + 