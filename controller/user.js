const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
const User = require("../model/user");
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const sendMail = require("../utils/sendMail");
const sendToken = require("../utils/jwtToken");
const { isAuthenticated, isAdmin } = require("../middleware/auth");

router.post("/register", async(req, res, next) => {
    try {
    const {name, email, password, avatar} = req.body;

    const userEmail = await User.findOne({ email });
    if (userEmail) {
      return next(new ErrorHandler("User already exists", 400));
    }

    if(avatar === null) {
        var user = {
            name: name,
            email: email,
            password: password,
        };
    } else {
       var user = {
            name: name,
            email: email,
            password: password,
            avatar: avatar
        };
    }

    
        // const newUser = await User.create(user);
        // res.status(201).json({
        //     success: true,
        //     newUser
        // });

    const activationToken = createActivationToken(user);
    const activationUrl = `http://127.0.0.1:5173/activation/${activationToken}`;

    try {
        await sendMail({
            email: user.email,
            subject: "Activate your account",
            text: `Hello ${user.name}, please click on the link to activate your account: ${activationUrl}`,
        });
        res.status(201).json({
            success: true,
            message: `Please check your email: ${user.email} to activate your account`
        });
    } catch (err) {
        return next(new ErrorHandler(err.message, 500));
    }
} catch(err) {
    return next(new ErrorHandler(err.message, 400));
}

});

const createActivationToken = (user) => {
    return jwt.sign(user, process.env.ACTIVATION_SECRET, {
        expiresIn: "5m"
    });
};

router.post("/activation", catchAsyncErrors(async(req, res, next) => {
    try {
        const {activation_token} = req.body;

        const newUser = jwt.verify(activation_token, process.env.ACTIVATION_SECRET);
    
        if(!newUser) {
            return next(new ErrorHandler("Invalid token", 400));
        }
    
        const {name, email, password, avatar} = newUser;
    
        let user = await User.findOne({ email });
        if (user) {
          return next(new ErrorHandler("User already exists", 400));
        }
    
        user = await User.create({
            name,
            email,
            avatar,
            password,
        });
        sendToken(user, 201, res); 
    } catch (error) {
        console.log(error.message);
        return next(new ErrorHandler(error.message, 500));
      }
}));

router.post("/login", catchAsyncErrors(async(req, res, next) => {
    try {
        const {email, password} = req.body;
        if(!email || !password) {
            return next(new ErrorHandler("Please provide the all fields", 400));  
        }

        const user = await User.findOne({email}).select("+password");
        if(!user) {
            return next(new ErrorHandler("User doesn't exists", 400));  
        }

        const isPasswordValid = await user.comparePassword(password);
        if(!isPasswordValid) {
            return next(new ErrorHandler("Please enter correct password", 400)); 
        }

        sendToken(user, 201, res);

    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
      }
}));

router.get("/get", isAuthenticated, catchAsyncErrors(async(req, res, next) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return next(new ErrorHandler("User doesn't exists", 400));
          }

          res.status(200).json({
            success: true,
            user
          });
    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
      }
}));

router.get("/logout", isAuthenticated, catchAsyncErrors(async(req, res, next) => {
    try {
        res.cookie("token", null, {
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

router.put("/update-user-info", isAuthenticated, catchAsyncErrors(async(req, res, next) => {
    try {
        const {name, email, password, phoneNumber, avatar} = req.body;
    
        const user = await User.findOne({email}).select("+password");
        if(!user) {
            return next(new ErrorHandler("User doesn't exists", 400));  
        }

        const isPasswordValid = await user.comparePassword(password);
        if(!isPasswordValid) {
            return next(new ErrorHandler("Please enter correct password", 400)); 
        }

        user.email = email;
        user.name = name;
        user.phoneNumber = phoneNumber;

        if(avatar === null) {
            await user.save();
             res.status(200).json({
            success: true,
            message: "Successfully updated",
            user
          });
        } else {
            user.avatar = avatar;
            await user.save();
             res.status(200).json({
            success: true,
            message: "Successfully updated",
            user
          });
        }  

    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
      }
}));

router.put(
    "/update-user-addresses",
    isAuthenticated,
    catchAsyncErrors(async (req, res, next) => {
      try {
        const user = await User.findById(req.user.id);
  
        const sameTypeAddress = user.addresses.find(
          (address) => address.addressType === req.body.addressType
        );
        if (sameTypeAddress) {
          return next(
            new ErrorHandler(`${req.body.addressType} address already exists`)
          );
        }
  
        const existsAddress = user.addresses.find(
          (address) => address._id === req.body._id
        );
  
        if (existsAddress) {
          Object.assign(existsAddress, req.body);
        } else {
          // add the new address to the array
          user.addresses.push(req.body);
        }
  
        await user.save();
  
        res.status(200).json({
          success: true,
          user,
        });
      } catch (error) {
        return next(new ErrorHandler(error.message, 500));
      }
    })
  );

  router.delete(
    "/delete-user-address/:id",
    isAuthenticated,
    catchAsyncErrors(async (req, res, next) => {
      try {
        const userId = req.user._id;
        const addressId = req.params.id;
  
        await User.updateOne(
          {
            _id: userId,
          },
          { $pull: { addresses: { _id: addressId } } }
        );
  
        const user = await User.findById(userId);
  
        res.status(200).json({ success: true, user });
      } catch (error) {
        return next(new ErrorHandler(error.message, 500));
      }
    })
  );

  router.put(
    "/update-user-password",
    isAuthenticated,
    catchAsyncErrors(async (req, res, next) => {
      try {
        const user = await User.findById(req.user.id).select("+password");
  
        const isPasswordMatched = await user.comparePassword(
          req.body.oldPassword
        );
  
        if (!isPasswordMatched) {
          return next(new ErrorHandler("Old password is incorrect!", 400));
        }
  
        user.password = req.body.newPassword;
  
        await user.save();
  
        res.status(200).json({
          success: true,
          message: "Password updated successfully!",
        });
      } catch (error) {
        return next(new ErrorHandler(error.message, 500));
      }
    })
  );

// all users --- for admin
router.get(
  "/admin-all-users",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const users = await User.find().sort({
        createdAt: -1,
      });
      res.status(201).json({
        success: true,
        users,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// delete users --- admin
router.delete(
  "/delete-user/:id",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const user = await User.findById(req.params.id);

      if (!user) {
        return next(
          new ErrorHandler("User is not available with this id", 400)
        );
      }

      await User.findByIdAndDelete(req.params.id);

      res.status(201).json({
        success: true,
        message: "User deleted successfully!",
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);
  

module.exports = router;