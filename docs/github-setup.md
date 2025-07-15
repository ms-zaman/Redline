# GitHub Setup Guide

This guide will help you set up the Bangladesh Political Violence Tracker project on GitHub.

## 🚀 Quick Setup

### 1. Create GitHub Repository

1. Go to [GitHub](https://github.com) and sign in to your account
2. Click the "+" icon in the top right corner
3. Select "New repository"
4. Fill in the repository details:
    - **Repository name**: `bangladesh-political-violence-tracker`
    - **Description**: `A full-stack JavaScript application that automatically tracks and visualizes political violence incidents reported in Bangladeshi news media.`
    - **Visibility**: Choose Public or Private based on your preference
    - **DO NOT** initialize with README, .gitignore, or license (we already have these)

### 2. Connect Local Repository to GitHub

After creating the repository on GitHub, run these commands in your project directory:

```bash
# Add the GitHub repository as remote origin
git remote add origin https://github.com/YOUR_USERNAME/bangladesh-political-violence-tracker.git

# Push the initial commit to GitHub
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username.

### 3. Verify Setup

After pushing, you should see all your project files on GitHub at:
`https://github.com/YOUR_USERNAME/bangladesh-political-violence-tracker`

## 📋 Repository Settings

### Recommended Settings

1. **Branch Protection Rules**

    - Go to Settings → Branches
    - Add rule for `main` branch
    - Enable "Require pull request reviews before merging"
    - Enable "Require status checks to pass before merging"

2. **Issues and Projects**

    - Enable Issues for bug tracking and feature requests
    - Consider setting up GitHub Projects for task management

3. **Security**
    - Enable Dependabot alerts
    - Set up code scanning if desired

## 🔄 Development Workflow

### Making Changes

1. **Create a new branch for each feature/fix:**

    ```bash
    git checkout -b feature/news-scraper
    ```

2. **Make your changes and commit:**

    ```bash
    git add .
    git commit -m "feat: implement news scraper for Prothom Alo"
    ```

3. **Push to GitHub:**

    ```bash
    git push origin feature/news-scraper
    ```

4. **Create a Pull Request on GitHub**

### Commit Message Convention

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

-   `feat:` - New features
-   `fix:` - Bug fixes
-   `docs:` - Documentation changes
-   `style:` - Code style changes (formatting, etc.)
-   `refactor:` - Code refactoring
-   `test:` - Adding or updating tests
-   `chore:` - Maintenance tasks

### Examples:

```bash
git commit -m "feat: add AI classification for political violence detection"
git commit -m "fix: resolve database connection timeout issue"
git commit -m "docs: update API documentation with new endpoints"
```

## 🏷️ Releases and Versioning

### Creating Releases

1. **Update CHANGELOG.md** with new version details
2. **Create a new tag:**
    ```bash
    git tag -a v0.2.0 -m "Release version 0.2.0"
    git push origin v0.2.0
    ```
3. **Create a release on GitHub** using the tag

### Version Numbers

We follow [Semantic Versioning](https://semver.org/):

-   `MAJOR.MINOR.PATCH` (e.g., 1.2.3)
-   **MAJOR**: Breaking changes
-   **MINOR**: New features (backward compatible)
-   **PATCH**: Bug fixes (backward compatible)

## 🔐 Environment Variables

### GitHub Secrets

For deployment and CI/CD, add these secrets in GitHub Settings → Secrets:

-   `DATABASE_URL` - Production database connection string
-   `OPENAI_API_KEY` - OpenAI API key for AI classification
-   `MAPBOX_TOKEN` - Mapbox token for mapping (if using Mapbox)

### Local Development

Always use the `.env` file for local development (never commit this file):

```bash
cp .env.example .env
# Edit .env with your local configuration
```

---

**Next Steps**: After setting up GitHub, proceed with [Step 1: Database Setup](../README.md#getting-started)
