const mongoose = require("mongoose");

async function connectDB() {
    console.log("MongoDB Connected");
    return mongoose.connect(process.env.MONGODB_URI_ORIGINAL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
}

module.exports = connectDB;
