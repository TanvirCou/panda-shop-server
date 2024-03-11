const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
const Shop = require("../model/shop");
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const sendMail = require("../utils/sendMail");
const sendShopToken = require("../utils/shopToken");
const { isShop, isAuthenticated, isAdmin } = require("../middleware/auth");

router.post("/shop-register", async(req, res, next) => {
    console.log(req.body);
    try {
    const {name, email, password, avatar, phoneNumber, address, zipCode} = req.body;

    const shopEmail = await Shop.findOne({ email });
    if (shopEmail) {
      return next(new ErrorHandler("Shop already exists", 400));
    }

    if(avatar === null) {
        var shop = {
            name: name,
            email: email,
            password: password,
            phoneNumber: phoneNumber,
            address: address,
            zipCode: zipCode
        };
    } else {
       var shop = {
            name: name,
            email: email,
            password: password,
            avatar: avatar,
            phoneNumber: phoneNumber,
            address: address,
            zipCode: zipCode
        };
    }

    
        // const newUser = await User.create(user);
        // res.status(201).json({
        //     success: true,
        //     newUser
        // });

    const activationToken = createActivationToken(shop);
    const activationUrl = `http://127.0.0.1:5173/shop-activation/${activationToken}`;

    try {
        await sendMail({
            email: shop.email,
            subject: "Activate your shop",
            text: `Hello ${shop.name}, please click on the link to activate your shop: ${activationUrl}`,
        });
        res.status(201).json({
            success: true,
            message: `Please check your email: ${shop.email} to activate your account`
        });
    } catch (err) {
        return next(new ErrorHandler(err.message, 500));
    }
} catch(err) {
    return next(new ErrorHandler(err.message, 400));
}

});

const createActivationToken = (shop) => {
    return jwt.sign(shop, process.env.ACTIVATION_SECRET, {
        expiresIn: "5m"
    });
};

router.post("/shop-activation", catchAsyncErrors(async(req, res, next) => {
    try {
        const {activation_token} = req.body;

        const newShop = jwt.verify(activation_token, process.env.ACTIVATION_SECRET);
    
        if(!newShop) {
            return next(new ErrorHandler("Invalid token", 400));
        }
    
        const {name, email, password, avatar, phoneNumber, address, zipCode} = newShop;
        console.log({name, email, password, avatar, phoneNumber, address, zipCode});
    
        let shop = await Shop.findOne({ email });
        if (shop) {
          return next(new ErrorHandler("Shop already exists", 400));
        }
    
        shop = await Shop.create({
            name,
            email,
            avatar,
            password,
            phoneNumber,
            address,
            zipCode
        });
        sendShopToken(shop, 201, res); 
    } catch (error) {
        console.log(error.message);
        return next(new ErrorHandler(error.message, 500));
      }
}));

router.post("/shop-login", catchAsyncErrors(async(req, res, next) => {
    try {
        const {email, password} = req.body;
        if(!email || !password) {
            return next(new ErrorHandler("Please provide the all fields", 400));  
        }

        const shop = await Shop.findOne({email}).select("+password");
        if(!shop) {
            return next(new ErrorHandler("Shop doesn't exists", 400));  
        }

        const isPasswordValid = await shop.comparePassword(password);
        if(!isPasswordValid) {
            return next(new ErrorHandler("Please enter correct password", 400)); 
        }

        sendShopToken(shop, 201, res);

    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
      }
}));

router.get("/get", isShop, catchAsyncErrors(async(req, res, next) => {
    try {
        const shop = await Shop.findById(req.shop.id);

        if (!shop) {
            return next(new ErrorHandler("Shop doesn't exists", 400));
          }

          res.status(200).json({
            success: true,
            shop
          });
    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
      }
}));

router.get("/logout", isShop, catchAsyncErrors(async(req, res, next) => {
    try {
        res.cookie("shop_token", null, {
            expires: new Date(Date.now()),
            httpOnly: true,
            sameSite: "none",
            secure: true,
        });

        res.status(201).json({
            success: true,
            message: "Logout successfully" 
          });
    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
      }
}));

router.get("/get-shop-info/:id", catchAsyncErrors(async(req, res, next) => {
    try {
        const shop = await Shop.findById(req.params.id);

          res.status(201).json({
            success: true,
            shop
          });
    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
      }
}));

router.put("/update-shop-info", isShop, catchAsyncErrors(async(req, res, next) => {
    try {
        const {name, description, address, phoneNumber, zipCode, avatar} = req.body;
    
        const shop = await Shop.findById(req.shop._id);
        console.log(req.body);
        if(!shop) {
            return next(new ErrorHandler("shop doesn't exists", 400));  
        }
        shop.name = name;
        shop.description = description;
        shop.address = address
        shop.phoneNumber = phoneNumber;
        shop.zipCode = zipCode;

        if(avatar === null) {
            await shop.save();
             res.status(200).json({
            success: true,
            message: "Successfully updated",
            shop
          });
        } else {
            shop.avatar = avatar;
            await shop.save();
             res.status(200).json({
            success: true,
            message: "Successfully updated",
            shop
          });
        }  

    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
      }
}));

// all sellers --- for admin
router.get(
    "/admin-all-shops",
    isAuthenticated,
    isAdmin("Admin"),
    catchAsyncErrors(async (req, res, next) => {
      try {
        const shops = await Shop.find().sort({
          createdAt: -1,
        });
        res.status(201).json({
          success: true,
          shops,
        });
      } catch (error) {
        return next(new ErrorHandler(error.message, 500));
      }
    })
  );

// delete seller ---admin
router.delete(
  "/delete-shop/:id",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const seller = await Shop.findById(req.params.id);

      if (!seller) {
        return next(
          new ErrorHandler("Shop is not available with this id", 400)
        );
      }

      await Shop.findByIdAndDelete(req.params.id);

      res.status(201).json({
        success: true,
        message: "Seller deleted successfully!",
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// update seller withdraw methods --- sellers
router.put(
  "/update-payment-methods",
  isShop,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { bankInfo } = req.body;

      const shop = await Shop.findByIdAndUpdate(req.shop._id, {
        withdrawMethod: bankInfo,
      });

      res.status(201).json({
        success: true,
        shop,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// delete seller withdraw merthods --- only seller
router.delete(
  "/delete-withdraw-method",
  isShop,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const shop = await Shop.findById(req.shop._id);

      if (!shop) {
        return next(new ErrorHandler("Shop not found with this id", 400));
      }

      shop.withdrawMethod = null;

      await shop.save();

      res.status(201).json({
        success: true,
        shop,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

module.exports = router;