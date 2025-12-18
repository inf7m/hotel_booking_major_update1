require('dotenv').config();
const mongoose = require('mongoose');

//   MONGO CONNECTION
const MONGO_URI = process.env.MONGODB_URI || "mongodb+srv://bbbnhan1_db_user:TT3yyCJJ1KCk0FuB@cluster0.sewtqr0.mongodb.net/hotel_booking?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err.message));

//   DEFINE SCHEMAS
const hotelSchema = new mongoose.Schema({
    name: String,
});

const roomSchema = new mongoose.Schema({
    hotelName: String,
    type: String,
    price: Number,
    roomNumber: Number,
    capacity: Number,
    createdAt: Date,
});

const Hotel = mongoose.model('Hotel', hotelSchema, 'hotels');
const Room = mongoose.model('Room', roomSchema, 'rooms');

//   RANDOM PLAN

const roomTypes = ['deluxe', 'family', 'studio'];
const capacities = [2, 4];

function getRandomPrice(min = 1500000, max = 3500000) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomType() {
    return roomTypes[Math.floor(Math.random() * roomTypes.length)];
}

function getRandomCapacity() {
    return capacities[Math.floor(Math.random() * capacities.length)];
}

function getRandomRoomNumber() {
    return Math.floor(Math.random() * (400 - 100 + 1)) + 100;
}

function getRandomDate(start = '2025-11-10', end = '2025-12-15') {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));
}

//   POPULATE ROOMS

async function populateRooms() {
    try {
        const hotels = await Hotel.find();
        console.log(`Found ${hotels.length} hotels`);

        const roomsToInsert = [];

        hotels.forEach(hotel => {
            for (let i = 0; i < 2; i++) { // 2 rooms per hotel
                roomsToInsert.push({
                    hotelName: hotel.name,
                    type: getRandomType(),
                    price: getRandomPrice(),
                });
            }
        });

        if (roomsToInsert.length > 0) {
            await Room.insertMany(roomsToInsert);
            console.log(`Inserted ${roomsToInsert.length} rooms`);
        } else {
            console.log('No rooms to insert');
        }
    } catch (err) {
        console.error('Error populating rooms:', err);
    }
}

//   AUTOFILL NULL FIELDS
async function autofillNullFields() {
    try {
        const rooms = await Room.find({
            $or: [
                { roomNumber: { $exists: false } },
                { capacity: { $exists: false } },
                { createdAt: { $exists: false } }
            ]
        });

        console.log(`Found ${rooms.length} rooms with missing fields`);

        for (const room of rooms) {
            if (!room.roomNumber) room.roomNumber = getRandomRoomNumber();
            if (!room.capacity) room.capacity = getRandomCapacity();
            if (!room.createdAt) room.createdAt = getRandomDate();

            await room.save();
        }

        console.log(` Updated ${rooms.length} rooms`);
    } catch (err) {
        console.error(' Error autofilling fields:', err);
    } finally {
        mongoose.connection.close();
    }
}

//   Autofill process

async function main() {
    await populateRooms();
    await autofillNullFields();
}

main();
