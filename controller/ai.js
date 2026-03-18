const express = require("express");
const router = express.Router();
const Product = require("../model/product");
const { extractSearchIntent, generateEmbedding } = require("../utils/gemini");

function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

router.post("/search", async (req, res, next) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ success: false, message: "Prompt is required" });
    }

    const [promptEmbedding, intent] = await Promise.all([
      generateEmbedding(prompt),
      extractSearchIntent(prompt)
    ]);
    
    const dbFilter = { embedding: { $exists: true, $not: { $size: 0 } } };
    
    if (intent && (intent.minPrice !== null || intent.maxPrice !== null)) {
      dbFilter.discountPrice = {};
      if (intent.minPrice !== null) dbFilter.discountPrice.$gte = intent.minPrice;
      if (intent.maxPrice !== null) dbFilter.discountPrice.$lte = intent.maxPrice;
    }

    let products = [];
    if (promptEmbedding && promptEmbedding.length > 0) {
       const allProducts = await Product.find(dbFilter);
       
       const scoredProducts = allProducts.map(p => {
         let score = cosineSimilarity(promptEmbedding, p.embedding);
         
         if (intent && intent.category && p.category) {
            const intentCat = intent.category.toLowerCase().replace(/s$/, '').trim();
            const pCat = p.category.toLowerCase().replace(/s$/, '').trim();
            
            if (pCat.includes(intentCat) || intentCat.includes(pCat)) {
                score += 0.15; 
            }
         }

         return { product: p, score };
       });

       const relevantProducts = scoredProducts.filter(p => p.score > 0.55);

       relevantProducts.sort((a, b) => b.score - a.score);

       products = relevantProducts.slice(0, 10).map(p => p.product);
    }

    res.status(200).json({
      success: true,
      intent, 
      products,
    });
  } catch (error) {
    console.error("AI Search Server Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
