const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});


const safeJsonParse = (str) => {
  try {
    const jsonMatch = str.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(str);
  } catch (e) {
    console.error("Failed to parse JSON:", str);
    return null;
  }
};

const extractSearchIntent = async (prompt) => {
  try {
    const res = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `
You are an e-commerce AI assistant mapping user prompts to search criteria.
Return ONLY raw JSON. No markdown. No code fences.

Extract search criteria from the prompt to query a product database.
Schema:
{
  "category": "String (e.g. Computers and Laptops, Shoes, Mobile and Tablets, Accesories, Cloths, Gifts, Pet Care, Music and Gaming, Others) or null if unknown. If plural find the closest match.",
  "keywords": ["Array of specific string keywords to search for in product name or description"],
  "minPrice": "Number or null",
  "maxPrice": "Number or null"
}

Prompt: "${prompt}"
    `,
    });
    return safeJsonParse(res.text);
  } catch (error) {
    console.error("Gemini API Error:", error.message);
    if (error.message.includes("429") || error.message.includes("quota")) {
      throw new Error("AI Quota Exceeded. Please wait a moment and try again.");
    }
    throw new Error("Failed to communicate with the AI Assistant.");
  }
};

const generateEmbedding = async (text) => {
  try {
    const response = await ai.models.embedContent({
      model: "gemini-embedding-001",
      contents: text,
    });
    return response.embeddings[0].values;
  } catch (err) {
    console.error("Embedding Error:", err.message);
    if (err.message.includes("429") || err.message.includes("quota")) {
      throw new Error("AI Quota Exceeded. Please wait a moment and try again.");
    }
    throw new Error("Failed to generate AI embeddings.");
  }
};

module.exports = {
  extractSearchIntent,
  generateEmbedding,
};
