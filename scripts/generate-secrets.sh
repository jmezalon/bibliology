#!/bin/bash

# Script to generate secure secrets for production deployment
# Usage: ./scripts/generate-secrets.sh

echo "================================================"
echo "  Bibliology Production Secrets Generator"
echo "================================================"
echo ""
echo "Generating secure random secrets for production..."
echo ""

# Generate JWT secrets
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)

echo "✅ Generated secure secrets!"
echo ""
echo "================================================"
echo "  COPY THESE TO YOUR RENDER ENVIRONMENT"
echo "================================================"
echo ""
echo "JWT_SECRET=$JWT_SECRET"
echo ""
echo "JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET"
echo ""
echo "================================================"
echo ""
echo "⚠️  IMPORTANT:"
echo "  - Copy these values to Render immediately"
echo "  - Do NOT commit these to git"
echo "  - Do NOT share these secrets"
echo "  - Store them securely (password manager)"
echo ""
echo "================================================"
echo ""
