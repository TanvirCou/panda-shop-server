const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const shopSchema = new mongoose.Schema({
  name:{
    type: String,
    required: [true, "Please enter your shop name!"],
  },
  email:{
    type: String,
    required: [true, "Please enter your shop email!"],
  },
  password:{
    type: String,
    required: [true, "Please enter your password"],
    minLength: [6, "Password should be greater than 4 characters"],
    select: false,
  },
  phoneNumber:{
    type: Number,
    required : true
  },
  zipCode:{
    type: Number,
    required : true
  },
  address:{
    type: String,
    required : true
  },
  description:{
    type: String
  },
  role:{
    type: String,
    default: "seller",
  },
  avatar:{
    type: String,
    default: "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg"
 },
 withdrawMethod: {
  type: Object,
},
availableBalance: {
  type: Number,
  default: 0,
},
transactions: [
  {
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      default: "Processing",
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    updatedAt: {
      type: Date,
    },
  },
],
 createdAt:{
  type: Date,
  default: Date.now(),
 },
 resetPasswordToken: String,
 resetPasswordTime: Date,
});


//  Hash password
shopSchema.pre("save", async function (next){
  if(!this.isModified("password")){
    next();
  }

  this.password = await bcrypt.hash(this.password, 10);
});

// jwt token
shopSchema.methods.getJwtToken = function () {
  return jwt.sign({ id: this._id}, process.env.JWT_SECRET_KEY,{
    expiresIn: process.env.JWT_EXPIRES,
  });
};

// compare password
shopSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("Shop", shopSchema);