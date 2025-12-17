// This file is the process to create/populate the availability for reservation feature
// Each hotel will have default 2 available room
// Populate for the next 1 year

const { settingUpTheConnection } = require("../../services/tripadviserApi/ingestToMongoDB/mongodbUtils.js");
const defaultAvailableRooms = 2;
const daysToPopulate = 365; // populate for the next 1 year

async function populateAvailabilityForAllHotels() {
    // Established connect into 2 hotels collections
    const connect = await settingUpTheConnection();
    const hotel_info_db = connect.db("hotel_info");
    const hotelsCollection = hotel_info_db.collection("currentAvailableHotelsDetail");
    const availabilityCollection = hotel_info_db.collection("availability");
    // Populate Phase
    const today = new Date();
    today.setHours(0, 0, 0, 0); // start from today
    const availabilityDocs = [];

    // Fetch all hotels to get location_id of each hotel
    const hotels = await hotelsCollection.find({}, { projection: { location_id: 1 } }).toArray();
    for (const hotel of hotels) {
        for (let i = 0; i < daysToPopulate; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            availabilityDocs.push({
                hotelId: hotel.location_id,
                date: date,
                availableRooms: defaultAvailableRooms,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
        }
    }
    // Insert Phase
    if (availabilityDocs.length > 0) {
        const result = await availabilityCollection.insertMany(availabilityDocs);
        console.log(`Inserted ${result.insertedCount} availability documents.`);
    } else {
        console.log("No availability documents to insert.");
    }
    await connect.close(); // Close the connection
}

