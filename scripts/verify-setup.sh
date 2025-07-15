#!/bin/bash

# Bangladesh Political Violence Tracker - Setup Verification Script
# This script verifies that the project is properly set up

echo "🔍 Verifying Bangladesh Political Violence Tracker Setup..."
echo "=================================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in project root directory"
    echo "   Please run this script from the project root"
    exit 1
fi

echo "✅ Project directory: $(pwd)"

# Check Git setup
echo ""
echo "📋 Git Configuration:"
if git rev-parse --git-dir > /dev/null 2>&1; then
    echo "✅ Git repository initialized"

    # Check for remote origin
    if git remote get-url origin > /dev/null 2>&1; then
        echo "✅ GitHub remote configured: $(git remote get-url origin)"
    else
        echo "⚠️  GitHub remote not configured yet"
        echo "   Run: git remote add origin https://github.com/YOUR_USERNAME/bangladesh-political-violence-tracker.git"
    fi

    # Check current branch
    current_branch=$(git branch --show-current)
    echo "✅ Current branch: $current_branch"

    # Check commit history
    commit_count=$(git rev-list --count HEAD)
    echo "✅ Commits: $commit_count"
else
    echo "❌ Git repository not initialized"
fi

# Check Node.js and npm
echo ""
echo "📋 Node.js Environment:"
if command -v node > /dev/null 2>&1; then
    echo "✅ Node.js: $(node --version)"
else
    echo "❌ Node.js not installed"
fi

if command -v npm > /dev/null 2>&1; then
    echo "✅ npm: $(npm --version)"
else
    echo "❌ npm not installed"
fi

# Check dependencies
echo ""
echo "📋 Dependencies:"
if [ -d "node_modules" ]; then
    echo "✅ Root dependencies installed"
else
    echo "⚠️  Root dependencies not installed"
    echo "   Run: npm install"
fi

if [ -d "backend/node_modules" ]; then
    echo "✅ Backend dependencies installed"
else
    echo "⚠️  Backend dependencies not installed"
    echo "   Run: cd backend && npm install"
fi

if [ -d "frontend/node_modules" ]; then
    echo "✅ Frontend dependencies installed"
else
    echo "⚠️  Frontend dependencies not installed"
    echo "   Run: cd frontend && npm install"
fi

# Check environment files
echo ""
echo "📋 Configuration:"
if [ -f ".env.example" ]; then
    echo "✅ Environment template (.env.example) exists"
    if [ -f ".env" ]; then
        echo "✅ Environment file (.env) configured"
    else
        echo "⚠️  Environment file (.env) not configured"
        echo "   Run: cp .env.example .env"
        echo "   Then edit .env with your configuration"
    fi
else
    echo "❌ Environment template missing"
fi

# Check project structure
echo ""
echo "📋 Project Structure:"
required_dirs=("backend" "frontend" "docs" "scripts")
for dir in "${required_dirs[@]}"; do
    if [ -d "$dir" ]; then
        echo "✅ $dir/ directory exists"
    else
        echo "❌ $dir/ directory missing"
    fi
done

required_files=("README.md" "CHANGELOG.md" ".gitignore" "package.json")
for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file missing"
    fi
done

echo ""
echo "=================================================="
echo "🎯 Next Steps:"
echo ""

if ! git remote get-url origin > /dev/null 2>&1; then
    echo "1. 🔗 Set up GitHub repository:"
    echo "   - Create repository on GitHub: bangladesh-political-violence-tracker"
    echo "   - Run: git remote add origin https://github.com/YOUR_USERNAME/bangladesh-political-violence-tracker.git"
    echo "   - Run: git push -u origin main"
    echo ""
fi

if [ ! -f ".env" ]; then
    echo "2. ⚙️  Configure environment:"
    echo "   - Run: cp .env.example .env"
    echo "   - Edit .env with your database and API credentials"
    echo ""
fi

if [ ! -d "node_modules" ] || [ ! -d "backend/node_modules" ]; then
    echo "3. 📦 Install dependencies:"
    echo "   - Run: npm install"
    echo ""
fi

echo "4. 🗄️  Set up database:"
echo "   - Install PostgreSQL with PostGIS"
echo "   - Run: npm run db:setup"
echo "   - Run: npm run db:migrate"
echo ""

echo "5. 🚀 Start development:"
echo "   - Run: npm run dev"
echo ""

echo "✨ Setup verification complete!"