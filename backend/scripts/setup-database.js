#!/usr/bin/env node

import dotenv from "dotenv";
import { dirname, join } from "path";
import { Client } from "pg";
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
    database: "postgres", // Connect to default database first
};

const targetDatabase = process.env.DB_NAME || "redline_db";

async function setupDatabase() {
    const client = new Client(dbConfig);

    try {
        console.log("🔌 Connecting to PostgreSQL...");
        await client.connect();

        // Check if database exists
        const dbCheckResult = await client.query(
            "SELECT 1 FROM pg_database WHERE datname = $1",
            [targetDatabase]
        );

        if (dbCheckResult.rows.length === 0) {
            console.log(`📦 Creating database: ${targetDatabase}`);
            await client.query(`CREATE DATABASE ${targetDatabase}`);
        } else {
            console.log(`✅ Database ${targetDatabase} already exists`);
        }

        await client.end();

        // Connect to the target database
        const targetClient = new Client({
            ...dbConfig,
            database: targetDatabase,
        });

        await targetClient.connect();

        // Enable PostGIS extension
        console.log("🗺️  Enabling PostGIS extension...");
        await targetClient.query("CREATE EXTENSION IF NOT EXISTS postgis");

        console.log("✅ Database setup completed successfully!");
        console.log(`📍 Database: ${targetDatabase}`);
        console.log(`🌐 Host: ${dbConfig.host}:${dbConfig.port}`);

        await targetClient.end();
    } catch (error) {
        console.error("❌ Database setup failed:", error.message);
        process.exit(1);
    }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    setupDatabase();
}

export default setupDatabase;
