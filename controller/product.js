const express = require("express");
const router = express.Router();
const Shop = require("../model/shop");
const Product = require("../model/product");
const Order = require("../model/order");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const { isShop, isAuthenticated } = require("../middleware/auth");
const ErrorHandler = require("../utils/ErrorHandler");

router.post("/create-product", catchAsyncErrors(async(req, res, next) => {
    try {
        const shopId = req.body.shopId;
        const shop = await Shop.findById(shopId);
        if(!shop) {
            return next(new ErrorHandler("Shop doesn't exits", 400));
        } else {
            const productData = req.body;
            productData.shop = shop;
            
            const product = await Product.create(productData);
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