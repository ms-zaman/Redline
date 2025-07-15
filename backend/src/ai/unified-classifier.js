import dotenv from "dotenv";
import { classifyArticle as classifyWithOpenAI } from "./classifier.js";
import { classifyArticleWithGemini } from "./gemini-classifier.js";

dotenv.config({ path: "../../../.env" });

/**
 * Unified classifier that automatically chooses the best available AI provider
 * @param {Object} article - Article object with title, content, source, date
 * @returns {Object} Classification result
 */
export async function classifyArticleUnified(article) {
    const provider = getAvailableProvider();

    console.log(`🤖 Using AI provider: ${provider.toUpperCase()}`);

    switch (provider) {
        case "openai":
            return await classifyWithOpenAI(article);
        case "gemini":
            return await classifyArticleWithGemini(article);
        default:
            throw new Error(
                "No AI provider configured. Please set OPENAI_API_KEY or GEMINI_API_KEY in .env file"
            );
    }
}

/**
 * Determine which AI provider is available and configured
 * @returns {string} Provider name ('openai', 'gemini', or 'none')
 */
function getAvailableProvider() {
    // Check Gemini first (often has better free tier)
    if (
        process.env.GEMINI_API_KEY &&
        process.env.GEMINI_API_KEY !== "your_gemini_api_key_here"
    ) {
        return "gemini";
    }

    // Check OpenAI
    if (
        process.env.OPENAI_API_KEY &&
        process.env.OPENAI_API_KEY !== "your_openai_api_key_here" &&
        process.env.OPENAI_API_KEY.startsWith("sk-")
    ) {
        return "openai";
    }

    return "none";
}

/**
 * Get provider status and configuration info
 * @returns {Object} Provider status information
 */
export function getProviderStatus() {
    const openaiConfigured =
        process.env.OPENAI_API_KEY &&
        process.env.OPENAI_API_KEY !== "your_openai_api_key_here" &&
        process.env.OPENAI_API_KEY.startsWith("sk-");

    const geminiConfigured =
        process.env.GEMINI_API_KEY &&
        process.env.GEMINI_API_KEY !== "your_gemini_api_key_here";

    const activeProvider = getAvailableProvider();

    return {
        openai: {
            configured: openaiConfigured,
            model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        },
        gemini: {
            configured: geminiConfigured,
            model: process.env.GEMINI_MODEL || "gemini-1.5-flash",
        },
        active_provider: activeProvider,
        any_configured: activeProvider !== "none",
    };
}

export default {
    classifyArticleUnified,
    getProviderStatus,
};
