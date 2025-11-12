#!/bin/bash
set -euo pipefail

echo "🚀 Starting AI Planner Enterprise Refactor..."
echo ""

# Create backup
BACKUP_DIR=".backup_$(date +%Y%m%d_%H%M%S)"
echo "📦 Creating backup in $BACKUP_DIR..."
mkdir -p "$BACKUP_DIR"
cp -r lib prisma public server.js package.json "$BACKUP_DIR/" 2>/dev/null || true

echo "✅ Backup created"
echo ""

# Create new directory structure
echo "📁 Creating enterprise directory structure..."

mkdir -p src/{api/{controllers,middleware,routes},core/{tasks,auth,calendar,ocr,agenda}/{entities,repositories,services,validators,types},infrastructure/{database,cache,logging,crypto},shared/{types,utils,config}}
mkdir -p tests/{unit,integration,e2e}
mkdir -p public/{css,js/{components,state,services,utils}}
mkdir -p docs

echo "✅ Directory structure created"
echo ""

echo "📝 Installation complete!"
echo ""
echo "Next steps:"
echo "1. Review the new structure in src/"
echo "2. Configure .env file"
echo "3. Run: npm install"
echo "4. Run: npm run db:migrate"
echo "5. Run: npm run dev"
echo ""
echo "🎉 Refactor scaffold ready!"
