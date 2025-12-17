import { MongoClient } from "mongodb";

/* ================= RIGHT DB ================= */
const RIGHT_URI =
    "mongodb+srv://ingestion:Fin71510@cluster0.qsa9hsq.mongodb.net/?retryWrites=true&w=majority";

const RIGHT_DB = "hotel_info";
const RIGHT_COLLECTION = "currentAvailableHotelsDetail";

/* ================= LEFT DB ================= */
const LEFT_URI =
    "mongodb+srv://bbbnhan1_db_user:TT3yyCJJ1KCk0FuB@cluster0.sewtqr0.mongodb.net/hotel_booking?retryWrites=true&w=majority&appName=Cluster0";

const LEFT_DB = "hotel_booking";
const LEFT_COLLECTION = "hotels";

async function migrateHotels() {
    const rightClient = new MongoClient(RIGHT_URI);
    const leftClient = new MongoClient(LEFT_URI);

    try {
        await rightClient.connect();
        await leftClient.connect();

        console.log("Connected to both databases");

        const rightCol = rightClient.db(RIGHT_DB).collection(RIGHT_COLLECTION);
        const leftCol = leftClient.db(LEFT_DB).collection(LEFT_COLLECTION);

        const cursor = rightCol.find({});
        const now = new Date();
        const hotelsToInsert = [];

        for await (const h of cursor) {
            hotelsToInsert.push({
                name: h.name ?? "",
                description: h.description ?? "",
                address: h.address_obj
                    ? Object.values(h.address_obj).filter(Boolean).join(", ")
                    : "",
                city: h.address_obj?.city ?? "",
                latitude: h.latitude ?? null,     // KEEP STRING
                longitude: h.longitude ?? null,   // KEEP STRING
                rating: h.rating ?? null,
                amenities: Array.isArray(h.amenities) ? h.amenities : [],
                imageUrl: null,
                imageUrls: [],
                createdAt: now,
                updatedAt: now
            });
        }

        if (!hotelsToInsert.length) {
            console.log("No hotels found to migrate");
            return;
        }

        await leftCol.insertMany(hotelsToInsert);
        console.log(`Successfully migrated ${hotelsToInsert.length} hotels`);
    } catch (err) {
        console.error("Migration error:", err);
    } finally {
        await rightClient.close();
        await leftClient.close();
    }
}

migrateHotels();
