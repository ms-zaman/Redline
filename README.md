# Bangladesh Political Violence Tracker

A full-stack JavaScript application that automatically tracks and visualizes political violence incidents reported in Bangladeshi news media.

## 🎯 Project Overview

This system automatically:

-   Scrapes news articles from Bangladeshi news websites daily
-   Uses AI to classify and extract political violence incidents
-   Stores structured data with geographic information
-   Visualizes incidents on an interactive map
-   Provides filtering and analysis capabilities

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   News Sources  │───▶│   Web Scrapers  │───▶│  AI Classifier  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
┌─────────────────┐    ┌─────────────────┐    ┌─────────▼─────────┐
│  Frontend Map   │◀───│   Express API   │◀───│   PostgreSQL +   │
│   (Next.js)     │    │                 │    │     PostGIS      │
└─────────────────┘    └─────────────────┘    └─────────────────────┘
```

## 🛠️ Tech Stack

-   **Backend**: Node.js, Express.js
-   **Database**: PostgreSQL with PostGIS extension
-   **Frontend**: Next.js, React
-   **Mapping**: Leaflet.js
-   **AI**: OpenAI API (GPT-4)
-   **Scraping**: Puppeteer, Cheerio
-   **Scheduling**: node-cron
-   **Deployment**: Docker

## 📁 Project Structure

```
redline/
├── backend/                 # Express.js API server
│   ├── src/
│   │   ├── controllers/     # API route handlers
│   │   ├── models/          # Database models
│   │   ├── services/        # Business logic
│   │   ├── middleware/      # Express middleware
│   │   ├── config/          # Configuration files
│   │   └── utils/           # Utility functions
│   ├── scrapers/            # News scraping modules
│   ├── ai/                  # AI classification & extraction
│   ├── migrations/          # Database migrations
│   └── tests/               # Backend tests
├── frontend/                # Next.js application
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Next.js pages
│   │   ├── hooks/           # Custom React hooks
│   │   ├── utils/           # Frontend utilities
│   │   └── styles/          # CSS/styling
│   └── public/              # Static assets
├── shared/                  # Shared types and utilities
├── docker/                  # Docker configuration
├── docs/                    # Documentation
└── scripts/                 # Deployment and utility scripts
```

## 🚀 Implementation Roadmap

### Phase 1: MVP (Weeks 1-2)

-   [ ] Database setup with basic schema
-   [ ] Simple news scraper for 1-2 major sites
-   [ ] Basic AI classification
-   [ ] Simple map with incident pins
-   [ ] Manual data entry interface

### Phase 2: Core Features (Weeks 3-4)

-   [ ] Multiple news source scrapers
-   [ ] Advanced AI extraction
-   [ ] Filtering and search
-   [ ] Automated daily scraping
-   [ ] Data validation and cleanup

### Phase 3: Enhancement (Weeks 5-6)

-   [ ] Advanced visualizations
-   [ ] Performance optimization
-   [ ] Mobile responsiveness
-   [ ] Error monitoring
-   [ ] Deployment automation

### Phase 4: Future Features

-   [ ] Bangla language support
-   [ ] Heatmap visualizations
-   [ ] Report generation
-   [ ] API for researchers
-   [ ] Real-time notifications

## 🔧 Getting Started

1. **Prerequisites**

    ```bash
    node >= 18.0.0
    postgresql >= 14
    docker (optional)
    ```

2. **Installation**

    ```bash
    git clone <repository>
    cd redline
    npm run setup
    ```

3. **Environment Setup**

    ```bash
    cp .env.example .env
    # Configure your environment variables
    ```

4. **Database Setup**

    ```bash
    npm run db:setup
    npm run db:migrate
    ```

5. **Development**
    ```bash
    npm run dev
    ```

## 📊 Data Model

### Core Entities

-   **Articles**: Raw scraped news articles
-   **Incidents**: Classified political violence events
-   **Locations**: Geographic data with coordinates
-   **Sources**: News website configurations
-   **Classifications**: AI analysis results

## 🤖 AI Prompt Engineering

The system uses carefully crafted prompts to:

-   Classify articles as political violence or not
-   Extract structured incident data
-   Geocode location information
-   Summarize key details

## 🔒 Security & Ethics

-   Rate limiting for news sources
-   Data anonymization where appropriate
-   Transparent methodology
-   Source attribution
-   Regular bias auditing

## 📈 Scalability Considerations

-   Horizontal scaling with Docker
-   Database indexing and optimization
-   Caching strategies
-   API rate limiting
-   Monitoring and alerting

## 🤝 Contributing

This is an experimental project for research purposes. Contributions welcome!

## 📄 License

MIT License - See LICENSE file for details
