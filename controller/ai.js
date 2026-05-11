const express = require("express");
const router = express.Router();
const Product = require("../model/product");
const { extractSearchIntent, generateEmbedding } = require("../utils/gemini");
const mongoose = require("mongoose");
const { getPineconeIndex } = require("../db/pinecone");

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
    
    let products = [];
    if (promptEmbedding && promptEmbedding.length > 0) {
       
       const index = getPineconeIndex();
       
       if (index) {
          const queryResponse = await index.query({
             vector: promptEmbedding,
             topK: 30,
             includeValues: false,
             includeMetadata: true,   // need metadata for category boost
             namespace: 'search-products'
          });
          
          if (queryResponse.matches && queryResponse.matches.length > 0) {
             

             // Apply category boost (+0.15) matching the original logic
             const intentCat = intent?.category
               ? intent.category.toLowerCase().replace(/s$/, '').trim()
               : null;

             const scoredMatches = queryResponse.matches
               .filter(m => mongoose.Types.ObjectId.isValid(m.id))
               .map(m => {
                 let score = m.score;
                 if (intentCat && m.metadata?.category) {
                   const pCat = m.metadata.category.toLowerCase().replace(/s$/, '').trim();
                   if (pCat.includes(intentCat) || intentCat.includes(pCat)) {
                     score += 0.15;   // boost for category match
                   }
                 }
                 return { id: m.id, score };
               })
               .filter(m => m.score > 0.58)   // raised threshold to naturally cut off irrelevant items
               .sort((a, b) => b.score - a.score)
               .slice(0, 10);

             const pineconeIds = scoredMatches.map(m => m.id);

             if (pineconeIds.length === 0) {
               return res.status(200).json({ success: true, intent, products: [] });
             }
             
             const dbFilter = { _id: { $in: pineconeIds } };
             if (intent && (intent.minPrice !== null || intent.maxPrice !== null)) {
               dbFilter.discountPrice = {};
               if (intent.minPrice !== null) dbFilter.discountPrice.$gte = intent.minPrice;
               if (intent.maxPrice !== null) dbFilter.discountPrice.$lte = intent.maxPrice;
             }
             
             const matchedProducts = await Product.find(dbFilter);
             
             // Preserve Pinecone score order
             products = pineconeIds
               .map(id => matchedProducts.find(p => p._id.toString() === id))
               .filter(p => p != null);
          }
       }
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
