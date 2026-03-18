require("dotenv").config({ path: `${__dirname}/../config/.env` });
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function run() {
  const response = await ai.models.list();
  for await (const model of response) {
    if (model.name.includes("embed") || (model.supportedGenerationMethods && model.supportedGenerationMethods.includes("embedContent"))) {
        console.log("Found embed model:", model.name);
    }
  }
}
run();
