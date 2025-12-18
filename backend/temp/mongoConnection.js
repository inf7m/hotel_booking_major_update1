require("dotenv").config();
const mongoose = require("mongoose");

// Env vars
const { MONGODB_USERNAME, MONGODB_PASSWD, MONGODB_HOST } = process.env;

// Database and collection
const DB_NAME = "hotel_info";
const COLLECTION_NAME = "currentAvailableHotelsDetail";

const MONGO_URI = `mongodb+srv://${MONGODB_USERNAME}:${MONGODB_PASSWD}@${MONGODB_HOST}/${DB_NAME}?appName=Cluster0`;
cosnt
mongoose
    .connect(MONGO_URI)
    .then(async () => {
        console.log("MongoDB connected ✅");

        const db = mongoose.connection;
        console.log("Database Name:", db.name);
        console.log("Host:", db.host);
        console.log("Port:", db.port);
        console.log("Ready State:", db.readyState);

        // Query documents from the collection
        try {
            const collection = db.collection(COLLECTION_NAME);
            const docs = await collection.find({}).limit(5).toArray(); // get first 5 docs
            console.log(`First ${docs.length} documents in ${COLLECTION_NAME}:`);
            console.log(docs);
        } catch (err) {
            console.error("Error querying collection:", err);
        }

        process.exit(0);
    })
    .catch((err) => {
        console.error("MongoDB connection error:", err);
        process.exit(1);
    });
