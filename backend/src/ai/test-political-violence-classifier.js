#!/usr/bin/env node

import dotenv from "dotenv";
import { Pool } from "pg";
import { classifyArticleUnified } from "./unified-classifier.js";

dotenv.config({ path: "../../../.env" });

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function testPoliticalViolenceClassifier() {
    try {
        console.log("🚨 Testing Political Violence Classifier...\n");

        // First, check if we have OpenAI API key
        const hasValidApiKey =
            process.env.OPENAI_API_KEY &&
            process.env.OPENAI_API_KEY !== "your_openai_api_key_here" &&
            process.env.OPENAI_API_KEY.startsWith("sk-");

        if (!hasValidApiKey) {
            console.log(
                "⚠️  OpenAI API key not configured or invalid. Please set OPENAI_API_KEY in .env file"
            );
            console.log("For now, testing with mock classification...\n");
            await testWithMockClassification();
            return;
        }

        // Get recent articles from database
        console.log("📰 Fetching recent articles from database...");
        const articlesResult = await pool.query(`
            SELECT id, title, content, url, published_at, scraped_at
            FROM news_articles 
            WHERE content IS NOT NULL 
            AND length(content) > 100
            ORDER BY scraped_at DESC 
            LIMIT 3
        `);

        if (articlesResult.rows.length === 0) {
            console.log(
                "No articles found in database. Please run the scraper first."
            );
            return;
        }

        console.log(
            `Found ${articlesResult.rows.length} articles to classify\n`
        );

        // Test single article classification first
        const testArticle = articlesResult.rows[0];
        console.log("🔍 Testing single article classification...");
        console.log(`Article: ${testArticle.title}\n`);

        const singleResult = await classifyArticleUnified(testArticle);

        console.log("🚨 Classification Results:");
        console.log("=========================");
        console.log(`Processing time: ${singleResult.processing_time_ms}ms`);
        console.log(
            `Political Violence: ${
                singleResult.is_political_violence ? "YES" : "NO"
            }`
        );
        console.log(
            `Confidence: ${(singleResult.confidence * 100).toFixed(1)}%`
        );
        console.log(`Reasoning: ${singleResult.reasoning}`);

        if (
            singleResult.key_indicators &&
            singleResult.key_indicators.length > 0
        ) {
            console.log(
                `Key Indicators: ${singleResult.key_indicators.join(", ")}`
            );
        }

        // Test batch classification
        console.log("\n🔄 Testing batch classification...");
        const batchResults = await classifyArticlesBatch(articlesResult.rows, {
            batchSize: 2,
            delayMs: 3000, // 3 second delay between batches
            onProgress: (progress) => {
                console.log(
                    `Progress: ${progress.processed}/${progress.total} (${progress.errors} errors)`
                );
            },
        });

        console.log("\n📊 Batch Classification Results:");
        console.log("================================");
        console.log(`Total articles: ${batchResults.summary.total}`);
        console.log(
            `Successfully classified: ${batchResults.summary.successful}`
        );
        console.log(`Failed: ${batchResults.summary.failed}`);

        // Show individual results
        console.log("\n📰 Individual Classification Results:");
        batchResults.results.forEach((result, index) => {
            console.log(`\n${index + 1}. Article ID: ${result.article_id}`);
            if (result.success) {
                console.log(
                    `   🚨 Political Violence: ${
                        result.result.is_political_violence ? "YES" : "NO"
                    }`
                );
                console.log(
                    `   📊 Confidence: ${(
                        result.result.confidence * 100
                    ).toFixed(1)}%`
                );
                console.log(`   💭 Reasoning: ${result.result.reasoning}`);
            } else {
                console.log(`   ❌ Error: ${result.error}`);
            }
        });

        // Count political violence incidents
        const violenceCount = batchResults.results.filter(
            (r) => r.success && r.result.is_political_violence
        ).length;

        console.log(`\n🚨 Political Violence Summary:`);
        console.log(
            `   Violence incidents detected: ${violenceCount}/${batchResults.summary.successful}`
        );
        console.log(
            `   Violence rate: ${(
                (violenceCount / batchResults.summary.successful) *
                100
            ).toFixed(1)}%`
        );
    } catch (error) {
        console.error("❌ Test failed:", error);
    } finally {
        await pool.end();
        console.log("\n✅ Test completed");
    }
}

async function testWithMockClassification() {
    console.log("🧪 Testing with mock political violence classification...\n");

    const mockArticles = [
        {
            id: "mock-1",
            title: "Political rally turns violent in Dhaka",
            content:
                "A political rally organized by the opposition party in Dhaka turned violent yesterday when clashes erupted between supporters and police. Several activists were injured in the confrontation, and police used tear gas to disperse the crowd. The incident occurred near the National Press Club when protesters attempted to march towards the parliament building.",
            source: "Mock News",
            published_at: new Date().toISOString(),
        },
        {
            id: "mock-2",
            title: "New bridge inaugurated in Chittagong",
            content:
                "The Prime Minister inaugurated a new bridge in Chittagong today, connecting two major districts. The infrastructure project, funded by international donors, is expected to boost economic activity in the region. Local officials praised the development as a milestone for regional connectivity.",
            source: "Mock News",
            published_at: new Date().toISOString(),
        },
    ];

    console.log("📰 Mock Articles for Classification:");
    mockArticles.forEach((article, index) => {
        console.log(`${index + 1}. ${article.title}`);
    });

    console.log("\n🤖 Mock Classification Results:");
    console.log("===============================");

    // Mock classification results
    const mockResults = [
        {
            article_id: "mock-1",
            is_political_violence: true,
            confidence: 0.92,
            reasoning:
                "Article describes violent clashes between political protesters and police, with injuries reported",
            key_indicators: [
                "clashes",
                "violence",
                "injured",
                "tear gas",
                "political rally",
            ],
        },
        {
            article_id: "mock-2",
            is_political_violence: false,
            confidence: 0.95,
            reasoning:
                "Article describes infrastructure inauguration with no mention of violence or political conflict",
            key_indicators: [],
        },
    ];

    mockResults.forEach((result, index) => {
        console.log(`\n${index + 1}. Article: ${mockArticles[index].title}`);
        console.log(
            `   🚨 Political Violence: ${
                result.is_political_violence ? "YES" : "NO"
            }`
        );
        console.log(
            `   📊 Confidence: ${(result.confidence * 100).toFixed(1)}%`
        );
        console.log(`   💭 Reasoning: ${result.reasoning}`);
        if (result.key_indicators.length > 0) {
            console.log(
                `   🔍 Key Indicators: ${result.key_indicators.join(", ")}`
            );
        }
    });

    const violenceCount = mockResults.filter(
        (r) => r.is_political_violence
    ).length;
    console.log(`\n🚨 Mock Violence Summary:`);
    console.log(
        `   Violence incidents detected: ${violenceCount}/${mockResults.length}`
    );
    console.log(
        `   Violence rate: ${(
            (violenceCount / mockResults.length) *
            100
        ).toFixed(1)}%`
    );
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    testPoliticalViolenceClassifier();
}

export default testPoliticalViolenceClassifier;
