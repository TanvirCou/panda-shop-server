require("dotenv").config({ path: `${__dirname}/../config/.env` });
const mongoose = require("mongoose");
const Product = require("../model/product");
const { generateEmbedding } = require("../utils/gemini");

const sync = async () => {
  try {
    console.log("Connecting to MongoDB Atlas...");
    await mongoose.connect(process.env.MONGO_URL);
    console.log("Connected to MongoDB");

    const products = await Product.find({ 
      $or: [
        { embedding: { $exists: false } },
        { embedding: { $size: 0 } }
      ]
    });
    
    console.log(`Found ${products.length} products missing embeddings. Syncing now...`);

    for (let product of products) {
      console.log(`Embedding: ${product.name}`);
      const textToEmbed = `${product.name} ${product.description} ${product.category} ${product.tags || ""}`;
      const embedding = await generateEmbedding(textToEmbed);
      
      if (embedding && embedding.length > 0) {
        product.embedding = embedding;
        await product.save({ validateBeforeSave: false });
    
        await new Promise(res => setTimeout(res, 300));
      }
    }
    
    console.log("Sync Complete! All products have vector embeddings. 🚀");
    process.exit(0);
  } catch (err) {
    console.error("Sync Error:", err);
    process.exit(1);
  }
};

sync();
