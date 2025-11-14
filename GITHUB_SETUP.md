# GitHub Repository Setup Guide

## Create Repository on GitHub

### Option 1: Using GitHub Web Interface (Easiest)

1. **Go to GitHub**
   - Visit: https://github.com/new
   - Or click the "+" icon → "New repository"

2. **Repository Settings**
   - **Repository name**: `TRE-chat-page-analytics`
   - **Description**: `Tax Relief Experts Chatbot with Analytics Backend`
   - **Visibility**: Choose Public or Private
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)

3. **Click "Create repository"**

4. **Copy the repository URL** (you'll need it for the next step)

### Option 2: Using GitHub CLI

```bash
# Install GitHub CLI if needed
# macOS: brew install gh
# Then authenticate: gh auth login

# Create repository
gh repo create TRE-chat-page-analytics \
  --description "Tax Relief Experts Chatbot with Analytics Backend" \
  --public \
  --source=. \
  --remote=origin \
  --push
```

## Initialize Git and Push

### Step 1: Initialize Git (if not already done)

```bash
# Navigate to project directory
cd "/Users/pilipos/Money Making Projects/Callblade Media/Apps/TRE Chatbot"

# Initialize git repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: TRE Chat Page + Analytics"
```

### Step 2: Add Remote and Push

```bash
# Add GitHub remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/TRE-chat-page-analytics.git

# Or if using SSH:
# git remote add origin git@github.com:YOUR_USERNAME/TRE-chat-page-analytics.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Verify Setup

1. **Check repository on GitHub**
   - Visit: `https://github.com/YOUR_USERNAME/TRE-chat-page-analytics`
   - Verify all files are present

2. **Test clone** (optional)
   ```bash
   cd /tmp
   git clone https://github.com/YOUR_USERNAME/TRE-chat-page-analytics.git
   ```

## Repository Structure

Your repository should have:

```
TRE-chat-page-analytics/
├── .gitignore              ✅ Created
├── README.md               ✅ Created
├── index.html              ✅ Main chat page
├── chat.js                 ✅ Chat functionality
├── styles.css              ✅ Styling
├── questions.config.js     ✅ Question config
├── config.example.js       ✅ Config example
├── api/                    ✅ Analytics backend
│   ├── package.json
│   ├── server.js
│   ├── routes/
│   ├── services/
│   └── db/
└── libs/                   ✅ Dependencies
```

## Next Steps After Push

### 1. Set Up DigitalOcean Deployment

1. Go to DigitalOcean App Platform
2. Connect your GitHub repository
3. Follow deployment guide in `api/QUICK_DEPLOY.md`

### 2. Configure Repository Settings

**On GitHub:**
- Go to Settings → General
- Add topics: `chatbot`, `analytics`, `nodejs`, `express`, `tax-relief`
- Add description if needed
- Enable Issues and Wiki if desired

### 3. Add Collaborators (if needed)

- Go to Settings → Collaborators
- Add team members who need access

## Common Issues

### "Repository already exists"
- The repository name is already taken
- Choose a different name or use your username prefix

### "Permission denied"
- Check your GitHub authentication
- Use `gh auth login` for GitHub CLI
- Or use HTTPS with personal access token

### "Large files"
- `.gitignore` should exclude `node_modules/` and database files
- If issues persist, check file sizes

## Quick Commands Reference

```bash
# Check git status
git status

# Add all changes
git add .

# Commit changes
git commit -m "Your commit message"

# Push to GitHub
git push origin main

# Pull latest changes
git pull origin main

# View remote URL
git remote -v

# Change remote URL
git remote set-url origin NEW_URL
```

## Repository Badges (Optional)

Add to README.md for status badges:

```markdown
![Deployment](https://img.shields.io/badge/deployment-digitalocean-blue)
![Node](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen)
![License](https://img.shields.io/badge/license-proprietary-red)
```

---

**Ready to deploy!** Once pushed to GitHub, you can connect it to DigitalOcean App Platform for automatic deployments.

