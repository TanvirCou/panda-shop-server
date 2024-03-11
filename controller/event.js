const express = require("express");
const router = express.Router();
const Shop = require("../model/shop");
const Event = require("../model/event");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const ErrorHandler = require("../utils/ErrorHandler");
const { isShop } = require("../middleware/auth");

router.post("/create-event", catchAsyncErrors(async(req, res, next) => {
    try {
        const shopId = req.body.shopId;
        const shop = await Shop.findById(shopId);
        if(!shop) {
            return next(new ErrorHandler("Shop doesn't exits", 500));
        } else {
            const eventData = req.body;
            eventData.shop = shop;
            
            const event = await Event.create(eventData);
            res.status(201).json({
                success: true,
                event
            });
        }
    } catch (error) {
        return next(new ErrorHandler(error, 400));
    }
}));

router.get("/all-events/:id", catchAsyncErrors(async(req, res, next) => {
    try {
        const events = await Event.find({shopId: req.params.id});
        res.status(201).json({
            success: true,
            events
        });
    } catch (error) {
        return next(new ErrorHandler(error, 400));
    }
}));

router.delete("/delete-event/:id", catchAsyncErrors(async(req, res, next) => {
    try {
        const event = await Event.findByIdAndDelete(req.params.id);

        if(!event) {
            return next(new ErrorHandler("Event not found with this id", 500));
        } 

        res.status(201).json({
            success: true,
            message: "Event deleted successfully",
        });
    } catch (error) {
        return next(new ErrorHandler(error, 400));
    }
}));

router.get("/get-all-events", catchAsyncErrors(async(req, res, next) => {
    try {
        const allEvents = await Event.find();

        res.status(201).json({
            success: true,
            allEvents,
          });
    } catch (error) {
        return next(new ErrorHandler(error, 400));
    }
}));


module.exports = router;