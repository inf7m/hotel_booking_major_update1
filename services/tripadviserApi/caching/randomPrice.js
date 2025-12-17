import { MongoClient } from "mongodb";

/* ========== LEFT DB ONLY ========== */
const LEFT_URI =
    "mongodb+srv://bbbnhan1_db_user:TT3yyCJJ1KCk0FuB@cluster0.sewtqr0.mongodb.net/hotel_booking?retryWrites=true&w=majority&appName=Cluster0";

const DB_NAME = "hotel_booking";
const COLLECTION = "hotels";

function randomPrice() {
    const MIN = 2_000_000;
    const MAX = 4_000_000;
    return Math.floor(Math.random() * (MAX - MIN + 1)) + MIN;
}

async function fillMissingPrices() {
    const client = new MongoClient(LEFT_URI);

    try {
        await client.connect();
        console.log("Connected to LEFT DB");

        const col = client.db(DB_NAME).collection(COLLECTION);

        // find hotels where price is null or does not exist
        const cursor = col.find({
            $or: [
                { price: null },
                { price: { $exists: false } }
            ]
        });

        let updated = 0;

        for await (const hotel of cursor) {
            await col.updateOne(
                { _id: hotel._id },
                {
                    $set: {
                        price: randomPrice(),
                        updatedAt: new Date()
                    }
                }
            );
            updated++;
        }

        console.log(`💰 Prices filled for ${updated} hotels`);
    } catch (err) {
        console.error("Error filling prices:", err);
    } finally {
        await client.close();
    }
}

fillMissingPrices();
