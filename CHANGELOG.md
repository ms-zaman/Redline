# Changelog

All notable changes to the Bangladesh Political Violence Tracker project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2024-01-15

### Added

-   **Project Foundation**

    -   Initial project structure with backend, frontend, shared modules
    -   Comprehensive README with project overview and setup instructions
    -   Task management system for tracking development progress
    -   Environment configuration templates (.env.example)

-   **Database Design**

    -   PostgreSQL schema with PostGIS extension for geospatial data
    -   8 core tables: sources, articles, classifications, locations, incidents, processing_logs, scraping_sessions, migrations
    -   Optimized indexing for performance with spatial queries
    -   Database migration system with version tracking
    -   Automated setup scripts for easy deployment

-   **Backend Infrastructure (Node.js/Express)**

    -   Modern ES6+ setup with proper package configuration
    -   Database connection pooling with PostgreSQL
    -   Security middleware (helmet, CORS, rate limiting)
    -   AI classification service with OpenAI integration
    -   Comprehensive error handling and logging
    -   Environment configuration management

-   **AI System Design**

    -   5 specialized prompts for different AI tasks:
        -   Article classification for political violence detection
        -   Structured data extraction from articles
        -   Location geocoding for mapping
        -   Image analysis for content validation
        -   Quality validation for extracted data
    -   Best practices guide for prompt optimization
    -   Testing and evaluation framework

-   **Documentation**

    -   Detailed database schema documentation with examples
    -   AI prompts guide with optimization strategies
    -   Project architecture overview
    -   Development setup instructions

-   **Development Tools**
    -   Git repository initialization
    -   Comprehensive .gitignore for Node.js projects
    -   Package management configuration for monorepo structure
    -   Development scripts for database setup and migration

### Technical Details

-   **Backend**: Node.js 18+, Express.js, PostgreSQL with PostGIS
-   **Frontend**: Next.js (planned), React, TypeScript, Tailwind CSS
-   **AI**: OpenAI GPT-4 for classification and extraction
-   **Database**: PostgreSQL 14+ with PostGIS extension
-   **Mapping**: Leaflet.js (planned)
-   **Deployment**: Docker (planned)

### Project Structure

```
redline/
├── backend/                 # Express.js API server
├── frontend/                # Next.js application (planned)
├── shared/                  # Shared types and utilities
├── docs/                    # Documentation
├── scripts/                 # Deployment and utility scripts
└── docker/                  # Docker configuration (planned)
```

### Next Steps

-   [ ] Complete news scraping system for Bangladeshi news websites
-   [ ] Implement AI classification and data extraction pipeline
-   [ ] Build interactive map interface with Leaflet.js
-   [ ] Set up automated daily scraping with node-cron
-   [ ] Add comprehensive testing suite
-   [ ] Create Docker deployment configuration
