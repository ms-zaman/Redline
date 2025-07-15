import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config({ path: "../../../.env" });

// Initialize Gemini client only if API key is available
let genAI = null;
if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

const MODEL_VERSION = process.env.GEMINI_MODEL || "gemini-1.5-flash";

// Classification prompt template for political violence detection
const CLASSIFICATION_PROMPT = `You are an expert in political violence analysis for Bangladesh. Your task is to classify whether a news article describes political violence.

DEFINITION OF POLITICAL VIOLENCE:
Political violence includes:
- Violence by or against political parties, politicians, activists
- Election-related violence, voter intimidation
- Protests that turn violent, clashes with police/security forces
- Political assassinations, attacks on political figures
- Communal violence with political undertones
- Violence related to political rallies, demonstrations
- State violence against political opposition
- Political terrorism or extremist violence

CLASSIFICATION CRITERIA:
- Be CONSERVATIVE: Only classify as political violence if clearly evident
- Require explicit mention of violence AND political context
- General crime, accidents, or natural disasters are NOT political violence
- Economic protests without violence are NOT political violence
- Peaceful political activities are NOT political violence

ARTICLE TO ANALYZE:
Title: {title}
Content: {content}
Source: {source}
Date: {date}

RESPONSE FORMAT:
Respond with ONLY a valid JSON object:
{
  "is_political_violence": boolean,
  "confidence": number (0.0 to 1.0),
  "reasoning": "detailed explanation of classification decision",
  "key_indicators": ["list", "of", "key", "words", "or", "phrases"],
  "violence_type": "type of violence if applicable (e.g., 'protest clash', 'political assassination', 'election violence')",
  "location_mentioned": "primary location mentioned in article",
  "political_actors": ["list", "of", "political", "parties", "or", "figures", "mentioned"]
}

Be thorough but conservative in your analysis.`;

/**
 * Classify an article for political violence content using Gemini
 * @param {Object} article - Article object with title, content, source, date
 * @returns {Object} Classification result
 */
export async function classifyArticleWithGemini(article) {
    try {
        // Check if Gemini is available
        if (!genAI) {
            throw new Error("Gemini API key not configured. Please set GEMINI_API_KEY in .env file");
        }

        const prompt = CLASSIFICATION_PROMPT
            .replace("{title}", article.title || "")
            .replace("{content}", article.content || "")
            .replace("{source}", article.source || "")
            .replace("{date}", article.published_at || "");

        const startTime = Date.now();

        // Get the generative model
        const model = genAI.getGenerativeModel({ model: MODEL_VERSION });

        // Generate content
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const content = response.text();

        const processingTime = Date.now() - startTime;

        // Parse JSON response
        let classification;
        try {
            // Clean the response (remove markdown code blocks if present)
            const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
            classification = JSON.parse(cleanContent);
        } catch (parseError) {
            console.error("Failed to parse Gemini response:", content);
            throw new Error("Invalid AI response format");
        }

        // Validate response structure
        if (typeof classification.is_political_violence !== 'boolean') {
            throw new Error("Invalid classification response structure");
        }

        return {
            ...classification,
            model_version: MODEL_VERSION,
            processing_time_ms: processingTime,
            processed_at: new Date().toISOString(),
            provider: "gemini"
        };

    } catch (error) {
        console.error("Gemini classification error:", error);
        throw new Error(`Classification failed: ${error.message}`);
    }
}

/**
 * Classify multiple articles in batches using Gemini
 * @param {Array} articles - Array of article objects
 * @param {Object} options - Processing options
 * @returns {Object} Batch processing results
 */
export async function classifyArticlesBatchWithGemini(articles, options = {}) {
    const { batchSize = 1, delayMs = 2000, onProgress = null } = options;
    
    const results = {
        summary: {
            total: articles.length,
            successful: 0,
            failed: 0,
            errors: 0
        },
        results: []
    };
    
    for (let i = 0; i < articles.length; i += batchSize) {
        const batch = articles.slice(i, i + batchSize);
        
        for (const article of batch) {
            try {
                console.log(`Processing article ${i + 1}/${articles.length}: ${article.title?.substring(0, 50)}...`);
                
                const classification = await classifyArticleWithGemini(article);
                
                results.summary.successful++;
                results.results.push({
                    article_id: article.id,
                    success: true,
                    result: classification
                });
                
                console.log(`✅ Classified: ${classification.is_political_violence ? 'VIOLENCE' : 'NON-VIOLENCE'} (${(classification.confidence * 100).toFixed(1)}%)`);
                
            } catch (error) {
                console.error(`❌ Failed to classify article ${article.id}:`, error.message);
                results.summary.failed++;
                results.summary.errors++;
                results.results.push({
                    article_id: article.id,
                    success: false,
                    error: error.message
                });
            }
        }
        
        // Progress callback
        if (onProgress) {
            onProgress({
                processed: Math.min(i + batchSize, articles.length),
                total: articles.length,
                successful: results.summary.successful,
                failed: results.summary.failed,
                errors: results.summary.errors
            });
        }
        
        // Delay between batches to respect rate limits
        if (i + batchSize < articles.length && delayMs > 0) {
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
    }
    
    return results;
}

export default {
    classifyArticleWithGemini,
    classifyArticlesBatchWithGemini
};
