const axios = require('axios');
const { Pool } = require('pg');
require('dotenv').config();

class BaseScraper {
    constructor(name, baseUrl, language = 'en') {
        this.name = name;
        this.baseUrl = baseUrl;
        this.language = language;
        
        // Database connection
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL
        });
        
        // Request configuration
        this.requestConfig = {
            headers: {
                'User-Agent': process.env.USER_AGENT || 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
            },
            timeout: 10000
        };
    }

    /**
     * Get the source ID from database
     */
    async getSourceId() {
        try {
            const result = await this.pool.query(
                'SELECT id FROM news_sources WHERE name = $1',
                [this.name]
            );
            
            if (result.rows.length === 0) {
                throw new Error(`News source '${this.name}' not found in database`);
            }
            
            return result.rows[0].id;
        } catch (error) {
            console.error('Error getting source ID:', error);
            throw error;
        }
    }

    /**
     * Make HTTP request with retry logic
     */
    async makeRequest(url, retries = 3) {
        for (let i = 0; i < retries; i++) {
            try {
                const response = await axios.get(url, this.requestConfig);
                return response;
            } catch (error) {
                console.log(`Request failed (attempt ${i + 1}/${retries}): ${error.message}`);
                if (i === retries - 1) throw error;
                
                // Wait before retry
                await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
            }
        }
    }

    /**
     * Save article to database
     */
    async saveArticle(articleData, sourceId) {
        try {
            const query = `
                INSERT INTO news_articles (
                    source_id, title, content, author, published_at, url, language
                ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (url) DO UPDATE SET
                    title = EXCLUDED.title,
                    content = EXCLUDED.content,
                    author = EXCLUDED.author,
                    published_at = EXCLUDED.published_at,
                    updated_at = CURRENT_TIMESTAMP
                RETURNING id
            `;
            
            const values = [
                sourceId,
                articleData.title,
                articleData.content,
                articleData.author,
                articleData.publishedAt,
                articleData.url,
                articleData.language
            ];
            
            const result = await this.pool.query(query, values);
            return result.rows[0].id;
            
        } catch (error) {
            console.error('Error saving article:', error);
            throw error;
        }
    }

    /**
     * Check if article already exists
     */
    async articleExists(url) {
        try {
            const result = await this.pool.query(
                'SELECT id FROM news_articles WHERE url = $1',
                [url]
            );
            return result.rows.length > 0;
        } catch (error) {
            console.error('Error checking article existence:', error);
            return false;
        }
    }

    /**
     * Clean text content
     */
    cleanText(text) {
        if (!text) return '';
        
        return text
            .replace(/\s+/g, ' ')  // Replace multiple whitespace with single space
            .replace(/\n\s*\n/g, '\n\n')  // Clean up multiple newlines
            .trim();
    }

    /**
     * Parse date from various formats
     */
    parseDate(dateString) {
        if (!dateString) return new Date();
        
        // Try parsing the date
        const parsedDate = new Date(dateString);
        
        // If invalid, return current date
        if (isNaN(parsedDate.getTime())) {
            console.warn(`Could not parse date: ${dateString}`);
            return new Date();
        }
        
        return parsedDate;
    }

    /**
     * Add delay between requests
     */
    async delay(ms = null) {
        const delayMs = ms || parseInt(process.env.SCRAPING_DELAY_MS) || 2000;
        await new Promise(resolve => setTimeout(resolve, delayMs));
    }

    /**
     * Close database connection
     */
    async close() {
        await this.pool.end();
    }

    // Abstract methods to be implemented by subclasses
    async getLatestNewsUrls(limit) {
        throw new Error('getLatestNewsUrls method must be implemented by subclass');
    }

    async scrapeArticle(url) {
        throw new Error('scrapeArticle method must be implemented by subclass');
    }

    /**
     * Run the scraper (common implementation)
     */
    async run(limit = 10) {
        try {
            console.log(`Starting ${this.name} scraper...`);
            
            const sourceId = await this.getSourceId();
            const newsUrls = await this.getLatestNewsUrls(limit);
            
            const results = {
                total: newsUrls.length,
                successful: 0,
                failed: 0,
                skipped: 0,
                articles: []
            };
            
            for (const url of newsUrls) {
                try {
                    // Check if article already exists
                    if (await this.articleExists(url)) {
                        console.log(`⏭️  Skipping existing article: ${url}`);
                        results.skipped++;
                        continue;
                    }
                    
                    // Add delay between requests
                    await this.delay();
                    
                    const articleData = await this.scrapeArticle(url);
                    
                    // Skip if no content
                    if (!articleData.title || !articleData.content) {
                        console.log(`⚠️  Skipping article with missing data: ${url}`);
                        results.failed++;
                        continue;
                    }
                    
                    const articleId = await this.saveArticle(articleData, sourceId);
                    
                    results.successful++;
                    results.articles.push({
                        id: articleId,
                        title: articleData.title,
                        url: articleData.url
                    });
                    
                    console.log(`✅ Saved: ${articleData.title.substring(0, 80)}...`);
                    
                } catch (error) {
                    console.error(`❌ Failed to process ${url}:`, error.message);
                    results.failed++;
                }
            }
            
            console.log(`\n📊 ${this.name} scraper completed:`);
            console.log(`- Total URLs: ${results.total}`);
            console.log(`- Successful: ${results.successful}`);
            console.log(`- Failed: ${results.failed}`);
            console.log(`- Skipped: ${results.skipped}`);
            
            return results;
            
        } catch (error) {
            console.error('Scraper run failed:', error);
            throw error;
        }
    }
}

module.exports = BaseScraper;
