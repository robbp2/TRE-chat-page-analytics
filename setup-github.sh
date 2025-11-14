#!/bin/bash

# GitHub Repository Setup Script
# This script helps you initialize git and prepare for GitHub

set -e

echo "🚀 TRE Chat Page + Analytics - GitHub Setup"
echo "=============================================="
echo ""

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install git first."
    exit 1
fi

# Check if already a git repository
if [ -d .git ]; then
    echo "⚠️  Git repository already initialized"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo "📦 Initializing git repository..."
    git init
fi

# Add all files
echo "📝 Adding files to git..."
git add .

# Create initial commit
echo "💾 Creating initial commit..."
git commit -m "Initial commit: TRE Chat Page + Analytics

- Chat interface with question flow system
- Analytics API backend (Node.js/Express)
- SQLite and PostgreSQL database support
- DigitalOcean deployment ready
- Complete documentation"

echo ""
echo "✅ Git repository initialized!"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Create a new repository on GitHub:"
echo "   - Go to: https://github.com/new"
echo "   - Name: TRE-chat-page-analytics"
echo "   - Description: Tax Relief Experts Chatbot with Analytics Backend"
echo "   - DO NOT initialize with README, .gitignore, or license"
echo ""
echo "2. Add remote and push:"
echo "   git remote add origin https://github.com/YOUR_USERNAME/TRE-chat-page-analytics.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "Or use GitHub CLI (if installed):"
echo "   gh repo create TRE-chat-page-analytics --public --source=. --remote=origin --push"
echo ""
echo "📚 See GITHUB_SETUP.md for detailed instructions"

