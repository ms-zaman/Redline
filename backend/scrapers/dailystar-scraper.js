import axios from "axios";
import * as cheerio from "cheerio";
import dotenv from "dotenv";
import { Pool } from "pg";

dotenv.config({ path: "../.env" });

class DailyStarScraper {
    constructor() {
        this.baseUrl = "https://www.thedailystar.net";
        this.name = "The Daily Star";
        this.language = "en";

        // Database connection
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL,
        });

        // Request configuration
        this.requestConfig = {
            headers: {
                "User-Agent":
                    process.env.USER_AGENT ||
                    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.5",
                "Accept-Encoding": "gzip, deflate",
                Connection: "keep-alive",
                "Upgrade-Insecure-Requests": "1",
            },
            timeout: 10000,
        };
    }

    /**
     * Get the source ID from database
     */
    async getSourceId() {
        try {
            const result = await this.pool.query(
                "SELECT id FROM news_sources WHERE name = $1",
                [this.name]
            );

            if (result.rows.length === 0) {
                throw new Error(
                    `News source '${this.name}' not found in database`
                );
            }

            return result.rows[0].id;
        } catch (error) {
            console.error("Error getting source ID:", error);
            throw error;
        }
    }

    /**
     * Get latest news URLs from the homepage
     */
    async getLatestNewsUrls(limit = 10) {
        try {
            console.log(`Fetching latest news from ${this.baseUrl}...`);

            const response = await axios.get(this.baseUrl, this.requestConfig);
            const $ = cheerio.load(response.data);

            const newsUrls = [];

            // The Daily Star uses various selectors for news links
            const selectors = [
                'a[href*="/news/"]',
                'a[href*="/city/"]',
                'a[href*="/politics/"]',
                'a[href*="/business/"]',
                'a[href*="/sports/"]',
            ];

            selectors.forEach((selector) => {
                $(selector).each((index, element) => {
                    const href = $(element).attr("href");
                    if (href && !newsUrls.includes(href)) {
                        // Convert relative URLs to absolute
                        const fullUrl = href.startsWith("http")
                            ? href
                            : `${this.baseUrl}${href}`;
                        newsUrls.push(fullUrl);
                    }
                });
            });

            // Remove duplicates and limit results
            const uniqueUrls = [...new Set(newsUrls)].slice(0, limit);
            console.log(`Found ${uniqueUrls.length} news URLs`);

            return uniqueUrls;
        } catch (error) {
            console.error("Error fetching news URLs:", error);
            throw error;
        }
    }

    /**
     * Scrape a single article
     */
    async scrapeArticle(url) {
        try {
            console.log(`Scraping article: ${url}`);

            const response = await axios.get(url, this.requestConfig);
            const $ = cheerio.load(response.data);

            // Extract article data
            const title =
                $("h1").first().text().trim() ||
                $("title").text().replace(" | The Daily Star", "").trim();

            // Try multiple selectors for content
            let content = "";
            const contentSelectors = [
                ".article-content p",
                ".story-content p",
                ".news-content p",
                "article p",
                ".content p",
            ];

            for (const selector of contentSelectors) {
                const paragraphs = $(selector);
                if (paragraphs.length > 0) {
                    content = paragraphs
                        .map((i, el) => $(el).text().trim())
                        .get()
                        .join("\n\n");
                    break;
                }
            }

            // Extract author
            let author = "";
            const authorSelectors = [
                ".author",
                ".byline",
                ".writer",
                '[class*="author"]',
            ];

            for (const selector of authorSelectors) {
                const authorEl = $(selector).first();
                if (authorEl.length > 0) {
                    author = authorEl.text().trim();
                    break;
                }
            }

            // Extract published date
            let publishedAt = null;
            const dateSelectors = [
                ".publish-date",
                ".date",
                ".published",
                "[datetime]",
                "time",
            ];

            for (const selector of dateSelectors) {
                const dateEl = $(selector).first();
                if (dateEl.length > 0) {
                    const dateText =
                        dateEl.attr("datetime") || dateEl.text().trim();
                    const parsedDate = new Date(dateText);
                    if (!isNaN(parsedDate.getTime())) {
                        publishedAt = parsedDate;
                        break;
                    }
                }
            }

            // If no date found, use current time
            if (!publishedAt) {
                publishedAt = new Date();
            }

            return {
                title,
                content,
                author,
                publishedAt,
                url,
                language: this.language,
            };
        } catch (error) {
            console.error(`Error scraping article ${url}:`, error);
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
                articleData.language,
            ];

            const result = await this.pool.query(query, values);
            return result.rows[0].id;
        } catch (error) {
            console.error("Error saving article:", error);
            throw error;
        }
    }

    /**
     * Run the scraper
     */
    async run(limit = 5) {
        try {
            console.log(`Starting ${this.name} scraper...`);

            const sourceId = await this.getSourceId();
            const newsUrls = await this.getLatestNewsUrls(limit);

            const results = {
                total: newsUrls.length,
                successful: 0,
                failed: 0,
                articles: [],
            };

            for (const url of newsUrls) {
                try {
                    // Add delay between requests
                    await new Promise((resolve) =>
                        setTimeout(
                            resolve,
                            parseInt(process.env.SCRAPING_DELAY_MS) || 2000
                        )
                    );

                    const articleData = await this.scrapeArticle(url);

                    // Skip if no content
                    if (!articleData.title || !articleData.content) {
                        console.log(
                            `Skipping article with missing data: ${url}`
                        );
                        results.failed++;
                        continue;
                    }

                    const articleId = await this.saveArticle(
                        articleData,
                        sourceId
                    );

                    results.successful++;
                    results.articles.push({
                        id: articleId,
                        title: articleData.title,
                        url: articleData.url,
                    });

                    console.log(`✓ Saved: ${articleData.title}`);
                } catch (error) {
                    console.error(`✗ Failed to process ${url}:`, error.message);
                    results.failed++;
                }
            }

            console.log(`\n${this.name} scraper completed:`);
            console.log(`- Total URLs: ${results.total}`);
            console.log(`- Successful: ${results.successful}`);
            console.log(`- Failed: ${results.failed}`);

            return results;
        } catch (error) {
            console.error("Scraper run failed:", error);
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

export default DailyStarScraper;
