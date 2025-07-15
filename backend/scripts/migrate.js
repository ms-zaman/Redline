#!/usr/bin/env node

import dotenv from "dotenv";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, "../../.env") });

const dbConfig = {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || "redline_db",
};

const migrations = [
    {
        name: "001_create_sources_table",
        sql: `
      CREATE TABLE IF NOT EXISTS sources (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        base_url VARCHAR(500) NOT NULL,
        scraper_config JSONB NOT NULL,
        is_active BOOLEAN DEFAULT true,
        last_scraped_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_sources_active ON sources(is_active);
      CREATE INDEX IF NOT EXISTS idx_sources_last_scraped ON sources(last_scraped_at);
    `,
    },
    {
        name: "002_create_articles_table",
        sql: `
      CREATE TABLE IF NOT EXISTS articles (
        id SERIAL PRIMARY KEY,
        source_id INTEGER REFERENCES sources(id),
        url VARCHAR(1000) NOT NULL UNIQUE,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        author VARCHAR(255),
        published_at TIMESTAMP,
        scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        image_urls TEXT[],
        metadata JSONB,
        content_hash VARCHAR(64) UNIQUE,
        is_processed BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_articles_source_id ON articles(source_id);
      CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at);
      CREATE INDEX IF NOT EXISTS idx_articles_scraped_at ON articles(scraped_at);
      CREATE INDEX IF NOT EXISTS idx_articles_is_processed ON articles(is_processed);
      CREATE INDEX IF NOT EXISTS idx_articles_content_hash ON articles(content_hash);
      CREATE INDEX IF NOT EXISTS idx_articles_url_hash ON articles USING hash(url);
    `,
    },
    {
        name: "003_create_classifications_table",
        sql: `
      CREATE TABLE IF NOT EXISTS classifications (
        id SERIAL PRIMARY KEY,
        article_id INTEGER REFERENCES articles(id) ON DELETE CASCADE,
        is_political_violence BOOLEAN NOT NULL,
        confidence DECIMAL(3,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
        reasoning TEXT,
        key_indicators TEXT[],
        model_version VARCHAR(50) NOT NULL,
        processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        processing_time_ms INTEGER,

        UNIQUE(article_id, model_version)
      );

      CREATE INDEX IF NOT EXISTS idx_classifications_article_id ON classifications(article_id);
      CREATE INDEX IF NOT EXISTS idx_classifications_is_political_violence ON classifications(is_political_violence);
      CREATE INDEX IF NOT EXISTS idx_classifications_confidence ON classifications(confidence);
      CREATE INDEX IF NOT EXISTS idx_classifications_processed_at ON classifications(processed_at);
    `,
    },
    {
        name: "004_create_locations_table",
        sql: `
      CREATE EXTENSION IF NOT EXISTS postgis;

      CREATE TABLE IF NOT EXISTS locations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        name_bn VARCHAR(255),
        type VARCHAR(50) NOT NULL,
        parent_id INTEGER REFERENCES locations(id),
        admin_code VARCHAR(20),
        coordinates GEOMETRY(POINT, 4326) NOT NULL,
        boundary GEOMETRY(POLYGON, 4326),
        population INTEGER,
        area_sq_km DECIMAL(10,2),
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_locations_coordinates ON locations USING GIST(coordinates);
      CREATE INDEX IF NOT EXISTS idx_locations_boundary ON locations USING GIST(boundary);
      CREATE INDEX IF NOT EXISTS idx_locations_type ON locations(type);
      CREATE INDEX IF NOT EXISTS idx_locations_parent_id ON locations(parent_id);
      CREATE INDEX IF NOT EXISTS idx_locations_name ON locations(name);
    `,
    },
    {
        name: "005_create_incidents_table",
        sql: `
      CREATE TABLE IF NOT EXISTS incidents (
        id SERIAL PRIMARY KEY,
        article_id INTEGER REFERENCES articles(id),
        classification_id INTEGER REFERENCES classifications(id),

        title VARCHAR(500) NOT NULL,
        summary TEXT NOT NULL,
        incident_date DATE,
        incident_type VARCHAR(50) NOT NULL,

        location_raw TEXT NOT NULL,
        location_id INTEGER REFERENCES locations(id),
        coordinates GEOMETRY(POINT, 4326),
        location_confidence DECIMAL(3,2),

        killed INTEGER DEFAULT 0 CHECK (killed >= 0),
        injured INTEGER DEFAULT 0 CHECK (injured >= 0),
        missing INTEGER DEFAULT 0 CHECK (missing >= 0),

        perpetrators TEXT[],
        victims TEXT[],
        political_parties TEXT[],

        weapons_used TEXT[],
        property_damage TEXT,
        context TEXT,

        primary_image_url VARCHAR(1000),
        image_urls TEXT[],

        extraction_confidence DECIMAL(3,2),
        verified BOOLEAN DEFAULT false,
        verification_notes TEXT,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_incidents_article_id ON incidents(article_id);
      CREATE INDEX IF NOT EXISTS idx_incidents_incident_date ON incidents(incident_date);
      CREATE INDEX IF NOT EXISTS idx_incidents_incident_type ON incidents(incident_type);
      CREATE INDEX IF NOT EXISTS idx_incidents_location_id ON incidents(location_id);
      CREATE INDEX IF NOT EXISTS idx_incidents_coordinates ON incidents USING GIST(coordinates);
      CREATE INDEX IF NOT EXISTS idx_incidents_casualties ON incidents(killed, injured);
      CREATE INDEX IF NOT EXISTS idx_incidents_verified ON incidents(verified);
      CREATE INDEX IF NOT EXISTS idx_incidents_created_at ON incidents(created_at);

      CREATE INDEX IF NOT EXISTS idx_incidents_perpetrators ON incidents USING GIN(perpetrators);
      CREATE INDEX IF NOT EXISTS idx_incidents_victims ON incidents USING GIN(victims);
      CREATE INDEX IF NOT EXISTS idx_incidents_political_parties ON incidents USING GIN(political_parties);
    `,
    },
    {
        name: "006_create_processing_logs_table",
        sql: `
      CREATE TABLE IF NOT EXISTS processing_logs (
        id SERIAL PRIMARY KEY,
        article_id INTEGER REFERENCES articles(id),
        process_type VARCHAR(50) NOT NULL,
        status VARCHAR(20) NOT NULL,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP,
        error_message TEXT,
        retry_count INTEGER DEFAULT 0,
        metadata JSONB
      );

      CREATE INDEX IF NOT EXISTS idx_processing_logs_article_id ON processing_logs(article_id);
      CREATE INDEX IF NOT EXISTS idx_processing_logs_process_type ON processing_logs(process_type);
      CREATE INDEX IF NOT EXISTS idx_processing_logs_status ON processing_logs(status);
      CREATE INDEX IF NOT EXISTS idx_processing_logs_started_at ON processing_logs(started_at);
    `,
    },
    {
        name: "007_create_scraping_sessions_table",
        sql: `
      CREATE TABLE IF NOT EXISTS scraping_sessions (
        id SERIAL PRIMARY KEY,
        source_id INTEGER REFERENCES sources(id),
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP,
        status VARCHAR(20) NOT NULL,
        articles_found INTEGER DEFAULT 0,
        articles_new INTEGER DEFAULT 0,
        articles_updated INTEGER DEFAULT 0,
        errors_count INTEGER DEFAULT 0,
        error_details JSONB,
        metadata JSONB
      );

      CREATE INDEX IF NOT EXISTS idx_scraping_sessions_source_id ON scraping_sessions(source_id);
      CREATE INDEX IF NOT EXISTS idx_scraping_sessions_started_at ON scraping_sessions(started_at);
      CREATE INDEX IF NOT EXISTS idx_scraping_sessions_status ON scraping_sessions(status);
    `,
    },
    {
        name: "008_create_views",
        sql: `
      CREATE OR REPLACE VIEW incident_summary AS
      SELECT
        i.id,
        i.title,
        i.summary,
        i.incident_date,
        i.incident_type,
        i.coordinates,
        i.killed,
        i.injured,
        i.political_parties,
        i.primary_image_url,
        a.url as source_url,
        s.name as source_name,
        l.name as location_name,
        l.type as location_type,
        CASE
          WHEN i.incident_date >= CURRENT_DATE - INTERVAL '7 days' THEN 'recent'
          WHEN i.incident_date >= CURRENT_DATE - INTERVAL '30 days' THEN 'current'
          ELSE 'historical'
        END as recency,
        CASE
          WHEN i.killed > 0 THEN 'fatal'
          WHEN i.injured > 10 THEN 'major'
          WHEN i.injured > 0 THEN 'minor'
          ELSE 'property'
        END as severity
      FROM incidents i
      JOIN articles a ON i.article_id = a.id
      JOIN sources s ON a.source_id = s.id
      LEFT JOIN locations l ON i.location_id = l.id
      WHERE i.verified = true OR i.extraction_confidence > 0.7;

      CREATE OR REPLACE VIEW daily_statistics AS
      SELECT
        DATE(incident_date) as date,
        COUNT(*) as total_incidents,
        SUM(killed) as total_killed,
        SUM(injured) as total_injured,
        COUNT(DISTINCT location_id) as locations_affected,
        array_agg(DISTINCT unnest(political_parties)) as parties_involved
      FROM incidents
      WHERE incident_date IS NOT NULL
      GROUP BY DATE(incident_date)
      ORDER BY date DESC;
    `,
    },
];

import { Client } from "pg";

async function runMigrations() {
    const client = new Client(dbConfig);

    try {
        console.log("🔌 Connecting to database...");
        await client.connect();

        // Create migrations tracking table
        await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // Get already executed migrations
        const executedResult = await client.query(
            "SELECT name FROM migrations"
        );
        const executedMigrations = new Set(
            executedResult.rows.map((row) => row.name)
        );

        console.log(
            `📋 Found ${migrations.length} migrations, ${executedMigrations.size} already executed`
        );

        // Run pending migrations
        for (const migration of migrations) {
            if (executedMigrations.has(migration.name)) {
                console.log(
                    `⏭️  Skipping ${migration.name} (already executed)`
                );
                continue;
            }

            console.log(`🔄 Running migration: ${migration.name}`);

            try {
                await client.query("BEGIN");
                await client.query(migration.sql);
                await client.query(
                    "INSERT INTO migrations (name) VALUES ($1)",
                    [migration.name]
                );
                await client.query("COMMIT");

                console.log(`✅ Completed: ${migration.name}`);
            } catch (error) {
                await client.query("ROLLBACK");
                throw new Error(
                    `Migration ${migration.name} failed: ${error.message}`
                );
            }
        }

        console.log("🎉 All migrations completed successfully!");
    } catch (error) {
        console.error("❌ Migration failed:", error.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runMigrations();
}

export default runMigrations;
