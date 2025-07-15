#!/usr/bin/env node

import dotenv from "dotenv";
import { Pool } from "pg";
import {
    extractLocations,
    processArticlesForLocations,
} from "./location-extractor.js";

dotenv.config({ path: "../../../.env" });

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function testLocationExtraction() {
    try {
        console.log("🤖 Testing AI Location Extraction...\n");

        // First, check if we have OpenAI API key
        if (
            !process.env.OPENAI_API_KEY ||
            process.env.OPENAI_API_KEY === "your_openai_api_key_here"
        ) {
            console.log(
                "⚠️  OpenAI API key not configured. Please set OPENAI_API_KEY in .env file"
            );
            console.log("For now, testing with mock data...\n");
            await testWithMockData();
            return;
        }

        // Get recent articles from database
        console.log("📰 Fetching recent articles from database...");
        const articlesResult = await pool.query(`
            SELECT id, title, content, url, published_at 
            FROM news_articles 
            WHERE ai_processed = false 
            AND content IS NOT NULL 
            AND length(content) > 100
            ORDER BY scraped_at DESC 
            LIMIT 3
        `);

        if (articlesResult.rows.length === 0) {
            console.log(
                "No unprocessed articles found. Let's test with any recent articles..."
            );

            const anyArticlesResult = await pool.query(`
                SELECT id, title, content, url, published_at 
                FROM news_articles 
                WHERE content IS NOT NULL 
                AND length(content) > 100
                ORDER BY scraped_at DESC 
                LIMIT 2
            `);

            if (anyArticlesResult.rows.length === 0) {
                console.log(
                    "No articles found in database. Please run the scraper first."
                );
                return;
            }

            articlesResult.rows = anyArticlesResult.rows;
        }

        console.log(
            `Found ${articlesResult.rows.length} articles to process\n`
        );

        // Test single article extraction first
        const testArticle = articlesResult.rows[0];
        console.log("🔍 Testing single article extraction...");
        console.log(`Article: ${testArticle.title}\n`);

        const singleResult = await extractLocations(testArticle);

        console.log("📍 Extraction Results:");
        console.log("=====================");
        console.log(`Processing time: ${singleResult.processing_time_ms}ms`);
        console.log(`Total locations found: ${singleResult.locations.length}`);
        console.log(
            `Primary location: ${
                singleResult.summary?.primary_location || "Not specified"
            }`
        );
        console.log(
            `Geographic scope: ${
                singleResult.summary?.geographic_scope || "Not specified"
            }\n`
        );

        if (singleResult.locations.length > 0) {
            console.log("🗺️  Extracted Locations:");
            singleResult.locations.forEach((location, index) => {
                console.log(
                    `${index + 1}. ${location.normalized_name} (${
                        location.type
                    })`
                );
                console.log(`   Text: "${location.extracted_text}"`);
                console.log(`   Confidence: ${location.confidence}`);
                if (location.coordinates?.lat && location.coordinates?.lng) {
                    console.log(
                        `   Coordinates: ${location.coordinates.lat}, ${location.coordinates.lng}`
                    );
                }
                console.log(
                    `   Context: ${location.context?.substring(0, 100)}...`
                );
                console.log("");
            });
        }

        // Test batch processing
        console.log("\n🔄 Testing batch processing...");
        const batchResults = await processArticlesForLocations(
            articlesResult.rows,
            pool,
            {
                delayMs: 3000, // 3 second delay between requests
                onProgress: (progress) => {
                    console.log(
                        `Progress: ${progress.processed}/${progress.total} (${progress.successful} successful, ${progress.failed} failed)`
                    );
                },
            }
        );

        console.log("\n📊 Batch Processing Results:");
        console.log("============================");
        console.log(`Total articles: ${batchResults.total}`);
        console.log(`Successfully processed: ${batchResults.successful}`);
        console.log(`Failed: ${batchResults.failed}`);
        console.log(
            `Total locations extracted: ${batchResults.locations_extracted}`
        );

        if (batchResults.articles.length > 0) {
            console.log("\n📰 Article Processing Summary:");
            batchResults.articles.forEach((article, index) => {
                console.log(
                    `${index + 1}. ${article.title?.substring(0, 60)}...`
                );
                if (article.error) {
                    console.log(`   ❌ Error: ${article.error}`);
                } else {
                    console.log(
                        `   ✅ Locations found: ${article.locations_found}`
                    );
                    console.log(
                        `   Primary location: ${
                            article.primary_location || "Not specified"
                        }`
                    );
                    console.log(
                        `   Processing time: ${article.processing_time}ms`
                    );
                }
                console.log("");
            });
        }

        // Check database results
        console.log("\n🗄️  Checking database results...");
        const dbResult = await pool.query(`
            SELECT 
                COUNT(*) as total_locations,
                COUNT(DISTINCT article_id) as articles_with_locations,
                AVG(CASE WHEN confidence = 'high' THEN 1 WHEN confidence = 'medium' THEN 0.5 ELSE 0 END) as avg_confidence
            FROM article_locations 
            WHERE extraction_method = 'ai'
        `);

        console.log(
            `Total locations in database: ${dbResult.rows[0].total_locations}`
        );
        console.log(
            `Articles with locations: ${dbResult.rows[0].articles_with_locations}`
        );
        console.log(
            `Average confidence: ${parseFloat(
                dbResult.rows[0].avg_confidence
            ).toFixed(2)}`
        );
    } catch (error) {
        console.error("❌ Test failed:", error);
    } finally {
        await pool.end();
        console.log("\n✅ Test completed");
    }
}

async function testWithMockData() {
    console.log("🧪 Testing with mock Bangladesh news data...\n");

    const mockArticle = {
        id: "mock-1",
        title: "Traffic congestion worsens in Dhaka as monsoon hits Chittagong division",
        content: `Heavy rainfall in Chittagong division has caused severe flooding in several upazilas including Cox's Bazar and Bandarban. The situation has also affected transportation between Dhaka and Chittagong, with many vehicles stranded on the Dhaka-Chittagong highway. 
        
        In the capital, traffic congestion has worsened in areas like Dhanmondi, Gulshan, and Uttara due to waterlogging. The Dhaka Metropolitan Police reported that several roads in Old Dhaka are completely submerged. 
        
        Meanwhile, in Sylhet division, the Surma River has crossed the danger level, affecting Sylhet city and surrounding areas. Local authorities in Rajshahi and Khulna divisions have also issued flood warnings for low-lying areas.`,
    };

    try {
        const result = await extractLocations(mockArticle);

        console.log("📍 Mock Extraction Results:");
        console.log("==========================");
        console.log(`Total locations found: ${result.locations.length}`);
        console.log(
            `Primary location: ${
                result.summary?.primary_location || "Not specified"
            }`
        );
        console.log(
            `Geographic scope: ${
                result.summary?.geographic_scope || "Not specified"
            }\n`
        );

        if (result.locations.length > 0) {
            console.log("🗺️  Extracted Locations:");
            result.locations.forEach((location, index) => {
                console.log(
                    `${index + 1}. ${location.normalized_name} (${
                        location.type
                    })`
                );
                console.log(`   Confidence: ${location.confidence}`);
                if (location.coordinates?.lat && location.coordinates?.lng) {
                    console.log(
                        `   Coordinates: ${location.coordinates.lat}, ${location.coordinates.lng}`
                    );
                }
                console.log("");
            });
        }
    } catch (error) {
        console.error("Mock test failed:", error);
    }
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    testLocationExtraction();
}

export default testLocationExtraction;
