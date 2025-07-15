-- Bangladesh News Tracker Database Schema
-- PostgreSQL with PostGIS for geospatial data

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types for better data integrity
CREATE TYPE news_category AS ENUM (
    'politics', 'economy', 'sports', 'entertainment', 'technology', 
    'health', 'education', 'crime', 'weather', 'international', 'other'
);

CREATE TYPE location_type AS ENUM (
    'division', 'district', 'upazila', 'city', 'area', 'landmark', 'other'
);

CREATE TYPE confidence_level AS ENUM ('high', 'medium', 'low');

-- News sources table
CREATE TABLE news_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    base_url VARCHAR(500) NOT NULL,
    language VARCHAR(10) DEFAULT 'bn',
    is_active BOOLEAN DEFAULT true,
    scraping_config JSONB, -- Store scraping selectors and rules
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Bangladesh administrative divisions for reference
CREATE TABLE bd_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    name_en VARCHAR(255),
    name_bn VARCHAR(255),
    type location_type NOT NULL,
    parent_id UUID REFERENCES bd_locations(id),
    geometry GEOMETRY(MULTIPOLYGON, 4326), -- WGS84 coordinate system
    centroid GEOMETRY(POINT, 4326),
    population INTEGER,
    area_sq_km DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- News articles table
CREATE TABLE news_articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id UUID NOT NULL REFERENCES news_sources(id),
    title TEXT NOT NULL,
    content TEXT,
    summary TEXT,
    author VARCHAR(255),
    published_at TIMESTAMP WITH TIME ZONE,
    scraped_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    url VARCHAR(1000) UNIQUE NOT NULL,
    category news_category,
    language VARCHAR(10) DEFAULT 'bn',
    
    -- AI-extracted metadata
    ai_processed BOOLEAN DEFAULT false,
    ai_processed_at TIMESTAMP WITH TIME ZONE,
    ai_summary TEXT,
    ai_category news_category,
    ai_sentiment DECIMAL(3,2), -- -1 to 1 scale
    
    -- Full-text search
    search_vector tsvector,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Extracted locations from news articles
CREATE TABLE article_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_id UUID NOT NULL REFERENCES news_articles(id) ON DELETE CASCADE,
    bd_location_id UUID REFERENCES bd_locations(id),
    
    -- Raw extracted location data
    extracted_text VARCHAR(500) NOT NULL, -- Original text mentioning the location
    normalized_name VARCHAR(255), -- Cleaned/standardized name
    
    -- Geospatial data
    coordinates GEOMETRY(POINT, 4326), -- Specific coordinates if available
    
    -- AI confidence and metadata
    confidence confidence_level NOT NULL,
    extraction_method VARCHAR(50), -- 'ai', 'manual', 'geocoding'
    context TEXT, -- Surrounding text for context
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Location mentions tracking (for analytics)
CREATE TABLE location_mentions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bd_location_id UUID NOT NULL REFERENCES bd_locations(id),
    mention_date DATE NOT NULL,
    mention_count INTEGER DEFAULT 1,
    sentiment_avg DECIMAL(3,2),
    
    PRIMARY KEY (bd_location_id, mention_date)
);

-- Create indexes for performance
CREATE INDEX idx_news_articles_published_at ON news_articles(published_at DESC);
CREATE INDEX idx_news_articles_source_id ON news_articles(source_id);
CREATE INDEX idx_news_articles_category ON news_articles(category);
CREATE INDEX idx_news_articles_ai_processed ON news_articles(ai_processed);
CREATE INDEX idx_news_articles_search_vector ON news_articles USING GIN(search_vector);

CREATE INDEX idx_article_locations_article_id ON article_locations(article_id);
CREATE INDEX idx_article_locations_bd_location_id ON article_locations(bd_location_id);
CREATE INDEX idx_article_locations_confidence ON article_locations(confidence);

-- Geospatial indexes
CREATE INDEX idx_bd_locations_geometry ON bd_locations USING GIST(geometry);
CREATE INDEX idx_bd_locations_centroid ON bd_locations USING GIST(centroid);
CREATE INDEX idx_article_locations_coordinates ON article_locations USING GIST(coordinates);

-- Full-text search index
CREATE INDEX idx_news_articles_title_content ON news_articles USING GIN(to_tsvector('english', title || ' ' || COALESCE(content, '')));

-- Triggers for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_news_articles_updated_at BEFORE UPDATE ON news_articles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_news_sources_updated_at BEFORE UPDATE ON news_sources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for updating search vector
CREATE OR REPLACE FUNCTION update_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector = to_tsvector('english', NEW.title || ' ' || COALESCE(NEW.content, ''));
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_news_articles_search_vector BEFORE INSERT OR UPDATE ON news_articles
    FOR EACH ROW EXECUTE FUNCTION update_search_vector();
