import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config({ path: "../../../.env" });

// Initialize OpenAI client only if API key is available
let openai = null;
if (
    process.env.OPENAI_API_KEY &&
    process.env.OPENAI_API_KEY !== "your_openai_api_key_here"
) {
    openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });
}

const MODEL_VERSION = process.env.OPENAI_MODEL || "gpt-4o-mini";

// Location extraction prompt template
const LOCATION_EXTRACTION_PROMPT = `You are an expert in Bangladeshi geography and news analysis. Your task is to extract and identify all location mentions from news articles, focusing on places within Bangladesh.

BANGLADESH ADMINISTRATIVE STRUCTURE:
- 8 Divisions: Dhaka, Chittagong, Rajshahi, Khulna, Sylhet, Barisal, Rangpur, Mymensingh
- 64 Districts (Zilla)
- 495 Upazilas (Sub-districts)
- Major Cities: Dhaka, Chittagong, Sylhet, Rajshahi, Khulna, Barisal, Rangpur, Mymensingh
- Areas within Dhaka: Dhanmondi, Gulshan, Old Dhaka, Uttara, Wari, Ramna, etc.

TASK:
Extract ALL location mentions from the article, including:
1. Divisions, districts, upazilas, cities, towns, villages
2. Neighborhoods, areas, and localities within cities
3. Landmarks, institutions, roads, markets
4. Both English and Bengali place names
5. Approximate coordinates if you can determine them

ARTICLE TO ANALYZE:
Title: {title}
Content: {content}

RESPONSE FORMAT:
Respond with a JSON object containing:
{
  "locations": [
    {
      "extracted_text": "exact text from article",
      "normalized_name": "standardized place name",
      "type": "division|district|upazila|city|area|landmark|other",
      "confidence": number (0-1),
      "context": "surrounding text for context",
      "coordinates": {
        "lat": number or null,
        "lng": number or null,
        "confidence": number (0-1)
      },
      "administrative_hierarchy": {
        "division": "division name if known",
        "district": "district name if known",
        "upazila": "upazila name if known"
      }
    }
  ],
  "summary": {
    "total_locations": number,
    "primary_location": "most relevant location for this news",
    "geographic_scope": "local|regional|national|international"
  }
}

GUIDELINES:
- Be thorough but accurate - extract all location mentions
- Provide context from the surrounding text
- Use standardized English names for places
- Estimate coordinates for known places (use your knowledge of Bangladesh geography)
- Mark confidence levels honestly
- If unsure about a location, still include it but with lower confidence`;

/**
 * Extract locations from an article
 * @param {Object} article - Article object with title and content
 * @returns {Object} Location extraction result
 */
export async function extractLocations(article) {
    try {
        // Check if OpenAI is available
        if (!openai) {
            throw new Error(
                "OpenAI API key not configured. Please set OPENAI_API_KEY in .env file"
            );
        }

        const prompt = LOCATION_EXTRACTION_PROMPT.replace(
            "{title}",
            article.title || ""
        ).replace("{content}", article.content || "");

        const startTime = Date.now();

        const response = await openai.chat.completions.create({
            model: MODEL_VERSION,
            messages: [
                {
                    role: "system",
                    content:
                        "You are a Bangladesh geography expert. Respond only with valid JSON.",
                },
                {
                    role: "user",
                    content: prompt,
                },
            ],
            temperature: 0.2, // Low temperature for consistent results
            max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 2000,
        });

        const processingTime = Date.now() - startTime;
        const content = response.choices[0].message.content;

        // Parse JSON response
        let extraction;
        try {
            extraction = JSON.parse(content);
        } catch (parseError) {
            console.error("Failed to parse AI response:", content);
            throw new Error("Invalid AI response format");
        }

        // Validate response structure
        if (!extraction.locations || !Array.isArray(extraction.locations)) {
            throw new Error("Invalid extraction response structure");
        }

        return {
            ...extraction,
            model_version: MODEL_VERSION,
            processing_time_ms: processingTime,
            processed_at: new Date().toISOString(),
        };
    } catch (error) {
        console.error("Location extraction error:", error);
        throw new Error(`Location extraction failed: ${error.message}`);
    }
}

/**
 * Save extracted locations to database
 * @param {string} articleId - Article ID
 * @param {Object} extraction - Location extraction result
 * @param {Object} pool - Database pool
 * @returns {Array} Array of saved location IDs
 */
export async function saveExtractedLocations(articleId, extraction, pool) {
    const savedLocations = [];

    try {
        for (const location of extraction.locations) {
            // Insert into article_locations table
            const query = `
                INSERT INTO article_locations (
                    article_id, extracted_text, normalized_name, 
                    coordinates, confidence, extraction_method, context
                ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING id
            `;

            // Create PostGIS point if coordinates exist
            let coordinates = null;
            if (
                location.coordinates &&
                location.coordinates.lat &&
                location.coordinates.lng
            ) {
                coordinates = `POINT(${location.coordinates.lng} ${location.coordinates.lat})`;
            }

            const values = [
                articleId,
                location.extracted_text,
                location.normalized_name,
                coordinates,
                location.confidence >= 0.7
                    ? "high"
                    : location.confidence >= 0.4
                    ? "medium"
                    : "low",
                "ai",
                location.context || "",
            ];

            const result = await pool.query(query, values);
            savedLocations.push(result.rows[0].id);
        }

        // Update article as AI processed
        await pool.query(
            "UPDATE news_articles SET ai_processed = true, ai_processed_at = CURRENT_TIMESTAMP WHERE id = $1",
            [articleId]
        );

        return savedLocations;
    } catch (error) {
        console.error("Error saving extracted locations:", error);
        throw error;
    }
}

/**
 * Process multiple articles for location extraction
 * @param {Array} articles - Array of article objects
 * @param {Object} pool - Database pool
 * @param {Object} options - Processing options
 * @returns {Object} Processing results
 */
export async function processArticlesForLocations(
    articles,
    pool,
    options = {}
) {
    const { delayMs = 2000, onProgress = null } = options;

    const results = {
        total: articles.length,
        successful: 0,
        failed: 0,
        locations_extracted: 0,
        articles: [],
    };

    for (let i = 0; i < articles.length; i++) {
        const article = articles[i];

        try {
            console.log(
                `Processing article ${i + 1}/${
                    articles.length
                }: ${article.title?.substring(0, 50)}...`
            );

            // Extract locations
            const extraction = await extractLocations(article);

            // Save to database
            const savedLocationIds = await saveExtractedLocations(
                article.id,
                extraction,
                pool
            );

            results.successful++;
            results.locations_extracted += extraction.locations.length;
            results.articles.push({
                id: article.id,
                title: article.title,
                locations_found: extraction.locations.length,
                primary_location: extraction.summary?.primary_location,
                processing_time: extraction.processing_time_ms,
            });

            console.log(
                `✅ Extracted ${
                    extraction.locations.length
                } locations from: ${article.title?.substring(0, 50)}...`
            );
        } catch (error) {
            console.error(
                `❌ Failed to process article ${article.id}:`,
                error.message
            );
            results.failed++;
            results.articles.push({
                id: article.id,
                title: article.title,
                error: error.message,
            });
        }

        // Progress callback
        if (onProgress) {
            onProgress({
                processed: i + 1,
                total: articles.length,
                successful: results.successful,
                failed: results.failed,
            });
        }

        // Delay between requests to respect rate limits
        if (i < articles.length - 1 && delayMs > 0) {
            await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
    }

    return results;
}

export default {
    extractLocations,
    saveExtractedLocations,
    processArticlesForLocations,
};
