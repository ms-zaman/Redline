import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

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

const MODEL_VERSION = process.env.OPENAI_MODEL || "gpt-4";

// Classification prompt template
const CLASSIFICATION_PROMPT = `You are an expert analyst specializing in political violence detection in news articles. Your task is to classify whether the given article describes incidents of political violence.

DEFINITION OF POLITICAL VIOLENCE:
Political violence includes any use of force, threats, or intimidation by or against political actors, including:
- Physical attacks on politicians, activists, or supporters
- Violence during political rallies, protests, or campaigns
- Clashes between political parties or groups
- State violence against political opposition
- Election-related violence
- Politically motivated killings, injuries, or property damage

CLASSIFICATION CRITERIA:
- The incident must involve physical violence or credible threats
- There must be a clear political motivation or context
- The violence must be directed at or by political actors/groups

ARTICLE TO ANALYZE:
Title: {title}
Content: {content}
Source: {source}
Date: {date}

RESPONSE FORMAT:
Respond with a JSON object containing:
{
  "is_political_violence": boolean,
  "confidence": number (0-1),
  "reasoning": "Brief explanation of your decision",
  "key_indicators": ["list", "of", "violence", "indicators"]
}

Be conservative in classification - only mark as political violence if clearly evident.`;

/**
 * Classify an article for political violence content
 * @param {Object} article - Article object with title, content, source, date
 * @returns {Object} Classification result
 */
export async function classifyArticle(article) {
    try {
        // Check if OpenAI is available
        if (!openai) {
            throw new Error(
                "OpenAI API key not configured. Please set OPENAI_API_KEY in .env file"
            );
        }

        const prompt = CLASSIFICATION_PROMPT.replace(
            "{title}",
            article.title || ""
        )
            .replace("{content}", article.content || "")
            .replace("{source}", article.source || "")
            .replace("{date}", article.published_at || "");

        const startTime = Date.now();

        const response = await openai.chat.completions.create({
            model: MODEL_VERSION,
            messages: [
                {
                    role: "system",
                    content:
                        "You are a political violence detection expert. Respond only with valid JSON.",
                },
                {
                    role: "user",
                    content: prompt,
                },
            ],
            temperature: 0.1, // Low temperature for consistent results
            max_tokens: 500,
        });

        const processingTime = Date.now() - startTime;
        const content = response.choices[0].message.content;

        // Parse JSON response
        let classification;
        try {
            classification = JSON.parse(content);
        } catch (parseError) {
            console.error("Failed to parse AI response:", content);
            throw new Error("Invalid AI response format");
        }

        // Validate response structure
        if (
            typeof classification.is_political_violence !== "boolean" ||
            typeof classification.confidence !== "number" ||
            classification.confidence < 0 ||
            classification.confidence > 1
        ) {
            throw new Error("Invalid classification response structure");
        }

        return {
            ...classification,
            model_version: MODEL_VERSION,
            processing_time_ms: processingTime,
            processed_at: new Date().toISOString(),
        };
    } catch (error) {
        console.error("Classification error:", error);
        throw new Error(`Classification failed: ${error.message}`);
    }
}

/**
 * Batch classify multiple articles
 * @param {Array} articles - Array of article objects
 * @param {Object} options - Options for batch processing
 * @returns {Array} Array of classification results
 */
export async function classifyArticlesBatch(articles, options = {}) {
    const { batchSize = 5, delayMs = 1000, onProgress = null } = options;

    const results = [];
    const errors = [];

    for (let i = 0; i < articles.length; i += batchSize) {
        const batch = articles.slice(i, i + batchSize);
        const batchPromises = batch.map(async (article, index) => {
            try {
                const result = await classifyArticle(article);
                return {
                    article_id: article.id,
                    success: true,
                    result,
                };
            } catch (error) {
                errors.push({
                    article_id: article.id,
                    error: error.message,
                });
                return {
                    article_id: article.id,
                    success: false,
                    error: error.message,
                };
            }
        });

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        // Progress callback
        if (onProgress) {
            onProgress({
                processed: Math.min(i + batchSize, articles.length),
                total: articles.length,
                errors: errors.length,
            });
        }

        // Delay between batches to respect rate limits
        if (i + batchSize < articles.length && delayMs > 0) {
            await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
    }

    return {
        results,
        errors,
        summary: {
            total: articles.length,
            successful: results.filter((r) => r.success).length,
            failed: errors.length,
        },
    };
}

export default {
    classifyArticle,
    classifyArticlesBatch,
};
