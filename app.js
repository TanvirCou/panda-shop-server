const express = require("express");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const cors = require("cors");
const ErrorHandler = require("./middleware/error");

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cors({
    origin: "http://127.0.0.1:5173",
    credentials: true
  }));

//config
if(process.env.NODE_ENV !== "PRODUCTION") {
    require("dotenv").config({
        path: "config/.env",
    });
}

const user = require("./controller/user");
const shop = require("./controller/shop");
const product = require("./controller/product");
const event = require("./controller/event");
const couponCode = require("./controller/couponCode");
const payment = require("./controller/payment");
const order = require("./controller/order");
const withdraw = require("./controller/withdraw");

app.use("/api/user", user);
app.use("/api/shop", shop);
app.use("/api/product", product);
app.use("/api/event", event);
app.use("/api/coupon-code", couponCode);
app.use("/api/payment", payment);
app.use("/api/order", order);
app.use("/api/withdraw", withdraw);




app.use(ErrorHandler);

module.exports = app;