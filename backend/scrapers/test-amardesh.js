#!/usr/bin/env node

import AmarDeshScraper from './amardesh-scraper.js';

async function testAmarDeshScraper() {
    const scraper = new AmarDeshScraper();
    
    try {
        console.log('🚀 Testing Daily Amar Desh scraper...\n');
        
        // Test with just 3 articles for now
        const results = await scraper.run(3);
        
        console.log('\n📊 Scraping Results:');
        console.log('===================');
        console.log(`Total articles processed: ${results.total}`);
        console.log(`Successfully scraped: ${results.successful}`);
        console.log(`Failed: ${results.failed}`);
        
        if (results.articles.length > 0) {
            console.log('\n📰 Scraped Articles:');
            results.articles.forEach((article, index) => {
                console.log(`${index + 1}. ${article.title}`);
                console.log(`   URL: ${article.url}`);
                console.log(`   Content Length: ${article.contentLength} characters`);
                console.log(`   ID: ${article.id}\n`);
            });
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await scraper.close();
        console.log('✅ Test completed');
    }
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    testAmarDeshScraper();
}

export default testAmarDeshScraper;
