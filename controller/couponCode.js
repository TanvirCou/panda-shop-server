const express = require("express");
const router = express.Router();
const Shop = require("../model/shop");
const CouponCode = require("../model/CouponCode");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const ErrorHandler = require("../utils/ErrorHandler");
const { isShop } = require("../middleware/auth");

router.post("/create-coupon-code", isShop, catchAsyncErrors(async(req, res, next) => {
    try {
        const isCouponCodeExits = await CouponCode.find({name: req.body.name});

        if(isCouponCodeExits.length !== 0) {
            return next(new ErrorHandler("Coupon code already exits", 500));
        }

        const couponCode = await CouponCode.create(req.body);
        res.status(201).json({
            success: true,
            couponCode
        });
    } catch (error) {
        return next(new ErrorHandler(error, 400));
    }
}));

router.get("/all-coupon-codes/:id", isShop, catchAsyncErrors(async(req, res, next) => {
    try {
        const couponCodes = await CouponCode.find({shopId: req.params.id});
        res.status(201).json({
            success: true,
            couponCodes
        });
    } catch (error) {
        return next(new ErrorHandler(error, 400));
    }
}));

router.delete("/delete-coupon-code/:id", isShop, catchAsyncErrors(async(req, res, next) => {
    try {
        const couponCode = await CouponCode.findByIdAndDelete(req.params.id);

        if(!couponCode) {
            return next(new ErrorHandler("Coupon code not found with this id", 500));
        } 

        res.status(201).json({
            success: true,
            message: "Coupon code deleted successfully",
        });
    } catch (error) {
        return next(new ErrorHandler(error, 400));
    }
}))

// get coupon code value by its name
router.get(
    "/get-coupon-value/:name",
    catchAsyncErrors(async (req, res, next) => {
      try {
        const couponCode = await CouponCode.findOne({ name: req.params.name });
  
        res.status(200).json({
          success: true,
          couponCode,
        });
      } catch (error) {
        return next(new ErrorHandler(error, 400));
      }
    })
  );

module.exports = router;

