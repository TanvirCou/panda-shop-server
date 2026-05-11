const express = require("express");
const router = express.Router();
const Shop = require("../model/shop");
const Product = require("../model/product");
const Order = require("../model/order");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const { isShop, isAuthenticated } = require("../middleware/auth");
const ErrorHandler = require("../utils/ErrorHandler");
const { generateEmbedding } = require("../utils/gemini");
const { getPineconeIndex } = require("../db/pinecone");

router.post("/create-product", catchAsyncErrors(async(req, res, next) => {
    try {
        const shopId = req.body.shopId;
        const shop = await Shop.findById(shopId);
        if(!shop) {
            return next(new ErrorHandler("Shop doesn't exits", 400));
        } else {
            const productData = req.body;
            productData.shop = shop;
            
            const textToEmbed = `${productData.name} ${productData.description} ${productData.category} ${productData.tags || ""} ${productData.shop.name || ""} ${productData.discountPrice || ""}`;

            const embedding = await generateEmbedding(textToEmbed);

            const product = await Product.create(productData);

            const index = getPineconeIndex();
            
            if (embedding && embedding.length > 0 && index) {
              try {
                await index.upsert({
                  records: [{
                    id: product._id.toString(),
                    values: embedding,
                  metadata: {
                      name: product.name || "",
                      description: product.description || "",
                      category: product.category || "",
                      image: JSON.stringify(product.images || []),
                      shopName: product.shop?.name || "",
                      shopPhone: product.shop?.phoneNumber || "",
                      shopEmail: product.shop?.email || "",
                      shopAddress: product.shop?.address || "",
                      ratings: product.ratings || 0,
                      reviews: JSON.stringify(product.reviews || []),
                      stock: product.stock || 0,
                      tags: product.tags || "",
                      price: product.discountPrice || 0,
                  }
                  }],
                  namespace: 'search-products'
                });
              } catch (pineconeErr) {
                console.error("Error saving to Pinecone (search-products):", pineconeErr);
              }
            }

            try {
              const chatbotText = `
                  Product: ${product.name}
                  Category: ${product.category}
                  Description: ${product.description}
                  Tags: ${product.tags || "none"}
                  Price: ${product.discountPrice} (Original: ${product.originalPrice || product.discountPrice})
                  Stock available: ${product.stock} units
                  Rating: ${product.ratings || "Not rated yet"}
                  Shop name: ${product.shop?.name || "Unknown"}
                  Shop email: ${product.shop?.email || "N/A"}
                  Shop phone: ${product.shop?.phoneNumber || "N/A"}
                  Shop address: ${product.shop?.address || "N/A"}
              `.trim();

              const chatbotEmbedding = await generateEmbedding(chatbotText);
              if (chatbotEmbedding && chatbotEmbedding.length > 0 && index) {
                await index.upsert({
                  records: [{
                    id: product._id.toString(),
                    values: chatbotEmbedding,
                    metadata: {
                      text: chatbotText,          
                      name: product.name || "",
                      category: product.category || "",
                      price: product.discountPrice || 0,
                      originalPrice: product.originalPrice || 0,
                      stock: product.stock || 0,
                      ratings: product.ratings || 0,
                      sold: product.sold_out || 0,
                      tags: product.tags || "",
                      description: product.description || "",
                      image: JSON.stringify(product.images || []),
                      shopName: product.shop?.name || "",
                      shopEmail: product.shop?.email || "",
                      shopPhone: product.shop?.phoneNumber || "",
                      shopAddress: product.shop?.address || "",
                      reviews: JSON.stringify(product.reviews || []),
                    }
                  }],
                  namespace: 'chatbot'
                });
              }
            } catch (chatbotErr) {
              console.error("Error saving to Pinecone (chatbot):", chatbotErr);
            }
            res.status(201).json({
                success: true,
                product
            });
        }
    } catch (error) {
        return next(new ErrorHandler(error, 400));
    }
}));

router.get("/all-products/:id", catchAsyncErrors(async(req, res, next) => {
    try {
        const products = await Product.find({shopId: req.params.id});
        res.status(201).json({
            success: true,
            products
        });
    } catch (error) {
        return next(new ErrorHandler(error, 400));
    }
}));

router.delete("/delete-product/:id", isShop, catchAsyncErrors(async(req, res, next) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);

        if(!product) {
            return next(new ErrorHandler("Product not found with this id", 500));
        } 

        const index = getPineconeIndex();
        if (index) {
          try {
            await Promise.all([
              index.deleteOne({ id: req.params.id, namespace: 'search-products' }),
              index.deleteOne({ id: req.params.id, namespace: 'chatbot' }),
            ]);
          } catch (pineconeErr) {
            console.error("Error deleting from Pinecone:", pineconeErr);
          }
        }

        res.status(201).json({
            success: true,
            message: "Product deleted successfully",
        });
    } catch (error) {
        return next(new ErrorHandler(error, 400));
    }
}))

router.get("/get-all-products", catchAsyncErrors(async(req, res, next) => {
    try {
        const allProducts = await Product.find().sort({ createdAt: -1});

        res.status(201).json({
            success: true,
            allProducts,
          });
    } catch (error) {
        return next(new ErrorHandler(error, 400));
    }
}));

// review for a product
router.put(
    "/create-new-review",
    isAuthenticated,
    catchAsyncErrors(async (req, res, next) => {
      try {
        const { user, rating, comment, productId, orderId } = req.body;
  
        const product = await Product.findById(productId);
  
        const review = {
          user,
          rating,
          comment,
          productId,
        };
  
        const isReviewed = product.reviews.find(
          (rev) => rev.user._id === req.user._id
        );
  
        if (isReviewed) {
          product.reviews.forEach((rev) => {
            if (rev.user._id === req.user._id) {
              (rev.rating = rating), (rev.comment = comment), (rev.user = user);
            }
          });
        } else {
          product.reviews.push(review);
        }
  
        let avg = 0;
  
        product.reviews.forEach((rev) => {
          avg += rev.rating;
        });
  
        product.ratings = avg / product.reviews.length;
  
        await product.save({ validateBeforeSave: false });
  
        await Order.findByIdAndUpdate(
          orderId,
          { $set: { "cart.$[elem].isReviewed": true } },
          { arrayFilters: [{ "elem._id": productId }], new: true }
        );

        
        try {
          const index = getPineconeIndex();
          if (index) {
            await index.update({
              id: product._id.toString(),
              metadata: {
                name: product.name || "",
                category: product.category || "",
                price: product.discountPrice || 0,
                stock: product.stock || 0,
                ratings: product.ratings || 0,
                description: product.description || "",
                image: JSON.stringify(product.images || []),
                shopName: product.shop?.name || "",
                reviews: JSON.stringify(product.reviews || []),
              },
              namespace: 'chatbot'
            });
          }
        } catch (pineconeErr) {
          console.error("Error updating Pinecone chatbot metadata after review:", pineconeErr);
        }

        res.status(200).json({
          success: true,
          message: "Reviwed succesfully!",
        });
      } catch (error) {
        return next(new ErrorHandler(error, 400));
      }
    })
  );
  

module.exports = router;