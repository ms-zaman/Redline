import axios from "axios";
import * as cheerio from "cheerio";
import dotenv from "dotenv";
import { Pool } from "pg";

dotenv.config({ path: "../.env" });

class DailyStarImprovedScraper {
    constructor() {
        this.baseUrl = "https://www.thedailystar.net";
        this.name = "The Daily Star";
        this.language = "en";
        
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
     * Get latest news URLs from specific sections
     */
    async getLatestNewsUrls(limit = 10) {
        try {
            const newsUrls = [];
            
            // Try different section pages to get actual articles
            const sectionUrls = [
                `${this.baseUrl}/news/bangladesh`,
                `${this.baseUrl}/city`,
                `${this.baseUrl}/politics`
            ];
            
            for (const sectionUrl of sectionUrls) {
                console.log(`Fetching articles from ${sectionUrl}...`);
                
                try {
                    const response = await axios.get(sectionUrl, this.requestConfig);
                    const $ = cheerio.load(response.data);
                    
                    // Look for article links in the section page
                    $('a').each((index, element) => {
                        const href = $(element).attr('href');
                        if (href) {
                            const fullUrl = href.startsWith('http') ? href : `${this.baseUrl}${href}`;
                            
                            // Check if this looks like an actual article URL
                            if (this.isArticleUrl(fullUrl) && !newsUrls.includes(fullUrl)) {
                                newsUrls.push(fullUrl);
                            }
                        }
                    });
                    
                    // Add delay between section requests
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                } catch (error) {
                    console.error(`Error fetching from ${sectionUrl}:`, error.message);
                }
                
                // Stop if we have enough URLs
                if (newsUrls.length >= limit) break;
            }
            
            // If we still don't have enough, try a simpler approach
            if (newsUrls.length === 0) {
                console.log('Trying homepage for any article links...');
                const response = await axios.get(this.baseUrl, this.requestConfig);
                const $ = cheerio.load(response.data);
                
                // Look for any links that might be articles
                $('a[href*="/news/"], a[href*="/city/"], a[href*="/politics/"]').each((index, element) => {
                    const href = $(element).attr('href');
                    if (href && newsUrls.length < limit) {
                        const fullUrl = href.startsWith('http') ? href : `${this.baseUrl}${href}`;
                        if (!newsUrls.includes(fullUrl)) {
                            newsUrls.push(fullUrl);
                        }
                    }
                });
            }
            
            const uniqueUrls = [...new Set(newsUrls)].slice(0, limit);
            console.log(`Found ${uniqueUrls.length} potential article URLs`);
            
            return uniqueUrls;
        } catch (error) {
            console.error('Error fetching news URLs:', error);
            throw error;
        }
    }

    /**
     * Check if URL looks like an article
     */
    isArticleUrl(url) {
        // More flexible article detection
        const hasArticleIndicators = [
            /\/\d{4}\/\d{2}\/\d{2}\//,  // Date in URL
            /-\d{6,}$/,                 // Ends with long number (article ID)
            /\/news\/.*\/[^\/]+$/,      // News section with article slug
            /\/city\/[^\/]+$/,          // City section with article
            /\/politics\/[^\/]+$/       // Politics section with article
        ];
        
        const excludePatterns = [
            /\/(news|city|politics|business|sports)\/?$/,  // Section pages
            /\/tags\//,
            /\/search\//,
            /\/author\//,
            /\/category\//,
            /\.(jpg|jpeg|png|gif|pdf|css|js)$/i
        ];
        
        const hasIndicator = hasArticleIndicators.some(pattern => pattern.test(url));
        const isExcluded = excludePatterns.some(pattern => pattern.test(url));
        
        return hasIndicator && !isExcluded;
    }

    /**
     * Scrape a single article
     */
    async scrapeArticle(url) {
        try {
            console.log(`Scraping article: ${url}`);
            
            const response = await axios.get(url, this.requestConfig);
            const $ = cheerio.load(response.data);
            
            // Extract title with multiple fallbacks
            let title = '';
            const titleSelectors = ['h1', '.headline', '.title', 'title'];
            for (const selector of titleSelectors) {
                const titleEl = $(selector).first();
                if (titleEl.length > 0) {
                    title = titleEl.text().trim().replace(' | The Daily Star', '');
                    if (title && title.length > 10) break;
                }
            }
            
            // Extract content with multiple fallbacks
            let content = '';
            const contentSelectors = [
                '.story-content p',
                '.article-content p',
                '.news-content p',
                'article p',
                '.content p',
                'p'
            ];
            
            for (const selector of contentSelectors) {
                const paragraphs = $(selector);
                if (paragraphs.length > 2) {  // Need at least 3 paragraphs
                    content = paragraphs
                        .map((i, el) => $(el).text().trim())
                        .get()
                        .filter(text => text.length > 20)  // Filter out short paragraphs
                        .join('\n\n');
                    if (content.length > 200) break;  // Need substantial content
                }
            }
            
            // Extract author
            let author = '';
            const authorSelectors = ['.author', '.byline', '.writer', '[class*="author"]'];
            for (const selector of authorSelectors) {
                const authorEl = $(selector).first();
                if (authorEl.length > 0) {
                    author = authorEl.text().trim();
                    break;
                }
            }
            
            // Extract published date
            let publishedAt = new Date();
            const dateSelectors = ['.publish-date', '.date', '.published', '[datetime]', 'time'];
            for (const selector of dateSelectors) {
                const dateEl = $(selector).first();
                if (dateEl.length > 0) {
                    const dateText = dateEl.attr('datetime') || dateEl.text().trim();
                    const parsedDate = new Date(dateText);
                    if (!isNaN(parsedDate.getTime())) {
                        publishedAt = parsedDate;
                        break;
                    }
                }
            }
            
            return {
                title: title || 'Untitled',
                content: content || '',
                author: author || '',
                publishedAt,
                url,
                language: this.language
            };
            
        } catch (error) {
            console.error(`Error scraping article ${url}:`, error.message);
            throw error;
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
     * Run the scraper
     */
    async run(limit = 5) {
        try {
            console.log(`Starting ${this.name} improved scraper...`);
            
            const sourceId = await this.getSourceId();
            const newsUrls = await this.getLatestNewsUrls(limit);
            
            const results = {
                total: newsUrls.length,
                successful: 0,
                failed: 0,
                articles: []
            };
            
            for (const url of newsUrls) {
                try {
                    // Add delay between requests
                    await new Promise(resolve => setTimeout(resolve, 
                        parseInt(process.env.SCRAPING_DELAY_MS) || 2000));
                    
                    const articleData = await this.scrapeArticle(url);
                    
                    // Skip if no meaningful content
                    if (!articleData.title || articleData.content.length < 100) {
                        console.log(`⚠️  Skipping article with insufficient content: ${url}`);
                        results.failed++;
                        continue;
                    }
                    
                    const articleId = await this.saveArticle(articleData, sourceId);
                    
                    results.successful++;
                    results.articles.push({
                        id: articleId,
                        title: articleData.title,
                        url: articleData.url,
                        contentLength: articleData.content.length
                    });
                    
                    console.log(`✅ Saved: ${articleData.title.substring(0, 60)}... (${articleData.content.length} chars)`);
                    
                } catch (error) {
                    console.error(`❌ Failed to process ${url}:`, error.message);
                    results.failed++;
                }
            }
            
            console.log(`\n📊 ${this.name} improved scraper completed:`);
            console.log(`- Total URLs: ${results.total}`);
            console.log(`- Successful: ${results.successful}`);
            console.log(`- Failed: ${results.failed}`);
            
            return results;
            
        } catch (error) {
            console.error('Scraper run failed:', error);
            throw error;
        }
    }

    /**
     * Close database connection
     */
    async close() {
        await this.pool.end();
    }
}

export default DailyStarImprovedScraper;
