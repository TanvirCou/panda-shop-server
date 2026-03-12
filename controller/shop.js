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
    const activationUrl = `https://panda-shop-webapps.netlify.app/shop-activation/${activationToken}`;

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
        // console.log({name, email, password, avatar, phoneNumber, address, zipCode});
    
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


router.post("/forgot-password", catchAsyncErrors(async (req, res, next) => {
    const { email } = req.body;
    const shop = await Shop.findOne({ email });

    if (!shop) {
        return next(new ErrorHandler("No shop account found with this email", 404));
    }

    const crypto = require("crypto");
    const resetToken = crypto.randomBytes(32).toString("hex");

    shop.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    shop.resetPasswordTime = Date.now() + 30 * 60 * 1000; 
    await shop.save({ validateBeforeSave: false });

    const resetUrl = `https://panda-shop-webapps.netlify.app/shop/reset-password/${resetToken}`;

    try {
        await sendMail({
            email: shop.email,
            subject: "PandaShop Seller — Password Reset",
            text: `Hello ${shop.name},\n\nYou requested a password reset for your seller account.\n\nClick the link below to reset your password (valid for 30 minutes):\n\n${resetUrl}\n\nIf you did not request this, please ignore this email.`,
        });

        res.status(200).json({
            success: true,
            message: `Password reset link sent to ${shop.email}`,
        });
    } catch (err) {
        shop.resetPasswordToken = undefined;
        shop.resetPasswordTime = undefined;
        await shop.save({ validateBeforeSave: false });
        return next(new ErrorHandler("Failed to send email. Try again later.", 500));
    }
}));


router.post("/reset-password/:token", catchAsyncErrors(async (req, res, next) => {
    const crypto = require("crypto");
    const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

    const shop = await Shop.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordTime: { $gt: Date.now() },
    });

    if (!shop) {
        return next(new ErrorHandler("Reset token is invalid or has expired", 400));
    }

    const { password, confirmPassword } = req.body;

    if (!password || !confirmPassword) {
        return next(new ErrorHandler("Please provide both password fields", 400));
    }

    if (password !== confirmPassword) {
        return next(new ErrorHandler("Passwords do not match", 400));
    }

    if (password.length < 6) {
        return next(new ErrorHandler("Password must be at least 6 characters", 400));
    }

    shop.password = password;
    shop.resetPasswordToken = undefined;
    shop.resetPasswordTime = undefined;
    await shop.save();

    res.status(200).json({
        success: true,
        message: "Password reset successful! You can now log in.",
    });
}));

module.exports = router;
