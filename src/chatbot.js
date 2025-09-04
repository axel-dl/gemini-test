require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

class GeminiChatbot {
    constructor(apiKey, tools = []) {
        const key = apiKey || process.env.GEMINI_API_KEY;
        if (!key) {
            throw new Error("Gemini API Key not provided or found in environment variables.");
        }
        this.genAI = new GoogleGenerativeAI(key);
        this.model = this.genAI.getGenerativeModel({ 
            model: "gemini-1.5-pro-latest",
            tools: tools 
        });
    }

    async sendMessage(message) {
        try {
            const result = await this.model.generateContent(message);
            const response = await result.response;
            const text = response.text();
            
            // Return null for blocked or empty responses
            const blockReason = response.promptFeedback?.blockReason;
            const functionCalls = response.functionCalls();
            if (blockReason && (!text && !functionCalls)) {
                return null;
            }

            
            // Collect performance metrics
            const tokens = response.usageMetadata?.totalTokenCount || 0;
            const safetyRatings = response.promptFeedback?.safetyRatings || [];
            
            return {
                text,
                functionCalls,
                metrics: {
                    tokens,
                    safetyRatings,
                    timestamp: Date.now()
                }
            };
        } catch (error) {
            console.error("Error communicating with Gemini API:", error);
            return null;
        }
    }
}

module.exports = { GeminiChatbot };

// Example usage (for quick testing, remove in production)
async function main() {
    try {
        const chatbot = new GeminiChatbot();
        const userMessage = "What is the capital of Australia?";
        console.log(`User: ${userMessage}`);
        const geminiResponse = await chatbot.sendMessage(userMessage);
        console.log(`Gemini: ${geminiResponse}`);
    } catch (error) {
        console.error("Error:", error.message);
    }
}

// main(); // Uncomment to run example directly
